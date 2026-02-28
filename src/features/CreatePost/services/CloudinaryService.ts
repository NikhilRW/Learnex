import {Alert} from 'react-native';
import {DEFAULT_UPLOAD_PRESET} from 'shared/constants/cloudinary';
import {CLOUDINARY_CONFIG} from '../constants';
import {MediaItem} from '../types';

type ProgressCallback = (progress: number) => void;
type IndexCallback = (index: number) => void;

/**
 * Uploads a single media item to Cloudinary and reports upload progress.
 */
export const uploadMediaToCloudinary = async (
  mediaItem: MediaItem,
  index: number,
  totalCount: number,
  onProgress: ProgressCallback,
  onIndexChange: IndexCallback,
): Promise<string> => {
  try {
    const progressStart = (index / totalCount) * 100;
    const progressEnd = ((index + 1) / totalCount) * 100;

    onProgress(progressStart);
    onIndexChange(index);

    const {cloudName, uploadPreset} = CLOUDINARY_CONFIG;

    const file = {
      uri: mediaItem.uri,
      type: mediaItem.type,
      name: mediaItem.name || (mediaItem.isVideo ? 'upload.mp4' : 'upload.jpg'),
    } as any;

    console.log(file);

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('upload_preset', DEFAULT_UPLOAD_PRESET);
    uploadFormData.append('tags', 'learnex_post');

    onProgress((progressStart + progressEnd) / 2);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${mediaItem.isVideo ? 'video' : 'image'}/upload`,
      {
        method: 'POST',
        body: uploadFormData,
      },
    );

    const data = await response.json();
    console.log('Cloudinary response:', data);

    onProgress(progressEnd);

    if (data.secure_url) {
      return data.secure_url;
    }

    if (data.error) {
      if (
        data.error.message.includes('unknown preset') ||
        data.error.message.includes('preset not found')
      ) {
        Alert.alert(
          'Upload Preset Missing',
          `The upload preset "${uploadPreset}" doesn't exist. Please create it in your Cloudinary dashboard:\n\n` +
            '1. Go to Settings > Upload\n' +
            '2. Scroll to Upload Presets and click "Add Upload Preset"\n' +
            '3. Set Mode to "Unsigned"\n' +
            `4. Set the Preset Name to "${uploadPreset}"\n` +
            '5. Save the preset',
        );
      }
      throw new Error(`Cloudinary error: ${data.error.message}`);
    }

    console.log('data_t', data);
    throw new Error('Failed to upload to Cloudinary');
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};
