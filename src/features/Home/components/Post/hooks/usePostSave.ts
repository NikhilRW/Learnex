import {useState, useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import Snackbar from 'react-native-snackbar';
import Firebase from '@/shared/services/firebase';

export const usePostSave = (
  postId: string,
  initialIsSaved: boolean | undefined,
  firebase: Firebase,
) => {
  const [isSaved, setIsSaved] = useState(initialIsSaved === true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const checkPostSavedStatus = async () => {
      try {
        const currentUser = firebase.currentUser();
        if (!currentUser) return;

        const userRef = firestore().collection('users').doc(currentUser.uid);
        const userDoc = await userRef.get();

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const savedPosts = userData?.savedPosts || [];
          const saved = savedPosts.includes(postId);
          setIsSaved(saved);
        } else {
          setIsSaved(false);
        }
      } catch (error) {
        console.error('Error checking post saved status:', error);
        setIsSaved(false);
      }
    };

    if (initialIsSaved === undefined) {
      checkPostSavedStatus();
    }
  }, [firebase, postId, initialIsSaved]);

  const handleSavePost = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const result = await firebase.posts.savePost(postId);

      if (result.success) {
        setIsSaved(result.saved === true);

        Snackbar.show({
          text: result.saved ? 'Post saved' : 'Post unsaved',
          duration: Snackbar.LENGTH_SHORT,
          textColor: 'white',
          backgroundColor: '#2379C2',
        });
      } else {
        Snackbar.show({
          text: result.error || 'Failed to save post',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
      }
    } catch (error) {
      console.error('Error saving post:', error);
      Snackbar.show({
        text: 'An error occurred while saving the post',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {isSaved, isSaving, handleSavePost};
};
