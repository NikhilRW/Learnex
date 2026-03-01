import {useState, useEffect, useCallback} from 'react';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
} from '@react-native-firebase/firestore';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import {PostType} from 'shared/types/post';
import {FirestorePost, convertFirestorePost} from 'shared/services/utils';

interface UseSavedPostsResult {
  savedPosts: PostType[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

export const useSavedPosts = (): UseSavedPostsResult => {
  const [savedPosts, setSavedPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const firebase = useTypedSelector(state => state.firebase.firebase);

  const fetchSavedPosts = useCallback(async () => {
    try {
      setLoading(true);

      const currentUser = firebase.currentUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(
        doc(collection(getFirestore(), 'users'), currentUser.uid),
      );

      if (!userDoc.exists()) {
        setLoading(false);
        return;
      }

      const userData = userDoc.data() as {savedPosts?: string[]};
      const savedPostIds = userData?.savedPosts || [];

      if (savedPostIds.length === 0) {
        setSavedPosts([]);
        setLoading(false);
        return;
      }

      const postsPromises = savedPostIds.map(async (postId: string) => {
        try {
          const postDoc = await getDoc(
            doc(collection(getFirestore(), 'posts'), postId),
          );

          if (!postDoc.exists()) return null;

          const postDocData = postDoc.data() as any;
          const postData = {id: postId, ...postDocData} as FirestorePost;
          const commentsSnapshot = await getDocs(
            collection(
              doc(collection(getFirestore(), 'posts'), postId),
              'comments',
            ),
          );
          const comments = commentsSnapshot.docs.map((docSnapshot: any) => ({
            id: docSnapshot.id,
            ...docSnapshot.data(),
          }));

          postData.commentsList = comments;
          postData.comments = comments.length;

          const convertedPost = convertFirestorePost(postData, currentUser.uid);
          convertedPost.isSaved = true;

          return convertedPost;
        } catch (error) {
          console.error(`Error fetching post ${postId}:`, error);
          return null;
        }
      });

      const posts = (await Promise.all(postsPromises)).filter(
        Boolean,
      ) as PostType[];

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

  useEffect(() => {
    fetchSavedPosts();

    const unsubscribe = firebase.subscribeToSavedPosts(() => {
      console.log('Saved posts changed, refreshing...');
      fetchSavedPosts();
    });

    return () => {
      unsubscribe();
    };
  }, [fetchSavedPosts, firebase]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSavedPosts();
  }, [fetchSavedPosts]);

  return {savedPosts, loading, refreshing, onRefresh};
};
