import AsyncStorage from '@react-native-async-storage/async-storage';
import {HackathonSummary} from 'events-and-hackathons/types/hackathon';

// Constants for cache keys
const KEYS = {
  HACKATHONS: 'hackathons',
  HACKATHONS_TIMESTAMP: 'hackathons_timestamp',
  HACKATHONS_LOCATION: 'hackathons_location',
};

// Cache expiration time (in minutes)
const CACHE_EXPIRATION = 60; // 1 hour

/**
 * Service for storing and retrieving data from device storage
 */
export class StorageService {
  /**
   * Save hackathon data to local storage
   * @param hackathons The hackathon data to cache
   * @param location The location filter used for this data
   */
  public static async cacheHackathons(
    hackathons: HackathonSummary[],
    location: string,
  ): Promise<void> {
    try {
      // Store the hackathons
      await AsyncStorage.setItem(KEYS.HACKATHONS, JSON.stringify(hackathons));

      // Store the timestamp
      await AsyncStorage.setItem(
        KEYS.HACKATHONS_TIMESTAMP,
        Date.now().toString(),
      );

      // Store the location filter
      await AsyncStorage.setItem(KEYS.HACKATHONS_LOCATION, location);

      console.log(
        `Cached ${hackathons.length} hackathons for location: ${location}`,
      );
    } catch (error) {
      console.error('Error caching hackathons:', error);
    }
  }

  /**
   * Get cached hackathon data if available and not expired
   * @param location The current location filter
   * @returns The cached hackathons if valid, null otherwise
   */
  public static async getCachedHackathons(
    location: string,
  ): Promise<{hackathons: HackathonSummary[]; isSameLocation: boolean} | null> {
    try {
      // Check if we have cached hackathons
      const hackathonsJson = await AsyncStorage.getItem(KEYS.HACKATHONS);
      const timestampStr = await AsyncStorage.getItem(
        KEYS.HACKATHONS_TIMESTAMP,
      );
      const cachedLocation = await AsyncStorage.getItem(
        KEYS.HACKATHONS_LOCATION,
      );

      if (!hackathonsJson || !timestampStr || !cachedLocation) {
        console.log('No cached hackathons found');
        return null;
      }

      // Check if cache is expired
      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();
      const expirationTime = CACHE_EXPIRATION * 60 * 1000; // Convert minutes to ms

      if (now - timestamp > expirationTime) {
        console.log('Cached hackathons expired');
        return null;
      }

      // Parse the cached data
      const hackathons = JSON.parse(hackathonsJson) as HackathonSummary[];
      const isSameLocation = cachedLocation === location;

      console.log(
        `Retrieved ${
          hackathons.length
        } cached hackathons. Cache age: ${Math.round(
          (now - timestamp) / 60000,
        )} minutes`,
      );

      return {hackathons, isSameLocation};
    } catch (error) {
      console.error('Error getting cached hackathons:', error);
      return null;
    }
  }

  /**
   * Clear all cached data
   */
  public static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.HACKATHONS,
        KEYS.HACKATHONS_TIMESTAMP,
        KEYS.HACKATHONS_LOCATION,
      ]);
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}
