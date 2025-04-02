// API configuration
export const API_URL = __DEV__
  ? 'http://localhost:5000/api' // Development
  : 'https://your-production-api.com/api'; // Production

// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: 'your_cloud_name',
  API_KEY: 'your_api_key',
  API_SECRET: 'your_api_secret',
};

// Other configuration
export const APP_CONFIG = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  MAX_POST_TITLE_LENGTH: 100,
};
