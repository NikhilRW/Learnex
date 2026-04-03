import AsyncStorage from '@react-native-async-storage/async-storage';
import {HackathonSummary} from '../types';
import {STORAGE_KEYS, CACHE_EXPIRATION_MINUTES} from '../constants';
import {logger} from 'shared/utils/logger';

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
      await AsyncStorage.setItem(
        STORAGE_KEYS.HACKATHONS,
        JSON.stringify(hackathons),
      );

      // Store the timestamp
      await AsyncStorage.setItem(
        STORAGE_KEYS.HACKATHONS_TIMESTAMP,
        Date.now().toString(),
      );

      // Store the location filter
      await AsyncStorage.setItem(STORAGE_KEYS.HACKATHONS_LOCATION, location);

      logger.debug(
        `Cached ${hackathons.length} hackathons for location: ${location}`,
        undefined,
        'StorageService',
      );
    } catch (error) {
      logger.error('Error caching hackathons:', error, 'StorageService');
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
      const hackathonsJson = await AsyncStorage.getItem(
        STORAGE_KEYS.HACKATHONS,
      );
      const timestampStr = await AsyncStorage.getItem(
        STORAGE_KEYS.HACKATHONS_TIMESTAMP,
      );
      const cachedLocation = await AsyncStorage.getItem(
        STORAGE_KEYS.HACKATHONS_LOCATION,
      );

      if (!hackathonsJson || !timestampStr || !cachedLocation) {
        logger.debug('No cached hackathons found', undefined, 'StorageService');
        return null;
      }

      // Check if cache is expired
      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();
      const expirationTime = CACHE_EXPIRATION_MINUTES * 60 * 1000; // Convert minutes to ms

      if (now - timestamp > expirationTime) {
        logger.debug('Cached hackathons expired', undefined, 'StorageService');
        return null;
      }

      // Parse the cached data
      const hackathons = JSON.parse(hackathonsJson) as HackathonSummary[];
      const isSameLocation = cachedLocation === location;

      logger.debug(
        `Retrieved ${
          hackathons.length
        } cached hackathons. Cache age: ${Math.round(
          (now - timestamp) / 60000,
        )} minutes`,
        undefined,
        'StorageService',
      );

      return {hackathons, isSameLocation};
    } catch (error) {
      logger.error('Error getting cached hackathons:', error, 'StorageService');
      return null;
    }
  }

  /**
   * Clear all cached data
   */
  public static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.HACKATHONS,
        STORAGE_KEYS.HACKATHONS_TIMESTAMP,
        STORAGE_KEYS.HACKATHONS_LOCATION,
      ]);
      logger.debug('Cache cleared successfully', undefined, 'StorageService');
    } catch (error) {
      logger.error('Error clearing cache:', error, 'StorageService');
    }
  }
}
