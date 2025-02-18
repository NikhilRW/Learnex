import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {AddCommentResponse} from '../../types/firebase';
import {FirestoreComment} from '../../types/post';
import {convertFirestoreComment} from './utils';

export class CommentService {
  async addComment(postId: string, text: string): Promise<AddCommentResponse> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      const postRef = firestore().collection('posts').doc(postId);
      const postDoc = await postRef.get();

      if (!postDoc.exists) {
        return {success: false, error: 'Post not found'};
      }

      const userDoc = await firestore()
        .collection('users')
        .where('email', '==', currentUser.email)
        .get();

      if (userDoc.empty) {
        return {success: false, error: 'User data not found'};
      }

      const userData = userDoc.docs[0].data();

      const commentData: Omit<FirestoreComment, 'id'> = {
        userId: currentUser.uid,
        username: userData.username,
        userImage: userData.image || 'default_avatar_url',
        text,
        likes: 0,
        timestamp: firestore.FieldValue.serverTimestamp(),
      };

      const commentRef = await postRef.collection('comments').add(commentData);

      await postRef.update({
        comments: firestore.FieldValue.increment(1),
      });

      const firestoreComment: FirestoreComment = {
        id: commentRef.id,
        ...commentData,
      };

      return {
        success: true,
        comment: convertFirestoreComment(firestoreComment),
      };
    } catch (error) {
      console.error('Error in addComment:', error);
      return {success: false, error: 'Failed to add comment'};
    }
  }

  async getPostComments(postRef: any) {
    const commentsSnapshot = await postRef
      .collection('comments')
      .orderBy('timestamp', 'desc')
      .get();

    return commentsSnapshot.docs.map(commentDoc => ({
      id: commentDoc.id,
      ...commentDoc.data(),
    })) as FirestoreComment[];
  }
}
