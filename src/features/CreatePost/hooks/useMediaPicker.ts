import {useState} from 'react';
import {Alert, Linking} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {CLOUDINARY_CONFIG} from '../constants';
import {MediaItem, PostFormData} from '../types';

/**
 * Manages media picking, validation, and removal for the CreatePost form.
 */
export const useMediaPicker = (
  formData: PostFormData,
  setFormData: React.Dispatch<React.SetStateAction<PostFormData>>,
  hasStoragePermission: boolean,
  permissionsChecked: boolean,
  requestStoragePermissions: () => Promise<boolean>,
) => {
  const [pickerError, setPickerError] = useState<string | null>(null);

  const canAddMoreMedia = () =>
    formData.mediaItems.length < CLOUDINARY_CONFIG.maxTotalMedia;

  const removeMediaItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mediaItems: prev.mediaItems.filter((_, i) => i !== index),
    }));
  };

  const pickMedia = async () => {
    try {
      setPickerError(null);

      if (!canAddMoreMedia()) {
        const videoCount = formData.mediaItems.filter(
          item => item.isVideo,
        ).length;
        if (videoCount >= CLOUDINARY_CONFIG.maxVideos) {
          Alert.alert(
            'Limit Reached',
            `You can only add up to ${CLOUDINARY_CONFIG.maxVideos} videos per post.`,
          );
        } else {
          Alert.alert(
            'Limit Reached',
            `You can only add up to ${CLOUDINARY_CONFIG.maxTotalMedia} media items per post.`,
          );
        }
        return;
      }

      if (!permissionsChecked) {
        const hasPermission = await requestStoragePermissions();
        if (!hasPermission) {
          return;
        }
      } else if (!hasStoragePermission) {
        Alert.alert(
          'Permission Required',
          'Storage access permission is required to upload images and videos to your posts. Please enable it in your device settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => Linking.openSettings()},
          ],
        );
        return;
      }

      const options = {
        mediaType: 'mixed' as any,
        quality: 0.8 as any,
        maxWidth: 1200,
        maxHeight: 1200,
        selectionLimit:
          CLOUDINARY_CONFIG.maxTotalMedia - formData.mediaItems.length,
        includeBase64: false,
      };

      const result = await launchImageLibrary(options);

      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (result.errorCode) {
        const errorMsg = `ImagePicker error: ${result.errorMessage || result.errorCode}`;
        console.error(errorMsg);
        setPickerError(errorMsg);
        Alert.alert(
          'Error',
          'Could not access media. Please check your device settings and try again.',
        );
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const selectedVideos = result.assets.filter(asset =>
          asset.type?.startsWith('video/'),
        );
        const currentVideoCount = formData.mediaItems.filter(
          item => item.isVideo,
        ).length;

        if (
          selectedVideos.length + currentVideoCount >
          CLOUDINARY_CONFIG.maxVideos
        ) {
          Alert.alert(
            'Video Limit',
            `You can only add up to ${CLOUDINARY_CONFIG.maxVideos} videos per post. Please select fewer videos.`,
          );
          return;
        }

        const validatedMedia: MediaItem[] = [];
        const errors: string[] = [];

        for (const asset of result.assets) {
          const uri = asset.uri;
          const isVideo = asset.type?.startsWith('video/') || false;
          const allowedTypes = isVideo
            ? CLOUDINARY_CONFIG.allowedVideoTypes
            : CLOUDINARY_CONFIG.allowedImageTypes;

          if (!uri) {
            errors.push('Failed to get media URI');
            continue;
          }

          if (asset.fileSize) {
            const sizeLimit = isVideo
              ? CLOUDINARY_CONFIG.maxVideoSize
              : CLOUDINARY_CONFIG.maxFileSize;

            if (asset.fileSize > sizeLimit) {
              const limitInMB = sizeLimit / (1024 * 1024);
              errors.push(
                `${isVideo ? 'Video' : 'Image'} size must be less than ${limitInMB}MB`,
              );
              continue;
            }
          }

          if (!asset.type || !allowedTypes.includes(asset.type)) {
            errors.push(
              `Only ${isVideo ? 'MP4 or MOV' : 'JPEG, PNG or GIF'} files are allowed`,
            );
            continue;
          }

          const height = asset.height || 0;
          const width = asset.width || 0;
          const isVertical = height > width;

          validatedMedia.push({
            uri,
            type: asset.type || '',
            isVideo,
            isVertical,
            width,
            height,
            size: asset.fileSize,
            name: asset.fileName || `media_${Date.now()}`,
          });
        }

        if (errors.length > 0) {
          Alert.alert('Some media could not be added', errors.join('\n'));
        }

        if (validatedMedia.length > 0) {
          setFormData(prev => ({
            ...prev,
            mediaItems: [...prev.mediaItems, ...validatedMedia],
          }));
        }
      }
    } catch (error) {
      const errorMsg = 'Failed to pick media';
      console.error('Error picking media:', error);
      setPickerError(errorMsg);
      Alert.alert('Error', errorMsg);
    }
  };

  return {pickerError, canAddMoreMedia, removeMediaItem, pickMedia};
};
