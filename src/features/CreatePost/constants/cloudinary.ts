import Config from 'react-native-config';

export const CLOUDINARY_CONFIG = {
  cloudName: Config.CLOUDINARY_CLOUD_NAME,
  uploadPreset: 'learnex-post',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxVideoSize: 100 * 1024 * 1024, // 100MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
  allowedVideoTypes: ['video/mp4', 'video/quicktime'],
  maxTotalMedia: 6,
  maxVideos: 2,
};
