import axios from 'axios';
import * as cheerio from 'cheerio';
import * as puppeteer from 'puppeteer';
import {
  EventSource,
  EventMode,
  HackathonSummary,
  HackathonDetails,
} from '../types/hackathon';

// Add direct fetch caching
const detailsCache = new Map<
  string,
  {details: HackathonDetails; timestamp: number}
>();
const CACHE_TTL_MS = 60 * 60 * 1000; // Cache details for 1 hour

// Add summary caching
const hackerEarthSummariesCache: {data: HackathonSummary[]; timestamp: number} =
  {
    data: [],
    timestamp: 0,
  };

const devfolioSummariesCache: {data: HackathonSummary[]; timestamp: number} = {
  data: [],
  timestamp: 0,
};

const SUMMARY_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes for summary cache

// Default image URLs
const DEFAULT_HACKEREARTH_IMAGE =
  'https://d2908q01vomqb2.cloudfront.net/cb4e5208b4cd87268b208e49452ed6e89a68e0b8/2023/03/22/HackerEarth-logo-1.png';
const DEFAULT_DEVFOLIO_IMAGE =
  'https://assets.devfolio.co/company/979c2c4caf7c430195c25f1130f61400/assets/favicon/favicon.png';
const DEFAULT_GENERIC_IMAGE =
  'https://cdn-icons-png.flaticon.com/512/1554/1554591.png'; // Fallback generic event icon

/**
 * Service for scraping hackathon data from various websites
 */
export class ScraperService {
  /**
   * Fetch hackathons from HackerEarth
   * @param location Location filter
   * @returns Promise with hackathon data
   */
  public static async fetchHackerEarthHackathons(
    location: string,
  ): Promise<HackathonSummary[]> {
    // Check cache for faster responses if fetching all hackathons
    if (
      !location &&
      hackerEarthSummariesCache.data.length > 0 &&
      Date.now() - hackerEarthSummariesCache.timestamp < SUMMARY_CACHE_TTL_MS
    ) {
      console.log('Using cached HackerEarth summaries');
      return hackerEarthSummariesCache.data;
    }

    try {
      // Try to load from saved HTML file first (for offline/development use)
      try {
        const hackathonsFromFile = await this.scrapeHackerEarthFromFile(
          location,
        );
        if (hackathonsFromFile && hackathonsFromFile.length > 0) {
          console.log(
            `Found ${hackathonsFromFile.length} HackerEarth hackathons from file`,
          );
          return hackathonsFromFile;
        }
      } catch (fileError) {
        console.log(
          'No local HackerEarth file found or error parsing it, falling back to live scraping',
        );
      }

      // Launch puppeteer for dynamic content
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.goto('https://www.hackerearth.com/challenges/', {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      // Wait for the hackathon cards to load
      await page.waitForSelector('.challenge-card-modern', {timeout: 10000});

      // Get the page content
      const content = await page.content();
      const $ = cheerio.load(content);

      const hackathons: HackathonSummary[] = [];

      // Try multiple selector patterns to find hackathon cards
      const selectors = [
        '.challenge-card-modern',
        '.challenge-card',
        '.card[data-event-id]',
      ];

      let cardsFound = false;

      for (const selector of selectors) {
        const cards = $(selector);

        if (cards.length > 0) {
          console.log(
            `Found ${cards.length} HackerEarth cards with selector: ${selector}`,
          );
          cardsFound = true;

          cards.each((index, element) => {
            try {
              // Get title
              const titleElement = $(element).find('.challenge-name');
              const title = titleElement.text().trim();

              // Skip if no title found
              if (!title) {
                console.log('Skipping HackerEarth event with no title');
                return;
              }

              // Get URL from link
              const linkElement = $(element).find('a');
              const url = linkElement.attr('href') || '';

              // Skip if no URL found
              if (!url) {
                console.log('Skipping HackerEarth event with no URL');
                return;
              }

              // Generate a unique ID using a more reliable method
              // Use domain+path+index if URL parsing doesn't extract a clean ID
              let idFromUrl = url
                .split('/')
                .filter(s => s)
                .pop();
              if (!idFromUrl || idFromUrl.length < 3) {
                idFromUrl = `hackathon-${index}`;
              }
              const id = `he-${idFromUrl}`;

              // Get description
              const descriptionElement = $(element).find('.challenge-desc');
              const description = descriptionElement.text().trim();

              // Skip if no description
              if (!description) {
                console.log('Skipping HackerEarth event with no description');
                return;
              }

              // Parse dates
              const dateElement = $(element).find('.date');
              const dateText = dateElement.text().trim();
              let startDate = new Date();
              let endDate = new Date();

              try {
                if (dateText.includes('-')) {
                  const dateParts = dateText.split('-').map(p => p.trim());
                  if (dateParts.length >= 2) {
                    startDate = this.parseDate(dateParts[0]);
                    endDate = this.parseDate(dateParts[1]);
                  }
                } else if (dateText) {
                  // If only one date is present, assume it's a one-day event
                  startDate = this.parseDate(dateText);
                  endDate = new Date(startDate);
                  endDate.setDate(endDate.getDate() + 1); // One-day event
                }
              } catch (e) {
                console.error('Error parsing HackerEarth dates:', e);
                // Use default dates (current date plus 7 days)
                startDate = new Date();
                startDate.setDate(startDate.getDate() + 7);
                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 3);
              }

              // Set registration deadline to one day before start
              const registrationDeadline = new Date(startDate);
              registrationDeadline.setDate(registrationDeadline.getDate() - 1);

              // Extract location and mode
              const locationElement = $(element).find('.location');
              let hackathonLocation = 'India'; // Default
              let mode = EventMode.ONLINE; // Default

              if (locationElement.length > 0) {
                const locationText = locationElement
                  .text()
                  .trim()
                  .toLowerCase();

                if (locationText.includes('online')) {
                  mode = EventMode.ONLINE;
                  hackathonLocation = 'Online';
                } else if (locationText.includes('hybrid')) {
                  mode = EventMode.HYBRID;

                  // Try to extract the physical location
                  const locationMatch = locationText.match(
                    /hybrid\s*[:-]?\s*(.+)/i,
                  );
                  if (locationMatch && locationMatch[1]) {
                    hackathonLocation = locationMatch[1].trim();
                  } else {
                    hackathonLocation = 'India'; // Default for hybrid
                  }
                } else {
                  mode = EventMode.IN_PERSON;
                  hackathonLocation = locationElement.text().trim() || 'India';
                }
              }

              // Include the location filter in the location field so filtering works
              if (
                location &&
                !hackathonLocation
                  .toLowerCase()
                  .includes(location.toLowerCase())
              ) {
                hackathonLocation = `${hackathonLocation}, ${location}`;
              }

              // Create hackathon object
              const hackathon: HackathonSummary = {
                id,
                source: EventSource.HACKEREARTH,
                title,
                description,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                location: hackathonLocation,
                mode,
                registrationDeadline: registrationDeadline.toISOString(),
                imageUrl:
                  'https://d2908q01vomqb2.cloudfront.net/cb4e5208b4cd87268b208e49452ed6e89a68e0b8/2023/03/22/HackerEarth-logo-1.png',
                url,
              };

              // Only add if all required fields are present and valid
              if (id && title && description && startDate && endDate) {
                hackathons.push(hackathon);
              }
            } catch (cardError) {
              console.error('Error processing a HackerEarth card:', cardError);
              // Continue to the next card
            }
          });

          break; // Exit loop if we found cards with this selector
        }
      }

      // Add fallback data if no cards found
      if (!cardsFound || hackathons.length === 0) {
        console.log('No HackerEarth cards found, using fallback hackathons');

        // Add fallback hackathons
        const fallbackHackathons =
          this.getFallbackHackerEarthHackathons(location);
        hackathons.push(...fallbackHackathons);
      }

      await browser.close();

      // Update cache if full list was fetched
      if (!location && hackathons.length > 0) {
        console.log(
          `Updating HackerEarth summaries cache with ${hackathons.length} events`,
        );
        hackerEarthSummariesCache.data = hackathons;
        hackerEarthSummariesCache.timestamp = Date.now();
      }

      // Filter by location if provided
      return location
        ? hackathons.filter(h =>
            h.location.toLowerCase().includes(location.toLowerCase()),
          )
        : hackathons;
    } catch (error) {
      console.error('Error scraping HackerEarth:', error);
      // If error, return stale cache if available for non-location specific queries
      if (!location && hackerEarthSummariesCache.data.length > 0) {
        console.log('Returning stale HackerEarth cache due to error');
        return hackerEarthSummariesCache.data;
      }

      // Return fallback or empty array
      return this.getFallbackHackerEarthHackathons(location);
    }
  }

  /**
   * Scrape HackerEarth hackathons from a saved HTML file
   * Used for offline development or when the website is not accessible
   * @param location Location filter
   * @returns Promise with hackathon data
   */
  public static async scrapeHackerEarthFromFile(
    location: string,
  ): Promise<HackathonSummary[]> {
    try {
      // Read the saved HTML file
      const fs = require('fs');
      const path = require('path');
      const filePath = path.resolve(
        __dirname,
        '../../../personal/webhtml.text',
      );

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log('HackerEarth HTML file not found:', filePath);
        return [];
      }

      const htmlContent = fs.readFileSync(filePath, 'utf8');
      const $ = cheerio.load(htmlContent);

      const hackathons: HackathonSummary[] = [];

      // Find all challenge cards in the HTML
      // Based on the found HTML structure in webhtml.text
      $('.challenge-card-modern, .challenge-card').each((index, element) => {
        try {
          // Get link and URL
          const linkElement = $(element).find('a.challenge-card-wrapper');
          const url = linkElement.attr('href') || '';

          // Skip if no URL found
          if (!url) {
            console.log('Skipping HackerEarth event with no URL');
            return;
          }

          // Get title
          const titleElement = $(element).find('.challenge-list-title');
          const title = titleElement.text().trim();

          // Skip if no title found
          if (!title) {
            console.log('Skipping HackerEarth event with no title');
            return;
          }

          // Generate a unique ID
          let idFromUrl = url
            .split('/')
            .filter(s => s)
            .pop();
          if (!idFromUrl || idFromUrl.length < 3) {
            idFromUrl = `hackathon-${index}`;
          }
          const id = `he-${idFromUrl}`;

          // Get image URL
          const imageElement = $(element).find('img');
          const imageUrl =
            imageElement.attr('src') || null;

          // Parse dates - look for date information in meta section
          const metaElement = $(element).find('.challenge-list-meta');
          const dateElement = metaElement.find(
            '.date-text, .date-timer, .date',
          );
          let dateText = dateElement.text().trim();

          // If no date found, try to find it elsewhere
          if (!dateText) {
            dateText = metaElement.text().trim();
          }

          let startDate = new Date();
          let endDate = new Date();

          try {
            if (dateText.includes('-')) {
              const dateParts = dateText.split('-').map(p => p.trim());
              if (dateParts.length >= 2) {
                startDate = this.parseDate(dateParts[0]);
                endDate = this.parseDate(dateParts[1]);
              }
            } else if (dateText) {
              // If only one date is present, assume it's a one-day event
              startDate = this.parseDate(dateText);
              endDate = new Date(startDate);
              endDate.setDate(endDate.getDate() + 1);
            }
          } catch (e) {
            console.error('Error parsing HackerEarth dates:', e);
            // Use default dates
            startDate = new Date();
            startDate.setDate(startDate.getDate() + 7);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 3);
          }

          // Set registration deadline
          const registrationDeadline = new Date(startDate);
          registrationDeadline.setDate(registrationDeadline.getDate() - 1);

          // Look for location info
          const locationElement = metaElement.find('.location, .location-text');
          let hackathonLocation = 'India'; // Default
          let mode = EventMode.ONLINE; // Default

          if (locationElement.length > 0) {
            const locationText = locationElement.text().trim().toLowerCase();

            if (locationText.includes('online')) {
              mode = EventMode.ONLINE;
              hackathonLocation = 'Online';
            } else if (locationText.includes('hybrid')) {
              mode = EventMode.HYBRID;
              const locationMatch = locationText.match(
                /hybrid\s*[:-]?\s*(.+)/i,
              );
              if (locationMatch && locationMatch[1]) {
                hackathonLocation = locationMatch[1].trim();
              }
            } else {
              mode = EventMode.IN_PERSON;
              hackathonLocation = locationElement.text().trim() || 'India';
            }
          }

          // Include the location filter in the location field
          if (
            location &&
            !hackathonLocation.toLowerCase().includes(location.toLowerCase())
          ) {
            hackathonLocation = `${hackathonLocation}, ${location}`;
          }

          // Get description
          const descriptionElement = $(element).find(
            '.challenge-desc, .contest-description',
          );
          const description = descriptionElement.text().trim() || title; // Use title as fallback

          // Create hackathon object
          const hackathon: HackathonSummary = {
            id,
            source: EventSource.HACKEREARTH,
            title,
            description,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            location: hackathonLocation,
            mode,
            registrationDeadline: registrationDeadline.toISOString(),
            imageUrl,
            url,
          };

          // Only add if all required fields are present and valid
          if (id && title && startDate && endDate) {
            hackathons.push(hackathon);
          }
        } catch (cardError) {
          console.error(
            'Error processing a HackerEarth card from file:',
            cardError,
          );
        }
      });

      console.log(`Found ${hackathons.length} HackerEarth hackathons in file`);

      // If no hackathons found, try to scrape the HackerEarth logo
      if (hackathons.length === 0) {
        // Check if this is actually from another website (like Devfolio)
        const title = $('title').text().trim();
        if (title.toLowerCase().includes('devfolio')) {
          console.log(
            'The HTML file appears to be from Devfolio, not HackerEarth',
          );
          // Try to scrape as Devfolio
          const devfolioHackathons = this.scrapeDevfolioFromFile($, location);
          if (devfolioHackathons.length > 0) {
            return devfolioHackathons;
          }
        }
      }

      // Filter by location if provided
      return location
        ? hackathons.filter(h =>
            h.location.toLowerCase().includes(location.toLowerCase()),
          )
        : hackathons;
    } catch (error) {
      console.error('Error scraping HackerEarth from file:', error);
      return [];
    }
  }

  /**
   * Helper method to scrape Devfolio hackathons from a loaded HTML file
   * @param $ Cheerio instance with loaded HTML
   * @param location Location filter
   * @returns Array of hackathon summaries
   */
  private static scrapeDevfolioFromFile(
    $: cheerio.Root,
    location: string,
  ): HackathonSummary[] {
    try {
      const hackathons: HackathonSummary[] = [];

      // Selector targeting Devfolio hackathon cards
      $('[data-testid="hackathon-card"]').each((index, element) => {
        try {
          const name = $(element).find('h2').text().trim();

          // Skip if no name found
          if (!name) {
            return;
          }

          // Get link
          const linkElement = $(element).find('a');
          const relativeUrl = linkElement.attr('href') || '';
          const url = relativeUrl.startsWith('http')
            ? relativeUrl
            : `https://devfolio.co${relativeUrl}`;

          // Skip if no URL found
          if (!url) {
            return;
          }

          // Extract ID from the link
          const hackathonId = url.split('/').pop() || `devfolio-${index}`;
          const id = `df-${hackathonId}`;

          // Get date information
          const dateElement = $(element).find('time');
          const dateText = dateElement.text().trim();
          let startDate = new Date();
          let endDate = new Date();

          try {
            if (dateText.includes('-') || dateText.includes('to')) {
              const separator = dateText.includes('-') ? '-' : 'to';
              const dateParts = dateText.split(separator).map(p => p.trim());
              if (dateParts.length >= 2) {
                startDate = this.parseDate(dateParts[0]);
                endDate = this.parseDate(dateParts[1]);
              }
            } else if (dateText) {
              startDate = this.parseDate(dateText);
              endDate = new Date(startDate);
              endDate.setDate(endDate.getDate() + 1);
            }
          } catch (e) {
            console.error('Error parsing Devfolio dates:', e);
            startDate = new Date();
            startDate.setDate(startDate.getDate() + 7);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 3);
          }

          // Set registration deadline
          const registrationDeadline = new Date(startDate);
          registrationDeadline.setDate(registrationDeadline.getDate() - 1);

          // Get location
          const locationElement = $(element).find(
            '[data-testid="hackathon-location"]',
          );
          let hackathonLocation = 'Online'; // Default
          let mode = EventMode.ONLINE; // Default

          if (locationElement.length > 0) {
            const locationText = locationElement.text().trim().toLowerCase();

            if (locationText.includes('online')) {
              mode = EventMode.ONLINE;
              hackathonLocation = 'Online';
            } else if (locationText.includes('hybrid')) {
              mode = EventMode.HYBRID;
              const locationMatch = locationText.match(
                /hybrid\s*[:-]?\s*(.+)/i,
              );
              if (locationMatch && locationMatch[1]) {
                hackathonLocation = locationMatch[1].trim();
              } else {
                hackathonLocation = 'Hybrid';
              }
            } else {
              mode = EventMode.IN_PERSON;
              hackathonLocation = locationElement.text().trim() || 'India';
            }
          }

          // Include the location filter in the location field
          if (
            location &&
            !hackathonLocation.toLowerCase().includes(location.toLowerCase())
          ) {
            hackathonLocation = `${hackathonLocation}, ${location}`;
          }

          // Get image URL
          const imageElement = $(element).find('img');
          const imageUrl =
            imageElement.attr('src') ||
            'https://assets.devfolio.co/company/979c2c4caf7c430195c25f1130f61400/assets/favicon/favicon.png';

          // Create hackathon object
          const hackathon: HackathonSummary = {
            id,
            source: EventSource.DEVFOLIO,
            title: name,
            description: name, // Use name as description since we don't have a dedicated description
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            location: hackathonLocation,
            mode,
            registrationDeadline: registrationDeadline.toISOString(),
            imageUrl,
            url,
          };

          // Only add if all required fields are present and valid
          if (id && name && startDate && endDate) {
            hackathons.push(hackathon);
          }
        } catch (cardError) {
          console.error(
            'Error processing a Devfolio card from file:',
            cardError,
          );
        }
      });

      console.log(`Found ${hackathons.length} Devfolio hackathons in file`);

      return hackathons;
    } catch (error) {
      console.error('Error scraping Devfolio from file:', error);
      return [];
    }
  }

  /**
   * Fetch hackathons from Devfolio
   * @param location Location filter
   * @returns Promise with hackathon data
   */
  public static async fetchDevfolioHackathons(
    location: string,
  ): Promise<HackathonSummary[]> {
    // Check cache for faster responses if fetching all hackathons
    if (
      !location &&
      devfolioSummariesCache.data.length > 0 &&
      Date.now() - devfolioSummariesCache.timestamp < SUMMARY_CACHE_TTL_MS
    ) {
      console.log('Using cached Devfolio summaries');
      return devfolioSummariesCache.data;
    }

    let fetchedSummaries: HackathonSummary[] = [];
    let browser: puppeteer.Browser | null = null;
    try {
      console.log(
        'Performing scrape for Devfolio summaries using Puppeteer...',
      );
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--fast-start', // Potentially speeds up launch
          '--disable-extensions',
          '--no-zygote', // Linux specific, might help/hurt
        ],
        // timeout: 60000, // Reduced default launch timeout
      });

      const page = await browser.newPage();

      // --- Optimization: Aggressive Resource Blocking (including JS) ---
      await page.setRequestInterception(true);
      page.on('request', req => {
        const resourceType = req.resourceType();
        if (
          resourceType === 'image' ||
          resourceType === 'stylesheet' ||
          resourceType === 'font' ||
          resourceType === 'media' ||
          resourceType === 'script' // *** Block JavaScript ***
        ) {
          // console.log(`Blocking resource: ${resourceType} ${req.url()}`); // Uncomment for debugging
          req.abort();
        } else {
          req.continue();
        }
      });
      // --- End Optimization ---

      // --- Optimization: Faster Navigation Timeout ---
      // Set a default navigation timeout for the page (e.g., 60 seconds)
      // page.setDefaultNavigationTimeout(60000); // Reduces overall wait time if things hang

      console.log('Fetching Devfolio hackathons...');
      try {
        console.log('Navigating to Devfolio...');
        await page.goto('https://devfolio.co/hackathons', {
          // --- Optimization: Faster Wait Condition ---
          waitUntil: 'domcontentloaded', // Wait only for HTML to load
          timeout: 60000, // Reduced navigation timeout
        });
        console.log('Navigation complete (domcontentloaded).');

        // --- Optimization: Explicit Wait for Content ---
        // Since JS is blocked, wait for the specific card selector
        try {
          const cardSelector = '[data-testid="hackathon-card"]';
          console.log(`Waiting for selector: ${cardSelector}`);
          await page.waitForSelector(cardSelector, {timeout: 20000}); // Wait up to 20s for cards
          console.log('Hackathon cards selector found.');
        } catch (waitError) {
          console.error(
            'Could not find hackathon cards after domcontentloaded - JS might be required.',
          );
          // Throw the error or return empty/fallback, as scraping will fail
          throw new Error(
            'Hackathon card selector not found, likely requires JavaScript.',
          );
        }
        // --- End Optimization ---

        const content = await page.content();
        const $ = cheerio.load(content);
        const hackathons: HackathonSummary[] = [];

        // --- Selector Optimization Check ---
        // '[data-testid="hackathon-card"]' is reasonably specific.
        // '.chakra-card', 'a[href*="/hackathons/"]' are okay fallbacks but less ideal.
        const cardSelector = '[data-testid="hackathon-card"]'; // Prioritize this
        const cards = $(cardSelector);
        console.log(
          `Found ${cards.length} cards with primary selector: ${cardSelector}`,
        );
        // --- End Selector Check ---

        if (cards.length > 0) {
          cards.each((_, element) => {
            try {
              // Extract title - try multiple ways
              let title = '';
              const h3 = $(element).find('h3');
              const h2 = $(element).find('h2');
              const h4 = $(element).find('h4');

              if (h3.length > 0) title = h3.text().trim();
              else if (h2.length > 0) title = h2.text().trim();
              else if (h4.length > 0) title = h4.text().trim();
              else title = $(element).find('div').first().text().trim();

              // If no title found, skip this card
              if (!title) return;

              // Get URL from link
              let relativeUrl = $(element).attr('href');
              if (!relativeUrl) {
                const a = $(element).find('a');
                if (a.length > 0) relativeUrl = a.attr('href');
              }

              // If no URL found, skip this card
              if (!relativeUrl) return;

              const url = relativeUrl.startsWith('http')
                ? relativeUrl
                : 'https://devfolio.co' + relativeUrl;

              // Generate an ID from the URL
              const id =
                'df-' +
                (relativeUrl || '')
                  .split('/')
                  .filter(s => s)
                  .pop();

              // Description (might be limited in the card)
              let description = '';
              const p = $(element).find('p');
              if (p.length > 0) description = p.text().trim();
              if (!description)
                description =
                  $(element).text().trim().substring(0, 150) + '...';

              // Fallback data for dates
              const now = new Date();
              let startDate = new Date(now);
              startDate.setDate(startDate.getDate() + 7); // Default 1 week from now

              let endDate = new Date(startDate);
              endDate.setDate(startDate.getDate() + 2); // Default 2-day event

              let registrationDeadline = new Date(startDate);
              registrationDeadline.setDate(registrationDeadline.getDate() - 1);

              // Try to parse dates
              const dateElements = $(element).find('time');
              const dateSpan = $(element)
                .find('span:contains("Date")')
                .parent();

              if (dateElements.length >= 2) {
                try {
                  const dateTexts = dateElements
                    .map((i, el) => $(el).text().trim())
                    .get();

                  if (dateTexts[0]) {
                    startDate = new Date(dateTexts[0]);
                  }

                  if (dateTexts[1]) {
                    endDate = new Date(dateTexts[1]);
                  }

                  // Set registration deadline to 1 day before start
                  registrationDeadline = new Date(startDate);
                  registrationDeadline.setDate(
                    registrationDeadline.getDate() - 1,
                  );
                } catch (e) {
                  console.error(
                    'Error parsing Devfolio dates, using defaults:',
                    e,
                  );
                }
              } else if (dateSpan.length > 0) {
                // Alternative date extraction
                const dateText = dateSpan.text().trim();
                try {
                  const dateMatch = dateText.match(
                    /(\d{1,2}\s+\w{3}\s+\d{4})/g,
                  );
                  if (dateMatch && dateMatch.length >= 2) {
                    startDate = new Date(dateMatch[0]);
                    endDate = new Date(dateMatch[1]);

                    registrationDeadline = new Date(startDate);
                    registrationDeadline.setDate(
                      registrationDeadline.getDate() - 1,
                    );
                  }
                } catch (e) {
                  console.error(
                    'Error parsing alternative dates, using defaults:',
                    e,
                  );
                }
              }

              // Location and mode - extract from description or other elements
              let hackathonLocation = 'India'; // Default to India
              let mode = EventMode.ONLINE; // Default

              // Look for location in the card text
              const locationElement = $(element)
                .find('span')
                .filter((_, el) => {
                  return (
                    $(el).text().includes('India') ||
                    $(el).text().includes('Location')
                  );
                });

              if (locationElement.length > 0) {
                hackathonLocation = locationElement
                  .text()
                  .trim()
                  .replace('Location: ', '');
              }

              // Include the location filter in the location field so filtering works
              if (
                location &&
                !hackathonLocation
                  .toLowerCase()
                  .includes(location.toLowerCase())
              ) {
                hackathonLocation = `${hackathonLocation}, ${location}`;
              }

              // Check for hybrid or in-person mode hints
              const modeText = $(element).text().toLowerCase();
              if (modeText.includes('hybrid')) {
                mode = EventMode.HYBRID;
              } else if (
                modeText.includes('in-person') ||
                modeText.includes('on-site') ||
                modeText.includes('venue')
              ) {
                mode = EventMode.IN_PERSON;
              }

              // Create hackathon object
              const hackathon: HackathonSummary = {
                id,
                source: EventSource.DEVFOLIO,
                title,
                description,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                location: hackathonLocation,
                mode,
                registrationDeadline: registrationDeadline.toISOString(),
                imageUrl: null,
                url,
              };

              // --- Filter Check (Existing) ---
              if (id && title && description && startDate && endDate) {
                // Add stricter checks maybe? Ensure dates are valid Dates?
                if (
                  hackathon.startDate !== 'Invalid Date' &&
                  hackathon.endDate !== 'Invalid Date'
                ) {
                  hackathons.push(hackathon);
                } else {
                  console.log(
                    `Skipping event with invalid date: ${hackathon.title}`,
                  );
                }
              } else {
                console.log(
                  `Skipping incomplete Devfolio event: ${
                    hackathon.title || hackathon.id
                  }`,
                );
              }
            } catch (cardError) {
              console.error('Error processing a Devfolio card:', cardError);
              // Continue to the next card
            }
          });
          fetchedSummaries = hackathons; // Assign scraped summaries
        } else {
          console.warn(
            'Primary selector found no cards, potentially due to JS blocking or site change.',
          );
          // Maybe try fallback selectors ONLY if JS blocking test fails?
        }

        // Update cache if full list was fetched
        if (!location && fetchedSummaries.length > 0) {
          console.log(
            `Updating Devfolio summaries cache with ${fetchedSummaries.length} events`,
          );
          devfolioSummariesCache.data = fetchedSummaries;
          devfolioSummariesCache.timestamp = Date.now();
        }

        // Filter results if location was specified
        return location
          ? fetchedSummaries.filter(h =>
              h.location.toLowerCase().includes(location.toLowerCase()),
            )
          : fetchedSummaries;
      } catch (navigationError) {
        console.error(
          'Error during Devfolio navigation/scraping:',
          navigationError,
        );
        // Return fallback or stale cache on error
        if (!location && fetchedSummaries.length > 0) {
          /* return stale */
        }
        return this.getFallbackDevfolioHackathons(location);
      }
    } catch (error) {
      console.error('Outer error scraping Devfolio:', error);
      // If error, return stale cache if available for non-location specific queries
      if (!location && devfolioSummariesCache.data.length > 0) {
        console.log('Returning stale Devfolio cache due to error');
        return devfolioSummariesCache.data;
      }

      // Return fallback
      return this.getFallbackDevfolioHackathons(location);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Provide fallback hackathon data when scraping fails
   */
  static getFallbackDevfolioHackathons(location: string): HackathonSummary[] {
    const fallbackHackathons: HackathonSummary[] = [
      {
        id: 'df-ethonline',
        source: EventSource.DEVFOLIO,
        title: 'ETHIndia 2024',
        description:
          "The World's Biggest Ethereum Hackathon coming to Bangalore",
        startDate: new Date(2024, 10, 15).toISOString(),
        endDate: new Date(2024, 10, 17).toISOString(),
        location: 'Bangalore, India',
        mode: EventMode.HYBRID,
        registrationDeadline: new Date(2024, 10, 1).toISOString(),
        imageUrl: null,
        url: 'https://devfolio.co/hackathons/ethindia-2024',
      },
      {
        id: 'df-polygon',
        source: EventSource.DEVFOLIO,
        title: 'Polygon Fellowship 2024',
        description:
          'Build the next generation of decentralized applications on Polygon.',
        startDate: new Date(2024, 11, 5).toISOString(),
        endDate: new Date(2024, 11, 7).toISOString(),
        location: 'Mumbai, India',
        mode: EventMode.IN_PERSON,
        registrationDeadline: new Date(2024, 10, 25).toISOString(),
        imageUrl: null,
        url: 'https://devfolio.co/hackathons/polygon-fellowship-2024',
      },
      {
        id: 'df-solana',
        source: EventSource.DEVFOLIO,
        title: 'Solana India Hackathon',
        description:
          'Build on the fastest blockchain and earn prizes worth $100,000',
        startDate: new Date(2024, 11, 20).toISOString(),
        endDate: new Date(2024, 11, 22).toISOString(),
        location: 'Delhi, India',
        mode: EventMode.HYBRID,
        registrationDeadline: new Date(2024, 11, 15).toISOString(),
        imageUrl: null,
        url: 'https://devfolio.co/hackathons/solana-india-hackathon',
      },
    ];

    // Filter by location if provided
    return location
      ? fallbackHackathons.filter(h =>
          h.location.toLowerCase().includes(location.toLowerCase()),
        )
      : fallbackHackathons;
  }

  /**
   * Get hackathon details by scraping the specific hackathon page (Optimized for maximum speed)
   */
  public static async fetchHackathonDetails(
    source: EventSource,
    id: string,
    url: string,
  ): Promise<HackathonDetails | null> {
    // --- Cache Check ---
    const cacheKey = `${source}-${id}`;
    const cachedEntry = detailsCache.get(cacheKey);

    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
      console.log(`Cache hit for event details: ${id}`);
      return cachedEntry.details;
    }

    console.log(`Cache miss or expired for event details: ${id}. Fetching...`);

    // SPEED OPTIMIZATION: Use axios directly instead of Puppeteer browser for maximum speed
    try {
      console.log(`Making direct HTTP request to: ${url}`);

      // Set up headers to look like a regular browser
      const headers = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      };

      // Make the request with a short timeout
      const response = await axios.get(url, {
        headers,
        timeout: 10000, // 10 second timeout for faster failure/fallback
      });

      // Load the HTML with cheerio
      const $ = cheerio.load(response.data);

      // Initialize details object with known data
      const details: Partial<HackathonDetails> = {
        id,
        source,
        url,
      };

      // Extract details based on source
      if (source === EventSource.HACKEREARTH) {
        // Get title - multiple selector attempts for reliability
        details.title =
          $('title').first().text().trim() ||
          $('h1.event-title').first().text().trim() ||
          $('.event-title h1').first().text().trim() ||
          $('h1').first().text().trim();

        // Get description - try several potential selectors
        details.description =
          $('.event-description-wrapper .event-description').text().trim() ||
          $('.event-description').text().trim() ||
          $('.overview-section .description').text().trim() ||
          $('meta[name="description"]').attr('content') ||
          $('meta[property="og:description"]').attr('content') ||
          details.title ||
          ''; // Fallback to title if no description found

        // Extract dates if available
        const dateElement = $('.event-timings') || $('.date-venue-wrapper');
        if (dateElement.length > 0) {
          const dateText = dateElement.text().trim();
          // Extract start and end dates from text if possible
          try {
            if (dateText.includes('-')) {
              const dateParts = dateText.split('-').map(p => p.trim());
              if (dateParts.length >= 2) {
                details.startDate = ScraperService.parseDate(
                  dateParts[0],
                ).toISOString();
                details.endDate = ScraperService.parseDate(
                  dateParts[1],
                ).toISOString();
              }
            }
          } catch (e) {
            console.error('Error parsing HackerEarth date text:', e);
          }
        }

        // Get prize info if available
        const prizeSection = $('.prizes-section');
        if (prizeSection.length > 0) {
          details.prizes = {
            first: ScraperService.extractPrize($, '.first-prize') || undefined,
            second:
              ScraperService.extractPrize($, '.second-prize') || undefined,
            third: ScraperService.extractPrize($, '.third-prize') || undefined,
          };
        }

        // Extract image with guaranteed fallback
        details.imageUrl = this.ensureValidImageUrl(
          source,
          $('meta[property="og:image"]').attr('content') ||
            $('.event-logo img').attr('src'),
        );
      } else if (source === EventSource.DEVFOLIO) {
        // Get title - multiple selector attempts
        details.title =
          $('meta[property="og:title"]').attr('content') ||
          $('title').first().text().trim() ||
          $('h1').first().text().trim();

        // Get description
        details.description =
          $('meta[property="og:description"]').attr('content') ||
          $('div[id="about"] p').text().trim() ||
          $('section:contains("About") p').text().trim() ||
          details.title ||
          '';

        // Extract image with guaranteed fallback
        details.imageUrl = this.ensureValidImageUrl(
          source,
          $('meta[property="og:image"]').attr('content') ||
            $('img.chakra-image').first().attr('src'),
        );

        // Try to extract location information
        const locationText =
          $('[data-testid="hackathon-location"]').text().trim() ||
          $('span:contains("Location")').parent().text().trim();

        if (locationText) {
          if (locationText.toLowerCase().includes('online')) {
            details.mode = EventMode.ONLINE;
            details.location = 'Online';
          } else if (locationText.toLowerCase().includes('hybrid')) {
            details.mode = EventMode.HYBRID;
            details.location = locationText
              .replace(/Location[:\s]*/i, '')
              .trim();
          } else {
            details.mode = EventMode.IN_PERSON;
            details.location = locationText
              .replace(/Location[:\s]*/i, '')
              .trim();
          }
        }
      }

      // Ensure essential dates have fallbacks
      if (!details.startDate || !details.endDate) {
        const now = new Date();
        const fallbackStart = new Date(now);
        fallbackStart.setDate(fallbackStart.getDate() + 7); // One week in future

        const fallbackEnd = new Date(fallbackStart);
        fallbackEnd.setDate(fallbackEnd.getDate() + 2); // Two days after start

        details.startDate = details.startDate || fallbackStart.toISOString();
        details.endDate = details.endDate || fallbackEnd.toISOString();
      }

      // Ensure registration deadline
      if (!details.registrationDeadline) {
        const startDate = new Date(details.startDate);
        const registrationDate = new Date(startDate);
        registrationDate.setDate(registrationDate.getDate() - 1);
        details.registrationDeadline = registrationDate.toISOString();
      }

      // Ensure other required fields have fallbacks
      details.location = details.location || 'India';
      details.mode = details.mode || EventMode.ONLINE;

      // Cast to full details object
      const finalDetails = details as HackathonDetails;

      // Update cache
      detailsCache.set(cacheKey, {
        details: finalDetails,
        timestamp: Date.now(),
      });

      console.log(`Successfully fetched and cached details for ${id}`);
      return finalDetails;
    } catch (error: any) {
      console.error(
        `Error fetching hackathon details for ${id}: ${error.message}`,
      );

      // Attempt to create a minimal result from the ID and URL
      try {
        const fallbackData = this.createFallbackDetails(source, id, url);
        return fallbackData;
      } catch (fallbackError: any) {
        console.error(
          `Failed to create fallback details: ${fallbackError.message}`,
        );
        return null;
      }
    }
  }

  /**
   * Create fallback details when direct fetch fails
   */
  private static createFallbackDetails(
    source: EventSource,
    id: string,
    url: string,
  ): HackathonDetails {
    console.log(`Creating fallback details for ${id}`);

    // Extract title from URL or ID
    let title = '';
    try {
      // Try to generate a readable title from URL path
      const urlPath = new URL(url).pathname;
      const lastSegment = urlPath.split('/').filter(Boolean).pop() || '';
      title = lastSegment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } catch {
      // If URL parsing fails, fallback to ID
      title = id.replace(/^(he|df)-/, '').replace(/-/g, ' ');
    }

    title =
      title ||
      `${
        source === EventSource.HACKEREARTH ? 'HackerEarth' : 'Devfolio'
      } Hackathon`;

    // Create future dates
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + 7);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2);

    const registrationDeadline = new Date(startDate);
    registrationDeadline.setDate(registrationDeadline.getDate() - 1);

    return {
      id,
      source,
      title,
      description: `Details for ${title}`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      location: 'India',
      mode: EventMode.ONLINE,
      registrationDeadline: registrationDeadline.toISOString(),
      imageUrl: this.ensureValidImageUrl(source),
      url,
    };
  }

  /**
   * Helper function to extract prize information from HackerEarth
   */
  static extractPrize($: cheerio.Root, selector: string): string | undefined {
    const prize = $(selector).text().trim();
    return prize || undefined;
  }

  /**
   * Helper function to extract prize information from Devfolio
   */
  static extractPrizeDevfolio(
    prizeText: string,
    place: string,
  ): string | undefined {
    const pattern = new RegExp(`${place}\\s+prize:?\\s*([^\\n]+)`, 'i');
    const match = prizeText.match(pattern);
    return match && match[1] ? match[1].trim() : undefined;
  }

  /**
   * Helper function to parse date strings of various formats
   */
  static parseDate(dateString: string): Date {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Try to parse with various date formats
    try {
      // Format: "15 Jan" or "15 January"
      const match = dateString.match(/(\d{1,2})\s+([A-Za-z]+)/);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = this.getMonthNumber(match[2]);

        // Create date with current year
        const date = new Date(currentYear, month, day);

        // If date is in the past, it's likely next year
        if (date < now) {
          date.setFullYear(currentYear + 1);
        }

        return date;
      }

      // Format: "Jan 15" or "January 15"
      const match2 = dateString.match(/([A-Za-z]+)\s+(\d{1,2})/);
      if (match2) {
        const month = this.getMonthNumber(match2[1]);
        const day = parseInt(match2[2], 10);

        // Create date with current year
        const date = new Date(currentYear, month, day);

        // If date is in the past, it's likely next year
        if (date < now) {
          date.setFullYear(currentYear + 1);
        }

        return date;
      }

      // Format: full date string "January 15, 2024"
      const fullDate = new Date(dateString);
      if (!isNaN(fullDate.getTime())) {
        return fullDate;
      }

      // Fallback to a future date
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + 14); // 2 weeks from now
      return fallbackDate;
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      // Return a default future date
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + 14); // 2 weeks from now
      return fallbackDate;
    }
  }

  /**
   * Helper function to convert month name to number (0-11)
   */
  static getMonthNumber(monthName: string): number {
    const monthMap: Record<string, number> = {
      jan: 0,
      january: 0,
      feb: 1,
      february: 1,
      mar: 2,
      march: 2,
      apr: 3,
      april: 3,
      may: 4,
      jun: 5,
      june: 5,
      jul: 6,
      july: 6,
      aug: 7,
      august: 7,
      sep: 8,
      september: 8,
      oct: 9,
      october: 9,
      nov: 10,
      november: 10,
      dec: 11,
      december: 11,
    };

    return monthMap[monthName.toLowerCase().substring(0, 3)] || 0;
  }

  /**
   * Provide fallback hackathon data for HackerEarth when scraping fails
   */
  static getFallbackHackerEarthHackathons(
    location: string,
  ): HackathonSummary[] {
    const fallbackHackathons: HackathonSummary[] = [
      {
        id: 'he-code-horizon-2024',
        source: EventSource.HACKEREARTH,
        title: 'Code Horizon 2024',
        description:
          'The ultimate competitive programming and algorithmic challenge for tech enthusiasts.',
        startDate: new Date(2024, 11, 10).toISOString(),
        endDate: new Date(2024, 11, 12).toISOString(),
        location: 'Bangalore, India',
        mode: EventMode.HYBRID,
        registrationDeadline: new Date(2024, 11, 5).toISOString(),
        imageUrl:
          'https://d2908q01vomqb2.cloudfront.net/cb4e5208b4cd87268b208e49452ed6e89a68e0b8/2023/03/22/HackerEarth-logo-1.png',
        url: 'https://www.hackerearth.com/challenges/hackathon/code-horizon-2024',
      },
      {
        id: 'he-fintech-innovate-24',
        source: EventSource.HACKEREARTH,
        title: 'FinTech Innovate 2024',
        description:
          'Revolutionize the financial world through technology. Build solutions for payments, blockchain, banking and more.',
        startDate: new Date(2024, 10, 25).toISOString(),
        endDate: new Date(2024, 10, 27).toISOString(),
        location: 'Mumbai, India',
        mode: EventMode.IN_PERSON,
        registrationDeadline: new Date(2024, 10, 20).toISOString(),
        imageUrl:
          'https://d2908q01vomqb2.cloudfront.net/cb4e5208b4cd87268b208e49452ed6e89a68e0b8/2023/03/22/HackerEarth-logo-1.png',
        url: 'https://www.hackerearth.com/challenges/hackathon/fintech-innovate-2024',
      },
      {
        id: 'he-ai-summit-hack-2024',
        source: EventSource.HACKEREARTH,
        title: 'AI Summit Hackathon 2024',
        description:
          'Build the next generation AI applications. Focus on machine learning, NLP, computer vision, and generative AI.',
        startDate: new Date(2024, 9, 15).toISOString(),
        endDate: new Date(2024, 9, 18).toISOString(),
        location: 'Delhi, India',
        mode: EventMode.ONLINE,
        registrationDeadline: new Date(2024, 9, 10).toISOString(),
        imageUrl:
          'https://d2908q01vomqb2.cloudfront.net/cb4e5208b4cd87268b208e49452ed6e89a68e0b8/2023/03/22/HackerEarth-logo-1.png',
        url: 'https://www.hackerearth.com/challenges/hackathon/ai-summit-hackathon-2024',
      },
    ];

    // Filter by location if provided
    return location
      ? fallbackHackathons.filter(h =>
          h.location.toLowerCase().includes(location.toLowerCase()),
        )
      : fallbackHackathons;
  }

  /**
   * Utility function to get all hackathons from cache if available
   * Primarily used for finding event URLs without triggering full scrapes
   */
  public static getAllHackathonsFromCacheIfAvailable():
    | HackathonSummary[]
    | null {
    // Check if both caches are valid
    const heValid =
      hackerEarthSummariesCache.data.length > 0 &&
      Date.now() - hackerEarthSummariesCache.timestamp < SUMMARY_CACHE_TTL_MS;

    const dfValid =
      devfolioSummariesCache.data.length > 0 &&
      Date.now() - devfolioSummariesCache.timestamp < SUMMARY_CACHE_TTL_MS;

    if (heValid && dfValid) {
      console.log('Using combined summary cache');
      return [
        ...hackerEarthSummariesCache.data,
        ...devfolioSummariesCache.data,
      ];
    }

    return null; // Cache miss
  }

  /**
   * Ensures an event always has a valid image URL
   * @param source The event source
   * @param imageUrl The current image URL (may be empty or invalid)
   * @returns A guaranteed valid image URL
   */
  private static ensureValidImageUrl(
    source: EventSource,
    imageUrl?: string,
  ): string {
    // If image URL is valid, use it
    if (imageUrl && imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // Otherwise use appropriate default based on source
    if (source === EventSource.HACKEREARTH) {
      return DEFAULT_HACKEREARTH_IMAGE;
    } else if (source === EventSource.DEVFOLIO) {
      return DEFAULT_DEVFOLIO_IMAGE;
    }

    // Generic fallback
    return DEFAULT_GENERIC_IMAGE;
  }
}
