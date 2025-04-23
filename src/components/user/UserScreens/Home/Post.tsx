import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Image, TouchableOpacity, Modal, TouchableWithoutFeedback, Dimensions, Animated, StyleSheet, FlatList, Text, ScrollView, ImageURISource, NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import { PostType } from '../../../../types/post';
import { useTypedSelector } from '../../../../hooks/useTypedSelector';
import { primaryColor } from '../../../../res/strings/eng';
import CommentModal from './CommentModal';
import { getUsernameForLogo } from '../../../../helpers/stringHelpers';
import { Avatar } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { MessageService } from '../../../../service/firebase/MessageService';
import Snackbar from 'react-native-snackbar';
import { UserStackParamList } from '../../../../routes/UserStack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import firestore from '@react-native-firebase/firestore';

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

const Post: React.FC<PostProps> = ({ post, isVisible = false }) => {
    post
    const isDark = useTypedSelector((state) => state.user.theme) === "dark";
    const screenWidth = Dimensions.get('window').width;
    const [isLiked, setIsLiked] = useState(post.isLiked || false);
    const [imageHeight, setImageHeight] = useState(300);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showOptions, setShowOptions] = useState(false);
    const [isPaused, setIsPaused] = useState(!isVisible);
    const [showDots, setShowDots] = useState(true);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const videoRef = useRef<Video>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const dotsAnim = useRef(new Animated.Value(0)).current;
    const controlsTimeout = useRef<NodeJS.Timeout>();
    const dotsTimeout = useRef<NodeJS.Timeout>();
    const lastPosition = useRef(0);
    const firebase = useTypedSelector(state => state.firebase.firebase);
    const navigation = useNavigation<UserNavigation>();
    const messageService = new MessageService();
    const [isHiding, setIsHiding] = useState(false);
    const [isSaved, setIsSaved] = useState(post.isSaved === true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCurrentUserPost, setIsCurrentUserPost] = useState(false);
    const [formattedDescription, setFormattedDescription] = useState<React.ReactNode>(null);
    const [userProfileImage, setUserProfileImage] = useState<string | null>(post.user.image);

    // Add new state for mixed media navigation
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    // Combine all media (images and video) into a single array for navigation
    const allMedia = React.useMemo(() => {
        const mediaArray = [];

        // Add video if it exists
        if (post.postVideo) {
            mediaArray.push({
                type: 'video',
                source: post.postVideo
            });
        }

        // Add images if they exist
        if (post.postImages && post.postImages.length > 0) {
            post.postImages.forEach(image => {
                mediaArray.push({
                    type: 'image',
                    source: image
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
            const currentUser = firebase.currentUser();
            if (currentUser && post.user.id === currentUser.uid) {
                setIsCurrentUserPost(true);
            }
        };

        checkCurrentUser();
    }, [firebase, post.user.id]);

    // Listen for profile image updates
    useEffect(() => {
        if (!post.user.id) return;

        const unsubscribe = firestore()
            .collection('users')
            .doc(post.user.id)
            .onSnapshot(snapshot => {
                if (snapshot.exists) {
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
            useNativeDriver: true
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
                    const { width, height } = imageSource;
                    const screenWidth = Dimensions.get('window').width - 24;
                    const scaledHeight = (height / width) * screenWidth;
                    setImageHeight(scaledHeight || (post.isVertical ? 480 : 300));
                }
            } else {
                // Remote image
                const imageUri = typeof firstImage === 'string' ? firstImage :
                    (firstImage as ImageURISource).uri;
                if (imageUri) {
                    Image.getSize(imageUri, (width, height) => {
                        const screenWidth = Dimensions.get('window').width;
                        const scaledHeight = (height / width) * screenWidth;
                        setImageHeight(scaledHeight || (post.isVertical ? 480 : 300));
                    }, (error) => {
                        console.error('Error getting image size:', error);
                        // Fallback to orientation-based height
                        setImageHeight(post.isVertical ? 480 : 300);
                    });
                }
            }
        }

        return () => {
            if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
            if (dotsTimeout.current) clearTimeout(dotsTimeout.current);
        };
    }, [post.postImages, post.postImage, post.isVertical, fadeAnim, screenWidth]);

    const handleVideoProgress = useCallback((progress: VideoProgress) => {
        lastPosition.current = progress.currentTime;
    }, []);

    const handleVideoPress = () => {
        setIsPaused(prevState => !prevState);
        handleMediaTouch();
    };

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffset / (screenWidth - 14));
        setCurrentImageIndex(index);
    }, [screenWidth]);

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
                return renderImageContent(post.postImages[0], 0);
            }
        }

        // For multiple media items (either multiple images or video + images)
        return (
            <View style={[styles.mediaContainer]}>
                {/* Current media item (video or image) */}
                {allMedia[currentMediaIndex].type === 'video'
                    ? renderVideoContent(allMedia[currentMediaIndex].source)
                    : renderImageContent(allMedia[currentMediaIndex].source, currentMediaIndex)}

                {/* Navigation buttons */}
                {showDots && allMedia.length > 1 && (
                    <>
                        {/* Previous button */}
                        {currentMediaIndex > 0 && (
                            <TouchableOpacity
                                style={[styles.navButton, styles.prevButton]}
                                onPress={goToPreviousMedia}
                            >
                                <Icon name="chevron-left" size={30} color="white" />
                            </TouchableOpacity>
                        )}

                        {/* Next button */}
                        {currentMediaIndex < allMedia.length - 1 && (
                            <TouchableOpacity
                                style={[styles.navButton, styles.nextButton]}
                                onPress={goToNextMedia}
                            >
                                <Icon name="chevron-right" size={30} color="white" />
                            </TouchableOpacity>
                        )}

                        {/* Pagination dots */}
                        <View style={styles.paginationDots}>
                            {allMedia.map((_, index) => (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        {
                                            backgroundColor: index === currentMediaIndex ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                                            width: 6,
                                            height: 6,
                                            margin: 4,
                                            borderRadius: 3
                                        }
                                    ]}
                                />
                            ))}
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
            source = videoSource;
        } else if (typeof videoSource === 'string') {
            source = { uri: videoSource };
        } else if (videoSource && typeof videoSource === 'object') {
            const videoObject = videoSource as { uri?: string };
            if (videoObject.uri) {
                source = { uri: videoObject.uri };
            } else {
                console.error('Video object has no URI property:', videoSource);
                return <View style={styles.errorContainer}><Text>Invalid video format</Text></View>;
            }
        } else {
            console.error('Video has invalid format:', videoSource);
            return <View style={styles.errorContainer}><Text>Invalid video format</Text></View>;
        }

        return (
            <TouchableWithoutFeedback onPress={handleVideoPress}>
                <View style={{
                    width: screenWidth - 24,
                    height: imageHeight,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#000',
                    padding: 0,
                    margin: 0
                }}>
                    <Video
                        ref={videoRef}
                        source={source}
                        style={[
                            styles.postImage,
                            post.isVertical
                                ? { width: '100%', height: '100%' }
                                : { width: '100%', height: '100%', }
                        ]}
                        resizeMode={post.isVertical ? "cover" : "contain"}
                        paused={isPaused}
                        repeat
                        onProgress={handleVideoProgress}
                        onError={(error) => console.error('Video loading error:', error)}
                    />
                    {isPaused && (
                        <View style={styles.pausedOverlay} />
                    )}
                </View>
            </TouchableWithoutFeedback>
        );
    };

    // Helper function to render image content
    const renderImageContent = (imageSource: any, index: number) => {
        let source;
        if (typeof imageSource === 'number') {
            source = imageSource;
        } else if (typeof imageSource === 'string') {
            source = { uri: imageSource };
        } else if (imageSource && typeof imageSource === 'object' && 'uri' in imageSource) {
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
                            width: "100%",
                            height: imageHeight || (post.isVertical ? 480 : 300)
                        }
                    ]}
                    resizeMode={post.isVertical ? "cover" : "contain"}
                    onError={(error) => console.error('Image loading error for source', source, ':', error.nativeEvent.error)}
                />
            </TouchableWithoutFeedback>
        );
    };

    const handleMessageUser = async () => {
        try {
            const currentUser = firebase.currentUser();
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
            const conversation = await messageService.getOrCreateConversation(currentUser.uid, post.user.id);

            // Dismiss loading indicator
            Snackbar.dismiss();
            // Navigate to chat with proper typing
            navigation.navigate('Chat', {
                conversationId: conversation.id,
                recipientId: post.user.id,
                recipientName: post.user.username,
                recipientPhoto: post.user.image,
                isQrInitiated: false
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

            const currentUser = firebase.currentUser();
            if (!currentUser) {
                Snackbar.show({
                    text: 'You must be logged in to comment',
                    duration: Snackbar.LENGTH_LONG,
                    textColor: 'white',
                    backgroundColor: '#ff3b30',
                });
                return;
            }

            // Call firebase service to add comment
            const result = await firebase.posts.addComment(post.id, newComment.trim());

            if (result.success) {
                // Update UI immediately with the new comment
                if (result.comment) {
                    // Add the new comment to the post's comment list
                    const updatedCommentsList = [...(post.commentsList || []), result.comment];

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

            const result = await firebase.posts.hidePost(post.id);

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
            // Call Firebase service to save/unsave the post
            const result = await firebase.posts.savePost(post.id);

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

            // Delete the post using the firebase posts module
            const result = await firebase.posts.deletePost(post.id);

            // Dismiss loading indicator and show success/error message
            Snackbar.dismiss();

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
                    text: result.error || 'Failed to delete post',
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

    const PostOptionsModal = () => (
        <Modal
            animationType="fade"
            transparent={true}
            visible={showOptions}
            onRequestClose={() => setShowOptions(false)}
        >
            <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={[
                            styles.modalContent,
                            { backgroundColor: isDark ? '#2a2a2a' : 'white' }
                        ]}>
                            {isCurrentUserPost ? (
                                // Show only delete option for the user's own post
                                <TouchableOpacity
                                    style={styles.optionItem}
                                    onPress={handleDeletePost}
                                    disabled={isDeleting}
                                >
                                    <Icon name="trash-2" size={24} color={isDark ? "#ff3b30" : "#ff3b30"} />
                                    <Text style={[
                                        styles.optionText,
                                        { color: isDark ? "#ff3b30" : "#ff3b30" }
                                    ]}>
                                        {isDeleting ? 'Deleting post...' : 'Delete Post'}
                                    </Text>
                                    {isDeleting && (
                                        <ActivityIndicator size="small" color={isDark ? "white" : "#2379C2"} style={{ marginLeft: 8 }} />
                                    )}
                                </TouchableOpacity>
                            ) : (
                                // Show normal options for other users' posts
                                <>
                                    <TouchableOpacity
                                        style={styles.optionItem}
                                        onPress={handleMessageUser}
                                    >
                                        <Icon name="message-circle" size={24} color={isDark ? "white" : "black"} />
                                        <Text style={[styles.optionText, { color: isDark ? "white" : "black" }]}>Message @{post.user.username}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.optionItem}
                                        onPress={handleHidePost}
                                        disabled={isHiding}
                                    >
                                        <Icon name="eye-off" size={24} color={isDark ? "white" : "black"} />
                                        <Text style={[styles.optionText, { color: isDark ? "white" : "black" }]}>
                                            {isHiding ? 'Hiding post...' : 'Hide this post'}
                                        </Text>
                                        {isHiding && (
                                            <ActivityIndicator size="small" color={isDark ? "white" : "#2379C2"} style={{ marginLeft: 8 }} />
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );

    useEffect(() => {
        const checkPostSavedStatus = async () => {
            try {
                // We need to fetch the actual saved status from Firestore
                const currentUser = firebase.currentUser();
                if (!currentUser) return;

                const userRef = firestore().collection('users').doc(currentUser.uid);
                const userDoc = await userRef.get();

                if (userDoc.exists) {
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

            // Send request to backend
            const result = await firebase.posts.likePost(post.id);

            if (!result.success) {
                // Revert UI changes if request failed
                setIsLiked(!newIsLiked);
                post.likes -= likesChange;

                // Show error to user
                Snackbar.show({
                    text: result.error || 'Failed to update like status',
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
                const tag = part.slice(1); // Remove the # character
                return (
                    <Text
                        key={index}
                        style={[styles.hashtag, { color: isDark ? '#2379C2' : '#0095f6' }]}
                        onPress={() => handleHashtagPress(tag)}
                    >
                        {part}
                    </Text>
                );
            }
            return <Text key={index}>{part}</Text>;
        });

        setFormattedDescription(formattedParts);
    };

    // Handle hashtag press
    const handleHashtagPress = (tag: string) => {
        // Navigate to hashtag results or trigger filtering
        // Example navigation:
        // navigation.navigate('HashtagResults', { tag });
    };

    const [showFullPostModal, setShowFullPostModal] = useState(false);

    // Function to handle opening the full post details modal
    const handleOpenFullPost = () => {
        setShowFullPostModal(true);
    };

    // Update the FullPostModal component to memoize media content and improve scrolling
    const FullPostModal = () => {
        // Create local state for modal media navigation to prevent affecting the main feed
        const [modalMediaIndex, setModalMediaIndex] = useState(currentMediaIndex);

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
                return renderImageContent(media.source, modalMediaIndex);
            }
        }, [modalMediaIndex, allMedia]);

        // Memoize pagination dots
        const paginationDots = React.useMemo(() => {
            if (allMedia.length <= 1) return null;

            return (
                <View style={styles.paginationDots}>
                    {allMedia.map((_, index) => (
                        <Animated.View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: index === modalMediaIndex ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                                    width: 6,
                                    height: 6,
                                    margin: 4,
                                    borderRadius: 3
                                }
                            ]}
                        />
                    ))}
                </View>
            );
        }, [allMedia, modalMediaIndex]);

        return (
            <Modal
                animationType="slide"
                transparent={false}
                visible={showFullPostModal}
                onRequestClose={() => setShowFullPostModal(false)}
                statusBarTranslucent={false}
            >
                <SafeAreaView style={[
                    styles.fullPostModalContainer,
                    { backgroundColor: isDark ? '#1a1a1a' : 'white' }
                ]}>
                    <View style={[
                        styles.fullPostHeader,
                        { borderBottomColor: isDark ? '#333333' : '#f0f0f0' }
                    ]}>
                        <View style={styles.userInfo}>
                            {userProfileImage ? (
                                <Image
                                    source={
                                        typeof userProfileImage === 'string'
                                            ? { uri: userProfileImage }
                                            : userProfileImage
                                    }
                                    style={[styles.avatar]}
                                    onError={(e) => console.log('Avatar loading error:', e.nativeEvent.error)}
                                />
                            ) : (
                                <Avatar
                                    titleStyle={{
                                        textAlign: 'center',
                                        fontFamily: 'Kufam-Thin'
                                    }}
                                    title={getUsernameForLogo(post.user.username || 'Anonymous')}
                                    activeOpacity={0.7}
                                />
                            )}
                            <Text style={[styles.username, { color: isDark ? "white" : "black" }]}>{post.user.username}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowFullPostModal(false)}
                            style={styles.closeButton}
                        >
                            <AntDesign name="close" size={24} color={isDark ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.fullPostScrollView}
                        showsVerticalScrollIndicator={true}
                        persistentScrollbar={true}
                        alwaysBounceVertical={true}
                        indicatorStyle={isDark ? "white" : "black"}
                        bounces={true}
                        bouncesZoom={true}
                        scrollEventThrottle={16}
                        decelerationRate="normal"
                        contentContainerStyle={styles.fullPostScrollContent}
                    >
                        <View style={styles.fullPostMediaContainer}>
                            {/* Render the memoized media content to prevent re-renders */}
                            <View style={{
                                width: screenWidth,
                                height: imageHeight,
                                backgroundColor: '#000',
                                padding: 0,
                                margin: 0
                            }}>
                                {currentMediaContent}
                            </View>

                            {allMedia.length > 1 && (
                                <>
                                    {modalMediaIndex > 0 && (
                                        <TouchableOpacity
                                            style={[styles.navButton, styles.prevButton]}
                                            onPress={goToPreviousMediaInModal}
                                            hitSlop={{ top: 20, bottom: 20, left: 20, right: 10 }}
                                        >
                                            <Icon name="chevron-left" size={30} color="white" />
                                        </TouchableOpacity>
                                    )}

                                    {modalMediaIndex < allMedia.length - 1 && (
                                        <TouchableOpacity
                                            style={[styles.navButton, styles.nextButton]}
                                            onPress={goToNextMediaInModal}
                                            hitSlop={{ top: 20, bottom: 20, left: 10, right: 20 }}
                                        >
                                            <Icon name="chevron-right" size={30} color="white" />
                                        </TouchableOpacity>
                                    )}

                                    {paginationDots}
                                </>
                            )}
                        </View>

                        <View style={[
                            styles.fullPostActions,
                            { borderBottomColor: isDark ? '#333333' : '#f0f0f0' }
                        ]}>
                            <View style={styles.leftActions}>
                                <TouchableOpacity onPress={handleLikePost} style={styles.actionButton}>
                                    <AntDesign name={isLiked ? "heart" : "hearto"} size={24} color={isLiked ? "red" : (isDark ? "white" : "black")} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton} onPress={handleCommentButtonInModal}>
                                    <MaterialIcons name="comment" size={24} color={isDark ? "white" : "black"} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton} onPress={handleMessageUser}>
                                    <Icon name="send" size={24} color={isDark ? "white" : "black"} />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={handleSavePost} disabled={isSaving}>
                                {isSaving ? (
                                    <ActivityIndicator size="small" color={isDark ? "white" : "#2379C2"} />
                                ) : (
                                    <MaterialIcons
                                        name={isSaved ? "bookmark" : "bookmark-outline"}
                                        size={26}
                                        color={isSaved ? primaryColor : (isDark ? "white" : "black")}
                                    />
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.fullPostContentContainer}>
                            <Text style={[styles.likes, { color: isDark ? "white" : "black" }]}>{post.likes} likes</Text>

                            <View style={styles.fullPostDescriptionContainer}>
                                <Text style={[styles.username, { color: isDark ? "white" : "black", marginRight: 6 }]} numberOfLines={1}>
                                    {post.user.username}
                                </Text>
                                <Text style={[styles.fullPostDescription, { color: isDark ? "#e0e0e0" : "#2c2c2c" }]}>
                                    {formattedDescription || post.description}
                                </Text>
                            </View>

                            <Text style={[styles.timestamp, { color: isDark ? "#8e8e8e" : "#666666" }]}>{post.timestamp}</Text>

                            {post.commentsList && post.commentsList.length > 0 && (
                                <View style={[
                                    styles.fullPostCommentsSection,
                                    { borderTopColor: isDark ? '#333333' : '#f0f0f0' }
                                ]}>
                                    <View style={styles.commentsHeaderContainer}>
                                        <Text style={[styles.commentsHeader, { color: isDark ? "white" : "black" }]}>
                                            Comments ({post.comments})
                                        </Text>
                                        <TouchableOpacity
                                            onPress={handleCommentButtonInModal}
                                            style={styles.viewAllCommentsButton}
                                        >
                                            <Text style={{ color: primaryColor }}>View all</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Show just a few comments in the modal */}
                                    {post.commentsList.slice(0, 3).map((comment, index) => (
                                        <View key={index} style={[
                                            styles.commentItem,
                                            index < Math.min((post.commentsList?.length || 0), 3) - 1 && {
                                                borderBottomWidth: 0.5,
                                                borderBottomColor: isDark ? '#333333' : '#f0f0f0',
                                                paddingBottom: 10,
                                                marginBottom: 10
                                            }
                                        ]}>
                                            <Image
                                                source={
                                                    comment.userImage
                                                        ? { uri: comment.userImage }
                                                        : { uri: "https://avatar.iran.liara.run/username?username=" + encodeURIComponent(comment.username || 'Anonymous') }
                                                }
                                                style={styles.commentAvatar}
                                            />
                                            <View style={styles.commentContent}>
                                                <Text style={[styles.commentText, { color: isDark ? "#e0e0e0" : "#2c2c2c" }]}>
                                                    <Text style={[styles.commentUsername, { color: isDark ? "white" : "black" }]}>
                                                        {comment.username || 'Anonymous'}{' '}
                                                    </Text>
                                                    {comment.text}
                                                </Text>
                                                <View style={styles.commentMeta}>
                                                    <Text style={[styles.commentTimestamp, { color: isDark ? "#8e8e8e" : "#666666" }]}>
                                                        {comment.timestamp || ''}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))}

                                    {post.commentsList.length > 3 && (
                                        <TouchableOpacity
                                            onPress={handleCommentButtonInModal}
                                            style={[styles.viewCommentsButton, { alignSelf: 'center', marginTop: 10 }]}
                                        >
                                            <Text style={{ color: primaryColor, textAlign: 'center' }}>
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

    return (
        <Animated.View
            key={post.id}
            style={[
                styles.postContainer,
                { opacity: fadeAnim },
                { backgroundColor: isDark ? '#1a1a1a' : 'white' }
            ]}
        >
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    {
                        userProfileImage ? (<Image
                            source={
                                typeof userProfileImage === 'string'
                                    ? { uri: userProfileImage }
                                    : userProfileImage
                            }
                            style={styles.avatar}
                            onError={(e) => console.log('Avatar loading error:', e.nativeEvent.error)}
                        />) : (
                            <Avatar
                                titleStyle={{
                                    textAlign: 'center',
                                    fontFamily: 'Kufam-Thin'
                                }}
                                title={getUsernameForLogo(post.user.username || 'Anonymous')}
                                activeOpacity={0.7}
                            />
                        )
                    }
                    <Text style={[styles.username, { color: isDark ? "white" : "black" }]}>{post.user.username}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowOptions(true)}>
                    <Icon name="more-horizontal" size={24} color={isDark ? "white" : "black"} />
                </TouchableOpacity>
            </View>
            {/* Make the post content clickable to open the full post modal */}
            <TouchableWithoutFeedback onPress={handleOpenFullPost}>
                <View>
                    {renderMedia()}
                </View>
            </TouchableWithoutFeedback>
            <View style={styles.postActions}>
                <View style={styles.leftActions}>
                    <TouchableOpacity onPress={handleLikePost} style={styles.actionButton}>
                        <AntDesign name={isLiked ? "heart" : "hearto"} size={24} color={isLiked ? "red" : (isDark ? "white" : "black")} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => setShowComments(true)}>
                        <MaterialIcons name="comment" size={24} color={isDark ? "white" : "black"} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleMessageUser}>
                        <Icon name="send" size={24} color={isDark ? "white" : "black"} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleSavePost} disabled={isSaving}>
                    {isSaving ? (
                        <ActivityIndicator size="small" color={isDark ? "white" : "#2379C2"} />
                    ) : (
                        <MaterialIcons
                            name={isSaved ? "bookmark" : "bookmark-outline"}
                            size={26}
                            color={isSaved ? primaryColor : (isDark ? "white" : "black")}
                        />
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.postFooter}>
                <Text style={[styles.likes, { color: isDark ? "white" : "black" }]}>{post.likes} likes</Text>
                <TouchableWithoutFeedback onPress={handleOpenFullPost}>
                    <View style={styles.captionContainer}>
                        <Text style={[styles.caption, { color: isDark ? "#e0e0e0" : "#2c2c2c" }]} numberOfLines={3} ellipsizeMode="tail">
                            <Text style={[styles.username, { color: isDark ? "white" : "black" }]} numberOfLines={1}>{post.user.username + " ".repeat(2)}</Text>
                            {formattedDescription || post.description}
                        </Text>
                    </View>
                </TouchableWithoutFeedback>

                {post.commentsList && post.commentsList.length > 0 && (
                    <TouchableOpacity
                        style={styles.viewCommentsButton}
                        onPress={() => setShowComments(true)}
                    >
                        <Text style={[
                            styles.viewAllComments,
                            { color: isDark ? "#8e8e8e" : "#666666" }
                        ]}>
                            View all {post.comments} comments
                        </Text>
                    </TouchableOpacity>
                )}

                <Text style={[styles.timestamp, { color: isDark ? "#8e8e8e" : "#666666" }]}>{post.timestamp}</Text>
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
            <PostOptionsModal />
            <FullPostModal />
        </Animated.View>
    );
};

export default Post;

const styles = StyleSheet.create({
    postContainer: {
        marginBottom: 8,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 4,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 6,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    username: {
        fontWeight: '600',
        fontSize: 14,
    },
    mediaContainer: {
        position: 'relative',
    },
    carouselContainer: {
        position: 'relative',
    },
    postImage: {
        width: '100%',
        height: 300,
    },
    videoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    pausedOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    playButton: {
        opacity: 0.9,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.5,
        shadowRadius: 3.84,
    },
    paginationDots: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        margin: 4,
    },
    postActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    leftActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        marginRight: 16,
    },
    postFooter: {
        paddingHorizontal: 12,
        paddingBottom: 12,
    },
    likes: {
        fontWeight: '600',
        marginBottom: 4,
    },
    captionContainer: {
        marginBottom: 4,
    },
    caption: {
        fontSize: 14,
        lineHeight: 18,
    },
    timestamp: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: '400',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: '#CCCCCC',
    },
    optionText: {
        marginLeft: 15,
        fontSize: 16,
    },
    commentsContainer: {
        marginTop: 8,
        paddingHorizontal: 12,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'flex-start',
    },
    commentAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    commentContent: {
        flex: 1,
    },
    commentText: {
        fontSize: 13,
        lineHeight: 18,
    },
    commentUsername: {
        fontWeight: '600',
        fontSize: 13,
    },
    commentMeta: {
        flexDirection: 'row',
        marginTop: 4,
        alignItems: 'center',
    },
    commentTimestamp: {
        fontSize: 12,
        marginRight: 12,
    },
    commentLikes: {
        fontSize: 12,
    },
    viewCommentsButton: {
        paddingVertical: 8,
    },
    viewAllComments: {
        fontSize: 14,
        color: '#8e8e8e',
    },
    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f8d7da',
        width: '100%',
        height: 200,
    },
    hashtag: {
        fontWeight: '600',
        color: '#0095f6', // Default color for hashtags (used when isDark isn't available)
    },
    navButton: {
        position: 'absolute',
        top: '50%',
        transform: [{ translateY: -15 }],
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
    },
    prevButton: {
        left: 10,
    },
    nextButton: {
        right: 10,
    },
    fullPostModalContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        paddingTop: 0, // Ensure no extra padding at the top
    },
    fullPostScrollView: {
        flex: 1,
        width: '100%',
        height: '100%', // Ensure it takes full height
        marginBottom: 10, // Add margin at bottom
        overflow: 'scroll', // Force scrolling to be enabled
    },
    fullPostScrollContent: {
        flexGrow: 1,
        paddingBottom: 60, // Increase padding at the bottom for better scrolling
        minHeight: '100%',
    },
    fullPostHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 8,
        borderBottomWidth: 1,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.0,
        width: '100%',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
    },
    fullPostMediaContainer: {
        position: 'relative',
        width: '100%',
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        overflow: 'hidden',
        padding: 0,
        margin: 0,
    },
    fullPostActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        width: '100%',
    },
    fullPostContentContainer: {
        padding: 16,
        width: '100%',
    },
    fullPostDescriptionContainer: {
        marginVertical: 12,
        flexDirection: 'column',
        flexWrap: 'wrap',
        width: '100%',
    },
    fullPostDescription: {
        fontSize: 16,
        lineHeight: 22,
        width: "100%",
        textAlign: "justify",
        letterSpacing: 0.3,
    },
    fullPostCommentsSection: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        width: '100%',
    },
    commentsHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    commentsHeader: {
        fontSize: 16,
        fontWeight: '600',
    },
    viewAllCommentsButton: {
        padding: 5,
    }
});