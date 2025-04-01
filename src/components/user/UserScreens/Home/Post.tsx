import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Image, TouchableOpacity, Modal, TouchableWithoutFeedback, Dimensions, Animated, StyleSheet, FlatList, Text, ScrollView, ImageURISource, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import { PostType } from '../../../../types/post';
import { useTypedSelector } from '../../../../hooks/useTypedSelector';
import { primaryColor } from '../../../../res/strings/eng';
import CommentModal from './CommentModal';

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

const Post: React.FC<PostProps> = ({ post, isVisible = false }) => {
    const isDark = useTypedSelector((state) => state.user.theme) === "dark";
    const screenWidth = Dimensions.get('window').width;
    const [isLiked, setIsLiked] = useState(false);
    const [imageHeight, setImageHeight] = useState(300);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showOptions, setShowOptions] = useState(false);
    const [isPaused, setIsPaused] = useState(!isVisible);
    const [showDots, setShowDots] = useState(true);
    const [showComments, setShowComments] = useState(false);
    const videoRef = useRef<Video>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const dotsAnim = useRef(new Animated.Value(0)).current;
    const controlsTimeout = useRef<NodeJS.Timeout>();
    const dotsTimeout = useRef<NodeJS.Timeout>();
    const lastPosition = useRef(0);

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

        // Calculate image height based on first image
        const firstImage = post.postImages?.[0] || post.postImage;
        if (firstImage) {
            if (typeof firstImage === 'number') {
                // Local image
                const imageSource = Image.resolveAssetSource(firstImage);
                if (imageSource) {
                    const { width, height } = imageSource;
                    const screenWidth = Dimensions.get('window').width - 24;
                    const scaledHeight = (height / width) * screenWidth;
                    setImageHeight(scaledHeight || 300);
                }
            } else {
                // Remote image
                const imageUri = (firstImage as ImageURISource).uri;
                if (imageUri) {
                    Image.getSize(imageUri, (width, height) => {
                        const screenWidth = Dimensions.get('window').width - 24;
                        const scaledHeight = (height / width) * screenWidth;
                        setImageHeight(scaledHeight || 300);
                    }, (error) => {
                        console.error('Error getting image size:', error);
                        setImageHeight(300); // Fallback height
                    });
                }
            }
        }

        return () => {
            if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
            if (dotsTimeout.current) clearTimeout(dotsTimeout.current);
        };
    }, [post.postImages, post.postImage, fadeAnim]);

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
        if (post.isVideo && post.postVideo) {
            return (
                <View style={styles.mediaContainer}>
                    <TouchableWithoutFeedback onPress={handleVideoPress}>
                        <View style={{ width: screenWidth - 24, height: imageHeight }}>
                            <Video
                                ref={videoRef}
                                source={typeof post.postVideo === 'number' ? post.postVideo : { uri: post.postVideo as string }}
                                style={[styles.postImage, { width: '100%', height: '100%' }]}
                                resizeMode="cover"
                                paused={isPaused}
                                repeat
                                onProgress={handleVideoProgress}
                            />
                            {isPaused && (
                                <View style={styles.pausedOverlay} />
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            );
        }

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
                        const source = typeof image === 'number' ? image : { uri: (image as ImageURISource).uri };
                        return (
                            <TouchableWithoutFeedback
                                key={index}
                                onPress={handleMediaTouch}
                            >
                                <Image
                                    source={source}
                                    style={[styles.postImage, { width: screenWidth - 24, height: imageHeight || 300 }]}
                                    resizeMode="cover"
                                    onError={(error) => console.error('Image loading error:', error.nativeEvent.error)}
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
                                onPress={() => {
                                    // Handle follow/unfollow
                                    setShowOptions(false);
                                }}
                            >
                                <Icon name="user-plus" size={24} color={isDark ? "white" : "black"} />
                                <Text style={[styles.optionText, { color: isDark ? "white" : "black" }]}>Follow @{post.user.username}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={() => {
                                    // Handle mute
                                    setShowOptions(false);
                                }}
                            >
                                <Icon name="bell-off" size={24} color={isDark ? "white" : "black"} />
                                <Text style={[styles.optionText, { color: isDark ? "white" : "black" }]}>Mute @{post.user.username}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={() => {
                                    // Handle hide
                                    setShowOptions(false);
                                }}
                            >
                                <Icon name="eye-off" size={24} color={isDark ? "white" : "black"} />
                                <Text style={[styles.optionText, { color: isDark ? "white" : "black" }]}>Hide this post</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={() => {
                                    // Handle about this account
                                    setShowOptions(false);
                                }}
                            >
                                <Icon name="info" size={24} color={isDark ? "white" : "black"} />
                                <Text style={[styles.optionText, { color: isDark ? "white" : "black" }]}>About this account</Text>
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
                    <Image source={post.user.image} style={styles.avatar} />
                    <Text style={[styles.username, { color: isDark ? "white" : "black" }]}>{post.user.username}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowOptions(true)}>
                    <Icon name="more-horizontal" size={24} color={isDark ? "white" : "black"} />
                </TouchableOpacity>
            </View>
            {renderMedia()}
            <View style={styles.postActions}>
                <View style={styles.leftActions}>
                    <TouchableOpacity onPress={() => setIsLiked(!isLiked)} style={styles.actionButton}>
                        <AntDesign name={isLiked ? "heart" : "hearto"} size={24} color={isLiked ? "red" : (isDark ? "white" : "black")} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <MaterialIcons name="comment" size={24} color={isDark ? "white" : "black"} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Icon name="send" size={24} color={isDark ? "white" : "black"} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity>
                    <Icon name="bookmark" size={24} color={isDark ? "white" : "black"} />
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
});