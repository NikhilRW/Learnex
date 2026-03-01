import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Video from 'react-native-video';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import CommentModal from 'home/components/CommentModal';
import { useNavigation } from '@react-navigation/native';
import { MessageService } from 'conversations/services/MessageService';
import Snackbar from 'react-native-snackbar';
import { UserStackParamList } from 'shared/navigation/routes/UserStack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  getFirestore,
  collection,
  doc,
  updateDoc,
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import PostOptionsModal from './PostOptionsModal';
import { FullPostModal } from './FullPostModal';
import { createStyles } from '../styles/Post';
import { onSnapshot } from '@react-native-firebase/firestore';

// Custom hooks for business logic
import {
  usePostLike,
  usePostSave,
  usePostMedia,
  usePostComments,
} from './Post/hooks';

// Post sub-components
import { PostHeader, PostActions, PostFooter } from './Post/index';

// Utility functions
import {
  extractHashtags,
  formatDescriptionWithHashtags,
  combineMediaArray,
} from './Post/utils/postHelpers';

import { PostProps } from '../types';

/**
 * Post component that displays a social media post with images
 * Refactored for better maintainability and separation of concerns
 */
type UserNavigation = NativeStackNavigationProp<UserStackParamList>;

const Post: React.FC<PostProps> = ({ post, isVisible = false }) => {
  // Theme and navigation
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const navigation = useNavigation<UserNavigation>();
  const messageService = new MessageService();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // UI state
  const [showOptions, setShowOptions] = useState(false);
  const [showFullPostModal, setShowFullPostModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [isCurrentUserPost, setIsCurrentUserPost] = useState(false);
  const [userProfileImage, setUserProfileImage] = useState<string | null>(
    post.user.image,
  );

  // Custom hooks for business logic
  const { isLiked, handleLikePost } = usePostLike(
    post.id,
    post.isLiked || false,
    firebase,
  );
  const { isSaved, isSaving, handleSavePost } = usePostSave(
    post.id,
    post.isSaved,
    firebase,
  );
  const {
    imageHeight,
    isPaused,
    showDots,
    currentMediaIndex,
    videoRef,
    screenWidth,
    handleVideoProgress,
    handleVideoPress,
    handleMediaTouch,
    goToPreviousMedia,
    goToNextMedia,
  } = usePostMedia(
    post.isVideo || false,
    post.isVertical || false,
    post.postImages,
    post.postImage,
    post.postVideo,
    isVisible,
  );
  const {
    showComments,
    setShowComments,
    newComment,
    setNewComment,
    isAddingComment,
    handleAddComment,
  } = usePostComments(post.id, firebase, comment => {
    const updatedCommentsList = [...(post.commentsList || []), comment];
    post.commentsList = updatedCommentsList;
    post.comments = (post.comments || 0) + 1;
  });

  const videoContainerStyle = useMemo(
    () => ({
      width: screenWidth - 24,
      height: imageHeight,
      alignItems: 'center' as 'center',
      justifyContent: 'center' as 'center',
      backgroundColor: '#000',
      padding: 0,
      margin: 0,
    }),
    [screenWidth, imageHeight],
  );

  // Combine all media for carousel
  const allMedia = React.useMemo(
    () => combineMediaArray(post.postVideo, post.postImages || []),
    [post.postVideo, post.postImages],
  );

  // Check if current user is post owner
  useEffect(() => {
    const checkCurrentUser = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser && post.user.id === currentUser.uid) {
        setIsCurrentUserPost(true);
      }
    };
    checkCurrentUser();
  }, [post.user.id]);

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

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

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
                const dotBgStyle = { backgroundColor: bgColor };
                return (
                  <Animated.View
                    key={index}
                    style={[styles.dot, dotBgStyle]}
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
      const videoObject = videoSource as { uri?: string };
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
        <View style={videoContainerStyle}>
          <Video
            ref={videoRef}
            source={{ uri: source }}
            style={styles.postImage}
            resizeMode={post.isVertical ? 'cover' : 'contain'}
            paused={isPaused}
            repeat
            onProgress={handleVideoProgress}
            onError={error => console.error('Video loading error:', error)}
          />
          {isPaused && <View style={styles.pausedOverlay} />}
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
      source = { uri: imageSource };
    } else if (
      imageSource &&
      typeof imageSource === 'object' &&
      'uri' in imageSource
    ) {
      source = { uri: imageSource.uri };
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
                ? '100%'
                : imageHeight - 12 || (post.isVertical ? 480 : 300),
            },
          ]}
          resizeMode="cover"
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

      const conversation = await messageService.getOrCreateConversation(
        currentUser.uid,
        post.user.id,
      );

      Snackbar.dismiss();
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

  const handleHidePost = async () => {
    try {
      setIsHiding(true);
      setShowOptions(false);

      const db = getFirestore();
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, { hidden: true });
      const result = { success: true };

      if (result.success) {
        Snackbar.show({
          text: 'Post hidden successfully',
          duration: Snackbar.LENGTH_SHORT,
          textColor: 'white',
          backgroundColor: '#2379C2',
        });
      } else {
        Snackbar.show({
          text: 'Failed to hide post',
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

  const handleDeletePost = async () => {
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

    setIsDeleting(true);

    try {
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

  const handleOpenFullPost = () => {
    setShowFullPostModal(true);
  };

  const styles = createStyles(isDark);

  // Process description and hashtags using imported utility functions
  const formattedDescription = React.useMemo(() => {
    const extractedTags = extractHashtags(post.description || '');
    const existingTags = post.hashtags || [];
    const allTags = [...new Set([...existingTags, ...extractedTags])];
    post.hashtags = allTags;
    const formatted = formatDescriptionWithHashtags(
      post.description || '',
      styles,
    );
    return formatted;
  }, [post, styles]);

  // Wrapper for handleLikePost
  const onLikePress = async () => {
    await handleLikePost((likesChange: number) => {
      post.likes += likesChange;
    });
  };

  const fadeStyle = { opacity: fadeAnim };

  return (
    <Animated.View key={post.id} style={[styles.postContainer, fadeStyle]}>
      <PostHeader
        username={post.user.username}
        userProfileImage={userProfileImage}
        isDark={isDark}
        onOptionsPress={() => setShowOptions(true)}
        styles={styles}
      />
      {/* Make the post content clickable to open the full post modal */}
      <TouchableWithoutFeedback onPress={handleOpenFullPost}>
        <View>{renderMedia()}</View>
      </TouchableWithoutFeedback>
      <PostActions
        isLiked={isLiked}
        isSaved={isSaved}
        isSaving={isSaving}
        isDark={isDark}
        onLikePress={onLikePress}
        onCommentPress={() => setShowComments(true)}
        onSharePress={handleMessageUser}
        onSavePress={handleSavePost}
        styles={styles}
      />
      <PostFooter
        likes={post.likes}
        username={post.user.username}
        formattedDescription={formattedDescription}
        commentsCount={post.comments}
        hasComments={!!(post.commentsList && post.commentsList.length > 0)}
        timestamp={post.timestamp}
        onViewCommentsPress={() => setShowComments(true)}
        onCaptionPress={handleOpenFullPost}
        styles={styles}
      />
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
        currentMediaIndex={currentMediaIndex}
        handleLikePost={onLikePress}
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
