import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import {getAuth} from '@react-native-firebase/auth';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import Config from 'react-native-config';
import {DEFAULT_UPLOAD_PRESET} from 'shared/constants/cloudinary';
import {MediaItem, PostFormData} from 'create-post/types/main';
import {getStyles} from 'create-post/styles/CreatePost';

// Cloudinary Configuration
const CLOUDINARY_CONFIG = {
  cloudName: Config.CLOUDINARY_CLOUD_NAME, // Hardcoded cloud name
  uploadPreset: 'learnex-post', // Your upload preset
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxVideoSize: 100 * 1024 * 1024, // 100MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
  allowedVideoTypes: ['video/mp4', 'video/quicktime'],
  maxTotalMedia: 6,
  maxVideos: 2,
};

const CreatePost = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const theme = useTypedSelector(state => state.user.theme);
  const isDark = theme === 'dark';
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  const [hasStoragePermission, setHasStoragePermission] = useState(false);

  const [formData, setFormData] = useState<PostFormData>({
    description: '',
    mediaItems: [],
    hashtags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);

  const styles = getStyles(isDark, hasStoragePermission);

  // Function to extract hashtags from description
  const extractHashtags = (text: string): string[] => {
    // Improved regex to better match hashtags
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex) || [];

    // Remove the # symbol and filter out empty strings
    return matches
      .map(tag => tag.replace('#', '').trim())
      .filter(tag => tag.length > 0);
  };

  // Function to generate searchKeywords
  const generateSearchKeywords = (text: string): string[] => {
    // This matches the logic in createSamplePosts.js
    const words = text
      .toLowerCase()
      // Remove hashtag symbols but keep the words
      .replace(/#/g, '')
      // Remove special characters
      .replace(/[^\w\s]/g, ' ')
      // Split into words
      .split(/\s+/)
      // Remove empty strings
      .filter(word => word.length > 0);

    // Remove duplicates using Set
    return [...new Set(words)];
  };

  // Request storage permissions
  const requestStoragePermissions = async () => {
    try {
      if (Platform.OS !== 'android') {
        setHasStoragePermission(true);
        return true;
      }

      const androidVersion = parseInt(String(Platform.Version), 10);
      let permissionGranted = false;

      // For Android 13+ (API 33+)
      if (androidVersion >= 33) {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        ];

        // Request each permission individually
        const results = await Promise.all(
          permissions.map(permission =>
            PermissionsAndroid.request(permission, {
              title: 'Media Access Permission',
              message:
                'Learnex needs access to your photos and videos to create posts.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }),
          ),
        );

        // Check if all permissions were granted
        permissionGranted = results.every(
          result => result === PermissionsAndroid.RESULTS.GRANTED,
        );
      }
      // For Android 11-12 (API 30-32)
      else if (androidVersion >= 30) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message:
              'Learnex needs access to your storage to upload images and videos for posts.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      // For Android 10 and below (API 29 and below)
      else {
        const storagePermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message:
              'Learnex needs access to your storage to upload images and videos for posts.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        const writePermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Write Permission',
            message:
              'Learnex needs write access to your storage to save temporary files.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        permissionGranted =
          storagePermission === PermissionsAndroid.RESULTS.GRANTED &&
          writePermission === PermissionsAndroid.RESULTS.GRANTED;
      }

      setHasStoragePermission(permissionGranted);

      if (!permissionGranted) {
        Alert.alert(
          'Permission Required',
          'Storage access permission is required to upload images and videos to your posts. Please enable it in your device settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ],
        );
      }

      return permissionGranted;
    } catch (err) {
      console.warn('Error requesting permissions:', err);
      setHasStoragePermission(false);
      return false;
    } finally {
      setPermissionsChecked(true);
    }
  };

  // Check permissions when component mounts
  useEffect(() => {
    requestStoragePermissions();
  }, []);

  // Handle removing a media item
  const removeMediaItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mediaItems: prev.mediaItems.filter((_, i) => i !== index),
    }));
  };

  // Check if we can add more media
  const canAddMoreMedia = () => {
    const currentVideoCount = formData.mediaItems.filter(
      item => item.isVideo,
    ).length;
    const totalMediaCount = formData.mediaItems.length;

    return (
      totalMediaCount < CLOUDINARY_CONFIG.maxTotalMedia &&
      currentVideoCount < CLOUDINARY_CONFIG.maxVideos
    );
  };

  // Handle image picker with validation
  const pickMedia = async () => {
    try {
      setPickerError(null); // Clear any previous errors

      // Check if we can add more media
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

      // Don't check permission if it was already checked at component mount
      if (!permissionsChecked) {
        const hasPermission = await requestStoragePermissions();
        if (!hasPermission) {
          return;
        }
      } else if (!hasStoragePermission) {
        // If permissions were checked but denied, show settings dialog
        Alert.alert(
          'Permission Required',
          'Storage access permission is required to upload images and videos to your posts. Please enable it in your device settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return;
      }

      // Options for image picker
      const options = {
        mediaType: 'mixed' as any, // TypeScript workaround
        quality: 0.8 as any, // TypeScript workaround
        maxWidth: 1200,
        maxHeight: 1200,
        selectionLimit:
          CLOUDINARY_CONFIG.maxTotalMedia - formData.mediaItems.length, // Limit remaining slots
        includeBase64: false, // We don't need base64 data
      };

      const result = await launchImageLibrary(options);

      // Handle cancellation
      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      // Handle picker errors
      if (result.errorCode) {
        const errorMsg = `ImagePicker error: ${result.errorMessage || result.errorCode}`;
        console.error(errorMsg);
        setPickerError(errorMsg);

        // Show user-friendly error
        Alert.alert(
          'Error',
          'Could not access media. Please check your device settings and try again.',
        );
        return;
      }

      if (result.assets && result.assets.length > 0) {
        // Check for video limits
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

        // Process each selected media
        const validatedMedia: MediaItem[] = [];
        const errors: string[] = [];

        for (const asset of result.assets) {
          const uri = asset.uri;
          const isVideo = asset.type?.startsWith('video/') || false;
          const allowedTypes = isVideo
            ? CLOUDINARY_CONFIG.allowedVideoTypes
            : CLOUDINARY_CONFIG.allowedImageTypes;

          // Skip if no URI
          if (!uri) {
            errors.push('Failed to get media URI');
            continue;
          }

          // Validate file size
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

          // Validate media type
          if (!asset.type || !allowedTypes.includes(asset.type)) {
            errors.push(
              `Only ${isVideo ? 'MP4 or MOV' : 'JPEG, PNG or GIF'} files are allowed`,
            );
            continue;
          }

          // Check if image is vertical
          const height = asset.height || 0;
          const width = asset.width || 0;
          const isVertical = height > width;

          // Add to validated media
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

        // Show errors if any
        if (errors.length > 0) {
          Alert.alert('Some media could not be added', errors.join('\n'));
        }

        // Add valid media to form data
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

  // Handle tag addition
  const addTag = () => {
    if (tagInput.trim() && !formData.hashtags.includes(tagInput.trim())) {
      // Ensure hashtag has # prefix
      let tag = tagInput.trim();
      if (!tag.startsWith('#')) {
        tag = `#${tag}`;
      }

      setFormData(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, tag],
      }));
      setTagInput('');
    }
  };

  // Handle tag removal
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(tag => tag !== tagToRemove),
    }));
  };

  // Upload a single media item to Cloudinary
  const uploadMediaToCloudinary = async (
    mediaItem: MediaItem,
    index: number,
    totalCount: number,
  ): Promise<string> => {
    try {
      // Calculate progress based on current item
      const progressStart = (index / totalCount) * 100;
      const progressEnd = ((index + 1) / totalCount) * 100;

      setUploadProgress(progressStart);
      setCurrentUploadIndex(index);

      const cloudName = CLOUDINARY_CONFIG.cloudName;
      const uploadPreset = CLOUDINARY_CONFIG.uploadPreset;

      const newFormData = new FormData();
      newFormData.append('file', {
        uri: mediaItem.uri,
        type: mediaItem.type,
        name:
          mediaItem.name || (mediaItem.isVideo ? 'upload.mp4' : 'upload.jpg'),
      } as any);
      newFormData.append('upload_preset', DEFAULT_UPLOAD_PRESET);
      newFormData.append('tags', 'learnex_post');

      // Set mid-point progress
      setUploadProgress((progressStart + progressEnd) / 2);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${mediaItem.isVideo ? 'video' : 'image'}/upload`,
        {
          method: 'POST',
          body: newFormData,
        },
      );

      const data = await response.json();
      console.log('Cloudinary response:', data);

      // Set end progress for this item
      setUploadProgress(progressEnd);

      if (data.secure_url) {
        return data.secure_url;
      } else {
        if (data.error) {
          // Check for preset not found error
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
      }
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };

  // Handle form submission
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
      // Extract hashtags using the improved method
      const extractedTags = extractHashtags(formData.description);

      // Combine with any manually added hashtags and remove duplicates
      const allHashtags = [
        ...new Set([...formData.hashtags, ...extractedTags]),
      ];

      console.log('Extracted hashtags:', allHashtags);

      // Generate search keywords using the same method as createSamplePosts.js
      const searchKeywords = generateSearchKeywords(formData.description);

      // Upload all media files to Cloudinary
      setUploadProgress(0);

      const mediaUrls = [];
      for (let i = 0; i < formData.mediaItems.length; i++) {
        const mediaItem = formData.mediaItems[i];
        const url = await uploadMediaToCloudinary(
          mediaItem,
          i,
          formData.mediaItems.length,
        );
        mediaUrls.push({
          url,
          isVideo: mediaItem.isVideo,
          isVertical: mediaItem.isVertical,
        });
      }

      // Get current user
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      const {fullName} = await firebase.user.getNameUsernamestring();

      // Create arrays for images and videos
      const postImages = mediaUrls
        .filter(item => !item.isVideo)
        .map(item => item.url);

      const postVideos = mediaUrls
        .filter(item => item.isVideo)
        .map(item => item.url);

      // Create post document in Firestore
      const postData = {
        user: {
          id: currentUser.uid,
          username: currentUser.displayName || fullName || 'Anonymous',
          image:
            currentUser.photoURL ||
            `https://avatar.iran.liara.run/username?username=${encodeURIComponent(currentUser.displayName || fullName || 'Anonymous')}`,
        },
        description: formData.description,
        postImages: postImages,
        postVideo: postVideos.length > 0 ? postVideos[0] : null,
        isVideo: postVideos.length > 0,
        hasMultipleMedia: mediaUrls.length > 1,
        isVertical: formData.mediaItems[0]?.isVertical || false,
        hashtags: allHashtags,
        searchKeywords,
        likes: 0,
        likedBy: [],
        comments: 0,
        timestamp: serverTimestamp(),
      };

      console.log(
        'Creating post with data:',
        JSON.stringify(postData, null, 2),
      );

      // Add to Firestore with explicit type annotation to ensure hashtags field
      await addDoc(collection(getFirestore(), 'posts'), postData);

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

  // Update hashtags as user types description
  const handleDescriptionChange = (text: string) => {
    setFormData(prev => ({...prev, description: text}));

    // Extract hashtags for preview
    const extractedTags = extractHashtags(text);
    if (extractedTags.length > 0) {
      // Add newly detected hashtags to the list
      const currentTags = formData.hashtags;
      const newTags = extractedTags.filter(tag => !currentTags.includes(tag));

      if (newTags.length > 0) {
        setFormData(prev => ({
          ...prev,
          description: text,
          hashtags: [...prev.hashtags, ...newTags],
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          description: text,
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        description: text,
      }));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      {/* Display storage permission status */}
      {Platform.OS === 'android' && !hasStoragePermission && (
        <View style={styles.permissionStatus}>
          <View style={styles.permissionStatusRow}>
            <Ionicons
              name={'alert-circle'}
              size={20}
              color={hasStoragePermission ? '#4CAF50' : '#FF3B30'}
              style={styles.permissionIcon}
            />
            <Text style={styles.permissionStatusText}>
              {'Storage permission required for media uploads'}
            </Text>
          </View>
          {!hasStoragePermission && (
            <TouchableOpacity
              style={[
                styles.troubleshootingButton,
                styles.troubleshootingButtonAdditional,
              ]}
              onPress={requestStoragePermissions}>
              <Text style={styles.troubleshootingButtonText}>
                Grant Permission
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          {/* Upload Media First */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Text style={[styles.label]}>Photos & Videos *</Text>
              <Text style={styles.mediaCounter}>
                {formData.mediaItems.length}/{CLOUDINARY_CONFIG.maxTotalMedia}
                {formData.mediaItems.filter(m => m.isVideo).length > 0 &&
                  ` (${formData.mediaItems.filter(m => m.isVideo).length}/${CLOUDINARY_CONFIG.maxVideos} videos)`}
              </Text>
            </View>

            {/* Media Grid */}
            <View style={styles.mediaGrid}>
              {formData.mediaItems.map((item, index) => (
                <View key={index} style={styles.mediaItem}>
                  {item.isVideo ? (
                    <View style={styles.videoPlaceholder}>
                      <Ionicons
                        name="videocam"
                        size={30}
                        color={isDark ? '#e0e0e0' : '#666'}
                      />
                      <Text style={styles.videoPlaceholderText}>Video</Text>
                    </View>
                  ) : (
                    <Image
                      source={{uri: item.uri}}
                      style={styles.mediaThumbnail}
                    />
                  )}
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => removeMediaItem(index)}>
                    <Ionicons name="close-circle" size={22} color="#ff3b30" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add Media Button (only if we can add more) */}
              {canAddMoreMedia() && (
                <TouchableOpacity
                  style={styles.addMediaButton}
                  onPress={
                    hasStoragePermission ? pickMedia : requestStoragePermissions
                  }
                  disabled={loading}>
                  <Ionicons
                    name="add"
                    size={40}
                    color={isDark ? '#e0e0e0' : '#666'}
                  />
                </TouchableOpacity>
              )}
            </View>

            {pickerError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{pickerError}</Text>
              </View>
            )}

            {/* Upload progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <View
                style={[
                  styles.progressContainer,
                  isDark
                    ? styles.darkProgressContainer
                    : styles.lightProgressContainer,
                ]}>
                <Text style={styles.progressMediaUploadStatus}>
                  Uploading media {currentUploadIndex + 1} of{' '}
                  {formData.mediaItems.length}...
                </Text>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${uploadProgress}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressPercentage}>
                  {Math.round(uploadProgress)}%
                </Text>
              </View>
            )}
          </View>

          {/* Description Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label]}>Caption *</Text>
            <TextInput
              style={styles.contentInput}
              placeholder="Write a caption..."
              placeholderTextColor={isDark ? '#999' : '#999'}
              multiline
              numberOfLines={5}
              value={formData.description}
              onChangeText={handleDescriptionChange}
            />
          </View>

          {/* Tags Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label]}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={[styles.tagInput]}
                placeholder="Add tags (optional)"
                placeholderTextColor={isDark ? '#999' : '#999'}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
                <Ionicons name="add-circle" size={24} color="#0A84FF" />
              </TouchableOpacity>
            </View>
            <View style={styles.tagsContainer}>
              {formData.hashtags.map((tag, index) => (
                <View key={index} style={[styles.tagWrapper]}>
                  <Text style={styles.tagTextStyle}>{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag)}>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={isDark ? '#e0e0e0' : '#666'}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
              isDark && styles.submitButtonDark,
            ]}
            onPress={handleSubmit}
            disabled={loading || formData.mediaItems.length === 0}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Create Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreatePost;
