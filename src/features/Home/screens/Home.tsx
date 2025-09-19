import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ViewToken,
  RefreshControl,
} from 'react-native';
import React, { useEffect, useState, useCallback, useRef, JSX } from 'react';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import { useTypedDispatch } from 'hooks/redux/useTypedDispatch';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import Post from 'home/components/Post';
import { PostType } from 'shared/types/post';
import { styles } from 'home/styles/Home';
import { primaryColor } from 'shared/res/strings/eng';
import { SafeAreaView } from 'react-native-safe-area-context';

const Home = () => {
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const theme = useTypedSelector(state => state.user.theme);
  const isDark = theme === 'dark';

  const [isLoaded, setIsLoaded] = useState(false);
  const [posts, setPosts] = useState<
    (PostType & { isLiked: boolean; likes: number; isSaved: boolean })[]
  >([]);
  const [filteredPosts, setFilteredPosts] = useState<
    (PostType & { isLiked: boolean; likes: number; isSaved: boolean })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const dispatch = useTypedDispatch();
  const profileColor = useTypedSelector(state => state.user.userProfileColor);
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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
        unsubscribe = firebase.posts.subscribeToPostUpdates(updatedPosts => {
          setPosts(updatedPosts);
          if (selectedTag) {
            const filtered = updatedPosts.filter(post =>
              post.hashtags?.includes(selectedTag),
            );
            setFilteredPosts(filtered);
          }
          setLoading(false);
          setIsLoaded(true);
        });
      } catch (err) {
        console.error('Error setting up real-time updates:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to setup real-time updates',
        );
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
  const HomeSkeleton = ({
    width,
    height,
  }: {
    width: number;
    height: number;
  }): JSX.Element => {
    //TODO : Add the skeleton for the home screen
    return (
      <SkeletonPlaceholder
        borderRadius={4}
        speed={1000}
        highlightColor="#edf6f7">
        <View></View>
      </SkeletonPlaceholder>
    );
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      // Find the first video post that is visible
      const visibleVideo = viewableItems.find(
        ({ item }) => item.isVideo && item.postVideo,
      );
      // Set the visible video ID or null if no video is visible
      setVisibleVideoId(visibleVideo ? visibleVideo.item.id : null);
    },
    [],
  );

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: {
        itemVisiblePercentThreshold: 90, // Only play when fully visible
      },
      onViewableItemsChanged,
    },
  ]);

  const renderPost = useCallback(
    ({
      item,
    }: {
      item: PostType & { isLiked: boolean; likes: number; isSaved: boolean };
    }) => (
      <View style={styles.postContainer}>
        <Post
          key={item.id}
          post={item}
          isVisible={item.id === visibleVideoId}
        />
      </View>
    ),
    [visibleVideoId],
  );

  // Add refresh function
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log('Refreshing home feed...');

      // Refresh posts
      const postsResponse = await firebase.posts.getPosts();
      if (postsResponse.success && postsResponse.posts) {
        // Ensure posts have the required properties
        const formattedPosts = postsResponse.posts.map((post: PostType) => ({
          ...post,
          isLiked: post.isLiked || false,
          likes: post.likes || 0,
          isSaved: post.isSaved || false,
        }));

        setPosts(formattedPosts);

        // Update filtered posts if a tag is selected
        if (selectedTag) {
          const filtered = formattedPosts.filter(
            (
              post: PostType & {
                isLiked: boolean;
                likes: number;
                isSaved: boolean;
              },
            ) => post.hashtags?.includes(selectedTag),
          );
          setFilteredPosts(filtered);
        }
      }

      // Refresh trending tags
      const trendingResponse = await firebase.trending.getTrendingPosts(
        'day',
        20,
      );
      if (trendingResponse.success && trendingResponse.posts) {
        const hashtagStats = new Map<string, number>();

        trendingResponse.posts.forEach(
          (post: PostType & { likes: number; comments: number }) => {
            if (post.hashtags && Array.isArray(post.hashtags)) {
              const engagement = post.likes + post.comments;
              post.hashtags.forEach(tag => {
                const currentEngagement = hashtagStats.get(tag) || 0;
                hashtagStats.set(tag, currentEngagement + engagement);
              });
            }
          },
        );

        const hashtagEntries = Array.from(hashtagStats.entries());
        const topTags = hashtagEntries
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([tag]) => tag);

        // Use fallback tags if no trending tags are found
        setTrendingTags(topTags);
      } else {
        // Use fallback tags if API call fails
      }

      // Refresh user data
      await fetchUserData();
    } catch (error) {
      console.error('Error refreshing home feed:', error);
      // Use fallback tags if there's an error
    } finally {
      setRefreshing(false);
    }
  }, [firebase.posts, firebase.trending, selectedTag, fetchUserData]);

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
          posts: response.posts?.map((post: PostType) => ({
            id: post.id,
            hashtags: post.hashtags,
            engagement: post.likes + post.comments,
          })),
        });

        if (response.success && response.posts && response.posts.length > 0) {
          console.log('Processing posts for hashtags...');
          const hashtagStats = new Map<string, number>();

          response.posts.forEach(
            (post: PostType & { likes: number; comments: number }) => {
              console.log('Processing post:', {
                id: post.id,
                hashtags: post.hashtags || [],
                engagement: post.likes + post.comments,
              });

              // Ensure hashtags exists and is an array
              if (
                post.hashtags &&
                Array.isArray(post.hashtags) &&
                post.hashtags.length > 0
              ) {
                const engagement = post.likes + post.comments;
                post.hashtags.forEach(tag => {
                  // Skip empty tags
                  if (!tag || tag.trim() === '') return;

                  const currentEngagement = hashtagStats.get(tag) || 0;
                  hashtagStats.set(tag, currentEngagement + engagement);
                  console.log(
                    `Updated engagement for tag #${tag}:`,
                    currentEngagement + engagement,
                  );
                });
              } else {
                console.log('Post has no valid hashtags:', post.id);
              }
            },
          );

          const hashtagEntries = Array.from(hashtagStats.entries());

          const topTags = hashtagEntries
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag]) => tag);
        } else {
          // Extract tags from available posts instead of using fallback tags
          const extractTagsFromPosts = () => {
            const allTags = new Set<string>();

            posts.forEach(post => {
              if (post.hashtags && Array.isArray(post.hashtags)) {
                post.hashtags.forEach(tag => {
                  if (tag && tag.trim() !== '') {
                    allTags.add(tag);
                  }
                });
              }
            });

            return Array.from(allTags).slice(0, 10);
          };

          const extractedTags = extractTagsFromPosts();

          if (extractedTags.length > 0) {
            setTrendingTags(extractedTags);
          } else {
            setTrendingTags([]);
          }
        }
      } catch (error) {
        console.error('Error in fetchTrendingTags:', error);
        // Extract tags from available posts instead of using empty array
        if (mounted) {
          const extractTagsFromPosts = () => {
            const allTags = new Set<string>();

            posts.forEach(post => {
              if (post.hashtags && Array.isArray(post.hashtags)) {
                post.hashtags.forEach(tag => {
                  if (tag && tag.trim() !== '') {
                    allTags.add(tag);
                  }
                });
              }
            });

            return Array.from(allTags).slice(0, 10);
          };

          const extractedTags = extractTagsFromPosts();
          console.log('Extracted tags from posts after error:', extractedTags);

          if (extractedTags.length > 0) {
            setTrendingTags(extractedTags);
          } else {
            setTrendingTags([]);
          }
        }
      }
    };

    fetchTrendingTags();
    return () => {
      mounted = false;
    };
  }, [firebase.trending, posts]);

  // Optimize tag filtering
  const handleTagPress = useCallback(
    (tag: string) => {
      if (selectedTag === tag) {
        setSelectedTag(null);
        setFilteredPosts([]);
      } else {
        console.log(`Filtering by tag: ${tag}`);
        setSelectedTag(tag);
        const filtered = posts.filter(post => {
          // Ensure hashtags exists and is an array
          const hashtags = post.hashtags || [];
          const hasTag = Array.isArray(hashtags) && hashtags.includes(tag);
          return hasTag;
        });
        setFilteredPosts(filtered);
      }
    },
    [selectedTag, posts],
  );

  return (
    <SafeAreaView
      className={`justify-start items-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
      {isLoaded ? (
        <>
          <FlatList
            data={selectedTag ? filteredPosts : posts}
            renderItem={renderPost}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.mainContainer}
            contentContainerStyle={styles.postsContainer}
            viewabilityConfigCallbackPairs={
              viewabilityConfigCallbackPairs.current
            }
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            windowSize={5} // Causes Scrolling To Flicker
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={50}
            getItemLayout={(data, index) => ({
              length: 500, // Approximate height of each post
              offset: 500 * index,
              index,
            })}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                // onRefresh={onRefresh}
                tintColor={isDark ? '#ffffff' : '#000000'}
                colors={[primaryColor]}
                progressBackgroundColor={isDark ? '#1a1a1a' : '#ffffff'}
              />
            }
            ListHeaderComponent={() => (
              <>
                {/* Stories */}
                {/* <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.storiesContainer}
                >
                  {stories.map(story => (
                    <View key={story.id} style={styles.storyItem}>
                      <Image source={story.image} style={styles.storyImage} />
                    </View>
                  ))}
                </ScrollView> */}
                {/* Tags */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.tagsContainer}>
                  {trendingTags.map(tag => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tagButton,
                        {
                          backgroundColor: isDark ? '#2a2a2a' : '#F0F0F0',
                          borderWidth: selectedTag === tag ? 2 : 0,
                          borderColor: '#0095f6',
                        },
                      ]}
                      onPress={() => handleTagPress(tag)}>
                      <Text
                        style={[
                          styles.tagText,
                          {
                            color:
                              selectedTag === tag
                                ? '#0095f6'
                                : isDark
                                  ? 'white'
                                  : 'black',
                          },
                        ]}>
                        {tag.includes('#') ? tag : `#${tag}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {selectedTag && (
                  <View style={styles.filterInfo}>
                    <Text
                      style={[
                        styles.filterText,
                        { color: isDark ? 'white' : 'black' },
                      ]}>
                      Showing posts tagged with{' '}
                      {selectedTag.includes('#')
                        ? selectedTag
                        : `#${selectedTag}`}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleTagPress(selectedTag)}
                      style={styles.clearFilterButton}>
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
