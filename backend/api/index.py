import cloudinary.uploader
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from google.cloud.firestore_v1.base_query import FieldFilter
import cloudinary
from cloudinary import exceptions
from datetime import datetime, timedelta
import requests
from bs4 import BeautifulSoup
import re
import time
import threading
import concurrent.futures
import pickle
import hashlib
import json
import firebase_admin
from firebase_admin import credentials, firestore, messaging
import glob

# Add dotenv for loading environment variables
try:
    from dotenv import load_dotenv
    # Load environment variables from .env file if present
    load_dotenv()
except ImportError:
    print("python-dotenv not installed, skipping .env file loading")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Firebase Admin SDK if not already initialized
if not firebase_admin._apps:
    try:
        # Try to load from environment variable first
        cred = credentials.Certificate('credentials.json')
        firebase_admin.initialize_app(cred, {
            'projectId': 'learnex-241f1',  # Replace with your actual Firebase project ID
            # Disable direct connection to Firebase APIs
            'httpTimeout': 30,
            'databaseURL': None  # Prevent direct database connections
        })
        print("Firebase Admin SDK initialized successfully")
    except Exception as e:
        print(f"Firebase Admin SDK initialization error: {e}")

# Define types/enums to match frontend expectations


class EventMode:
    ONLINE = "online"
    IN_PERSON = "in-person"
    HYBRID = "hybrid"


class EventSource:
    HACKEREARTH = "hackerearth"
    DEVFOLIO = "devfolio"


# Cache configuration
CACHE_DIR = os.path.join(os.path.dirname(__file__), 'cache')
CACHE_DURATION = 300  # 5 minutes in seconds (changed from 3 hours)
# Directory for fallback HTML files
FALLBACK_HTML_DIR = os.path.dirname(os.path.abspath(__file__))
# Maximum age for HTML fallback files before initiating new scraping (2 hours in seconds)
HTML_FALLBACK_MAX_AGE = 7200  # 2 hours

# Ensure cache directory exists
os.makedirs(CACHE_DIR, exist_ok=True)

# In-memory data store
last_fetched = None
hackerearth_events = []
devfolio_events = []
is_refreshing = False  # Flag to track if refresh is in progress


def get_cache_path(key):
    """Generate a cache file path for a given key"""
    # Use MD5 to create a consistent filename
    hash_obj = hashlib.md5(key.encode())
    return os.path.join(CACHE_DIR, f"{hash_obj.hexdigest()}.cache")


def get_from_cache(key):
    """Retrieve data from cache if available and not expired"""
    cache_path = get_cache_path(key)

    if not os.path.exists(cache_path):
        return None

    try:
        with open(cache_path, 'rb') as f:
            timestamp, data = pickle.load(f)

        # Check if cache is expired
        if time.time() - timestamp <= CACHE_DURATION:
            print(f"✅ Cache hit for {key}")
            return data
        else:
            print(f"⏳ Cache expired for {key}")
            return None
    except Exception as e:
        print(f"❌ Cache error: {e}")
        return None


def save_to_cache(key, data):
    """Save data to cache with current timestamp"""
    cache_path = get_cache_path(key)

    try:
        with open(cache_path, 'wb') as f:
            pickle.dump((time.time(), data), f)
        print(f"💾 Saved to cache: {key}")
    except Exception as e:
        print(f"❌ Failed to save to cache: {e}")


def find_local_html_file(name_pattern):
    """
    Find a locally saved HTML file matching the pattern
    This serves as a fallback when live scraping fails

    Args:
        name_pattern (str): Pattern to match, e.g. "devfolio_detail_*"

    Returns:
        str or None: Path to HTML file if found, None otherwise
    """
    try:
        # Look for matching files in the API directory
        pattern = os.path.join(FALLBACK_HTML_DIR, name_pattern)
        matching_files = glob.glob(pattern)

        if matching_files:
            # Return the most recently modified file
            return max(matching_files, key=os.path.getmtime)

        return None
    except Exception as e:
        print(f"Error finding local HTML file: {e}")
        return None


def load_html_from_file(file_path):
    """
    Load HTML content from a file

    Args:
        file_path (str): Path to HTML file

    Returns:
        str or None: HTML content if successful, None otherwise
    """
    try:
        if file_path and os.path.exists(file_path):
            print(f"🔄 Loading fallback HTML from: {file_path}")
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        return None
    except Exception as e:
        print(f"Error loading HTML from file: {e}")
        return None


def is_html_file_recent(file_path, max_age=HTML_FALLBACK_MAX_AGE):
    """
    Check if an HTML file is recent enough to use without initiating new scraping

    Args:
        file_path (str): Path to HTML file
        max_age (int): Maximum age in seconds (default: 2 hours)

    Returns:
        bool: True if file exists and is recent, False otherwise
    """
    try:
        if not file_path or not os.path.exists(file_path):
            return False

        # Get file modification time
        mod_time = os.path.getmtime(file_path)
        current_time = time.time()

        # Check if file is recent enough
        age_in_seconds = current_time - mod_time
        is_recent = age_in_seconds <= max_age

        if is_recent:
            hours = int(age_in_seconds / 3600)
            minutes = int((age_in_seconds % 3600) / 60)
            print(
                f"✅ HTML file is recent ({hours}h {minutes}m old), using cached version")
        else:
            hours = int(age_in_seconds / 3600)
            minutes = int((age_in_seconds % 3600) / 60)
            print(
                f"❌ HTML file is too old ({hours}h {minutes}m), will initiate new scraping")

        return is_recent
    except Exception as e:
        print(f"Error checking HTML file age: {e}")
        return False


# Routes


@app.route('/api/health', methods=['GET'])
def health_check():
    """Basic health check endpoint"""
    return jsonify({
        "status": "healthy",
        "version": "1.3.0"
    })


cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


@app.route('/api/cloudinary/delete', methods=['POST'])
def delete_asset():
    public_id = request.json.get('public_id')
    print("")
    if not public_id:
        return jsonify({"error": "Public ID is required"}), 400

    try:
        result = cloudinary.uploader.destroy(public_id)
        return jsonify({"message": "Asset deleted successfully", "result": result}), 200
    except exceptions.NotFoundError:
        return jsonify({"error": "Asset not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/hackathons', methods=['GET'])
def get_hackathons():
    """Get all hackathons with optional location filter"""
    global hackerearth_events, devfolio_events, last_fetched, is_refreshing

    location = request.args.get('location', 'India').lower()

    print("Fetching hackathons from local HTML files...")

    # Force use of local HTML files as requested
    he_events = scrape_hackerearth(use_cached_html=True)
    df_events = scrape_devfolio(use_cached_html=True)

    # Update global state so detail route can find them
    hackerearth_events = he_events
    devfolio_events = df_events
    last_fetched = datetime.now()

    # Combine events from both sources
    all_events = he_events + df_events

    # Apply location filter if provided
    if location and location != "all":
        filtered_events = [
            event for event in all_events
            if location in event.get('location', '').lower()
        ]
    else:
        filtered_events = all_events

    return jsonify(filtered_events)


@app.route('/api/hackathons/<source>/<event_id>', methods=['GET'])
def get_hackathon_details(source, event_id):
    """Get details for a specific hackathon"""
    global hackerearth_events, devfolio_events

    # If lists are empty, try to populate them from local HTML
    if not hackerearth_events or not devfolio_events:
        print(f"In-memory lists empty, loading from local HTML for detail lookup...")
        if not hackerearth_events:
            hackerearth_events = scrape_hackerearth(use_cached_html=True)
        if not devfolio_events:
            devfolio_events = scrape_devfolio(use_cached_html=True)

    if source == EventSource.HACKEREARTH:
        # Find the event in hackerearth_events
        for event in hackerearth_events:
            if event.get('id') == event_id:
                return jsonify(event)

    elif source == EventSource.DEVFOLIO:
        # Find the event in devfolio_events
        for event in devfolio_events:
            if event.get('id') == event_id:
                # If we have the basic info but maybe not all details,
                # we could theoretically call scrape_hackathon_details here,
                # but scrape_devfolio already calls it for each event when use_cached_html is True.
                return jsonify(event)

        # Special case: if not in list, try to fetch detail directly from file if it's devfolio
        if source == EventSource.DEVFOLIO:
            # Reconstruct URL from event_id (approximation)
            event_url = f"https://{event_id}.devfolio.co/"
            print(f"Event {event_id} not in main list, trying direct file lookup for {event_url}")
            detail = scrape_hackathon_details(event_url, None, use_cached_html=True)
            if detail:
                return jsonify(detail)

    return jsonify({"error": "Event not found"}), 404


@app.route('/api/refresh', methods=['GET'])
def refresh_events():
    """Force refresh the event data"""
    global hackerearth_events, devfolio_events, last_fetched, is_refreshing

    # Check if refresh is already in progress
    if is_refreshing:
        return jsonify({
            "status": "in_progress",
            "message": "A refresh operation is already in progress. Please wait for it to complete.",
        })

    # Check if we should force clear cache
    force_refresh = request.args.get('force', 'false').lower() == 'true'

    # Check if the cache is still fresh (less than 5 minutes old)
    current_time = datetime.now()
    cache_is_fresh = last_fetched and (
        current_time - last_fetched < timedelta(seconds=CACHE_DURATION))

    # Check if the HTML files are recent (less than 2 hours old)
    hackerearth_file = find_local_html_file("hackerearth_response.html")
    devfolio_file = find_local_html_file("devfolio_response_scraperapi.html")

    html_files_status = {}

    if hackerearth_file:
        he_mtime = os.path.getmtime(hackerearth_file)
        he_age = int(time.time() - he_mtime)
        he_is_recent = he_age <= HTML_FALLBACK_MAX_AGE
        html_files_status["hackerearth"] = {
            "file": os.path.basename(hackerearth_file),
            "age_seconds": he_age,
            "age_hours": round(he_age / 3600, 1),
            "is_recent": he_is_recent,
            "last_modified": datetime.fromtimestamp(he_mtime).isoformat()
        }
    else:
        html_files_status["hackerearth"] = {
            "file": "not found",
            "is_recent": False
        }

    if devfolio_file:
        df_mtime = os.path.getmtime(devfolio_file)
        df_age = int(time.time() - df_mtime)
        df_is_recent = df_age <= HTML_FALLBACK_MAX_AGE
        html_files_status["devfolio"] = {
            "file": os.path.basename(devfolio_file),
            "age_seconds": df_age,
            "age_hours": round(df_age / 3600, 1),
            "is_recent": df_is_recent,
            "last_modified": datetime.fromtimestamp(df_mtime).isoformat()
        }
    else:
        html_files_status["devfolio"] = {
            "file": "not found",
            "is_recent": False
        }

    # Check if all HTML files are recent
    html_files_recent = (hackerearth_file and devfolio_file and
                         html_files_status["hackerearth"]["is_recent"] and
                         html_files_status["devfolio"]["is_recent"])

    if cache_is_fresh and not force_refresh:
        minutes_remaining = int((timedelta(
            seconds=CACHE_DURATION) - (current_time - last_fetched)).total_seconds() / 60)
        return jsonify({
            "status": "cache_fresh",
            "message": f"Cache is still fresh. Auto-refresh will occur in {minutes_remaining} minute(s). Use force=true to override.",
            "cache_expires_in_seconds": int((timedelta(seconds=CACHE_DURATION) - (current_time - last_fetched)).total_seconds()),
            "html_files_status": html_files_status,
            "using_cached_html": html_files_recent
        })

    try:
        if force_refresh:
            # Clear cache files for devfolio events
            try:
                cache_path = get_cache_path("devfolio_events_detailed")
                if os.path.exists(cache_path):
                    os.remove(cache_path)
                    print("Deleted Devfolio cache file")

                cache_path = get_cache_path("devfolio_events")
                if os.path.exists(cache_path):
                    os.remove(cache_path)
                    print("Deleted Devfolio events cache file")

                cache_path = get_cache_path("hackerearth_events")
                if os.path.exists(cache_path):
                    os.remove(cache_path)
                    print("Deleted HackerEarth cache file")
            except Exception as e:
                print(f"Error clearing cache: {e}")

        # Start background thread for the actual refresh
        threading.Thread(target=refresh_events_background).start()

        return jsonify({
            "status": "success",
            "message": "Event refresh started in background" + (" (forced refresh)" if force_refresh else ""),
            "note": "Check /api/hackathons in a minute to see updated data",
            "html_files_status": html_files_status,
            "using_cached_html": html_files_recent and not force_refresh
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/api/refresh-status', methods=['GET'])
def refresh_status():
    """Get the current status of the refresh operation"""
    global is_refreshing, last_fetched

    return get_hackathons()

    status = "in_progress" if is_refreshing else "idle"
    message = "Refresh operation in progress" if is_refreshing else "No refresh operation is currently running"

    # Check the HTML files
    hackerearth_file = find_local_html_file("hackerearth_response.html")
    devfolio_file = find_local_html_file("devfolio_response_scraperapi.html")

    html_files_status = {}

    if hackerearth_file:
        he_mtime = os.path.getmtime(hackerearth_file)
        he_age = int(time.time() - he_mtime)
        he_is_recent = he_age <= HTML_FALLBACK_MAX_AGE
        html_files_status["hackerearth"] = {
            "file": os.path.basename(hackerearth_file),
            "age_seconds": he_age,
            "age_hours": round(he_age / 3600, 1),
            "is_recent": he_is_recent,
            "last_modified": datetime.fromtimestamp(he_mtime).isoformat()
        }
    else:
        html_files_status["hackerearth"] = {
            "file": "not found",
            "is_recent": False
        }

    if devfolio_file:
        df_mtime = os.path.getmtime(devfolio_file)
        df_age = int(time.time() - df_mtime)
        df_is_recent = df_age <= HTML_FALLBACK_MAX_AGE
        html_files_status["devfolio"] = {
            "file": os.path.basename(devfolio_file),
            "age_seconds": df_age,
            "age_hours": round(df_age / 3600, 1),
            "is_recent": df_is_recent,
            "last_modified": datetime.fromtimestamp(df_mtime).isoformat()
        }
    else:
        html_files_status["devfolio"] = {
            "file": "not found",
            "is_recent": False
        }

    # Check if all HTML files are recent
    html_files_recent = (hackerearth_file and devfolio_file and
                         html_files_status["hackerearth"]["is_recent"] and
                         html_files_status["devfolio"]["is_recent"])

    # Include last_fetched time if available
    last_update = None
    seconds_until_refresh = None
    if last_fetched:
        last_update = last_fetched.isoformat()
        time_since = datetime.now() - last_fetched
        seconds_since = int(time_since.total_seconds())
        minutes_since = seconds_since // 60

        if minutes_since < 60:
            time_ago = f"{minutes_since} minute{'s' if minutes_since != 1 else ''} ago"
        else:
            hours_since = minutes_since // 60
            time_ago = f"{hours_since} hour{'s' if hours_since != 1 else ''} ago"

        message += f". Last update was {time_ago}."

        # Calculate when the next automatic refresh will occur
        if seconds_since < CACHE_DURATION:
            seconds_until_refresh = CACHE_DURATION - seconds_since
            minutes_until_refresh = seconds_until_refresh // 60

            if minutes_until_refresh > 0:
                message += f" Next auto-refresh in {minutes_until_refresh} minute{'s' if minutes_until_refresh != 1 else ''}."
            else:
                message += f" Next auto-refresh in {seconds_until_refresh} seconds."
        else:
            message += " Cache is stale. A refresh will occur on the next data request."

    # Add information about using cached HTML
    if html_files_recent:
        message += " Using recent cached HTML files for scraping (less than 2 hours old)."

    return jsonify({
        "status": status,
        "is_refreshing": is_refreshing,
        "message": message,
        "last_updated": last_update,
        "seconds_until_refresh": seconds_until_refresh,
        "cache_duration_seconds": CACHE_DURATION,
        "html_fallback_max_age_seconds": HTML_FALLBACK_MAX_AGE,
        "html_files_status": html_files_status,
        "using_cached_html": html_files_recent,
        "event_counts": {
            "hackerearth": len(hackerearth_events),
            "devfolio": len(devfolio_events),
            "total": len(hackerearth_events) + len(devfolio_events)
        }
    })


@app.route('/api/notifications/message', methods=['POST'])
def send_message_notification():
    """
    Send a direct message notification via Firebase Cloud Messaging

    This endpoint implements device-to-device messaging by:
    1. Retrieving the recipient's FCM tokens from Firestore
    2. Sending the notification directly to each device token
    3. This is more appropriate for direct messages than topic-based messaging

    Expected JSON payload:
    {
        "recipientId": "user_id_to_receive_notification",
        "senderId": "user_id_who_sent_message",
        "senderName": "Name of message sender",
        "senderPhoto": "URL to sender's profile image (optional)",
        "message": "Text content of the message",
        "conversationId": "ID of the conversation"
    }
    """
    try:
        data = request.json

        # Validate required fields
        required_fields = ['recipientId', 'senderId',
                           'senderName', 'message', 'conversationId']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Get user's FCM tokens from Firestore
        db = firestore.client()
        tokens_ref = db.collection('fcmTokens').where(
            filter=FieldFilter('userId', '==', data['recipientId'])).stream()

        # Check if recipient has muted the sender
        prefs_ref = db.collection('notificationPreferences').document(
            data['recipientId']).get()

        is_muted = False
        if prefs_ref.exists:
            prefs = prefs_ref.to_dict()
            muted_recipients = prefs.get('mutedRecipients', [])
            is_muted = data['senderId'] in muted_recipients

        if is_muted:
            return jsonify({"status": "skipped", "reason": "sender_muted"}), 200

        # Collect all device tokens for this user
        tokens = []
        invalid_tokens = []

        for token_doc in tokens_ref:
            token_data = token_doc.to_dict()
            # Only include active tokens (if the field exists)
            if 'active' in token_data and token_data['active'] == False:
                continue

            tokens.append({
                'token': token_data['token'],
                'doc_id': token_doc.id
            })

        if not tokens:
            return jsonify({"status": "skipped", "reason": "no_tokens_found"}), 200

        # Check if message ID was provided, otherwise generate one
        message_id = data.get('messageId', '')

        # Create notification data
        notification_data = {
            'type': 'direct_message',
            'conversationId': data['conversationId'],
            'senderId': data['senderId'],
            'recipientId': data['recipientId'],
            'senderName': data['senderName'],
            'senderPhoto': data['senderPhoto'],
            # Add title to data payload for data-only messages
            'title': data['senderName'],
            # Add body to data payload for data-only messages
            'body': data['message'],
            'messageId': message_id,      # Include message ID for notification tracking
            'click_action': 'NOTIFICATION_CLICK'
        }

        # Create notification payload
        notification = messaging.Notification(
            title=data['senderName'],
            body=data['message'],
        )

        # Send to each token individually instead of using multicast
        # This avoids the batch endpoint issue with Vercel
        success_count = 0
        failure_count = 0

        for token_info in tokens:
            token = token_info['token']
            doc_id = token_info['doc_id']

            try:
                # Create message for a single token
                message = messaging.Message(
                    token=token,
                    notification=notification,
                    data=notification_data,
                    android=messaging.AndroidConfig(
                        priority='high',  # Ensures delivery even when device is in Doze mode
                        notification=messaging.AndroidNotification(
                            channel_id='direct_messages',
                            priority='high',
                            sound='notification',
                            default_vibrate_timings=True,
                            icon='ic_notification_logo',  # Specify the large icon for the notification
                        )
                    ),
                    apns=messaging.APNSConfig(
                        # High priority (5 is normal)
                        headers={'apns-priority': '10'},
                        payload=messaging.APNSPayload(
                            aps=messaging.Aps(
                                alert=messaging.ApsAlert(
                                    title=data['senderName'],
                                    body=data['message'],
                                ),
                                sound='default',
                                badge=1,
                                content_available=True,  # This is key for background delivery on iOS
                                mutable_content=True,    # Allows notification service extension to modify content
                                category='MESSAGE'       # Allows for action buttons if configured
                            )
                        )
                    )
                )

                # Send message directly (not using batch)
                response = messaging.send(message)
                success_count += 1
                print(
                    f"Successfully sent notification to token: {token[:10]}...")
            except Exception as e:
                failure_count += 1
                error_msg = str(e)
                print(f"Failed to send to token {token[:10]}...: {error_msg}")

                # Check if the token is invalid/expired
                if "Requested entity was not found" in error_msg or "Invalid registration" in error_msg:
                    invalid_tokens.append(doc_id)
                    print(
                        f"Token {token[:10]}... appears to be invalid. Marking as inactive.")

        # Update invalid tokens as inactive
        batch = db.batch()
        for doc_id in invalid_tokens:
            doc_ref = db.collection('fcmTokens').document(doc_id)
            batch.update(doc_ref, {
                'active': False,
                'updatedAt': firestore.SERVER_TIMESTAMP,
                'error': 'Token invalid or not found'
            })

        if invalid_tokens:
            batch.commit()
            print(f"Marked {len(invalid_tokens)} invalid tokens as inactive")

        return jsonify({
            "status": "success",
            "success_count": success_count,
            "failure_count": failure_count,
            "invalid_tokens": len(invalid_tokens)
        }), 200

    except Exception as e:
        print(f"Error sending notification: {e}")
        return jsonify({"error": str(e)}), 500

# Scraping functions


def scrape_hackerearth(use_cached_html=False):
    """Scrape events from HackerEarth"""
    events = []
    try:
        url = "https://www.hackerearth.com/challenges/hackathon/"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        # Check if we have a recent HTML file (less than 2 hours old)
        fallback_file_path = find_local_html_file("hackerearth_response.html")

        if fallback_file_path and (use_cached_html or is_html_file_recent(fallback_file_path)):
            # Use the recent cached HTML file directly without attempting a new scrape
            if use_cached_html:
                print("Using local HTML file for HackerEarth (forced)")
            else:
                print("Using recent cached HTML file for HackerEarth (less than 2 hours old)")
            
            html_content = load_html_from_file(fallback_file_path)
            if html_content:
                soup = BeautifulSoup(html_content, 'html.parser')
            else:
                if use_cached_html:
                    print("Failed to load local HTML for HackerEarth, returning empty list")
                    return []
                print("Failed to load recent cached HTML, will try live scraping")
                soup = None
        elif use_cached_html:
            print("No local HTML file found for HackerEarth, returning empty list")
            return []
        else:
            # Either no cached file or it's too old, try live scraping
            try:
                # Try fetching from the live site
                response = requests.get(url, headers=headers, timeout=30)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')

                    # Save for future fallback use
                    fallback_file = os.path.join(
                        FALLBACK_HTML_DIR, "hackerearth_response.html")
                    with open(fallback_file, "w", encoding="utf-8") as f:
                        f.write(response.text)
                    print(
                        f"Saved HackerEarth HTML to {fallback_file} for future fallback use")
                else:
                    print(
                        f"Failed to fetch HackerEarth page: {response.status_code}")

                    # Try loading from fallback file
                    fallback_file_path = find_local_html_file(
                        "hackerearth_response.html")
                    html_content = load_html_from_file(fallback_file_path)

                    if html_content:
                        print(
                            "Using fallback HTML for HackerEarth after failed request")
                        soup = BeautifulSoup(html_content, 'html.parser')
                    else:
                        print(
                            "No fallback HTML found for HackerEarth, returning empty events list")
                        return events
            except Exception as e:
                print(f"Error fetching HackerEarth page: {e}")

                # Try loading from fallback file
                fallback_file_path = find_local_html_file(
                    "hackerearth_response.html")
                html_content = load_html_from_file(fallback_file_path)

                if html_content:
                    print("Using fallback HTML for HackerEarth after fetch error")
                    soup = BeautifulSoup(html_content, 'html.parser')
                else:
                    print(
                        "No fallback HTML found for HackerEarth, returning empty events list")
                    return events

        # Process the HTML content
        if soup:
            # Find all hackathon cards - live challenges section
            live_section = soup.find('div', text=re.compile(
                r'LIVE CHALLENGES', re.IGNORECASE))
            if live_section:
                parent_section = live_section.find_parent('div')
                if parent_section:
                    challenge_cards = parent_section.find_all(
                        'div', class_='challenge-card')

                    for card in challenge_cards:
                        try:
                            # Extract basic info
                            title_elem = card.find(
                                'div', class_='challenge-name')
                            title = title_elem.text.strip() if title_elem else "Untitled Hackathon"

                            # Generate a unique ID
                            event_id = re.sub(r'[^a-z0-9]', '-', title.lower())

                            # Extract URL
                            link_elem = card.find('a', href=True)
                            url = link_elem['href'] if link_elem else ""
                            if url and not url.startswith('http'):
                                url = f"https://www.hackerearth.com{url}"

                            # Extract dates
                            date_elem = card.find(
                                'div', class_='date-container')
                            start_date = datetime.now().isoformat()
                            end_date = datetime.now().isoformat()
                            if date_elem:
                                date_text = date_elem.text.strip()
                                # Parse dates from text (simplified)
                                dates = re.findall(
                                    r'\d{1,2}\s+[A-Za-z]{3}\s+\d{4}', date_text)
                                if len(dates) >= 2:
                                    # Attempt to parse these dates properly
                                    try:
                                        start_date = datetime.strptime(
                                            dates[0], '%d %b %Y').isoformat()
                                        end_date = datetime.strptime(
                                            dates[1], '%d %b %Y').isoformat()
                                    except:
                                        # Fallback to the raw strings
                                        start_date = dates[0]
                                        end_date = dates[1]

                            # Determine if it's online/in-person
                            location = "India"  # Default location
                            mode = EventMode.ONLINE  # Default mode
                            location_elem = card.find('div', class_='location')
                            if location_elem:
                                location_text = location_elem.text.strip()
                                if re.search(r'online|virtual', location_text, re.IGNORECASE):
                                    mode = EventMode.ONLINE
                                else:
                                    mode = EventMode.IN_PERSON
                                    location = location_text

                            # Extract description
                            description = "Join this exciting hackathon organized by HackerEarth."
                            desc_elem = card.find(
                                'div', class_='challenge-desc')
                            if desc_elem:
                                description = desc_elem.text.strip()

                            # Create event object
                            event = {
                                "id": event_id,
                                "title": title,
                                "description": description,
                                "startDate": start_date,
                                "endDate": end_date,
                                "location": location,
                                "mode": mode,
                                "url": url,
                                "source": EventSource.HACKEREARTH,
                                "tags": ["hackathon", "coding", "technology"],
                                "prize": "Prizes worth thousands of dollars",
                                "imageUrl": ""
                            }

                            events.append(event)
                        except Exception as e:
                            print(f"Error parsing HackerEarth event card: {e}")

            # Also look for upcoming challenges
            upcoming_section = soup.find('div', text=re.compile(
                r'UPCOMING CHALLENGES', re.IGNORECASE))
            if upcoming_section:
                parent_section = upcoming_section.find_parent('div')
                if parent_section:
                    upcoming_cards = parent_section.find_all(
                        'div', class_='challenge-card')
                    # Similar parsing logic as above
                    # Process each card and add to events list...

        # If we found no events from the HTML, check if we should use hardcoded fallback events
        if not events:
            print("No events found from HackerEarth, using hardcoded fallback events")
            # Add a couple of hardcoded events as ultimate fallback
            events.append({
                "id": "hackerearth-sample-1",
                "title": "AI and ML Hackathon",
                "description": "Build innovative solutions using AI and Machine Learning technologies.",
                "startDate": datetime.now().isoformat(),
                "endDate": (datetime.now() + timedelta(days=14)).isoformat(),
                "location": "Online",
                "mode": EventMode.ONLINE,
                "url": "https://www.hackerearth.com/challenges/hackathon/",
                "source": EventSource.HACKEREARTH,
                "tags": ["hackathon", "ai", "machine-learning", "technology"],
                "prize": "Prizes worth $5000",
                "imageUrl": ""
            })

            events.append({
                "id": "hackerearth-sample-2",
                "title": "Web3 Innovation Challenge",
                "description": "Create cutting-edge decentralized applications on blockchain platforms.",
                "startDate": (datetime.now() + timedelta(days=7)).isoformat(),
                "endDate": (datetime.now() + timedelta(days=21)).isoformat(),
                "location": "Bangalore, India",
                "mode": EventMode.HYBRID,
                "url": "https://www.hackerearth.com/challenges/hackathon/",
                "source": EventSource.HACKEREARTH,
                "tags": ["hackathon", "web3", "blockchain", "crypto"],
                "prize": "Prizes worth ₹200,000",
                "imageUrl": ""
            })

    except Exception as e:
        print(f"Error scraping HackerEarth: {e}")

        # Use fallback HTML if available
        fallback_file_path = find_local_html_file("hackerearth_response.html")
        html_content = load_html_from_file(fallback_file_path)

        if html_content:
            print("Using fallback HTML for HackerEarth after exception")
            try:
                soup = BeautifulSoup(html_content, 'html.parser')
                # Process the fallback HTML (simplified)
                # ... (processing code would go here, but for simplicity we'll just use hardcoded events)
            except Exception as e:
                print(f"Error processing fallback HTML: {e}")

        # Add hardcoded fallback events
        if not events:
            print("Using hardcoded fallback events for HackerEarth due to error")
            events.append({
                "id": "hackerearth-fallback-1",
                "title": "Data Science Competition",
                "description": "Solve real-world data science problems and win exciting prizes.",
                "startDate": datetime.now().isoformat(),
                "endDate": (datetime.now() + timedelta(days=30)).isoformat(),
                "location": "Online",
                "mode": EventMode.ONLINE,
                "url": "https://www.hackerearth.com/challenges/hackathon/",
                "source": EventSource.HACKEREARTH,
                "tags": ["hackathon", "data-science", "analytics"],
                "prize": "Prizes worth $3000",
                "imageUrl": ""
            })

    return events


def get_scraper_api_key():
    """Get the ScraperAPI key from environment variables"""
    return os.environ.get('SCRAPER_API_KEY', None)


def scrape_devfolio(force_refresh=False, use_cached_html=False):
    """
    Scrape events from Devfolio using ScraperAPI if available, otherwise use direct scraping
    @param force_refresh: If True, bypass cache and force a fresh scrape
    @param use_cached_html: If True, force loading from local HTML files
    """
    # Get the ScraperAPI key
    api_key = get_scraper_api_key()

    # Check for cached results first if not forcing refresh
    if not force_refresh:
        cached_events = get_from_cache("devfolio_events_detailed")
        if cached_events:
            print("Using cached Devfolio events")
            return cached_events

    # Check if we have a recent HTML file for the main page (less than 2 hours old)
    main_fallback_file = find_local_html_file(
        "devfolio_response_scraperapi.html")

    # If we have a local HTML file or forced cached mode
    if use_cached_html or (main_fallback_file and is_html_file_recent(main_fallback_file) and not force_refresh):
        if use_cached_html:
            print("Using local HTML file for Devfolio (forced)")
        else:
            print("Using recent cached HTML file for Devfolio (less than 2 hours old)")
        return scrape_devfolio_direct(force_refresh, use_cached_html=True)

    # If no API key is available, fall back to direct scraping
    if not api_key:
        print("💡 No ScraperAPI key found, falling back to direct scraping method")
        return scrape_devfolio_direct(force_refresh, use_cached_html=use_cached_html)
    elif api_key == "your_api_key_here":
        print(
            "⚠️  Using placeholder ScraperAPI key - please replace with your actual API key")
        print("💡 Falling back to direct scraping method")
        return scrape_devfolio_direct(force_refresh)
    else:
        print("🚀 ScraperAPI key found! Using ScraperAPI for improved scraping")

    events = []
    try:
        # ScraperAPI Configuration
        API_KEY = api_key

        # First try to get the list from the main page
        list_url = "https://devfolio.co/hackathons/open"

        # Build ScraperAPI URL
        api_url = (
            f"http://api.scraperapi.com"
            f"?api_key={API_KEY}"
            f"&url={list_url}"
            f"&render=true"
            f"&keep_headers=true"
        )

        print(f"Fetching hackathon list from {list_url} via ScraperAPI")

        hackathon_links = []

        # Try to get links from the main page using ScraperAPI
        try:
            # Request through ScraperAPI with JS rendering
            # Reduced timeout for faster response
            response = requests.get(api_url, timeout=30)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')

                # Save for future fallback use
                fallback_file = os.path.join(
                    FALLBACK_HTML_DIR, "devfolio_response_scraperapi.html")
                with open(fallback_file, "w", encoding="utf-8") as f:
                    f.write(response.text)
                print(f"Saved HTML to {fallback_file} for future fallback use")

                # Look for Link__LinkBase pattern which is used for hackathon links
                link_anchors = soup.select('a[class*="Link__LinkBase"]')
                print(
                    f"Found {len(link_anchors)} links with Link__LinkBase class pattern")

                # Use ONLY Link__LinkBase links
                anchors = link_anchors

                # Process only the Link__LinkBase pattern links
                hackathon_links = []
                for anchor in anchors:
                    href = anchor.get('href')
                    anchor_text = anchor.get_text().strip()

                    print(
                        f"Processing link from Link__LinkBase pattern: {href} - Text: {anchor_text[:50]}")

                    # Check if it's a hackathon link
                    if href:
                        # Format the URL properly
                        if not href.startswith('http'):
                            if href.startswith('/'):
                                href = f"https://devfolio.co{href}"
                            else:
                                href = f"https://devfolio.co/{href}"

                        # Skip non-hackathon pages but keep all potential devfolio.co subdomains
                        if ('open' not in href and
                            'explore' not in href and
                            'login' not in href and
                                href not in hackathon_links):
                            hackathon_links.append(href)
                            print(f"  Added Link__LinkBase link: {href}")

                # Only if we didn't find ANY hackathon links, fall back to examples
                if not hackathon_links:
                    print(
                        "No hackathon links found with Link__LinkBase pattern, using example list")
                    example_hackathons = [
                        "https://rns-hackoverflow-2.devfolio.co/",
                        "https://hackhazards-25.devfolio.co/",
                        "https://bitbox-5-0.devfolio.co/",
                        "https://synapses-25.devfolio.co/",
                        "https://amuhacks-4-0.devfolio.co/"
                    ]
                    hackathon_links.extend(example_hackathons)

                print(
                    f"Found {len(hackathon_links)} hackathon links on the main page")
            else:
                print(
                    f"ScraperAPI returned status code: {response.status_code}")

        except Exception as e:
            print(f"Error fetching main page via ScraperAPI: {e}")
            import traceback
            traceback.print_exc()

        # Add new code here
        print(
            f"Processing all {len(hackathon_links)} hackathon links from Devfolio...")

        # Process hackathon detail pages in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            # Submit all scraping tasks
            future_to_url = {
                executor.submit(scrape_hackathon_details, event_url, API_KEY, use_cached_html=use_cached_html): event_url
                for event_url in hackathon_links
            }

            # Process results as they complete
            for future in concurrent.futures.as_completed(future_to_url):
                event_url = future_to_url[future]
                try:
                    event = future.result()
                    if event:  # Only add if we got a valid event
                        events.append(event)
                        print(f"Added event: {event.get('title', 'Unnamed')}")
                except Exception as e:
                    print(f"Error processing {event_url}: {e}")

        # Only add a sample hardcoded event if not in force_refresh mode and no events were found
        if not events and not force_refresh:
            print("Adding sample hardcoded event")
            events.append({
                "id": "rns-hackoverflow-2",
                "title": "RNS Hack_Overflow 2.0",
                "description": "RNS_HackOverflow 2.0 is an annual 24-Hour Hackathon, hosted by the Department of Information Science and Engineering. This Hackathon serves as the backbone for fulfilling the primary motto of HackOverflow 2.0, i.e. developing interest and encouraging innovation in technology among the peers.",
                "startDate": "2025-05-24T00:00:00",
                "endDate": "2025-05-25T00:00:00",
                "location": "Bengaluru, India",
                "mode": EventMode.IN_PERSON,
                "url": "https://rns-hackoverflow-2.devfolio.co/",
                "source": EventSource.DEVFOLIO,
                "tags": ["hackathon", "coding", "technology"],
                "prize": "Prizes worth $550",
                "imageUrl": "https://assets.devfolio.co/hackathons/c4e78cf1a97c4aebb8d5d9992e49517b/assets/cover/231.png",
                "sponsors": ["ETHIndia", "Polygon", "Aptos"],
                "teamSize": {"min": 1, "max": 4}
            })

        print(
            f"Successfully scraped {len(events)} events from Devfolio using ScraperAPI")

        # Cache the results
        if events:
            save_to_cache("devfolio_events_detailed", events)

    except Exception as e:
        print(f"Error scraping Devfolio: {e}")
        import traceback
        traceback.print_exc()

    return events


def scrape_hackathon_details(event_url, api_key, use_cached_html=False):
    """Scrape details of a single hackathon (for parallel processing)"""
    try:
        # Extract hackathon ID from URL
        event_id = event_url.split('//')[1].split('.')[0]
        if not event_id:
            return None

        # Check if we have a recent HTML file (less than 2 hours old)
        fallback_file_path = find_local_html_file(
            f"devfolio_detail_{event_id}*.html")

        if fallback_file_path and (use_cached_html or is_html_file_recent(fallback_file_path)):
            # Use the local HTML file直接 without attempting a new scrape
            if use_cached_html:
                print(f"Using local HTML file for hackathon {event_id} (forced)")
            else:
                print(
                    f"Using recent cached HTML file for hackathon {event_id} (less than 2 hours old)")
            
            html_content = load_html_from_file(fallback_file_path)
            if html_content:
                detail_soup = BeautifulSoup(html_content, 'html.parser')
            else:
                if use_cached_html:
                    return None
                print("Failed to load recent cached HTML, will try live scraping")
                detail_soup = None
                # Continue with live scraping
        elif use_cached_html:
            return None
        else:
            print(f"Fetching details for {event_url} via ScraperAPI")

            # Build ScraperAPI URL for the detail page with improved parameters
            api_detail_url = (
                f"http://api.scraperapi.com"
                f"?api_key={api_key}"
                f"&url={event_url}"
                f"&render=true"
                f"&keep_headers=true"
            )

            # Implement retry logic for more reliable scraping
            max_retries = 2  # Reduced from 3 to 2 for faster response
            retry_count = 0
            detail_response = None

            while retry_count < max_retries:
                try:
                    # Fetch the event detail page through ScraperAPI
                    detail_response = requests.get(
                        api_detail_url, timeout=20)  # Reduced timeout

                    # Check if we got a successful response
                    if detail_response.status_code == 200:
                        break

                    # If we got a 500 error, retry with a different approach
                    if detail_response.status_code == 500:
                        print(
                            f"ScraperAPI returned 500 error on attempt {retry_count+1}/{max_retries}, retrying...")

                        # Try a different approach on each retry
                        if retry_count == 0:
                            # Try without rendering JS on first retry
                            api_detail_url = api_detail_url.replace(
                                "&render=true", "")

                        # Add a delay before retrying to avoid overwhelming the API
                        time.sleep(1)
                    else:
                        # For other status codes, just log and continue to next retry
                        print(
                            f"ScraperAPI returned status code: {detail_response.status_code} on attempt {retry_count+1}/{max_retries}")
                        time.sleep(1)

                    retry_count += 1
                except Exception as e:
                    print(
                        f"Error on attempt {retry_count+1}/{max_retries}: {e}")
                    retry_count += 1
                    time.sleep(1)

            # Check if we got a successful response after retries
            if not detail_response or detail_response.status_code != 200:
                print(
                    f"Failed to fetch detail page after {max_retries} attempts: {event_url}")

                # Try direct scraping as a fallback for this specific event
                print(
                    f"Attempting direct scraping as fallback for: {event_url}")
                try:
                    # Setup headers for direct request
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Referer': 'https://devfolio.co/',
                    }
                    # Direct request as fallback
                    direct_response = requests.get(
                        event_url, headers=headers, timeout=15)
                    if direct_response.status_code == 200:
                        detail_response = direct_response
                        print(f"Successfully fetched via direct request")
                    else:
                        print(
                            f"Direct request also failed with status: {direct_response.status_code}")

                        # Look for a local HTML file as a final fallback
                        html_file_path = find_local_html_file(
                            f"devfolio_detail_{event_id}*.html")
                        html_content = load_html_from_file(html_file_path)

                        if html_content:
                            # Create a mock response object
                            class MockResponse:
                                def __init__(self, text, status_code=200):
                                    self.text = text
                                    self.status_code = status_code

                            detail_response = MockResponse(html_content)
                            print(
                                f"Using local HTML file as fallback for {event_id}")
                        else:
                            print(
                                f"No fallback HTML file found for {event_id}, returning None")
                            return None
                except Exception as e:
                    print(f"Direct request failed with error: {e}")

                    # Look for a local HTML file as a final fallback
                    html_file_path = find_local_html_file(
                        f"devfolio_detail_{event_id}*.html")
                    html_content = load_html_from_file(html_file_path)

                    if html_content:
                        # Create a mock response object
                        class MockResponse:
                            def __init__(self, text, status_code=200):
                                self.text = text
                                self.status_code = status_code

                        detail_response = MockResponse(html_content)
                        print(
                            f"Using local HTML file as fallback for {event_id}")
                    else:
                        print(
                            f"No fallback HTML file found for {event_id}, returning None")
                        return None

            if detail_response and detail_response.status_code == 200:
                # Save the response for future fallback use
                fallback_file = os.path.join(
                    FALLBACK_HTML_DIR, f"devfolio_detail_{event_id}.html")
                with open(fallback_file, "w", encoding="utf-8") as f:
                    f.write(detail_response.text)
                print(
                    f"Saved detail HTML to {fallback_file} for future fallback use")

                detail_soup = BeautifulSoup(
                    detail_response.text, 'html.parser')
            else:
                return None

        # Extract essential info with minimal processing
        # This is a simplified version for speed

        # Extract title - just try h1 and meta for speed
        title = "Unnamed Hackathon"
        title_elem = detail_soup.find('h1')
        if title_elem:
            title = title_elem.get_text().strip()
        else:
            meta_title = detail_soup.find('meta', property='og:title')
            if meta_title and 'content' in meta_title.attrs:
                title = meta_title['content']

        # Extract image - just from meta tags for speed
        banner_img = ""
        meta_image = detail_soup.find('meta', property='og:image')
        if meta_image and 'content' in meta_image.attrs:
            banner_img = meta_image['content']

        # Extract description - just from meta description for speed
        description = "Join this exciting hackathon on Devfolio."
        meta_desc = detail_soup.find('meta', property='og:description') or detail_soup.find(
            'meta', attrs={'name': 'description'})
        if meta_desc and 'content' in meta_desc.attrs:
            description = meta_desc['content']

        # Set reasonable defaults for other fields
        start_date = datetime.now().isoformat()
        end_date = (datetime.now() + timedelta(days=2)).isoformat()
        location = "India"
        mode = EventMode.ONLINE
        prize = "Exciting prizes to be won"
        team_size = {"min": 1, "max": 4}
        sponsors = []
        tags = ["hackathon", "coding", "technology"]

        # Create the event object with minimal scraping
        return {
            "id": event_id,
            "title": title,
            "description": description,
            "startDate": start_date,
            "endDate": end_date,
            "location": location,
            "mode": mode,
            "url": event_url,
            "source": EventSource.DEVFOLIO,
            "tags": tags,
            "prize": prize,
            "imageUrl": banner_img,
            "sponsors": sponsors,
            "teamSize": team_size
        }

    except Exception as e:
        print(f"Error processing hackathon {event_url}: {e}")
        import traceback
        traceback.print_exc()
        return None


def scrape_devfolio_direct(force_refresh=False, use_cached_html=False):
    """Original direct scraping method for Devfolio without using ScraperAPI"""
    events = []
    try:
        hackathon_links = []
        list_url = "https://devfolio.co/hackathons/open"

        # If use_cached_html is True, skip the live scraping and use cached HTML directly
        if use_cached_html:
            print("Using cached HTML for Devfolio as requested")
            # Load cached HTML
            main_fallback_file = find_local_html_file(
                "devfolio_response_scraperapi.html")
            html_content = load_html_from_file(main_fallback_file)

            if html_content:
                soup = BeautifulSoup(html_content, 'html.parser')
                print(
                    f"Successfully loaded cached HTML from {main_fallback_file}")

                # Extract links from the cached HTML
                fallback_links = soup.select('a[class*="Link__LinkBase"]')
                print(f"Found {len(fallback_links)} links in cached HTML")

                for anchor in fallback_links:
                    href = anchor.get('href')
                    if href:
                        # Format the URL properly
                        if not href.startswith('http'):
                            if href.startswith('/'):
                                href = f"https://devfolio.co{href}"
                            else:
                                href = f"https://devfolio.co/{href}"

                        # Skip non-hackathon pages but keep all potential devfolio.co subdomains
                        if ('open' not in href and
                            'explore' not in href and
                            'login' not in href and
                                href not in hackathon_links):
                            hackathon_links.append(href)
                            print(f"  Added cached link: {href}")
            else:
                # Fall back to example list if cached HTML couldn't be loaded
                print("Failed to load cached HTML, using example list")
                example_hackathons = [
                    "https://rns-hackoverflow-2.devfolio.co/",
                    "https://hackhazards-25.devfolio.co/",
                    "https://bitbox-5-0.devfolio.co/",
                    "https://synapses-25.devfolio.co/",
                    "https://amuhacks-4-0.devfolio.co/"
                ]
                hackathon_links.extend(example_hackathons)
        else:
            # Try to get links from the main page using live request
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://devfolio.co/',
                'Cache-Control': 'max-age=0',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            }

            # Initialize session to maintain cookies
            session = requests.Session()
            session.headers.update(headers)

            print(f"Fetching hackathon list from {list_url} using direct method")

            # If we still have no links, use example list
            if not hackathon_links:
                print("No hackathon links found in cached HTML, using example list")
                example_hackathons = [
                    "https://rns-hackoverflow-2.devfolio.co/",
                    "https://hackhazards-25.devfolio.co/",
                    "https://bitbox-5-0.devfolio.co/",
                    "https://synapses-25.devfolio.co/",
                    "https://amuhacks-4-0.devfolio.co/"
                ]
                hackathon_links.extend(example_hackathons)

                print(f"Using {len(hackathon_links)} links from cached HTML")
            else:
                # Fall back to example list if cached HTML couldn't be loaded
                print("Failed to load cached HTML, using example list")
                example_hackathons = [
                    "https://rns-hackoverflow-2.devfolio.co/",
                    "https://hackhazards-25.devfolio.co/",
                    "https://bitbox-5-0.devfolio.co/",
                    "https://synapses-25.devfolio.co/",
                    "https://amuhacks-4-0.devfolio.co/"
                ]
                hackathon_links.extend(example_hackathons)
                # Try to get links from the main page using live request
                try:
                    response = None
                    # First try using the ScraperAPI
                        # Check if the api_url is defined - if not, define it
                    if 'api_url' not in locals() and 'api_url' not in globals():
                        API_KEY = get_scraper_api_key()
                        if API_KEY:
                            api_url = (
                                f"http://api.scraperapi.com"
                                f"?api_key={API_KEY}"
                                f"&url={list_url}"
                                f"&render=true"
                                f"&keep_headers=true"
                            )
                        else:
                            # No API key available
                            raise Exception("No ScraperAPI key available")
                    response = requests.get(api_url, timeout=45)
                except Exception as e:
                    print(f"Error with ScraperAPI request: {e}")
                    # If ScraperAPI fails, try direct request
                    response = session.get(list_url, timeout=30)

                # Check if we got a successful response
                if response and response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')

                    # Save HTML for debugging and future fallback use
                    fallback_file = os.path.join(
                        FALLBACK_HTML_DIR, "devfolio_response_scraperapi.html")
                    with open(fallback_file, "w", encoding="utf-8") as f:
                        f.write(response.text)
                    print(
                        f"Saved HTML response to {fallback_file} for future fallback use")

                    # Print page structure for debugging
                    print(
                        f"Page title: {soup.title.string if soup.title else 'No title'}")

                    # Look for Link__LinkBase pattern which is used for hackathon links
                    link_anchors = soup.select('a[class*="Link__LinkBase"]')
                    print(
                        f"Found {len(link_anchors)} links with Link__LinkBase class pattern")

                    # Use ONLY Link__LinkBase links
                    anchors = link_anchors

                    # Process only the Link__LinkBase pattern links
                    for anchor in anchors:
                        href = anchor.get('href')
                        anchor_text = anchor.get_text().strip()

                        print(
                            f"Processing link from Link__LinkBase pattern: {href} - Text: {anchor_text[:50]}")

                        # Check if it's a hackathon link
                        if href:
                            # Format the URL properly
                            if not href.startswith('http'):
                                if href.startswith('/'):
                                    href = f"https://devfolio.co{href}"
                                else:
                                    href = f"https://devfolio.co/{href}"

                            # Skip non-hackathon pages but keep all potential devfolio.co subdomains
                            if ('open' not in href and
                                'explore' not in href and
                                'login' not in href and
                                    href not in hackathon_links):
                                hackathon_links.append(href)
                                print(f"  Added Link__LinkBase link: {href}")

                    # Only if we didn't find ANY hackathon links, check for fallback HTML
                    if not hackathon_links:
                        print(
                            "No hackathon links found with Link__LinkBase pattern, looking for saved HTML")

                        # Look for local HTML file
                        html_file_path = find_local_html_file(
                            "devfolio_response_scraperapi.html")
                        html_content = load_html_from_file(html_file_path)

                        if html_content:
                            print("Using previously saved HTML as fallback")
                            fallback_soup = BeautifulSoup(
                                html_content, 'html.parser')

                            # Try to extract links from fallback HTML
                            fallback_links = fallback_soup.select(
                                'a[class*="Link__LinkBase"]')
                            print(
                                f"Found {len(fallback_links)} links in fallback HTML")

                            for anchor in fallback_links:
                                href = anchor.get('href')
                                if href:
                                    # Format the URL properly
                                    if not href.startswith('http'):
                                        if href.startswith('/'):
                                            href = f"https://devfolio.co{href}"
                                        else:
                                            href = f"https://devfolio.co/{href}"

                                    # Skip non-hackathon pages but keep all potential devfolio.co subdomains
                                    if ('open' not in href and
                                        'explore' not in href and
                                        'login' not in href and
                                            href not in hackathon_links):
                                        hackathon_links.append(href)
                                        print(
                                            f"  Added fallback Link__LinkBase link: {href}")

                    # If we still have no links, use example list
                    if not hackathon_links:
                        print(
                            "No hackathon links found from fallbacks, using example list")
                        example_hackathons = [
                            "https://rns-hackoverflow-2.devfolio.co/",
                            "https://hackhazards-25.devfolio.co/",
                            "https://bitbox-5-0.devfolio.co/",
                            "https://synapses-25.devfolio.co/",
                            "https://amuhacks-4-0.devfolio.co/"
                        ]
                        hackathon_links.extend(example_hackathons)

                    print(
                        f"Found {len(hackathon_links)} hackathon links from fallbacks")
                else:
                    print(
                        f"Failed to fetch main page: {response.status_code if response else 'No response'}")

                    # Try fallback HTML
                    html_file_path = find_local_html_file(
                        "devfolio_response_scraperapi.html")
                    html_content = load_html_from_file(html_file_path)

                    if html_content:
                        print("Using previously saved HTML as fallback for main page")
                        fallback_soup = BeautifulSoup(
                            html_content, 'html.parser')

                        # Try to extract links from fallback HTML
                        fallback_links = fallback_soup.select(
                            'a[class*="Link__LinkBase"]')
                        print(
                            f"Found {len(fallback_links)} links in fallback HTML")

                        for anchor in fallback_links:
                            href = anchor.get('href')
                            if href:
                                # Format the URL properly
                                if not href.startswith('http'):
                                    if href.startswith('/'):
                                        href = f"https://devfolio.co{href}"
                                    else:
                                        href = f"https://devfolio.co/{href}"

                                # Skip non-hackathon pages but keep all potential devfolio.co subdomains
                                if ('open' not in href and
                                    'explore' not in href and
                                    'login' not in href and
                                        href not in hackathon_links):
                                    hackathon_links.append(href)
                                    print(
                                        f"  Added fallback Link__LinkBase link: {href}")

                    # If we still have no links, use example list
                    if not hackathon_links:
                        print(
                            "No hackathon links found from fallbacks, using example list")
                        example_hackathons = [
                            "https://rns-hackoverflow-2.devfolio.co/",
                            "https://hackhazards-25.devfolio.co/",
                            "https://bitbox-5-0.devfolio.co/",
                            "https://synapses-25.devfolio.co/",
                            "https://amuhacks-4-0.devfolio.co/"
                        ]
                        hackathon_links.extend(example_hackathons)

                    print(
                        f"Found {len(hackathon_links)} hackathon links from fallbacks")

                # Use fallback HTML
                html_file_path = find_local_html_file(
                    "devfolio_response_scraperapi.html")
                html_content = load_html_from_file(html_file_path)

                if html_content:
                    print("Using previously saved HTML as fallback after exception")
                    fallback_soup = BeautifulSoup(html_content, 'html.parser')

                    # Try to extract links from fallback HTML
                    fallback_links = fallback_soup.select(
                        'a[class*="Link__LinkBase"]')
                    print(
                        f"Found {len(fallback_links)} links in fallback HTML")

                    for anchor in fallback_links:
                        href = anchor.get('href')
                        if href:
                            # Format the URL properly
                            if not href.startswith('http'):
                                if href.startswith('/'):
                                    href = f"https://devfolio.co{href}"
                                else:
                                    href = f"https://devfolio.co/{href}"

                            # Skip non-hackathon pages but keep all potential devfolio.co subdomains
                            if ('open' not in href and
                                'explore' not in href and
                                'login' not in href and
                                    href not in hackathon_links):
                                hackathon_links.append(href)
                                print(
                                    f"  Added fallback Link__LinkBase link: {href}")

                # If we still have no links, use example list
                if not hackathon_links:
                    print("Using example list as ultimate fallback")
                    example_hackathons = [
                        "https://rns-hackoverflow-2.devfolio.co/",
                        "https://hackhazards-25.devfolio.co/",
                        "https://bitbox-5-0.devfolio.co/",
                        "https://synapses-25.devfolio.co/",
                        "https://amuhacks-4-0.devfolio.co/"
                    ]
                    hackathon_links.extend(example_hackathons)

                print(
                    f"Proceeding with {len(hackathon_links)} hackathon links from fallbacks")

        # Process each hackathon detail page
        for event_url in hackathon_links:
            try:
                # Extract hackathon ID from URL
                event_id = event_url.split('//')[1].split('.')[0]
                if not event_id:
                    continue

                # Skip duplicates
                if any(e.get('id') == event_id for e in events):
                    continue

                # For cached HTML mode, check if we have a recent HTML file for this event
                if use_cached_html:
                    fallback_file_path = find_local_html_file(
                        f"devfolio_detail_{event_id}*.html")

                    if fallback_file_path and is_html_file_recent(fallback_file_path):
                        print(
                            f"Using recent cached HTML file for hackathon {event_id}")
                        html_content = load_html_from_file(fallback_file_path)

                        if html_content:
                            # Create a mock response object for the scraper
                            class MockResponse:
                                def __init__(self, text, status_code=200):
                                    self.text = text
                                    self.status_code = status_code

                            # Try to use scrape_hackathon_details with mock response
                            # We create a custom version of the function to use our cached HTML
                            detail_soup = BeautifulSoup(
                                html_content, 'html.parser')

                            # Extract title
                            title = "Unnamed Hackathon"
                            title_elem = detail_soup.find('h1')
                            if title_elem:
                                title = title_elem.get_text().strip()
                            else:
                                meta_title = detail_soup.find(
                                    'meta', property='og:title')
                                if meta_title and 'content' in meta_title.attrs:
                                    title = meta_title['content']

                            # Extract image
                            banner_img = ""
                            meta_image = detail_soup.find(
                                'meta', property='og:image')
                            if meta_image and 'content' in meta_image.attrs:
                                banner_img = meta_image['content']

                            # Extract description
                            description = "Join this exciting hackathon on Devfolio."
                            meta_desc = detail_soup.find('meta', property='og:description') or detail_soup.find(
                                'meta', attrs={'name': 'description'})
                            if meta_desc and 'content' in meta_desc.attrs:
                                description = meta_desc['content']

                            # Set default values for other fields
                            event = {
                                "id": event_id,
                                "title": title,
                                "description": description,
                                "startDate": datetime.now().isoformat(),
                                "endDate": (datetime.now() + timedelta(days=2)).isoformat(),
                                "location": "India",
                                "mode": EventMode.ONLINE,
                                "url": event_url,
                                "source": EventSource.DEVFOLIO,
                                "tags": ["hackathon", "coding", "technology"],
                                "prize": "Exciting prizes to be won",
                                "imageUrl": banner_img,
                                "sponsors": [],
                                "teamSize": {"min": 1, "max": 4}
                            }

                            events.append(event)
                            print(
                                f"Added Devfolio event from cached HTML: {title}")
                            continue  # Skip to next event

                print(f"Fetching details for {event_url}")

                # Try to get cached event first
                fallback_file_path = find_local_html_file(
                    f"devfolio_detail_{event_id}*.html")

                # Try to use scrape_hackathon_details for consistent processing
                API_KEY = get_scraper_api_key()
                event_data = scrape_hackathon_details(event_url, API_KEY, use_cached_html=use_cached_html)

                if event_data:
                    events.append(event_data)
                    print(
                        f"Added Devfolio event: {event_data.get('title', 'Unnamed')}")
                    continue  # Continue to next event if this one was processed successfully

                # If we couldn't get data from scrape_hackathon_details, try our own processing from HTML file
                if fallback_file_path:
                    print(f"Using fallback HTML file for {event_id}")
                    html_content = load_html_from_file(fallback_file_path)
                    if html_content:
                        detail_soup = BeautifulSoup(
                            html_content, 'html.parser')

                        # Extract title
                        title = "Unnamed Hackathon"
                        title_elem = detail_soup.find('h1')
                        if title_elem:
                            title = title_elem.get_text().strip()
                        else:
                            meta_title = detail_soup.find(
                                'meta', property='og:title')
                            if meta_title and 'content' in meta_title.attrs:
                                title = meta_title['content']

                        # Extract image
                        banner_img = ""
                        meta_image = detail_soup.find(
                            'meta', property='og:image')
                        if meta_image and 'content' in meta_image.attrs:
                            banner_img = meta_image['content']

                        # Extract description
                        description = "Join this exciting hackathon on Devfolio."
                        meta_desc = detail_soup.find('meta', property='og:description') or detail_soup.find(
                            'meta', attrs={'name': 'description'})
                        if meta_desc and 'content' in meta_desc.attrs:
                            description = meta_desc['content']

                        # Set default values for other fields
                        event = {
                            "id": event_id,
                            "title": title,
                            "description": description,
                            "startDate": datetime.now().isoformat(),
                            "endDate": (datetime.now() + timedelta(days=2)).isoformat(),
                            "location": "India",
                            "mode": EventMode.ONLINE,
                            "url": event_url,
                            "source": EventSource.DEVFOLIO,
                            "tags": ["hackathon", "coding", "technology"],
                            "prize": "Exciting prizes to be won",
                            "imageUrl": banner_img,
                            "sponsors": [],
                            "teamSize": {"min": 1, "max": 4}
                        }

                        events.append(event)
                        print(
                            f"Added Devfolio event from fallback HTML: {title}")

            except Exception as e:
                print(f"Error processing hackathon {event_url}: {e}")
                import traceback
                traceback.print_exc()

        # Only add a sample hardcoded event if not in force_refresh mode and no events were found
        if not events and not force_refresh:
            print("Adding sample hardcoded event")
            events.append({
                "id": "rns-hackoverflow-2",
                "title": "RNS Hack_Overflow 2.0",
                "description": "RNS_HackOverflow 2.0 is an annual 24-Hour Hackathon, hosted by the Department of Information Science and Engineering. This Hackathon serves as the backbone for fulfilling the primary motto of HackOverflow 2.0, i.e. developing interest and encouraging innovation in technology among the peers.",
                "startDate": "2025-05-24T00:00:00",
                "endDate": "2025-05-25T00:00:00",
                "location": "Bengaluru, India",
                "mode": EventMode.IN_PERSON,
                "url": "https://rns-hackoverflow-2.devfolio.co/",
                "source": EventSource.DEVFOLIO,
                "tags": ["hackathon", "coding", "technology"],
                "prize": "Prizes worth $550",
                "imageUrl": "https://assets.devfolio.co/hackathons/c4e78cf1a97c4aebb8d5d9992e49517b/assets/cover/231.png",
                "sponsors": ["ETHIndia", "Polygon", "Aptos"],
                "teamSize": {"min": 1, "max": 4}
            })

        print(f"Successfully scraped {len(events)} events from Devfolio")

    except Exception as e:
        print(f"Error scraping Devfolio: {e}")
        import traceback
        traceback.print_exc()

    return events


def refresh_events_background():
    """Refresh events in a background thread"""
    global hackerearth_events, devfolio_events, last_fetched, is_refreshing

    print("Starting background refresh of event data...")

    # Set refreshing flag
    is_refreshing = True

    try:
        # Check if we have recent HTML files for both sources (less than 2 hours old)
        hackerearth_file = find_local_html_file("hackerearth_response.html")
        devfolio_file = find_local_html_file(
            "devfolio_response_scraperapi.html")

        use_cached_html = False

        # If both HTML files exist and are recent, use them directly
        if (hackerearth_file and is_html_file_recent(hackerearth_file) and
                devfolio_file and is_html_file_recent(devfolio_file)):
            print(
                "⚡ Found recent HTML files for both sources, using cached data instead of fresh scraping")
            use_cached_html = True
            force_refresh = False
        else:
            # Force refresh from sources, bypassing cache
            force_refresh = True
            print("🔄 Either HTML files are missing or too old, performing fresh scraping")

        # Get HackerEarth events
        print("Scraping HackerEarth events (step 1/3)...")
        he_events = scrape_hackerearth()
        print(f"Found {len(he_events)} HackerEarth events")

        # Get Devfolio events (with parallel processing)
        print("Scraping Devfolio events (step 2/3)...")
        df_events = scrape_devfolio(force_refresh)
        print(f"Found {len(df_events)} Devfolio events")

        # Validate events (step 3/3)
        print("Validating and processing events (step 3/3)...")

        # Update global variables
        hackerearth_events = he_events
        devfolio_events = df_events
        last_fetched = datetime.now()

        # Save to cache
        save_to_cache("hackerearth_events", he_events)
        save_to_cache("devfolio_events", df_events)

        print(
            f"Background refresh complete: {len(he_events)} HackerEarth events, {len(df_events)} Devfolio events")
    except Exception as e:
        print(f"Error in background refresh: {e}")
    finally:
        # Reset refreshing flag
        is_refreshing = False

# Auto-refresh events on startup - this approach is deprecated in newer Flask versions
# @app.before_first_request
# def initialize():
#     refresh_events()

# New approach for initializing data


def initialize():
    global hackerearth_events, devfolio_events
    if not hackerearth_events and not devfolio_events:
        try:
            hackerearth_events = scrape_hackerearth()
            devfolio_events = scrape_devfolio()
            print(
                f"Initialized with {len(hackerearth_events)} HackerEarth events and {len(devfolio_events)} Devfolio events")
        except Exception as e:
            print(f"Error initializing events: {e}")

# Call initialize before each request if data is empty


# @app.before_request
# def check_initialization():
#     if not hackerearth_events and not devfolio_events:
#         initialize()

# For local development
if __name__ == "__main__":
    # Load initial data
    # initialize()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
