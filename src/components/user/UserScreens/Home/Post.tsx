import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Image, TouchableOpacity, Modal, TouchableWithoutFeedback, Dimensions, Animated, StyleSheet, FlatList, Text, ScrollView, ImageURISource, NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator } from 'react-native';
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
    const [isLiked, setIsLiked] = useState(false);
    const [imageHeight, setImageHeight] = useState(300);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showOptions, setShowOptions] = useState(false);
    const [isPaused, setIsPaused] = useState(!isVisible);
    const [showDots, setShowDots] = useState(true);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isAddingComment, setIsAddingComment] = useState(false);
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
    const [isSaved, setIsSaved] = useState(post.isSaved || false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Handle video visibility changes
        if (post.isVideo) {
            setIsPaused(!isVisible);
        }
    }, [isVisible, post.isVideo]);

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
                        const screenWidth = Dimensions.get('window').width - 24;
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
        console.log('Rendering media for post:', post.id);
        console.log('isVideo:', post.isVideo, 'postVideo:', post.postVideo);
        console.log('postImages:', post.postImages);
        console.log('isVertical:', post.isVertical);

        if (post.isVideo && post.postVideo) {
            let videoSource;
            if (typeof post.postVideo === 'number') {
                videoSource = post.postVideo;
                console.log('Video is a local asset number:', post.postVideo);
            } else if (typeof post.postVideo === 'string') {
                videoSource = { uri: post.postVideo };
                console.log('Video is a string URI:', post.postVideo);
            } else if (post.postVideo && typeof post.postVideo === 'object') {
                // Safely access the uri property with proper type checking
                const videoObject = post.postVideo as { uri?: string };
                if (videoObject.uri) {
                    videoSource = { uri: videoObject.uri };
                    console.log('Video is an object with URI:', videoObject.uri);
                } else {
                    console.error('Video object has no URI property:', post.postVideo);
                    return <View style={styles.errorContainer}><Text>Invalid video format</Text></View>;
                }
            } else {
                console.error('Video has invalid format:', post.postVideo);
                return <View style={styles.errorContainer}><Text>Invalid video format</Text></View>;
            }
            console.log('Final video source:', videoSource);

            return (
                <View style={styles.mediaContainer}>
                    <TouchableWithoutFeedback onPress={handleVideoPress}>
                        <View style={{
                            width: screenWidth - 24,
                            height: imageHeight,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#000'
                        }}>
                            <Video
                                ref={videoRef}
                                source={videoSource}
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
                </View>
            );
        }

        console.log('Rendering images carousel. Images count:', post.postImages?.length || 0);
        return (
            <View style={styles.carouselContainer}>
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleScroll}
                    onScrollBeginDrag={handleMediaTouch}
                >
                    {post.postImages?.map((image, index) => {
                        let source;
                        if (typeof image === 'number') {
                            source = image;
                        } else if (typeof image === 'string') {
                            source = { uri: image };
                            console.log(`Image ${index} is a string URI:`, image);
                        } else if (image && typeof image === 'object' && 'uri' in image) {
                            source = { uri: image.uri };
                            console.log(`Image ${index} is an object with URI:`, image.uri);
                        } else {
                            console.error(`Image ${index} has invalid format:`, image);
                            return null; // Skip invalid images
                        }
                        return (
                            <TouchableWithoutFeedback
                                key={index}
                                onPress={handleMediaTouch}
                            >
                                <Image
                                    source={source}
                                    style={[
                                        styles.postImage,
                                        {
                                            width: screenWidth - 24,
                                            height: imageHeight || (post.isVertical ? 480 : 300)
                                        }
                                    ]}
                                    resizeMode={post.isVertical ? "cover" : "contain"}
                                    onError={(error) => console.error('Image loading error for source', source, ':', error.nativeEvent.error)}
                                />
                            </TouchableWithoutFeedback>
                        );
                    })}
                </ScrollView>
                {showDots && post.postImages && post.postImages.length > 1 && (
                    <View style={styles.paginationDots}>
                        {post.postImages.map((_, index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.dot,
                                    animateDot(index)
                                ]}
                            />
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const handleMessageUser = async () => {
        // Close the options modal
        setShowOptions(false);

        const currentUser = firebase.currentUser();
        if (!currentUser || !post.user.id) {
            Snackbar.show({
                text: 'Unable to message user at this time',
                duration: Snackbar.LENGTH_LONG,
                textColor: 'white',
                backgroundColor: '#ff3b30',
            });
            return;
        }

        try {
            // Show loading indicator
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
                recipientPhoto: post.user.image
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
        try {
            setIsSaving(true);

            const result = await firebase.posts.savePost(post.id);

            if (result.success) {
                setIsSaved(result.saved);

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

                            <TouchableOpacity
                                style={[styles.optionItem, { borderBottomWidth: 0 }]}
                                onPress={() => {
                                    // Handle report
                                    setShowOptions(false);
                                }}
                            >
                                <MaterialIcons name="report-problem" size={24} color="#FF3B30" />
                                <Text style={[styles.optionText, { color: "#FF3B30" }]}>Report Post</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );

    const animateDot = (index: number) => {
        const isActive = index === currentImageIndex;
        return {
            width: 8,
            height: 8,
            backgroundColor: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
            transform: [
                { scale: isActive ? 1 : 0.8 },
                {
                    translateY: dotsAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, 0]
                    })
                }
            ],
            opacity: dotsAnim,
            margin: 4,
        };
    };

    useEffect(() => {
        console.log('Post comments:', post.commentsList);
        if (!post.commentsList?.length) {
            console.log('No comments to render');
        } else {
            console.log('Comments available:', post.commentsList.length);
        }
    }, [post.commentsList]);

    useEffect(() => {
        const checkPostSavedStatus = async () => {
            try {
                // Only check with service if it's not already known
                if (post.isSaved === undefined) {
                    const saved = firebase.posts.isPostSaved(post.id);
                    setIsSaved(Boolean(saved));
                }
            } catch (error) {
                console.error('Error checking post saved status:', error);
            }
        };

        checkPostSavedStatus();
    }, [firebase.posts, post.id, post.isSaved]);

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
                <View style={styles.userInfo} onLayout={() => console.log("postimg:" + post.user.image)}>
                    {

                        post.user.image ? (<Image
                            source={
                                typeof post.user.image === 'string'
                                    ? { uri: post.user.image }
                                    : post.user.image
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
            {renderMedia()}
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
                            size={24}
                            color={isSaved ? "#2379C2" : (isDark ? "white" : "black")}
                        />
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.postFooter}>
                <Text style={[styles.likes, { color: isDark ? "white" : "black" }]}>{post.likes} likes</Text>
                <View style={styles.captionContainer}>
                    <Text style={[styles.caption, { color: isDark ? "#e0e0e0" : "#2c2c2c" }]} numberOfLines={3} ellipsizeMode="tail">
                        <Text style={[styles.username, { color: isDark ? "white" : "black" }]} numberOfLines={1}>{post.user.username + " ".repeat(2)}</Text>
                        {post.description}
                    </Text>
                </View>

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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
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
        borderRadius: 4,
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
        width: '100%',
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
    },
});