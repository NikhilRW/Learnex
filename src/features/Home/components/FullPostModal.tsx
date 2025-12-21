import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Modal,
  Animated,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { primaryColor } from 'shared/res/strings/eng';
import { getUsernameForLogo } from 'shared/helpers/common/stringHelpers';
import { Avatar } from 'react-native-elements';
import { useTheme } from 'hooks/common/useTheme';
import { PostType } from 'shared/types/post';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createStyles } from '@/features/Home/styles/Post';

type FullPostModalProps = {
  currentMediaIndex: number;
  allMedia: {
    type: string;
    source: string | number;
  }[];
  renderImageContent: (source: any, isFullModal: boolean) => React.ReactNode;
  renderVideoContent: (source: any) => React.ReactNode;

  // Modal control
  showFullPostModal: boolean;
  setShowFullPostModal: React.Dispatch<React.SetStateAction<boolean>>;

  // Comment modal control
  setShowComments: React.Dispatch<React.SetStateAction<boolean>>;

  // Post data
  post: PostType;
  userProfileImage?: string;

  // Actions
  handleLikePost: () => Promise<void>;
  handleMessageUser: () => void;
  handleSavePost: () => void;

  // State flags
  isLiked: boolean;
  isSaved: boolean;
  isSaving: boolean;

  // Layout
  screenWidth: number;
  imageHeight: number;

  // Helpers
  formattedDescription?: React.ReactNode;
};

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
  screenWidth,
  setShowComments,
  setShowFullPostModal,
  showFullPostModal,
  formattedDescription,
  userProfileImage,
}: FullPostModalProps) => {
  // Create local state for modal media navigation to prevent affecting the main feed
  const [modalMediaIndex, setModalMediaIndex] = useState(currentMediaIndex);
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

  // Reset modal media index when the modal opens
  useEffect(() => {
    if (showFullPostModal) {
      setModalMediaIndex(currentMediaIndex);
    }
  }, [showFullPostModal, currentMediaIndex]);

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
    const bgColor = (index: number) =>
      index === modalMediaIndex ? '#fff' : 'rgba(255, 255, 255, 0.5)';

    return (
      <View style={styles.paginationDots}>
        {allMedia.map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: bgColor(index),
              },
            ]}
          />
        ))}
      </View>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMedia, modalMediaIndex]);

  const styles = createStyles(isDark);

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
            <View
              style={{
                width: screenWidth,
                height: imageHeight,
                ...styles.mediaContent,
              }}>
              {currentMediaContent}
            </View>

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
              <Text style={[styles.fullPostDescription]}>
                {formattedDescription || post.description}
              </Text>
            </View>

            <Text style={styles.timestamp}>{post.timestamp}</Text>

            {post.commentsList && post.commentsList.length > 0 && (
              <View style={[styles.fullPostCommentsSection]}>
                <View style={styles.commentsHeaderContainer}>
                  <Text style={[styles.commentsHeader]}>
                    Comments ({post.comments})
                  </Text>
                  <TouchableOpacity
                    onPress={handleCommentButtonInModal}
                    style={styles.viewAllCommentsButton}>
                    <Text style={{ color: primaryColor }}>View all</Text>
                  </TouchableOpacity>
                </View>

                {/* Show just a few comments in the modal */}
                {post.commentsList.slice(0, 3).map((comment, index) => (
                  <View
                    key={index}
                    style={[
                      styles.commentItem,
                      index < Math.min(post.commentsList?.length || 0, 3) - 1 &&
                      {},
                    ]}>
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
                        <Text style={[styles.commentUsername]}>
                          {comment.username || 'Anonymous'}{' '}
                        </Text>
                        {comment.text}
                      </Text>
                      <View style={styles.commentMeta}>
                        <Text style={[styles.commentTimestamp]}>
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
