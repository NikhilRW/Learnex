import React, { useState, useRef, useEffect } from 'react';
import { View, Image, TouchableOpacity, Modal, TouchableWithoutFeedback, Dimensions, Animated, StyleSheet, ScrollView, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import { PostType } from '../../../../types/post';
import { useTypedSelector } from '../../../../hooks/useTypedSelector';
import { primaryColor } from '../../../../res/strings/eng';

/**
 * Post component that displays a social media post with images
 * Features a beautiful carousel with spring-animated pagination dots
 */

interface PostProps {
    post: PostType;
}

const Post: React.FC<PostProps> = ({ post }) => {
    const isDark = useTypedSelector((state) => state.user.theme) === "dark";
    const screenWidth = Dimensions.get('window').width;
    const [isLiked, setIsLiked] = useState(false);
    const [imageHeight, setImageHeight] = useState(300);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    const scrollViewRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const dotsAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in animation for post
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        // Calculate image height based on first image
        const firstImage = post.postImages?.[0] || post.postImage;
        if (firstImage) {
            const imageSource = Image.resolveAssetSource(firstImage);
            if (imageSource) {
                const { width, height } = imageSource;
                const screenWidth = Dimensions.get('window').width - 14;
                const scaledHeight = (height / width) * screenWidth;
                setImageHeight(scaledHeight);
            }
        }
    }, [post.postImages, post.postImage]);

    const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
        const contentOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffset / (screenWidth - 14));
        setCurrentImageIndex(index);
    };

    const handleLayout = () => {
        setIsVisible(true);
        Animated.spring(dotsAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true
        }).start();
    };

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

    const renderMedia = () => {
        const mediaItems = [];

        // Add video if present
        if (post.isVideo && post.postVideo) {
            mediaItems.push(
                <View key="video" style={styles.mediaContainer}>
                    <TouchableOpacity onPress={() => setIsPaused(!isPaused)}>
                        <Video
                            source={post.postVideo}
                            style={[styles.postImage, { width: screenWidth - 14, height: imageHeight }]}
                            resizeMode="cover"
                            paused={isPaused}
                            repeat
                        />
                        {isPaused && (
                            <View style={styles.playButton}>
                                <Icon name="play-circle" size={60} color="white" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            );
        }

        // Add images if present
        if (post.postImages) {
            post.postImages.forEach((image, index) => {
                mediaItems.push(
                    <Image
                        key={`image-${index}`}
                        source={image}
                        style={[styles.postImage, { width: screenWidth - 14, height: imageHeight }]}
                        resizeMode="cover"
                    />
                );
            });
        } else if (post.postImage) {
            mediaItems.push(
                <Image
                    key="single-image"
                    source={post.postImage}
                    style={[styles.postImage, { width: screenWidth - 14, height: imageHeight }]}
                    resizeMode="cover"
                />
            );
        }

        return (
            <View style={styles.carouselContainer}>
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleScroll}
                    decelerationRate="fast"
                    snapToInterval={screenWidth - 14}
                >
                    {mediaItems}
                </ScrollView>

                {mediaItems.length > 1 && isVisible && (
                    <View style={styles.paginationDots}>
                        {mediaItems.map((_, index) => (
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

    return (
        <Animated.View
            key={post.id}
            style={[
                styles.postContainer,
                { opacity: fadeAnim },
                { backgroundColor: isDark ? '#1a1a1a' : 'white' }
            ]}
            onLayout={handleLayout}
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
                <Text style={styles.timestamp}>{post.timestamp}</Text>
            </View>

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
    playButton: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -30 }, { translateY: -30 }],
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
        color: '#8e8e8e',
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
        padding: 20,
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
});