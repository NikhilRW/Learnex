import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View, FlatList, ViewToken, ImageSourcePropType } from 'react-native';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { useTypedDispatch } from '../../hooks/useTypedDispatch';
import { changeIsLoggedIn } from '../../reducers/User';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import Post from '../../components/user/UserScreens/Home/Post';
import { PostType } from '../../types/post';
import { styles } from '../../styles/screens/userscreens/Home.styles';
import { FirestorePost } from '../../types/post';

// Type for Firestore post data


const Home = () => {
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const theme = useTypedSelector(state => state.user.theme);
  const isDark = theme === 'dark';
  const [isLoaded, setIsLoaded] = useState(false);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const dispatch = useTypedDispatch();
  const profileColor = useTypedSelector(state => state.user.userProfileColor);
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      const { success, error } = await firebase.auth.signOut();
      if (success) {
        dispatch(changeIsLoggedIn(false));
      } else {
        console.error('Sign out failed:', error);
      }
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Fetch user data
  const fetchUserData = async () => {
    try {
      const currentUser = firebase.auth.currentUser();
      if (currentUser?.photoURL) {
        setPhotoURL(currentUser.photoURL);
      }
      const { fullName } = await firebase.user.getNameUsernamestring();
      setUsername(fullName);
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  // Optimize post updates subscription
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupRealTimeUpdates = async () => {
      try {
        unsubscribe = firebase.posts.subscribeToPostUpdates((updatedPosts) => {
          setPosts(updatedPosts);
          if (selectedTag) {
            const filtered = updatedPosts.filter(post =>
              post.hashtags?.includes(selectedTag)
            );
            setFilteredPosts(filtered);
          }
          setLoading(false);
          setIsLoaded(true);
        });
      } catch (err) {
        console.error('Error setting up real-time updates:', err);
        setError(err instanceof Error ? err.message : 'Failed to setup real-time updates');
        setLoading(false);
      }
    };

    setupRealTimeUpdates();
    return () => unsubscribe?.();
  }, [firebase.posts, selectedTag]);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);
    }, 2500);
  }, []);

  const stories = [
    { id: 1, image: require('../../res/pngs/testing/logo.png') },
    { id: 2, image: require('../../res/pngs/testing/logo.png') },
    { id: 3, image: require('../../res/pngs/testing/logo.png') },
    { id: 4, image: require('../../res/pngs/testing/logo.png') },
    { id: 5, image: require('../../res/pngs/testing/logo.png') },
    { id: 6, image: require('../../res/pngs/testing/logo.png') },
  ];
  const HomeSkeleton = ({ width, height }: { width: number, height: number }): JSX.Element => {
    //TODO : Add the skeleton for the home screen
    return (
      <SkeletonPlaceholder borderRadius={4}
        speed={1000}
        highlightColor="#edf6f7"  >
        <View></View>
      </SkeletonPlaceholder>
    );
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
    // Find the first video post that is visible
    const visibleVideo = viewableItems.find(
      ({ item }) => item.isVideo && item.postVideo
    );
    // Set the visible video ID or null if no video is visible
    setVisibleVideoId(visibleVideo ? visibleVideo.item.id : null);
  }, []);

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: {
        itemVisiblePercentThreshold: 90, // Only play when fully visible
      },
      onViewableItemsChanged,
    },
  ]);

  const renderPost = ({ item }: { item: PostType }) => (
    <View style={styles.postContainer}>
      <Post
        key={item.id}
        post={item}
        isVisible={item.id === visibleVideoId}
      />
    </View>
  );

  // Optimize trending tags fetch with cleanup
  useEffect(() => {
    let mounted = true;
    const fetchTrendingTags = async () => {
      try {
        console.log('Starting to fetch trending tags...');
        const response = await firebase.trending.getTrendingPosts('day', 20);

        if (!mounted) {
          console.log('Component unmounted, skipping update');
          return;
        }
        console.log('posts', response.posts);
        console.log('Got trending posts response:', {
          success: response.success,
          postsCount: response.posts?.length,
          posts: response.posts?.map(post => ({
            id: post.id,
            hashtags: post.hashtags,
            engagement: post.likes + post.comments
          }))
        });

        if (response.success && response.posts) {
          console.log('Processing posts for hashtags...');
          const hashtagStats = new Map<string, number>();

          response.posts.forEach((post: PostType) => {
            console.log('Processing post:', {
              id: post.id,
              hashtags: post.hashtags,
              engagement: post.likes + post.comments
            });

            if (post.hashtags && Array.isArray(post.hashtags)) {
              const engagement = post.likes + post.comments;
              post.hashtags.forEach(tag => {
                const currentEngagement = hashtagStats.get(tag) || 0;
                hashtagStats.set(tag, currentEngagement + engagement);
                console.log(`Updated engagement for tag #${tag}:`, currentEngagement + engagement);
              });
            } else {
              console.log('Post has no valid hashtags:', post.id);
            }
          });

          const hashtagEntries = Array.from(hashtagStats.entries());
          console.log('Hashtag stats:', hashtagEntries);

          const topTags = hashtagEntries
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag]) => tag);

          console.log('Setting trending tags:', topTags);
          setTrendingTags(topTags);
        } else {
          console.log('Failed to get trending posts:', response.error);
        }
      } catch (error) {
        console.error('Error in fetchTrendingTags:', error);
      }
    };

    fetchTrendingTags();
    return () => { mounted = false; };
  }, [firebase.trending]);

  // Optimize tag filtering
  const handleTagPress = useCallback((tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
      setFilteredPosts([]);
    } else {
      setSelectedTag(tag);
      const filtered = posts.filter(post =>
        post.hashtags?.includes(tag)
      );
      setFilteredPosts(filtered);
    }
  }, [selectedTag, posts]);

  return (
    <SafeAreaView className={` justify-start items-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
      {isLoaded ? (
        <>
          <FlatList
            data={selectedTag ? filteredPosts : posts}
            renderItem={renderPost}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.mainContainer}
            contentContainerStyle={styles.postsContainer}
            viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            windowSize={5}
            removeClippedSubviews={true}
            ListHeaderComponent={() => (
              <>
                {/* Stories */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.storiesContainer}
                >
                  {stories.map(story => (
                    <View key={story.id} style={styles.storyItem}>
                      <Image source={story.image} style={styles.storyImage} />
                    </View>
                  ))}
                </ScrollView>
                {/* Tags */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.tagsContainer}
                >
                  {trendingTags.map(tag => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tagButton,
                        {
                          backgroundColor: isDark ? "#2a2a2a" : "#F0F0F0",
                          borderWidth: selectedTag === tag ? 2 : 0,
                          borderColor: '#0095f6'
                        }
                      ]}
                      onPress={() => handleTagPress(tag)}
                    >
                      <Text style={[
                        styles.tagText,
                        {
                          color: selectedTag === tag ? '#0095f6' : (isDark ? "white" : "black")
                        }
                      ]}>
                        #{tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {selectedTag && (
                  <View style={styles.filterInfo}>
                    <Text style={[
                      styles.filterText,
                      { color: isDark ? "white" : "black" }
                    ]}>
                      Showing posts tagged with #{selectedTag}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleTagPress(selectedTag)}
                      style={styles.clearFilterButton}
                    >
                      <Text style={{ color: '#0095f6' }}>Clear filter</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          />
        </>
      ) : (
        <HomeSkeleton width={100} height={100} />
      )}
    </SafeAreaView>
  );
};

export default Home;