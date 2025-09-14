import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import Post from '../../components/user/UserScreens/Home/Post';
import { PostType } from '../../types/post';
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
} from '@react-native-firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { primaryColor } from '../../res/strings/eng';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { FirestorePost, convertFirestorePost } from '../../service/firebase/utils';


/**
 * SavedPosts screen displays all posts that the user has saved
 * Shows a nice empty state when no saved posts exist
 */
const SavedPosts: React.FC = () => {
    const [savedPosts, setSavedPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const firebase = useTypedSelector(state => state.firebase.firebase);
    const isDark = useTypedSelector(state => state.user.theme) === 'dark';
    const navigation = useNavigation();

    const fetchSavedPosts = useCallback(async () => {
        try {
            setLoading(true);

            // Get the current user
            const currentUser = firebase.currentUser();
            if (!currentUser) {
                setLoading(false);
                return;
            }

            // Get the user document to find saved post IDs
            const userDoc = await getDoc(
                doc(collection(getFirestore(), 'users'), currentUser.uid)
            );

            if (!userDoc.exists()) {
                setLoading(false);
                return;
            }

            // Get the saved post IDs
            const userData = userDoc.data() as { savedPosts?: string[] };
            const savedPostIds = userData?.savedPosts || [];

            if (savedPostIds.length === 0) {
                setSavedPosts([]);
                setLoading(false);
                return;
            }

            // Get each saved post data
            const postsPromises = savedPostIds.map(async (postId: string) => {
                try {
                    const postDoc = await getDoc(
                        doc(collection(getFirestore(), 'posts'), postId)
                    );

                    if (!postDoc.exists()) return null;

                    // Get post data and comments
                    const postDocData = postDoc.data() as any;
                    const postData = { id: postId, ...postDocData } as FirestorePost;
                    const commentsSnapshot = await getDocs(
                        collection(doc(collection(getFirestore(), 'posts'), postId), 'comments')
                    );
                    const comments = commentsSnapshot.docs.map((docSnapshot: any) => ({
                        id: docSnapshot.id,
                        ...docSnapshot.data()
                    }));

                    postData.commentsList = comments;
                    postData.comments = comments.length;

                    // Convert to PostType and mark as saved
                    const convertedPost = convertFirestorePost(postData, currentUser.uid);
                    convertedPost.isSaved = true;

                    return convertedPost;
                } catch (error) {
                    console.error(`Error fetching post ${postId}:`, error);
                    return null;
                }
            });

            const posts = (await Promise.all(postsPromises)).filter(Boolean) as PostType[];

            // Sort posts by timestamp (newest first)
            posts.sort((a, b) => {
                const dateA = new Date(a.timestamp).getTime();
                const dateB = new Date(b.timestamp).getTime();
                return dateB - dateA;
            });

            setSavedPosts(posts);
        } catch (error) {
            console.error('Error fetching saved posts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [firebase]);

    // Load posts when the screen first renders
    useEffect(() => {
        fetchSavedPosts();

        // Subscribe to changes in saved posts
        const unsubscribe = firebase.subscribeToSavedPosts(() => {
            console.log('Saved posts changed, refreshing...');
            fetchSavedPosts();
        });

        return () => {
            unsubscribe();
        };
    }, [fetchSavedPosts, firebase]);

    // Handle pull-to-refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSavedPosts();
    }, [fetchSavedPosts]);

    // Render the header with back button
    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Icon name="arrow-left" size={24} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? 'white' : 'black' }]}>Saved Posts</Text>
            <View style={{ width: 24 }} />
        </View>
    );

    // Render empty state
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <MaterialIcons
                name="bookmark-border"
                size={80}
                color={isDark ? "#4a4a4a" : "#cccccc"}
            />
            <Text style={[styles.emptyTitle, { color: isDark ? 'white' : 'black' }]}>
                No Saved Posts
            </Text>
            <Text style={[styles.emptyText, { color: isDark ? '#b0b0b0' : '#666666' }]}>
                Posts you save will appear here. Tap the bookmark icon on any post to save it for later.
            </Text>
            <TouchableOpacity
                style={[styles.exploreButton, { backgroundColor: primaryColor }]}
                onPress={() => navigation.navigate('Home')}
            >
                <Text style={styles.exploreButtonText}>Explore Posts</Text>
            </TouchableOpacity>
        </View>
    );

    // Render loading state
    const renderLoading = () => (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
            {renderHeader()}

            {loading ? (
                renderLoading()
            ) : (
                <FlatList
                    data={savedPosts}
                    keyExtractor={(item) => item.id}
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                    renderItem={({ item }) => <Post post={item} isVisible={true} />}
                    contentContainerStyle={savedPosts.length === 0 ? { flex: 1 } : styles.contentContainer}
                    ListEmptyComponent={renderEmptyState}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[primaryColor]}
                            tintColor={isDark ? 'white' : primaryColor}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    backButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    exploreButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    exploreButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default SavedPosts; 