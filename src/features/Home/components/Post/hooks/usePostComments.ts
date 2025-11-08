import Firebase from '@/shared/services/firebase';
import {useState} from 'react';
import Snackbar from 'react-native-snackbar';

export const usePostComments = (
  postId: string,
  firebase: Firebase,
  onCommentAdded?: (comment: any) => void,
) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsAddingComment(true);

      const currentUser = firebase.currentUser();
      if (!currentUser) {
        Snackbar.show({
          text: 'You must be logged in to comment',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
        return;
      }

      const result = await firebase.posts.addComment(postId, newComment.trim());

      if (result.success) {
        if (result.comment && onCommentAdded) {
          onCommentAdded(result.comment);
        }

        setNewComment('');

        Snackbar.show({
          text: 'Comment added successfully',
          duration: Snackbar.LENGTH_SHORT,
          textColor: 'white',
          backgroundColor: '#2379C2',
        });

        setShowComments(true);
      } else {
        Snackbar.show({
          text: result.error || 'Failed to add comment',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Snackbar.show({
        text: 'An error occurred while adding your comment',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    } finally {
      setIsAddingComment(false);
    }
  };

  return {
    showComments,
    setShowComments,
    newComment,
    setNewComment,
    isAddingComment,
    handleAddComment,
  };
};
