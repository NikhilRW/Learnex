# Learnex Backend API

This is the backend API for the Learnex application. It provides endpoints for fetching hackathon data from various sources.

## Running the API

```bash
# Install dependencies
pip install -r requirements.txt

# Run the API
python -m api.index
```

## API Endpoints

### Health Check

- **URL**: `/api/health`
- **Method**: `GET`
- **Description**: Simple health check endpoint.
- **Response**: `{ "status": "healthy", "version": "1.0.0" }`

### Cloudinary Asset Deletion

- **URL**: `/api/cloudinary/delete`
- **Method**: `POST`
- **Body**: `{ "public_id": "cloudinary_public_id" }`
- **Description**: Deletes an asset from Cloudinary.
- **Response**: `{ "message": "Asset deleted successfully", "result": {...} }`

### Get Hackathons

- **URL**: `/api/hackathons`
- **Method**: `GET`
- **Query Params**:
  - `location` (optional): Filter by location name, defaults to "India"
  - `force` (optional): Force a refresh of data, defaults to "false"
- **Description**: Returns a list of hackathons from multiple sources.
- **Response**: Array of hackathon objects

### Get Hackathon Details

- **URL**: `/api/hackathons/{source}/{event_id}`
- **Method**: `GET`
- **URL Params**:
  - `source`: Source of the hackathon (devfolio/hackerearth)
  - `event_id`: ID of the specific hackathon
- **Description**: Returns detailed information about a specific hackathon.
- **Response**: Hackathon detail object

### Force Refresh Events

- **URL**: `/api/refresh`
- **Method**: `GET`
- **Description**: Force a refresh of all hackathon event data.
- **Response**: `{ "status": "refreshing" }` or `{ "status": "already_refreshing" }`

### Get Refresh Status

- **URL**: `/api/refresh-status`
- **Method**: `GET`
- **Description**: Check the status of a data refresh operation.
- **Response**: `{ "status": "refreshing" }` or `{ "status": "idle", "last_refresh": "ISO datetime" }`

### Send Direct Message Notification

- **URL**: `/api/notifications/message`
- **Method**: `POST`
- **Body**:

```json
{
  "recipientId": "user_id_to_receive_notification",
  "senderId": "user_id_who_sent_message",
  "senderName": "Name of message sender",
  "senderPhoto": "URL to sender's profile image (optional)",
  "message": "Text content of the message",
  "conversationId": "ID of the conversation"
}
```

- **Description**: Sends a push notification to a user's devices for a new direct message. Works even when the app is closed.
- **Response**:
  - Success: `{ "status": "success", "success_count": 2, "failure_count": 0 }`
  - Muted: `{ "status": "skipped", "reason": "sender_muted" }`
  - No tokens: `{ "status": "skipped", "reason": "no_tokens_found" }`

## ScraperAPI Integration

The backend uses ScraperAPI to improve the scraping of Devfolio hackathons. ScraperAPI helps handle JavaScript rendering and prevents blocking when scraping websites.

### Setup ScraperAPI

1. Sign up for a free account at [ScraperAPI](https://www.scraperapi.com/)
2. Get your API key from the dashboard
3. Set your API key as an environment variable:

```bash
# On Windows (PowerShell)
$env:SCRAPER_API_KEY="your_api_key_here"

# On Windows (Command Prompt)
set SCRAPER_API_KEY=your_api_key_here

# On Linux/Mac
export SCRAPER_API_KEY=your_api_key_here
```

Alternatively, create a `.env` file in the backend directory with:

```
SCRAPER_API_KEY=your_api_key_here
```

### How It Works

- If the ScraperAPI key is set, the backend will use ScraperAPI to scrape Devfolio
- If no API key is found, it will fall back to direct scraping
- ScraperAPI helps:
  - Handle JavaScript-rendered content
  - Bypass anti-bot protections
  - Provide better, more consistent results

### Debugging

Scraped HTML content is saved to the following files for debugging:

- `devfolio_response_scraperapi.html`: The main hackathon listing page
- `devfolio_detail_<event_id>.html`: Individual hackathon pages

Check these files if you're having issues with the scraper.

## Required Dependencies

- Flask
- Flask-CORS
- Requests
- BeautifulSoup4
- python-dotenv (optional, for loading environment variables)

You can install all dependencies with:

```bash
pip install flask flask-cors requests beautifulsoup4 python-dotenv
```

## Deployment

This API is designed to be deployed on Vercel. The `vercel.json` file contains the configuration for deployment.

To deploy to Vercel:

1. Install Vercel CLI:

```bash
npm install -g vercel
```

2. Deploy:

```bash
vercel
```

## Notes

- The API uses web scraping to fetch event data, so it depends on the structure of the source websites. If those websites change their structure, the scraping logic may need to be updated.
- For development with the React Native app, the API base URL in the frontend should point to:
  - `http://10.0.2.2:5000/api` for Android emulator
  - `http://localhost:5000/api` for web browser
  - `http://<your-computer-ip>:5000/api` for physical devices

## Environment Variables

- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
- `SCRAPER_API_KEY`: Your ScraperAPI key for web scraping

### Firebase Credentials for Push Notifications

For the direct message notification system to work, you need to set up Firebase credentials:

1. **Option 1: Using environment variable**

   - Set `FIREBASE_CREDENTIALS` as a JSON string of your Firebase service account credentials

2. **Option 2: Using a credentials file**
   - Set `FIREBASE_CREDENTIALS_PATH` to the path of your Firebase service account JSON file
   - Default path: `./firebase-credentials.json`

To get Firebase credentials:

1. Go to the Firebase Console
2. Navigate to Project Settings > Service Accounts
3. Click "Generate New Private Key"
4. Save the JSON file securely

When deploying to Vercel, add these as environment variables in your Vercel project settings.
