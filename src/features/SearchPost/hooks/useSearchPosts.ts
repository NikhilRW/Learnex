import {useState, useEffect, useCallback, useRef, startTransition} from 'react';
import {ViewToken} from 'react-native';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import {PostType} from 'shared/types/post';
import {ViewabilityPair, UseSearchPostsResult} from '../types';

const MAX_RETRIES = 3;

export const useSearchPosts = (searchText?: string): UseSearchPostsResult => {
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null);
  const [, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchPosts = async (currentRetryCount = 0) => {
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
            startTransition(() => {
              setPosts(response.posts!);
              setLoading(false);
            });
          } else if (currentRetryCount < MAX_RETRIES) {
            setRetryCount(currentRetryCount + 1);
            timeoutId = setTimeout(() => {
              if (isMounted) fetchPosts(currentRetryCount + 1);
            }, 1500);
          } else {
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
    fetchPosts(0);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [firebase.posts, searchText]);

  const onViewableItemsChanged = useCallback(
    ({viewableItems}: {viewableItems: Array<ViewToken>}) => {
      const visibleVideo = viewableItems.find(
        ({item}) => item.isVideo && item.postVideo,
      );
      setVisibleVideoId(visibleVideo ? visibleVideo.item.id : null);
    },
    [],
  );

  const viewabilityConfigCallbackPairs = useRef<ViewabilityPair[]>([
    {
      viewabilityConfig: {itemVisiblePercentThreshold: 90},
      onViewableItemsChanged,
    },
  ]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await firebase.posts.getPostsBySearch(searchText!);
      if (response.success) {
        startTransition(() => {
          setPosts(response.posts!);
        });
      }
    } catch (error) {
      console.error('Error refreshing search results:', error);
    } finally {
      setRefreshing(false);
    }
  }, [firebase.posts, searchText]);

  return {
    posts,
    loading,
    refreshing,
    visibleVideoId,
    onRefresh,
    viewabilityConfigCallbackPairs,
  };
};
