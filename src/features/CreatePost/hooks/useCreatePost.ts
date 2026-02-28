import {useState} from 'react';
import {Alert} from 'react-native';
import {PostFormData} from '../types';
import {extractHashtags, generateSearchKeywords} from '../utils';
import {uploadMediaToCloudinary, savePostToFirestore} from '../services';

/**
 * Manages post submission: uploads media to Cloudinary then saves to Firestore.
 */
export const useCreatePost = (
  formData: PostFormData,
  firebase: any,
  clearDraft: () => Promise<void>,
  navigation: any,
) => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please add a description');
      return;
    }

    if (formData.mediaItems.length === 0) {
      Alert.alert('Error', 'Please select at least one image or video');
      return;
    }

    setLoading(true);
    try {
      const extractedTags = extractHashtags(formData.description);
      const allHashtags = [
        ...new Set([...formData.hashtags, ...extractedTags]),
      ];
      console.log('Extracted hashtags:', allHashtags);

      const searchKeywords = generateSearchKeywords(formData.description);

      setUploadProgress(0);

      const mediaUrls: {url: string; isVideo: boolean; isVertical: boolean}[] =
        [];

      for (let i = 0; i < formData.mediaItems.length; i++) {
        const mediaItem = formData.mediaItems[i];
        const url = await uploadMediaToCloudinary(
          mediaItem,
          i,
          formData.mediaItems.length,
          setUploadProgress,
          setCurrentUploadIndex,
        );
        mediaUrls.push({
          url,
          isVideo: mediaItem.isVideo,
          isVertical: mediaItem.isVertical,
        });
      }

      await savePostToFirestore(
        formData.description,
        mediaUrls,
        allHashtags,
        searchKeywords,
        formData.isPublic,
        formData.mediaItems[0]?.isVertical || false,
        firebase,
      );

      await clearDraft();
      Alert.alert('Success', 'Post created successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return {loading, uploadProgress, currentUploadIndex, handleSubmit};
};
