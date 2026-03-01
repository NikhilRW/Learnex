import { View, RefreshControl } from 'react-native';
import { LegendList } from '@legendapp/list';
import React from 'react';
import { styles } from 'shared/styles/Home';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import { PostType } from 'shared/types/post';
import Post from 'home/components/Post';
import { primaryColor } from 'shared/res/strings/eng';
import { searchStyles } from '../styles/Search';
import { useSearchPosts } from '../hooks/useSearchPosts';
import SearchLoading from '../components/SearchLoading';
import SearchEmptyState from '../components/SearchEmptyState';
import { SearchScreenRouteProp } from '../types';

const Search = ({ route }: { route: SearchScreenRouteProp }) => {
  const searchText = route.params?.searchText;
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  const {
    posts,
    loading,
    refreshing,
    visibleVideoId,
    onRefresh,
    viewabilityConfigCallbackPairs,
  } = useSearchPosts(searchText);

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
        isDark ? searchStyles.darkContainer : searchStyles.lightContainer,
      ]}>
      {loading ? (
        <SearchLoading isDark={isDark} searchText={searchText} />
      ) : posts.length === 0 || searchText === '' ? (
        <SearchEmptyState isDark={isDark} />
      ) : (
        <LegendList
          data={posts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.mainContainer}
          contentContainerStyle={styles.postsContainer}
          viewabilityConfigCallbackPairs={
            viewabilityConfigCallbackPairs.current
          }
          estimatedItemSize={500}
          recycleItems={true}
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
