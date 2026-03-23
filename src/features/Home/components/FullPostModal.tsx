import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Modal,
  Animated,
  Text,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { primaryColor } from 'shared/res/strings/eng';
import { getUsernameForLogo } from 'shared/helpers/common/stringHelpers';
import { Avatar } from 'react-native-elements';
import { useTheme } from 'hooks/common/useTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createStyles } from '@/features/Home/styles/Post';
import { FullPostModalProps } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Update the FullPostModal component to memoize media content and improve scrolling
export const FullPostModal = ({
  currentMediaIndex,
  allMedia,
  handleLikePost,
  handleMessageUser,
  handleSavePost,
  imageHeight,
  isLiked,
  isSaved,
  isSaving,
  post,
  renderImageContent,
  renderVideoContent,
  setShowComments,
  setShowFullPostModal,
  showFullPostModal,
  formattedDescription,
  userProfileImage,
}: FullPostModalProps) => {
  // Create local state for modal media navigation to prevent affecting the main feed
  const [modalMediaIndex, setModalMediaIndex] = useState(currentMediaIndex);
  const [modalImageHeight, setModalImageHeight] = useState(imageHeight);
  const { isDark } = useTheme();
  // Function to handle comment button in the modal
  const handleCommentButtonInModal = () => {
    // First close the full post modal
    setShowFullPostModal(false);

    // After a small delay, open the comments modal
    setTimeout(() => {
      setShowComments(true);
    }, 300);
  };

  // Media navigation functions that only affect the modal state
  const goToPreviousMediaInModal = useCallback(() => {
    if (modalMediaIndex > 0) {
      setModalMediaIndex(modalMediaIndex - 1);
    }
  }, [modalMediaIndex]);

  const goToNextMediaInModal = useCallback(() => {
    if (modalMediaIndex < allMedia.length - 1) {
      setModalMediaIndex(modalMediaIndex + 1);
    }
  }, [modalMediaIndex, allMedia.length]);

  // Compute proper image height for full-width modal display
  useEffect(() => {
    if (!showFullPostModal || allMedia.length === 0) return;

    const media = allMedia[modalMediaIndex];
    if (!media || media.type === 'video') {
      setModalImageHeight(imageHeight);
      return;
    }

    const source = media.source;
    let imageUri: string | undefined;

    if (typeof source === 'string') {
      imageUri = source;
    } else if (source && typeof source === 'object' && 'uri' in source) {
      imageUri = (source as any).uri;
    }

    if (imageUri) {
      Image.getSize(
        imageUri,
        (w, h) => {
          const scaledHeight = (h / w) * SCREEN_WIDTH;
          setModalImageHeight(scaledHeight);
        },
        () => setModalImageHeight(imageHeight),
      );
    } else if (typeof source === 'number') {
      const resolved = Image.resolveAssetSource(source);
      if (resolved) {
        const scaledHeight =
          (resolved.height / resolved.width) * SCREEN_WIDTH;
        setModalImageHeight(scaledHeight);
      }
    } else {
      setModalImageHeight(imageHeight);
    }
  }, [showFullPostModal, modalMediaIndex, allMedia, imageHeight]);

  // Memoize the media content to prevent re-renders
  const currentMediaContent = React.useMemo(() => {
    if (allMedia.length === 0) return null;

    const media = allMedia[modalMediaIndex];
    if (media.type === 'video') {
      return renderVideoContent(media.source);
    } else {
      return renderImageContent(media.source, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalMediaIndex, allMedia]);

  // Memoize pagination dots
  const paginationDots = React.useMemo(() => {
    if (allMedia.length <= 1) return null;

    return (
      <View style={styles.paginationDots}>
        {allMedia.map((mediaItem, index) => {
          const dotBgColor =
            index === modalMediaIndex ? '#fff' : 'rgba(255, 255, 255, 0.5)';
          const dotBgStyle = { backgroundColor: dotBgColor };
          let mediaKey = mediaItem.type;
          if (typeof mediaItem.source === 'string') {
            mediaKey = mediaItem.source;
          } else if (typeof mediaItem.source === 'number') {
            mediaKey = `asset-${mediaItem.source}`;
          } else if (mediaItem.source && typeof mediaItem.source === 'object') {
            const mediaSource = mediaItem.source as { uri?: string };
            mediaKey = mediaSource.uri || mediaItem.type;
          }
          return (
            <Animated.View
              key={`${mediaItem.type}-${mediaKey}`}
              style={[styles.dot, dotBgStyle]}
            />
          );
        })}
      </View>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMedia, modalMediaIndex]);

  const styles = useMemo(() => createStyles(isDark) as any, [isDark]);
  const mediaContentStyle = useMemo(
    () => ({
      width: SCREEN_WIDTH,
      height: modalImageHeight,
      ...styles.mediaContent,
    }),
    [modalImageHeight, styles.mediaContent],
  );
  const viewAllStyle = useMemo(() => ({ color: primaryColor }), []);

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={showFullPostModal}
      onRequestClose={() => setShowFullPostModal(false)}
      statusBarTranslucent={false}>
      <SafeAreaView style={[styles.fullPostModalContainer]}>
        <View style={[styles.fullPostHeader]}>
          <View style={styles.userInfo}>
            {userProfileImage ? (
              <Image
                source={
                  typeof userProfileImage === 'string'
                    ? { uri: userProfileImage }
                    : userProfileImage
                }
                style={[styles.avatar]}
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
          <TouchableOpacity
            onPress={() => setShowFullPostModal(false)}
            style={styles.closeButton}>
            <AntDesign
              name="close"
              size={24}
              color={isDark ? 'white' : 'black'}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.fullPostScrollView}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          alwaysBounceVertical={true}
          indicatorStyle={isDark ? 'white' : 'black'}
          bounces={true}
          bouncesZoom={true}
          scrollEventThrottle={16}
          decelerationRate="normal"
          contentContainerStyle={styles.fullPostScrollContent}>
          <View style={styles.fullPostMediaContainer}>
            {/* Render the memoized media content to prevent re-renders */}
            <View style={mediaContentStyle}>{currentMediaContent}</View>

            {allMedia.length > 1 && (
              <>
                {modalMediaIndex > 0 && (
                  <TouchableOpacity
                    style={[styles.navButton, styles.prevButton]}
                    onPress={goToPreviousMediaInModal}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 10 }}>
                    <Icon name="chevron-left" size={30} color="white" />
                  </TouchableOpacity>
                )}

                {modalMediaIndex < allMedia.length - 1 && (
                  <TouchableOpacity
                    style={[styles.navButton, styles.nextButton]}
                    onPress={goToNextMediaInModal}
                    hitSlop={{ top: 20, bottom: 20, left: 10, right: 20 }}>
                    <Icon name="chevron-right" size={30} color="white" />
                  </TouchableOpacity>
                )}

                {paginationDots}
              </>
            )}
          </View>

          <View style={styles.fullPostActions}>
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
                onPress={handleCommentButtonInModal}>
                <MaterialIcons
                  name="comment"
                  size={24}
                  color={isDark ? 'white' : 'black'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleMessageUser}>
                <Icon
                  name="send"
                  size={24}
                  color={isDark ? 'white' : 'black'}
                />
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

          <View style={styles.fullPostContentContainer}>
            <Text style={styles.likes}>{post.likes} likes</Text>

            <View style={styles.fullPostDescriptionContainer}>
              <Text style={[styles.username, {}]} numberOfLines={1}>
                {post.user.username}
              </Text>
              <Text style={styles.fullPostDescription}>
                {formattedDescription || post.description}
              </Text>
            </View>

            <Text style={styles.timestamp}>{post.timestamp}</Text>

            {post.commentsList && post.commentsList.length > 0 && (
              <View style={styles.fullPostCommentsSection}>
                <View style={styles.commentsHeaderContainer}>
                  <Text style={styles.commentsHeader}>
                    Comments ({post.comments})
                  </Text>
                  <TouchableOpacity
                    onPress={handleCommentButtonInModal}
                    style={styles.viewAllCommentsButton}>
                    <Text style={viewAllStyle}>View all</Text>
                  </TouchableOpacity>
                </View>

                {/* Show just a few comments in the modal */}
                {post.commentsList.slice(0, 3).map(comment => (
                  <View
                    key={comment.id || `${comment.username}-${comment.timestamp}`}
                    style={styles.commentItem}>
                    <Image
                      source={
                        comment.userImage
                          ? { uri: comment.userImage }
                          : {
                            uri:
                              'https://ui-avatars.com/api/?name=' +
                              encodeURIComponent(
                                comment.username || 'Anonymous',
                              ),
                          }
                      }
                      style={styles.commentAvatar}
                    />
                    <View style={styles.commentContent}>
                      <Text style={styles.commentText}>
                        <Text style={styles.commentUsername}>
                          {comment.username || 'Anonymous'}{' '}
                        </Text>
                        {comment.text}
                      </Text>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentTimestamp}>
                          {comment.timestamp || ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}

                {post.commentsList.length > 3 && (
                  <TouchableOpacity
                    onPress={handleCommentButtonInModal}
                    style={[styles.viewCommentsButton]}>
                    <Text style={styles.viewAllComments}>
                      View all {post.comments} comments
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
