import Firebase from '@/shared/services/firebase';
import {useState, useEffect} from 'react';
import Snackbar from 'react-native-snackbar';
// import Firebase from 'shared/services/FirebaseService';

export const usePostLike = (
  postId: string,
  initialIsLiked: boolean,
  firebase: Firebase,
) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);

  useEffect(() => {
    setIsLiked(initialIsLiked);
  }, [initialIsLiked]);

  const handleLikePost = async (
    onLikesUpdate: (change: number) => void,
  ): Promise<void> => {
    try {
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);

      const likesChange = newIsLiked ? 1 : -1;
      onLikesUpdate(likesChange);

      const result = await firebase.posts.likePost(postId);

      if (!result.success) {
        setIsLiked(!newIsLiked);
        onLikesUpdate(-likesChange);

        Snackbar.show({
          text: result.error || 'Failed to update like status',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
      setIsLiked(!isLiked);

      Snackbar.show({
        text: 'Failed to update like status',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    }
  };

  return {isLiked, handleLikePost};
};
