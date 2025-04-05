import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
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
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import Config from 'react-native-config';

// Cloudinary Configuration
const CLOUDINARY_CONFIG = {
  cloudName: Config.CLOUDINARY_CLOUD_NAME, // Hardcoded cloud name
  uploadPreset: 'learnex-post', // Your upload preset
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
  allowedVideoTypes: ['video/mp4', 'video/quicktime'],
};

// Types
interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  created_at: string;
}

interface PostFormData {
  description: string;
  image: string | null;
  isVideo: boolean;
  isVertical: boolean;
  hashtags: string[];
}

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
    image: null,
    isVideo: false,
    isVertical: false,
    hashtags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pickerError, setPickerError] = useState<string | null>(null);

  // Function to extract hashtags from description
  const extractHashtags = (text: string): string[] => {
    // This matches the logic in createSamplePosts.js
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex) || [];

    // Remove the # symbol to match the format used in createSamplePosts.js
    return matches.map(tag => tag.replace('#', ''));
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
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
        ];

        // Request each permission individually
        const results = await Promise.all(
          permissions.map(permission =>
            PermissionsAndroid.request(permission, {
              title: 'Media Access Permission',
              message: 'Learnex needs access to your photos and videos to create posts.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            })
          )
        );

        // Check if all permissions were granted
        permissionGranted = results.every(
          result => result === PermissionsAndroid.RESULTS.GRANTED
        );
      }
      // For Android 11-12 (API 30-32)
      else if (androidVersion >= 30) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'Learnex needs access to your storage to upload images and videos for posts.',
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
            message: 'Learnex needs access to your storage to upload images and videos for posts.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        const writePermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Write Permission',
            message: 'Learnex needs write access to your storage to save temporary files.',
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
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings()
            }
          ]
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

  // Handle image picker with validation
  const pickImage = async () => {
    try {
      setPickerError(null); // Clear any previous errors

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
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings()
            }
          ]
        );
        return;
      }

      // Options for image picker
      const options = {
        mediaType: 'mixed',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        selectionLimit: 1,
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
        Alert.alert('Error', 'Could not access media. Please check your device settings and try again.');
        return;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.uri;

        if (!uri) {
          const errorMsg = 'Failed to get media URI';
          setPickerError(errorMsg);
          Alert.alert('Error', errorMsg);
          return;
        }

        // Validate file size
        if (asset.fileSize && asset.fileSize > CLOUDINARY_CONFIG.maxFileSize) {
          const errorMsg = 'File size must be less than 10MB';
          setPickerError(errorMsg);
          Alert.alert('Error', errorMsg);
          return;
        }

        // Validate media type
        const isVideo = asset.type?.startsWith('video/') || false;
        const allowedTypes = isVideo ? CLOUDINARY_CONFIG.allowedVideoTypes : CLOUDINARY_CONFIG.allowedImageTypes;

        if (!asset.type || !allowedTypes.includes(asset.type)) {
          const errorMsg = `Only ${isVideo ? 'MP4 or MOV' : 'JPEG, PNG or GIF'} files are allowed`;
          setPickerError(errorMsg);
          Alert.alert('Error', errorMsg);
          return;
        }

        // Check if image is vertical
        const height = asset.height || 0;
        const width = asset.width || 0;
        const isVertical = height > width;

        // Successfully selected media
        setFormData(prev => ({
          ...prev,
          image: uri,
          isVideo,
          isVertical,
        }));
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

  // Upload image to Cloudinary directly
  const uploadMediaToCloudinary = async (uri: string, isVideo: boolean): Promise<string> => {
    try {
      setUploadProgress(10); // Start progress

      const cloudName = CLOUDINARY_CONFIG.cloudName;
      const uploadPreset = CLOUDINARY_CONFIG.uploadPreset;

      const formData = new FormData();
      formData.append('file', {
        uri,
        type: isVideo ? 'video/mp4' : 'image/jpeg',
        name: isVideo ? 'upload.mp4' : 'upload.jpg',
      } as any);
      formData.append('upload_preset', uploadPreset);
      formData.append('tags', 'learnex_post');

      setUploadProgress(30); // Upload started

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${isVideo ? 'video' : 'image'}/upload`, {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(90); // Almost done

      const data = await response.json();

      setUploadProgress(100); // Complete

      if (data.secure_url) {
        return data.secure_url;
      } else {
        if (data.error) {
          // Check for preset not found error
          if (data.error.message.includes('unknown preset') || data.error.message.includes('preset not found')) {
            Alert.alert(
              'Upload Preset Missing',
              `The upload preset "${uploadPreset}" doesn't exist. Please create it in your Cloudinary dashboard:\n\n` +
              '1. Go to Settings > Upload\n' +
              '2. Scroll to Upload Presets and click "Add Upload Preset"\n' +
              '3. Set Mode to "Unsigned"\n' +
              `4. Set the Preset Name to "${uploadPreset}"\n` +
              '5. Save the preset'
            );
          }
          throw new Error(`Cloudinary error: ${data.error.message}`);
        }
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

    if (!formData.image) {
      Alert.alert('Error', 'Please select an image or video');
      return;
    }

    setLoading(true);
    try {
      // Extract hashtags using the same method as createSamplePosts.js
      const allHashtags = extractHashtags(formData.description);

      // Generate search keywords using the same method as createSamplePosts.js
      const searchKeywords = generateSearchKeywords(formData.description);

      // Upload media to Cloudinary
      const mediaUrl = await uploadMediaToCloudinary(formData.image, formData.isVideo);

      // Get current user
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      const { fullName } = await firebase.user.getNameUsernamestring();
      // Create post document in Firestore
      const postData = {
        user: {
          id: currentUser.uid,
          username: currentUser.displayName || fullName || 'Anonymous',
          image: currentUser.photoURL || `https://avatar.iran.liara.run/username?username=${currentUser.displayName || fullName || 'Anonymous'}`,
        },
        description: formData.description,
        // Use the appropriate field based on media type
        ...(formData.isVideo
          ? {
            postVideo: mediaUrl,
            isVideo: true,
            postImages: [] // Empty array to ensure field exists
          }
          : {
            postImages: [mediaUrl],
            isVideo: false,
            postVideo: null // Null to ensure field exists
          }
        ),
        isVertical: formData.isVertical,
        hashtags: allHashtags, // Already matches format in createSamplePosts.js
        searchKeywords, // Generated using same method as createSamplePosts.js
        likes: 0,
        likedBy: [],
        comments: 0,
        timestamp: firestore.FieldValue.serverTimestamp(),
      };

      console.log('Creating post with data:', JSON.stringify(postData, null, 2));

      // Add to Firestore
      await firestore().collection('posts').add(postData);

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
    setFormData(prev => ({ ...prev, description: text }));

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
      style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? 'white' : 'black'}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? 'white' : '#333' }]}>
          Create Post
        </Text>
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          disabled={loading || !formData.description}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Display storage permission status */}
      {Platform.OS === 'android' && (
        <View style={[styles.permissionStatus, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5', borderColor: isDark ? '#444' : '#ddd' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name={hasStoragePermission ? "checkmark-circle" : "alert-circle"}
              size={20}
              color={hasStoragePermission ? '#4CAF50' : '#FF3B30'}
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: isDark ? '#e0e0e0' : '#333' }}>
              {hasStoragePermission
                ? 'Storage permission granted'
                : 'Storage permission required for media uploads'}
            </Text>
          </View>

          {!hasStoragePermission && (
            <TouchableOpacity
              style={[styles.troubleshootingButton, { marginTop: 8 }]}
              onPress={requestStoragePermissions}
            >
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
            <Text style={[styles.label, { color: isDark ? '#e0e0e0' : '#333' }]}>Photo or Video *</Text>
            <TouchableOpacity
              style={[
                styles.imageUploadButton,
                { borderColor: isDark ? '#444' : '#ddd' },
                !hasStoragePermission && { opacity: 0.7 }
              ]}
              onPress={hasStoragePermission ? pickImage : requestStoragePermissions}
              disabled={loading}
            >
              {formData.image ? (
                <View style={styles.imageWrapper}>
                  {formData.isVideo ? (
                    <View style={[styles.videoPlaceholder, { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}>
                      <Ionicons name="videocam" size={40} color={isDark ? '#e0e0e0' : '#666'} />
                      <Text style={[styles.imagePlaceholderText, { color: isDark ? '#e0e0e0' : '#666' }]}>Video Selected</Text>
                    </View>
                  ) : (
                    <Image source={{ uri: formData.image }} style={styles.previewImage} />
                  )}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <View style={styles.progressOverlay}>
                      <Text style={styles.progressText}>{`${Math.round(uploadProgress)}%`}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
                  <Ionicons name="images-outline" size={40} color={isDark ? '#e0e0e0' : '#666'} />
                  <Text style={[styles.imagePlaceholderText, { color: isDark ? '#e0e0e0' : '#666' }]}>
                    {!hasStoragePermission
                      ? 'Grant permission to add media'
                      : 'Tap to add photo or video'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {pickerError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{pickerError}</Text>
              </View>
            )}
          </View>

          {/* Description Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDark ? '#e0e0e0' : '#333' }]}>Caption *</Text>
            <TextInput
              style={[styles.contentInput, {
                borderColor: isDark ? '#444' : '#ddd',
                color: isDark ? '#fff' : '#333',
                backgroundColor: isDark ? '#2a2a2a' : '#fff'
              }]}
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
            <Text style={[styles.label, { color: isDark ? '#e0e0e0' : '#333' }]}>Tags</Text>
            <View style={[styles.tagInputContainer, { borderColor: isDark ? '#444' : '#ddd', backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
              <TextInput
                style={[styles.tagInput, { color: isDark ? '#fff' : '#333' }]}
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
                <View key={index} style={[styles.tag, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}>
                  <Text style={[styles.tagText, { color: isDark ? '#fff' : '#333' }]}>{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag)}>
                    <Ionicons name="close-circle" size={16} color={isDark ? '#e0e0e0' : '#666'} />
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
              isDark && { backgroundColor: '#0A84FF' }
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imageUploadButton: {
    borderWidth: 1,
    borderRadius: 8,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePlaceholder: {
    alignItems: 'center',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  videoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  imagePlaceholderText: {
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  addTagButton: {
    padding: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    marginRight: 4,
  },
  removeTagButton: {
    padding: 2,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ff3b30',
    borderRadius: 8,
    backgroundColor: '#ffd2d0',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
  troubleshootingContainer: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  troubleshootingText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },
  troubleshootingButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  troubleshootingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  darkText: {
    color: 'white',
  },
  postButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.7,
  },
  permissionStatusContainer: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  darkPermissionStatusContainer: {
    backgroundColor: '#2a2a2a',
  },
  permissionText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  darkInput: {
    backgroundColor: '#2a2a2a',
  },
  imageSection: {
    marginBottom: 20,
  },
  selectedImageContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  videoText: {
    marginTop: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
  },
  addMediaButton: {
    borderWidth: 1,
    borderRadius: 8,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  addMediaText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  permissionStatus: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
});