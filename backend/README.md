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

- `/api/health`: Basic health check endpoint
- `/api/hackathons`: Get all hackathons (optional query param: `location`)
- `/api/hackathons/<source>/<event_id>`: Get details for a specific hackathon
- `/api/refresh`: Force refresh the event data from the sources

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
