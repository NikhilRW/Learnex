import axios from 'axios';
import {
  HackathonSummary,
  HackathonDetails,
  EventSource,
} from '../types/hackathon';
import {StorageService} from './storageService';

// Base URL for the API For Vercel
const API_BASE_URL = 'https://learnex-backend.vercel.app/api';

// Base URL for the API For Localhost (Android Emulator)
// const API_BASE_URL = 'http://10.0.2.2:5000/api';

// Base URL for the API For Localhost (Physical Device)
// const API_BASE_URL = 'http://192.168.1.10:5000/api';

/**
 * Service for fetching hackathon and event data from the backend API
 */
export class HackathonService {
  private static baseUrl = API_BASE_URL;
  /**
   * Fetches all hackathons with optional location filter
   * @param location Optional location filter (defaults to India)
   * @param forceRefresh Forces a refresh from API, bypassing cache
   * @returns Array of hackathon summaries
   */
  public static async getHackathons(
    location: string = 'India',
    forceRefresh: boolean = false,
  ): Promise<HackathonSummary[]> {
    try {
      // Always use 'India' as the location
      const finalLocation = 'India';

      // Check cache first if not forcing a refresh
      if (!forceRefresh) {
        const cachedData = await StorageService.getCachedHackathons(
          finalLocation,
        );

        // If we have valid cached data, use it
        if (cachedData && cachedData.isSameLocation) {
          console.log('Using cached hackathon data');
          return cachedData.hackathons;
        }
      }

      // If we're here, either forceRefresh is true, there's no cache,
      // or the location has changed - fetch from API
      const response = await axios.get(
        `${this.baseUrl}/hackathons?location=${encodeURIComponent(
          finalLocation,
        )}${forceRefresh ? '&force=true' : ''}`,
      );

      // Process the data to ensure image URLs are valid
      const hackathons = response.data.map((hackathon: any) => ({
        ...hackathon,
        imageUrl: this.ensureValidImageUrl(
          hackathon.imageUrl,
          hackathon.source,
        ),
      }));

      // Cache the fetched data
      await StorageService.cacheHackathons(hackathons, finalLocation);
      return hackathons;
    } catch (error) {
      console.error('Error fetching hackathons:', error);
      throw error;
    }
  }

  /**
   * Fetch details for a specific hackathon
   * @param source Source platform (hackerearth or devfolio)
   * @param id Hackathon ID
   * @returns Promise with hackathon details
   */
  public static async getHackathonDetails(
    source: string,
    id: string,
  ): Promise<HackathonDetails> {
    try {
      // For the new Flask API, the response structure is different
      const response = await axios.get<HackathonDetails>(
        `${API_BASE_URL}/hackathons/${source}/${id}`,
      );

      console.log(
        'Fetched hackathon details from Flask API:',
        response.data.title,
      );

      // Process and validate image URL
      const event = response.data;
      if (event.imageUrl) {
        // Fix relative URLs
        if (event.imageUrl && !event.imageUrl.startsWith('http')) {
          if (event.imageUrl.startsWith('/')) {
            // Try to make it an absolute URL based on the source
            if (event.source === EventSource.DEVFOLIO) {
              event.imageUrl = `https://devfolio.co${event.imageUrl}`;
            } else if (event.source === EventSource.HACKEREARTH) {
              event.imageUrl = `https://www.hackerearth.com${event.imageUrl}`;
            }
          } else {
            // Invalid URL - clear it
            event.imageUrl = '';
          }
        }
      }

      // The Flask API returns the object directly, not wrapped in a response object
      return event;
    } catch (error) {
      console.error('Error fetching hackathon details:', error);
      throw error;
    }
  }

  /**
   * Check the status of the refresh operation
   * @returns Status information
   */
  public static async getRefreshStatus(): Promise<{
    isRefreshing: boolean;
    message: string;
    eventCounts: {
      hackerearth: number;
      devfolio: number;
      total: number;
    };
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/refresh-status`);
      return {
        isRefreshing: response.data.is_refreshing,
        message: response.data.message,
        eventCounts: response.data.event_counts || {
          hackerearth: 0,
          devfolio: 0,
          total: 0,
        },
      };
    } catch (error) {
      console.error('Error getting refresh status:', error);
      return {
        isRefreshing: false,
        message: 'Error getting refresh status',
        eventCounts: {
          hackerearth: 0,
          devfolio: 0,
          total: 0,
        },
      };
    }
  }

  /**
   * Forces a refresh of events from the server by triggering a new scrape
   * @param options Optional parameters for the refresh
   * @param options.waitForCompletion Whether to wait for the refresh to complete (default: true)
   * @returns Response indicating success or failure
   */
  public static async refreshEvents(options?: {
    waitForCompletion?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    const waitForCompletion = options?.waitForCompletion !== false; // Default to true if not specified

    try {
      console.log('Forcing server to refresh events by scraping again...');

      // Call the backend refresh endpoint with force=true to ensure it scrapes data again
      const response = await axios.get(`${this.baseUrl}/refresh?force=true`);

      if (response.data && response.data.status === 'success') {
        console.log('Server has started refreshing events in background');

        // Only wait for refresh to complete if waitForCompletion is true
        if (waitForCompletion) {
          // Wait for refresh to complete by polling the status
          console.log('Waiting for backend to refresh data...');
          let isRefreshing = true;
          let attempts = 0;
          const maxAttempts = 20; // Maximum polling attempts

          while (isRefreshing && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds between checks

            // Check status
            attempts++;
            const status = await this.getRefreshStatus();
            isRefreshing = status.isRefreshing;

            console.log(
              `Refresh status check ${attempts}/${maxAttempts}: ${status.message}`,
            );

            // If refresh complete, break the loop
            if (!isRefreshing) {
              console.log(
                `Refresh complete! Found ${status.eventCounts.total} events`,
              );
              break;
            }
          }

          // If we timed out
          if (isRefreshing && attempts >= maxAttempts) {
            console.log(
              'Refresh is taking longer than expected. Continuing anyway...',
            );
          }
        } else {
          console.log(
            'Not waiting for refresh to complete (waitForCompletion=false)',
          );
        }

        return {success: true, message: response.data.message};
      } else if (response.data && response.data.status === 'in_progress') {
        // A refresh is already in progress
        console.log('A refresh operation is already in progress');

        // Only wait for existing refresh if waitForCompletion is true
        if (waitForCompletion) {
          // Wait for existing refresh to complete
          console.log('Waiting for existing refresh to complete...');
          let isRefreshing = true;
          let attempts = 0;
          const maxAttempts = 20;

          while (isRefreshing && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1500));

            attempts++;
            const status = await this.getRefreshStatus();
            isRefreshing = status.isRefreshing;

            console.log(
              `Refresh status check ${attempts}/${maxAttempts}: ${status.message}`,
            );

            if (!isRefreshing) {
              console.log(
                `Existing refresh complete! Found ${status.eventCounts.total} events`,
              );
              break;
            }
          }
        } else {
          console.log(
            'Not waiting for existing refresh to complete (waitForCompletion=false)',
          );
        }

        return {success: true, message: 'Used existing refresh operation'};
      } else {
        console.error('Failed to refresh events:', response.data);
        return {
          success: false,
          message: response.data?.message || 'Unknown error occurred',
        };
      }
    } catch (error) {
      console.error('Error refreshing events:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Ensures the image URL is valid and properly formatted
   * @param imageUrl The image URL to validate
   * @param source Optional source of the event (Devfolio or HackerEarth)
   * @returns A valid image URL or empty string
   */
  private static ensureValidImageUrl(
    imageUrl: string,
    source?: EventSource,
  ): string {
    if (!imageUrl) return '';

    // If it's already a valid URL, return it
    if (imageUrl.startsWith('http')) return imageUrl;

    // Handle relative URLs
    if (imageUrl.startsWith('/')) {
      // Try to make it an absolute URL based on the source
      if (source === EventSource.DEVFOLIO) {
        return `https://devfolio.co${imageUrl}`;
      } else if (source === EventSource.HACKEREARTH) {
        return `https://www.hackerearth.com${imageUrl}`;
      }

      // If source is not provided, try to guess from the URL path
      if (imageUrl.includes('devfolio')) {
        return `https://devfolio.co${imageUrl}`;
      } else if (imageUrl.includes('hackerearth')) {
        return `https://www.hackerearth.com${imageUrl}`;
      }
    }

    // Invalid URL - return empty string
    return '';
  }
}
