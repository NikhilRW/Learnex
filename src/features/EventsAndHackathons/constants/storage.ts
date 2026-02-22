// AsyncStorage keys for caching hackathon data
export const STORAGE_KEYS = {
  HACKATHONS: 'hackathons',
  HACKATHONS_TIMESTAMP: 'hackathons_timestamp',
  HACKATHONS_LOCATION: 'hackathons_location',
} as const;

// Cache expiration time in minutes
export const CACHE_EXPIRATION_MINUTES = 60;
