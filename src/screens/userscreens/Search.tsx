import { Text, View, FlatList, ViewToken, RefreshControl } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { UserStackParamList } from '../../routes/UserStack';
import { RouteProp } from '@react-navigation/native';
import { styles } from '../../styles/screens/userscreens/Home.styles'; // Reuse Home styles
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { PostType } from '../../types/post';
import Post from '../../components/user/UserScreens/Home/Post';
import { primaryColor } from '../../res/strings/eng';

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

  // Fetch posts based on search
  useEffect(() => {
    const fetchPosts = async () => {
      if (!searchText) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const response = await firebase.posts.getPostsBySearch(searchText);
      if (response.success) {
        setPosts(response.posts);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [searchText]);

  // Handle video visibility
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
    const visibleVideo = viewableItems.find(
      ({ item }) => item.isVideo && item.postVideo
    );
    setVisibleVideoId(visibleVideo ? visibleVideo.item.id : null);
  }, []);

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
        setPosts(response.posts);
      }
    } catch (error) {
      console.error('Error refreshing search results:', error);
    } finally {
      setRefreshing(false);
    }
  }, [searchText]);

  const renderPost = ({ item }: { item: PostType & { isLiked: boolean; likes: number; isSaved: boolean } }) => (
    <View style={styles.postContainer}>
      <Post
        key={item.id}
        post={item}
        isVisible={item.id === visibleVideoId}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: isDark ? '#ffffff' : '#000000' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
      {posts.length === 0 ? (
        <View style={[styles.container,{ justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: isDark ? '#ffffff' : '#000000' }}>No results found</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
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
}

export default Search;