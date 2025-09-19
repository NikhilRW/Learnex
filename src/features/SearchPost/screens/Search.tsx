import {
  Text,
  View,
  FlatList,
  ViewToken,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { UserStackParamList } from 'shared/navigation/routes/UserStack';
import { RouteProp } from '@react-navigation/native';
import { styles } from 'shared/styles/Home'; // Reuse Home styles
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import { PostType } from 'shared/types/post';
import Post from 'home/components/Post';
import { primaryColor } from 'shared/res/strings/eng';

type SearchScreenRouteProp = RouteProp<UserStackParamList, 'Search'>;

const Search = ({ route }: { route: SearchScreenRouteProp }) => {
  const searchText = route.params?.searchText;
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const theme = useTypedSelector(state => state.user.theme);
  const isDark = theme === 'dark';

  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3; // Maximum number of retries

  // Fetch posts based on search
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchPosts = async () => {
      if (!searchText) {
        if (isMounted) {
          setPosts([]);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await firebase.posts.getPostsBySearch(searchText);

        if (isMounted) {
          if (response.success) {
            setPosts(response.posts!);
            setLoading(false);
          } else if (retryCount < maxRetries) {
            // If no posts yet and within retry limit, try again after delay
            setRetryCount(prev => prev + 1);
            timeoutId = setTimeout(() => {
              if (isMounted) fetchPosts();
            }, 1500);
          } else {
            // Max retries reached, stop loading
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
        if (isMounted) setLoading(false);
      }
    };

    setLoading(true);
    setRetryCount(0);
    fetchPosts();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchText]);

  // Handle video visibility
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      const visibleVideo = viewableItems.find(
        ({ item }) => item.isVideo && item.postVideo,
      );
      setVisibleVideoId(visibleVideo ? visibleVideo.item.id : null);
    },
    [],
  );

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: {
        itemVisiblePercentThreshold: 90,
      },
      onViewableItemsChanged,
    },
  ]);

  // Refresh function
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await firebase.posts.getPostsBySearch(searchText!);
      if (response.success) {
        setPosts(response.posts!);
      }
    } catch (error) {
      console.error('Error refreshing search results:', error);
    } finally {
      setRefreshing(false);
    }
  }, [searchText]);

  const renderPost = ({
    item,
  }: {
    item: PostType & { isLiked: boolean; likes: number; isSaved: boolean };
  }) => (
    <View style={styles.postContainer}>
      <Post key={item.id} post={item} isVisible={item.id === visibleVideoId} />
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#1a1a1a' : '#fff' },
      ]}>
      {loading ? (
        <View
          style={[
            styles.container,
            { justifyContent: 'center', alignItems: 'center' },
          ]}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={{ color: isDark ? '#ffffff' : '#000000', marginTop: 16 }}>
            Searching for "{searchText}"...
          </Text>
        </View>
      ) : posts.length === 0 ? (
        <View
          style={[
            styles.container,
            { justifyContent: 'center', alignItems: 'center' },
          ]}>
          <Text
            style={{
              color: isDark ? '#ffffff' : '#000000',
              fontSize: 20,
              fontWeight: 'bold',
            }}>
            No results found
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
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
          windowSize={5}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? '#ffffff' : '#000000'}
              colors={[primaryColor]}
              progressBackgroundColor={isDark ? '#1a1a1a' : '#ffffff'}
            />
          }
        />
      )}
    </View>
  );
};

export default Search;
