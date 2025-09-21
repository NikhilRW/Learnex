import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
  Text,
  ImageURISource,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Video, {VideoRef} from 'react-native-video';
import {PostType} from 'shared/types/post';
import {Comment} from 'home/types/post';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import {primaryColor} from 'shared/res/strings/eng';
import CommentModal from 'home/components/CommentModal';
import {getUsernameForLogo} from 'shared/helpers/common/stringHelpers';
import {Avatar} from 'react-native-elements';
import {useNavigation} from '@react-navigation/native';
import {MessageService} from 'conversations/services/MessageService';
import Snackbar from 'react-native-snackbar';
import {UserStackParamList} from 'shared/navigation/routes/UserStack';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
} from '@react-native-firebase/firestore';
import {getAuth} from '@react-native-firebase/auth';
import PostOptionsModal from './PostOptionsModal';
import {FullPostModal} from './FullPostModal';
import {createStyles} from '../styles/Post';
import {onSnapshot} from '@react-native-firebase/firestore';

/**
 * Post component that displays a social media post with images
 * Features a beautiful carousel with spring-animated pagination dots
 */

interface PostProps {
  post: PostType;
  isVisible?: boolean;
}

interface VideoProgress {
  currentTime: number;
  playableDuration: number;
  seekableDuration: number;
}

type UserNavigation = NativeStackNavigationProp<UserStackParamList>;

const Post: React.FC<PostProps> = ({post, isVisible = false}) => {
  post;
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  const screenWidth = Dimensions.get('window').width;
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [imageHeight, setImageHeight] = useState(300);
  const [currentImageIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [isPaused, setIsPaused] = useState(!isVisible);
  const [showDots, setShowDots] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const videoRef = useRef<VideoRef>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;
  const controlsTimeout = useRef<NodeJS.Timeout>(null);
  const dotsTimeout = useRef<NodeJS.Timeout>(null);
  const lastPosition = useRef(0);
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const navigation = useNavigation<UserNavigation>();
  const messageService = new MessageService();
  const [isHiding, setIsHiding] = useState(false);
  const [isSaved, setIsSaved] = useState(post.isSaved === true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCurrentUserPost, setIsCurrentUserPost] = useState(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [formattedDescription, setFormattedDescription] =
    useState<React.ReactNode>(null);
  const [userProfileImage, setUserProfileImage] = useState<string | null>(
    post.user.image,
  );

  // Add new state for mixed media navigation
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Combine all media (images and video) into a single array for navigation
  const allMedia = React.useMemo(() => {
    const mediaArray = [];

    // Add video if it exists
    if (post.postVideo) {
      mediaArray.push({
        type: 'video',
        source: post.postVideo,
      });
    }

    // Add images if they exist
    if (post.postImages && post.postImages.length > 0) {
      post.postImages.forEach(image => {
        mediaArray.push({
          type: 'image',
          source: image,
        });
      });
    }

    return mediaArray;
  }, [post.postVideo, post.postImages]);

  // Navigation handlers
  const goToPreviousMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  const goToNextMedia = () => {
    if (currentMediaIndex < allMedia.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  useEffect(() => {
    // Check if the current user is the post creator
    const checkCurrentUser = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser && post.user.id === currentUser.uid) {
        setIsCurrentUserPost(true);
      }
    };

    checkCurrentUser();
  }, [firebase, post.user.id]);

  // Listen for profile image updates
  useEffect(() => {
    if (!post.user.id) return;

    const db = getFirestore();
    const userRef = doc(collection(db, 'users'), post.user.id);
    const unsubscribe = onSnapshot(userRef, snapshot => {
      if (snapshot.exists()) {
        const userData = snapshot.data();
        if (userData?.image && userData.image !== userProfileImage) {
          setUserProfileImage(userData.image);
        }
      }
    });

    return () => unsubscribe();
  }, [post.user.id, userProfileImage]);

  useEffect(() => {
    // Handle video visibility changes
    if (post.isVideo) {
      setIsPaused(!isVisible);
    }
  }, [isVisible, post.isVideo]);

  // Keep isLiked state synchronized with post prop
  useEffect(() => {
    setIsLiked(post.isLiked || false);
  }, [post.isLiked]);

  useEffect(() => {
    // Fade in animation for post
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Start dots animation
    Animated.spring(dotsAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Set default image height based on orientation
    if (post.isVertical) {
      // For vertical images, use a taller container
      setImageHeight(Math.min(480, screenWidth * 1.5));
    } else {
      // For horizontal images, use a shorter container
      setImageHeight(Math.min(300, screenWidth * 0.6));
    }

    // If we have a specific first image, try to calculate its exact dimensions
    const firstImage = post.postImages?.[0] || post.postImage;
    if (firstImage) {
      if (typeof firstImage === 'number') {
        // Local image
        const imageSource = Image.resolveAssetSource(firstImage);
        if (imageSource) {
          const {width, height} = imageSource;
          const actualScreenWidth = Dimensions.get('window').width - 24;
          const scaledHeight = (height / width) * actualScreenWidth;
          setImageHeight(scaledHeight || (post.isVertical ? 480 : 300));
        }
      } else {
        // Remote image
        const imageUri =
          typeof firstImage === 'string'
            ? firstImage
            : (firstImage as ImageURISource).uri;
        if (imageUri) {
          Image.getSize(
            imageUri,
            (width, height) => {
              const scaledHeight =
                (height / width) * Dimensions.get('window').width;
              setImageHeight(scaledHeight || (post.isVertical ? 480 : 300));
            },
            error => {
              console.error('Error getting image size:', error);
              // Fallback to orientation-based height
              setImageHeight(post.isVertical ? 480 : 300);
            },
          );
        }
      }
    }

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      if (dotsTimeout.current) clearTimeout(dotsTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.postImages, post.postImage, post.isVertical, fadeAnim, screenWidth]);

  const handleVideoProgress = useCallback((progress: VideoProgress) => {
    lastPosition.current = progress.currentTime;
  }, []);

  const handleVideoPress = () => {
    setIsPaused(prevState => !prevState);
    handleMediaTouch();
  };

  // const handleScroll = useCallback(
  //   (event: NativeSyntheticEvent<NativeScrollEvent>) => {
  //     const contentOffset = event.nativeEvent.contentOffset.x;
  //     const index = Math.round(contentOffset / (screenWidth - 14));
  //     setCurrentImageIndex(index);
  //   },
  //   [screenWidth],
  // );

  const handleMediaTouch = () => {
    setShowDots(true);
    if (dotsTimeout.current) {
      clearTimeout(dotsTimeout.current);
    }
    dotsTimeout.current = setTimeout(() => {
      setShowDots(false);
    }, 3000);
  };

  const renderMedia = () => {
    // If there's no media, return null
    if (!post.postVideo && (!post.postImages || post.postImages.length === 0)) {
      return null;
    }

    // If there's only one media item (just a video or a single image)
    if (allMedia.length === 1) {
      if (post.isVideo && post.postVideo) {
        // Render just the video
        return renderVideoContent(post.postVideo);
      } else if (post.postImages && post.postImages.length === 1) {
        // Render just the single image
        return renderImageContent(post.postImages[0]);
      }
    }

    // For multiple media items (either multiple images or video + images)
    return (
      <View style={[styles.mediaContainer]}>
        {/* Current media item (video or image) */}
        {allMedia[currentMediaIndex].type === 'video'
          ? renderVideoContent(allMedia[currentMediaIndex].source)
          : renderImageContent(allMedia[currentMediaIndex].source)}

        {/* Navigation buttons */}
        {showDots && allMedia.length > 1 && (
          <>
            {/* Previous button */}
            {currentMediaIndex > 0 && (
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={goToPreviousMedia}>
                <Icon name="chevron-left" size={30} color="white" />
              </TouchableOpacity>
            )}

            {/* Next button */}
            {currentMediaIndex < allMedia.length - 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={goToNextMedia}>
                <Icon name="chevron-right" size={30} color="white" />
              </TouchableOpacity>
            )}

            {/* Pagination dots */}
            <View style={styles.paginationDots}>
              {allMedia.map((_, index) => {
                const bgColor =
                  index === currentMediaIndex
                    ? '#fff'
                    : 'rgba(255, 255, 255, 0.5)';
                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: bgColor,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </>
        )}
      </View>
    );
  };

  // Helper function to render video content
  const renderVideoContent = (videoSource: any) => {
    let source;
    if (typeof videoSource === 'number') {
      source = videoSource as unknown as NodeRequire;
    } else if (typeof videoSource === 'string') {
      source = videoSource;
    } else if (videoSource && typeof videoSource === 'object') {
      const videoObject = videoSource as {uri?: string};
      if (videoObject.uri) {
        source = videoObject.uri;
      } else {
        console.error('Video object has no URI property:', videoSource);
        return (
          <View style={styles.errorContainer}>
            <Text>Invalid video format</Text>
          </View>
        );
      }
    } else {
      console.error('Video has invalid format:', videoSource);
      return (
        <View style={styles.errorContainer}>
          <Text>Invalid video format</Text>
        </View>
      );
    }

    return (
      <TouchableWithoutFeedback onPress={handleVideoPress}>
        <View
          style={{
            width: screenWidth - 24,
            height: imageHeight,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            padding: 0,
            margin: 0,
          }}>
          <Video
            ref={videoRef}
            source={{uri: source}}
            style={styles.postImage}
            resizeMode={post.isVertical ? 'cover' : 'contain'}
            paused={isPaused}
            repeat
            onProgress={handleVideoProgress}
            onError={error => {
              console.error('Video loading error:', error);
              setVideoError(true);
            }}
          />
          {isPaused && <View style={styles.pausedOverlay} />}
          {videoError && (
            <View style={[styles.videoErrorContainer]}>
              <Text className="text-white">Failed to load video :(</Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  // Helper function to render image content
  const renderImageContent = (
    imageSource: any,
    isFullModal: boolean = false,
  ) => {
    let source;
    if (typeof imageSource === 'number') {
      source = imageSource;
    } else if (typeof imageSource === 'string') {
      source = {uri: imageSource};
    } else if (
      imageSource &&
      typeof imageSource === 'object' &&
      'uri' in imageSource
    ) {
      source = {uri: imageSource.uri};
    } else {
      return null; // Skip invalid images
    }

    return (
      <TouchableWithoutFeedback onPress={handleMediaTouch}>
        <Image
          source={source}
          style={[
            styles.postImage,
            {
              height: isFullModal
                ? imageHeight
                : imageHeight - 12 || (post.isVertical ? 480 : 300),
            },
          ]}
          resizeMode={isFullModal ? 'contain' : 'cover'}
          onError={error =>
            console.error(
              'Image loading error for source',
              source,
              ':',
              error.nativeEvent.error,
            )
          }
        />
      </TouchableWithoutFeedback>
    );
  };

  const handleMessageUser = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Snackbar.show({
          text: 'You must be logged in to message users',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
        return;
      }

      Snackbar.show({
        text: 'Setting up conversation...',
        duration: Snackbar.LENGTH_INDEFINITE,
        textColor: 'white',
        backgroundColor: '#2379C2',
      });

      // Create or get conversation
      const conversation = await messageService.getOrCreateConversation(
        currentUser.uid,
        post.user.id,
      );

      // Dismiss loading indicator
      Snackbar.dismiss();
      // Navigate to chat with proper typing
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        recipientId: post.user.id,
        recipientName: post.user.username,
        recipientPhoto: post.user.image,
        isQrInitiated: false,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      Snackbar.show({
        text: 'Failed to start conversation',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsAddingComment(true);

      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Snackbar.show({
          text: 'You must be logged in to comment',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
        return;
      }

      const db = getFirestore();
      const commentsCollectionRef = collection(
        db,
        'posts',
        post.id,
        'comments',
      );
      const newCommentRef = doc(commentsCollectionRef);
      const newCommentData: Comment = {
        id: newCommentRef.id,
        userId: currentUser.uid,
        username: currentUser.displayName || 'Anonymous',
        userImage: currentUser.photoURL,
        text: newComment.trim(),
        timestamp: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        replies: [],
      };

      await setDoc(newCommentRef, newCommentData);

      const result = {success: true, comment: newCommentData};

      if (result.success) {
        // Update UI immediately with the new comment
        if (result.comment) {
          // Add the new comment to the post's comment list
          const updatedCommentsList = [
            ...(post.commentsList || []),
            result.comment,
          ];

          // Update the post object to include the new comment
          post.commentsList = updatedCommentsList;
          post.comments = (post.comments || 0) + 1;
        }

        setNewComment('');

        // Show feedback
        Snackbar.show({
          text: 'Comment added successfully',
          duration: Snackbar.LENGTH_SHORT,
          textColor: 'white',
          backgroundColor: '#2379C2',
        });

        // Show comments modal with updated comments
        setShowComments(true);
      } else {
        Snackbar.show({
          text: result.error || 'Failed to add comment',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Snackbar.show({
        text: 'An error occurred while adding your comment',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleHidePost = async () => {
    try {
      setIsHiding(true);
      setShowOptions(false);

      const db = getFirestore();
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {hidden: true});
      const result = {success: true};

      if (result.success) {
        Snackbar.show({
          text: 'Post hidden successfully',
          duration: Snackbar.LENGTH_SHORT,
          textColor: 'white',
          backgroundColor: '#2379C2',
        });
      } else {
        Snackbar.show({
          text: result.error || 'Failed to hide post',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
      }
    } catch (error) {
      console.error('Error hiding post:', error);
      Snackbar.show({
        text: 'Failed to hide post',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    } finally {
      setIsHiding(false);
    }
  };

  const handleSavePost = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      const db = getFirestore();
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);

      let updatedSavedPosts = [];
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const savedPosts = userData?.savedPosts || [];
        if (savedPosts.includes(post.id)) {
          updatedSavedPosts = savedPosts.filter((id: string) => id !== post.id);
        } else {
          updatedSavedPosts = [...savedPosts, post.id];
        }
      } else {
        updatedSavedPosts = [post.id];
      }

      await updateDoc(userRef, {savedPosts: updatedSavedPosts});
      const result = {
        success: true,
        saved: updatedSavedPosts.includes(post.id),
      };

      if (result.success) {
        setIsSaved(result.saved === true);

        // Show feedback to user
        Snackbar.show({
          text: result.saved ? 'Post saved' : 'Post unsaved',
          duration: Snackbar.LENGTH_SHORT,
          textColor: 'white',
          backgroundColor: '#2379C2',
        });
      } else {
        Snackbar.show({
          text: result.error || 'Failed to save post',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
      }
    } catch (error) {
      console.error('Error saving post:', error);
      Snackbar.show({
        text: 'An error occurred while saving the post',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async () => {
    // Close the options modal
    setShowOptions(false);

    const currentUser = firebase.currentUser();
    if (!currentUser || !post.id) {
      Snackbar.show({
        text: 'Unable to delete post at this time',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
      return;
    }

    // Confirm the user wants to delete
    setIsDeleting(true);

    try {
      // Show loading indicator
      Snackbar.show({
        text: 'Deleting post...',
        duration: Snackbar.LENGTH_INDEFINITE,
        textColor: 'white',
        backgroundColor: '#2379C2',
      });

      const result = await firebase.posts.deletePost(post.id);

      if (result.success) {
        Snackbar.show({
          text: 'Post deleted successfully',
          duration: Snackbar.LENGTH_SHORT,
          textColor: 'white',
          backgroundColor: '#4CAF50',
        });

        // You could add a callback here to refresh the feed
        // If you have a refresh function passed as prop, call it here
      } else {
        Snackbar.show({
          text: 'Failed to delete post',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      Snackbar.dismiss();
      Snackbar.show({
        text: 'Failed to delete post',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const checkPostSavedStatus = async () => {
      try {
        // We need to fetch the actual saved status from Firestore
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const db = getFirestore();
        const userRef = doc(collection(db, 'users'), currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const savedPosts = userData?.savedPosts || [];
          const saved = savedPosts.includes(post.id);
          setIsSaved(saved);
        } else {
          setIsSaved(false);
        }
      } catch (error) {
        console.error('Error checking post saved status:', error);
        setIsSaved(false);
      }
    };

    // Only check saved status if it's not explicitly set in the post prop
    if (post.isSaved === undefined) {
      checkPostSavedStatus();
    }
  }, [firebase, post.id, post.isSaved]);

  const handleLikePost = async () => {
    try {
      // Optimistically update UI immediately
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);

      // Update the likes count locally
      const likesChange = newIsLiked ? 1 : -1;
      post.likes += likesChange;

      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      const db = getFirestore();
      const postRef = doc(db, 'posts', post.id);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        return {success: false, error: 'Post not found'};
      }

      const postData = postDoc.data();
      let updatedLikes = postData?.likes || 0;
      let updatedLikedBy = postData?.likedBy || [];

      if (newIsLiked) {
        updatedLikes++;
        updatedLikedBy.push(currentUser.uid);
      } else {
        updatedLikes--;
        updatedLikedBy = updatedLikedBy.filter(
          (id: string) => id !== currentUser.uid,
        );
      }

      await updateDoc(postRef, {likes: updatedLikes, likedBy: updatedLikedBy});
      const result = {success: true};

      if (!result.success) {
        // Revert UI changes if request failed
        setIsLiked(!newIsLiked);
        post.likes -= likesChange;

        // Show error to user
        Snackbar.show({
          text: 'Failed to update like status',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);

      // Revert UI changes in case of error
      setIsLiked(!isLiked);

      // Show error to user
      Snackbar.show({
        text: 'Failed to update like status',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    }
  };

  // Function to extract hashtags from description
  const extractHashtags = (text: string): string[] => {
    // Regex to match hashtags
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex) || [];

    // Remove the # symbol and filter out empty strings
    return matches
      .map(tag => tag.replace('#', '').trim())
      .filter(tag => tag.length > 0);
  };

  // Process description and hashtags
  useEffect(() => {
    // Extract hashtags from description
    const extractedTags = extractHashtags(post.description || '');

    // Get existing hashtags array (if any)
    const existingTags = post.hashtags || [];

    // Combine both sets of hashtags and remove duplicates
    const allTags = [...new Set([...existingTags, ...extractedTags])];

    // Store combined tags back to post object for filtering
    post.hashtags = allTags;

    // Format the description with clickable hashtags
    formatDescriptionWithHashtags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.description]);

  // Format description with clickable hashtags
  const formatDescriptionWithHashtags = () => {
    if (!post.description) {
      setFormattedDescription(null);
      return;
    }

    const parts = post.description.split(/(#\w+)/g);
    const formattedParts = parts.map((part, index) => {
      if (part.startsWith('#')) {
        // Remove the # character
        return (
          <Text key={index} style={styles.hashtag} onPress={() => {}}>
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });

    setFormattedDescription(formattedParts);
  };

  // Handle hashtag press
  // const handleHashtagPress = (tag: string) => {};

  const [showFullPostModal, setShowFullPostModal] = useState(false);

  // Function to handle opening the full post details modal
  const handleOpenFullPost = () => {
    setShowFullPostModal(true);
  };
  const styles = createStyles(isDark);

  return (
    <Animated.View
      key={post.id}
      style={[styles.postContainer, {opacity: fadeAnim}]}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {userProfileImage ? (
            <Image
              source={
                typeof userProfileImage === 'string'
                  ? {uri: userProfileImage}
                  : userProfileImage
              }
              style={styles.avatar}
              onError={e =>
                console.log('Avatar loading error:', e.nativeEvent.error)
              }
            />
          ) : (
            <Avatar
              titleStyle={styles.titleStyle}
              title={getUsernameForLogo(post.user.username || 'Anonymous')}
              activeOpacity={0.7}
            />
          )}
          <Text style={[styles.username]}>{post.user.username}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowOptions(true)}>
          <Icon
            name="more-horizontal"
            size={24}
            color={isDark ? 'white' : 'black'}
          />
        </TouchableOpacity>
      </View>
      {/* Make the post content clickable to open the full post modal */}
      <TouchableWithoutFeedback onPress={handleOpenFullPost}>
        <View>{renderMedia()}</View>
      </TouchableWithoutFeedback>
      <View style={styles.postActions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            onPress={handleLikePost}
            style={styles.actionButton}>
            <AntDesign
              name={isLiked ? 'heart' : 'hearto'}
              size={24}
              color={isLiked ? 'red' : isDark ? 'white' : 'black'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowComments(true)}>
            <MaterialIcons
              name="comment"
              size={24}
              color={isDark ? 'white' : 'black'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMessageUser}>
            <Icon name="send" size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSavePost} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator
              size="small"
              color={isDark ? 'white' : '#2379C2'}
            />
          ) : (
            <MaterialIcons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={26}
              color={isSaved ? primaryColor : isDark ? 'white' : 'black'}
            />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.postFooter}>
        <Text style={[styles.likes]}>{post.likes} likes</Text>
        <TouchableWithoutFeedback onPress={handleOpenFullPost}>
          <View style={styles.captionContainer}>
            <Text
              style={[styles.caption]}
              numberOfLines={3}
              ellipsizeMode="tail">
              <Text style={[styles.username]} numberOfLines={1}>
                {post.user.username + ' '.repeat(2)}
              </Text>
              {formattedDescription || post.description}
            </Text>
          </View>
        </TouchableWithoutFeedback>

        {post.commentsList && post.commentsList.length > 0 && (
          <TouchableOpacity
            style={styles.viewCommentsButton}
            onPress={() => setShowComments(true)}>
            <Text style={styles.viewAllComments}>
              View all {post.comments} comments
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.timestamp}>{post.timestamp}</Text>
      </View>

      <CommentModal
        visible={showComments}
        onClose={() => setShowComments(false)}
        comments={post.commentsList || []}
        isDark={isDark}
        onAddComment={handleAddComment}
        newComment={newComment}
        setNewComment={setNewComment}
        isAddingComment={isAddingComment}
        postId={post.id}
      />
      <PostOptionsModal
        setShowOptions={setShowOptions}
        showOptions={showOptions}
        handleDeletePost={handleDeletePost}
        handleHidePost={handleHidePost}
        handleMessageUser={handleMessageUser}
        isCurrentUserPost={isCurrentUserPost}
        isDeleting={isDeleting}
        isHiding={isHiding}
        post={post}
      />
      <FullPostModal
        allMedia={allMedia}
        currentMediaIndex={currentImageIndex}
        handleLikePost={handleLikePost}
        handleMessageUser={handleMessageUser}
        handleSavePost={handleSavePost}
        imageHeight={imageHeight}
        isLiked={isLiked}
        isSaved={isSaved}
        isSaving={isSaving}
        post={post}
        renderImageContent={renderImageContent}
        renderVideoContent={renderVideoContent}
        screenWidth={screenWidth}
        setShowComments={setShowComments}
        setShowFullPostModal={setShowFullPostModal}
        showFullPostModal={showFullPostModal}
        formattedDescription={formattedDescription}
        userProfileImage={post.user.image}
      />
    </Animated.View>
  );
};

export default Post;
