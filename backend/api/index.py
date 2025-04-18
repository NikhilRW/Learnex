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


# Routes


@app.route('/api/health', methods=['GET'])
def health_check():
    """Basic health check endpoint"""
    return jsonify({
        "status": "healthy",
        "version": "1.0.0"
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
    force = request.args.get('force', 'false').lower() == 'true'

    # If force is true, trigger a refresh
    if force:
        print("Force refresh requested via /api/hackathons endpoint")
        # Start background thread for refresh
        threading.Thread(target=refresh_events_background).start()
        # We'll continue and return existing data, refresh will happen in background

    # Check if a refresh is currently in progress
    if is_refreshing:
        # If we don't have any data yet, return a loading placeholder
        if not hackerearth_events and not devfolio_events:
            return jsonify([{
                "id": "loading",
                "title": "Refreshing Events...",
                "description": "We're currently refreshing event data from our sources. This may take a minute or two. Please check back soon!",
                "source": "loading",
                "mode": "online",
                "startDate": datetime.now().isoformat(),
                "endDate": (datetime.now() + timedelta(days=1)).isoformat(),
                "location": "Loading...",
                "imageUrl": "",
                "url": ""
            }])

    # Check if we need to initialize or refresh data
    current_time = datetime.now()

    # Initialize if needed
    if not hackerearth_events and not devfolio_events:
        print("Initial data load...")
        # Try to load from cache first
        cached_hackerearth = get_from_cache("hackerearth_events")
        cached_devfolio = get_from_cache("devfolio_events")

        if cached_hackerearth and cached_devfolio:
            hackerearth_events = cached_hackerearth
            devfolio_events = cached_devfolio
            last_fetched = current_time
            print(
                f"Loaded {len(hackerearth_events)} HackerEarth events and {len(devfolio_events)} Devfolio events from cache")
        else:
            # Start background thread to load data if not in cache
            threading.Thread(target=refresh_events_background).start()

            # Return a small placeholder response immediately
            return jsonify([{
                "id": "loading",
                "title": "Loading Events...",
                "description": "Please wait or check back in a minute while we fetch the latest hackathons.",
                "source": "loading",
                "mode": "online",
                "startDate": datetime.now().isoformat(),
                "endDate": (datetime.now() + timedelta(days=1)).isoformat(),
                "location": "Loading...",
                "imageUrl": "",
                "url": ""
            }])

    # Auto-refresh if data is older than the cache duration (5 minutes)
    elif last_fetched and (current_time - last_fetched > timedelta(seconds=CACHE_DURATION)):
        print(
            f"Auto-refreshing data after cache duration ({CACHE_DURATION} seconds)...")
        threading.Thread(target=refresh_events_background).start()

    # Combine events from both sources
    all_events = hackerearth_events + devfolio_events

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
    if source == EventSource.HACKEREARTH:
        # Find the event in hackerearth_events
        for event in hackerearth_events:
            if event.get('id') == event_id:
                # Fetch additional details if needed
                return jsonify(event)

    elif source == EventSource.DEVFOLIO:
        # Find the event in devfolio_events
        for event in devfolio_events:
            if event.get('id') == event_id:
                # Fetch additional details if needed
                return jsonify(event)

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

    if cache_is_fresh and not force_refresh:
        minutes_remaining = int((timedelta(
            seconds=CACHE_DURATION) - (current_time - last_fetched)).total_seconds() / 60)
        return jsonify({
            "status": "cache_fresh",
            "message": f"Cache is still fresh. Auto-refresh will occur in {minutes_remaining} minute(s). Use force=true to override.",
            "cache_expires_in_seconds": int((timedelta(seconds=CACHE_DURATION) - (current_time - last_fetched)).total_seconds())
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
            "note": "Check /api/hackathons in a minute to see updated data"
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

    status = "in_progress" if is_refreshing else "idle"
    message = "Refresh operation in progress" if is_refreshing else "No refresh operation is currently running"

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

    return jsonify({
        "status": status,
        "is_refreshing": is_refreshing,
        "message": message,
        "last_updated": last_update,
        "seconds_until_refresh": seconds_until_refresh,
        "cache_duration_seconds": CACHE_DURATION,
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
            body=data['message']
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
                            default_sound=True,
                            default_vibrate_timings=True
                        )
                    ),
                    apns=messaging.APNSConfig(
                        # High priority (5 is normal)
                        headers={'apns-priority': '10'},
                        payload=messaging.APNSPayload(
                            aps=messaging.Aps(
                                alert=messaging.ApsAlert(
                                    title=data['senderName'],
                                    body=data['message']
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


def scrape_hackerearth():
    """Scrape events from HackerEarth"""
    events = []
    try:
        url = "https://www.hackerearth.com/challenges/hackathon/"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            print(f"Failed to fetch HackerEarth page: {response.status_code}")
            return events

        soup = BeautifulSoup(response.text, 'html.parser')

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
                        title_elem = card.find('div', class_='challenge-name')
                        title = title_elem.text.strip() if title_elem else "Untitled Hackathon"

                        # Generate a unique ID
                        event_id = re.sub(r'[^a-z0-9]', '-', title.lower())

                        # Extract URL
                        link_elem = card.find('a', href=True)
                        url = link_elem['href'] if link_elem else ""
                        if url and not url.startswith('http'):
                            url = f"https://www.hackerearth.com{url}"

                        # Extract dates
                        date_elem = card.find('div', class_='date-container')
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
                        desc_elem = card.find('div', class_='challenge-desc')
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

    except Exception as e:
        print(f"Error scraping HackerEarth: {e}")

    return events


def get_scraper_api_key():
    """Get the ScraperAPI key from environment variables"""
    return os.environ.get('SCRAPER_API_KEY', None)


def scrape_devfolio(force_refresh=False):
    """
    Scrape events from Devfolio using ScraperAPI if available, otherwise use direct scraping
    @param force_refresh: If True, bypass cache and force a fresh scrape
    """
    # Get the ScraperAPI key
    api_key = get_scraper_api_key()

    # Check for cached results first if not forcing refresh
    if not force_refresh:
        cached_events = get_from_cache("devfolio_events_detailed")
        if cached_events:
            print("Using cached Devfolio events")
            return cached_events

    # If no API key is available, fall back to direct scraping
    if not api_key:
        print("💡 No ScraperAPI key found, falling back to direct scraping method")
        return scrape_devfolio_direct(force_refresh)
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
                executor.submit(scrape_hackathon_details, event_url, API_KEY): event_url
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


def scrape_hackathon_details(event_url, api_key):
    """Scrape details of a single hackathon (for parallel processing)"""
    try:
        # Extract hackathon ID from URL
        event_id = event_url.split('//')[1].split('.')[0]
        if not event_id:
            return None

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
                print(f"Error on attempt {retry_count+1}/{max_retries}: {e}")
                retry_count += 1
                time.sleep(1)

        # Check if we got a successful response after retries
        if not detail_response or detail_response.status_code != 200:
            print(
                f"Failed to fetch detail page after {max_retries} attempts: {event_url}")

            # Try direct scraping as a fallback for this specific event
            print(f"Attempting direct scraping as fallback for: {event_url}")
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
                    return None
            except Exception as e:
                print(f"Direct request failed with error: {e}")
                return None

        detail_soup = BeautifulSoup(detail_response.text, 'html.parser')

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


def scrape_devfolio_direct(force_refresh=False):
    """Original direct scraping method for Devfolio without using ScraperAPI"""
    events = []
    try:
        # First try to get the list from the main page
        list_url = "https://devfolio.co/hackathons/open"
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

        hackathon_links = []

        # Try to get links from the main page using ScraperAPI
        try:
            # Request through ScraperAPI with JS rendering
            # Longer timeout for JS rendering
            response = requests.get(api_url, timeout=60)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')

                # Save HTML for debugging
                with open("devfolio_response_scraperapi.html", "w", encoding="utf-8") as f:
                    f.write(response.text)

                # Print page structure for debugging
                print(
                    f"Page title: {soup.title.string if soup.title else 'No title'}")

                # Look for Link__LinkBase pattern which is used for hackathon links
                link_anchors = soup.select('a[class*="Link__LinkBase"]')
                print(
                    f"Found {len(link_anchors)} links with Link__LinkBase class pattern")

                # Use ONLY Link__LinkBase links
                anchors = link_anchors

                # Skip the alternative selectors - as requested by user
                # alternative_anchors = soup.select('a.bnxtME, a[href*=".devfolio.co"]')
                # print(f"Found {len(alternative_anchors)} links with alternative selectors")
                # anchors = list(set(link_anchors + alternative_anchors))
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

                print(f"Fetching details for {event_url} via ScraperAPI")

                # Build ScraperAPI URL for the detail page
                api_detail_url = f"http://api.scraperapi.com?api_key={API_KEY}&url={event_url}&render=true"

                # Fetch the event detail page through ScraperAPI
                detail_response = requests.get(api_detail_url, timeout=60)
                if detail_response.status_code != 200:
                    print(
                        f"Failed to fetch detail page: {event_url} (Status {detail_response.status_code})")
                    continue

                detail_soup = BeautifulSoup(
                    detail_response.text, 'html.parser')

                # Save HTML for debugging
                with open(f"devfolio_detail_{event_id}.html", "w", encoding="utf-8") as f:
                    f.write(detail_response.text)

                # Extract title - try multiple strategies
                title = "Unnamed Hackathon"

                # Strategy 1: Look for h1 tags
                title_elem = detail_soup.find('h1')
                if title_elem:
                    title = title_elem.get_text().strip()

                # Strategy 2: Look for metadata
                if title == "Unnamed Hackathon":
                    meta_title = detail_soup.find('meta', property='og:title')
                    if meta_title and 'content' in meta_title.attrs:
                        title = meta_title['content']

                # Strategy 3: Look for large text near the top of the page
                if title == "Unnamed Hackathon":
                    large_text_elements = detail_soup.select(
                        'div[class*="title"], div[class*="heading"], span[class*="title"]')
                    for elem in large_text_elements:
                        text = elem.get_text().strip()
                        if len(text) > 5 and len(text) < 50:
                            title = text
                            break

                # Clean up title if needed
                if title.count(title.split()[0]) > 1:
                    title = ' '.join(title.split()[:len(title.split())//2])

                # Extract banner image - try multiple strategies
                banner_img = ""

                # Strategy 1: Look for meta tags
                meta_image = detail_soup.find('meta', property='og:image')
                if meta_image and 'content' in meta_image.attrs:
                    banner_img = meta_image['content']

                # Strategy 2: Look for banner/hero images
                if not banner_img:
                    banner_candidates = detail_soup.select(
                        'img[class*="banner"], img[class*="hero"], div[class*="banner"] img, div[class*="hero"] img')
                    if banner_candidates:
                        for img in banner_candidates:
                            if img.has_attr('src'):
                                src = img['src']
                                if 'logo' not in src.lower() and 'icon' not in src.lower() and '.svg' not in src.lower():
                                    if not src.startswith('http'):
                                        if src.startswith('/'):
                                            base_url = '/'.join(
                                                event_url.split('/')[:3])
                                            src = f"{base_url}{src}"
                                        else:
                                            src = f"{event_url.rstrip('/')}/{src}"
                                    banner_img = src
                                    break

                # Strategy 3: Find a large image
                if not banner_img:
                    banner_candidates = detail_soup.find_all('img', src=True)
                    for img in banner_candidates:
                        src = img['src']
                        if ('logo' not in src.lower() and
                            'icon' not in src.lower() and
                                '.svg' not in src.lower()):
                            if not src.startswith('http'):
                                if src.startswith('/'):
                                    base_url = '/'.join(event_url.split('/')
                                                        [:3])
                                    src = f"{base_url}{src}"
                                else:
                                    src = f"{event_url.rstrip('/')}/{src}"
                            banner_img = src
                            break

                # Extract description - try multiple strategies
                description = ""

                # Strategy 1: Try from meta description
                meta_desc = detail_soup.find('meta', property='og:description') or detail_soup.find(
                    'meta', attrs={'name': 'description'})
                if meta_desc and 'content' in meta_desc.attrs:
                    description = meta_desc['content']

                # Strategy 2: Look for about/description sections
                if not description or len(description) < 50:
                    about_sections = detail_soup.select(
                        'div[id*="about"], div[class*="about"], div[id*="description"], div[class*="description"]')
                    for section in about_sections:
                        text = section.get_text().strip()
                        if len(text) > 100:
                            description = text
                            break

                # Strategy 3: Look for substantive paragraphs
                if not description or len(description) < 50:
                    paragraphs = detail_soup.find_all('p')
                    for p in paragraphs:
                        text = p.get_text().strip()
                        if len(text) > 100:
                            description = text
                            break

                if not description:
                    description = "Join this exciting hackathon organized on Devfolio."

                # Set default values
                start_date = datetime.now().isoformat()
                end_date = (datetime.now() + timedelta(days=7)).isoformat()
                location = "India"
                mode = EventMode.ONLINE
                prize = "Exciting prizes to be won"
                team_size = {"min": 1, "max": 4}
                sponsors = []
                tags = ["hackathon", "coding", "technology"]

                # Extract dates - look for date patterns throughout the page
                date_texts = detail_soup.find_all(text=re.compile(
                    r'(May|Jun|Jul|Apr|Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mar)\s+\d{1,2}.*\d{4}'))

                if date_texts:
                    for date_elem in date_texts:
                        date_text = date_elem if isinstance(
                            date_elem, str) else date_elem.get_text()

                        # Look for date ranges
                        date_matches = re.findall(
                            r'(\w+\s+\d{1,2})(?:\s*-\s*\w+\s+\d{1,2})?,?\s*(\d{4})', date_text)
                        if date_matches:
                            try:
                                # Extract first date
                                date_str = f"{date_matches[0][0]}, {date_matches[0][1]}"
                                start_date = datetime.strptime(
                                    date_str, '%B %d, %Y').isoformat()

                                # For end date, look for a range
                                range_match = re.search(
                                    r'(\w+\s+\d{1,2})\s*-\s*(\w+\s+\d{1,2}),?\s*(\d{4})', date_text)
                                if range_match:
                                    end_str = f"{range_match.group(2)}, {range_match.group(3)}"
                                    end_date = datetime.strptime(
                                        end_str, '%B %d, %Y').isoformat()
                                else:
                                    # If no range, set end date to 1-2 days after start
                                    end_date = (datetime.strptime(
                                        date_str, '%B %d, %Y') + timedelta(days=2)).isoformat()

                                break
                            except Exception as e:
                                print(f"Error parsing dates: {e}")
                else:
                    # Look for other date formats like "24-25 May, 2025"
                    alt_date_texts = detail_soup.find_all(text=re.compile(
                        r'\d{1,2}\s*-\s*\d{1,2}\s+(May|Jun|Jul|Apr|Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mar).*\d{4}'))

                    if alt_date_texts:
                        for date_elem in alt_date_texts:
                            date_text = date_elem if isinstance(
                                date_elem, str) else date_elem.get_text()

                            # Try to parse this alternative format
                            alt_match = re.search(
                                r'(\d{1,2})\s*-\s*(\d{1,2})\s+(\w+).*?(\d{4})', date_text)
                            if alt_match:
                                try:
                                    start_day = alt_match.group(1)
                                    end_day = alt_match.group(2)
                                    month = alt_match.group(3)
                                    year = alt_match.group(4)

                                    start_date = datetime.strptime(
                                        f"{start_day} {month} {year}", '%d %B %Y').isoformat()
                                    end_date = datetime.strptime(
                                        f"{end_day} {month} {year}", '%d %B %Y').isoformat()
                                    break
                                except Exception as e:
                                    print(
                                        f"Error parsing alternative date format: {e}")

                # Extract location information
                location_elements = detail_soup.find_all(text=re.compile(
                    r'(Location|Venue|Place|Where|Online|Virtual|Remote|In-person|Hybrid|Bengaluru|Mumbai|Delhi|Hyderabad|Chennai|Pune)',
                    re.IGNORECASE))

                for loc_elem in location_elements:
                    parent = loc_elem.parent if hasattr(
                        loc_elem, 'parent') else None
                    context = parent.get_text() if parent else loc_elem

                    # Check for mode keywords
                    if re.search(r'\b(online|virtual|remote)\b', context, re.IGNORECASE):
                        mode = EventMode.ONLINE
                        location = "Online"
                        break
                    elif re.search(r'\b(in-person|on-site|physical|in person)\b', context, re.IGNORECASE):
                        mode = EventMode.IN_PERSON
                    elif re.search(r'\b(hybrid)\b', context, re.IGNORECASE):
                        mode = EventMode.HYBRID

                    # Check for city names
                    city_match = re.search(
                        r'\b(Bengaluru|Bangalore|Mumbai|Delhi|NCR|Hyderabad|Chennai|Pune|Kolkata|Ahmedabad|Jaipur)\b', context, re.IGNORECASE)
                    if city_match:
                        location = city_match.group(1)
                        if mode == EventMode.ONLINE:  # If we previously set it as online but found a location
                            mode = EventMode.HYBRID  # Assume hybrid
                        else:
                            mode = EventMode.IN_PERSON
                        break

                # Extract prize information
                prize_sections = detail_soup.select(
                    'div[id*="prize"], div[class*="prize"], h2:contains("Prize"), h3:contains("Prize")')
                if prize_sections:
                    for section in prize_sections:
                        section_text = section.get_text()

                        # Look for monetary values
                        prize_matches = re.findall(
                            r'(\$\s*[\d,]+|\₹\s*[\d,]+|[\d,]+\s*\$|[\d,]+\s*\₹|[\d,]+\s*USD|[\d,]+\s*INR)', section_text)
                        if prize_matches:
                            max_prize = max([re.sub(
                                r'[^\d]', '', match) for match in prize_matches], key=lambda x: int(x) if x else 0)
                            currency = '$' if '$' in section_text or 'USD' in section_text else '₹'
                            prize = f"Prizes worth {currency}{max_prize}"
                            break

                        # If no specific amount, at least indicate there are prizes
                        if re.search(r'prize(s|pool|money|fund|worth)', section_text, re.IGNORECASE):
                            prize = "Exciting prizes to be won"
                            break

                # Extract team size information
                team_sections = detail_soup.find_all(text=re.compile(
                    r'team size|team of|team members|participants per team', re.IGNORECASE))
                for team_text in team_sections:
                    context = team_text if isinstance(
                        team_text, str) else team_text.get_text()

                    # Look for team size patterns like "1-4 members" or "team of 2-5"
                    team_match = re.search(
                        r'(\d+)\s*(?:to|[-–])\s*(\d+)', context)
                    if team_match:
                        team_size = {
                            "min": int(team_match.group(1)),
                            "max": int(team_match.group(2))
                        }
                        break

                    # Or a fixed team size like "teams of 4"
                    fixed_match = re.search(
                        r'team(?:s)? of (\d+)', context, re.IGNORECASE)
                    if fixed_match:
                        size = int(fixed_match.group(1))
                        team_size = {"min": size, "max": size}
                        break

                # Extract sponsors
                sponsor_sections = detail_soup.select(
                    'div[id*="sponsor"], div[class*="sponsor"], h2:contains("Sponsor"), h3:contains("Sponsor")')
                for section in sponsor_sections:
                    # Look for images in the sponsor section
                    sponsor_images = section.find_all('img', alt=True)
                    for img in sponsor_images:
                        if img.get('alt') and len(img['alt']) > 2:
                            if img['alt'] not in sponsors:
                                sponsors.append(img['alt'])

                    # If no images with alt text, try looking for sponsor names in text
                    if not sponsors:
                        sponsor_text = section.get_text()
                        # Common sponsor organizations in hackathons
                        potential_sponsors = ["Google", "Microsoft", "AWS", "Amazon", "IBM", "Meta", "Polygon",
                                              "GitHub", "MLH", "Devfolio", "Replit", "MongoDB", "Firebase"]
                        for sponsor in potential_sponsors:
                            if sponsor in sponsor_text:
                                sponsors.append(sponsor)

                # Extract tags/themes if available
                theme_sections = detail_soup.select(
                    'div[id*="theme"], div[class*="theme"], h2:contains("Theme"), h3:contains("Theme")')
                if theme_sections:
                    for section in theme_sections:
                        section_text = section.get_text().lower()
                        # Look for common hackathon themes
                        theme_keywords = ["ai", "machine learning", "blockchain", "web3", "health", "healthcare",
                                          "fintech", "education", "climate", "sustainability", "iot", "mobile",
                                          "cloud", "security", "gaming", "ar/vr", "web", "data"]
                        for keyword in theme_keywords:
                            if keyword in section_text and keyword not in tags:
                                tags.append(keyword)

                # Create the event object with all the extracted information
                event = {
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
                    "sponsors": sponsors if sponsors else None,
                    "teamSize": team_size
                }

                events.append(event)
                print(f"Added Devfolio event: {title}")
                print(
                    f"  - Image: {banner_img[:50]}{'...' if len(banner_img) > 50 else ''}")
                print(f"  - Dates: {start_date} to {end_date}")
                print(f"  - Location: {location} ({mode})")

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

        print(
            f"Successfully scraped {len(events)} events from Devfolio using ScraperAPI")

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
        # Force refresh from sources, bypassing cache
        force_refresh = True

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
