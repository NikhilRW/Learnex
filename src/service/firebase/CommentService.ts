import auth from '@react-native-firebase/auth';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {FirestoreComment} from '../../types/post';
import {convertFirestoreComment, formatFirestoreTimestamp} from './utils';

interface AddCommentResponse {
  success: boolean;
  comment?: FirestoreComment;
  error?: string;
}

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

      // Use the document with currentUser.uid to retrieve user data
      const userDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();

      if (!userDoc.exists) {
        return {success: false, error: 'User data not found'};
      }

      const userData = userDoc.data();
      // Determine username: use Firestore username, or currentUser.displayName, or email prefix
      let username = (userData && userData.username) || currentUser.displayName;
      if (!username && currentUser.email) {
        username = currentUser.email.split('@')[0];
      }
      if (!username) {
        return {success: false, error: 'Invalid user data: username missing'};
      }

      // Set userImage using Firestore image or currentUser.photoURL or default
      const userImage =
        (userData && userData.image) ||
        currentUser.photoURL ||
        'default_avatar_url';

      // Create a timestamp first to ensure it's valid
      const timestamp = firestore.FieldValue.serverTimestamp();

      const commentData: Omit<FirestoreComment, 'id'> = {
        userId: currentUser.uid,
        username,
        userImage,
        text: text.trim(),
        likes: 0,
        likedBy: [],
        timestamp,
        editedAt: null,
        replies: [],
      };

      // Use a batch to ensure atomic operations
      const batch = firestore().batch();

      // Create the comment
      const commentRef = postRef.collection('comments').doc();
      batch.set(commentRef , commentData);

      // Update post comment count
      batch.update(postRef, {
        comments: firestore.FieldValue.increment(1),
      });

      // Commit the batch
      await batch.commit();

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

  private async findCommentLocation(
    postId: string,
    commentId: string,
  ): Promise<{
    type: 'main' | 'reply';
    commentRef: FirebaseFirestoreTypes.DocumentReference;
    parentCommentRef?: FirebaseFirestoreTypes.DocumentReference;
  } | null> {
    const postRef = firestore().collection('posts').doc(postId);

    // First check if it's a main comment
    const commentRef = postRef.collection('comments').doc(commentId);
    const commentDoc = await commentRef.get();

    if (commentDoc.exists) {
      return {
        type: 'main',
        commentRef,
      };
    }

    // If not found as main comment, search in replies
    const commentsSnapshot = await postRef.collection('comments').get();

    for (const mainComment of commentsSnapshot.docs) {
      const repliesSnapshot = await mainComment.ref
        .collection('replies')
        .where(firestore.FieldPath.documentId(), '==', commentId)
        .get();

      if (!repliesSnapshot.empty) {
        return {
          type: 'reply',
          commentRef: repliesSnapshot.docs[0].ref,
          parentCommentRef: mainComment.ref,
        };
      }
    }

    return null;
  }

  async likeComment(
    postId: string,
    commentId: string,
  ): Promise<{success: boolean; liked?: boolean; error?: string}> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      const commentLocation = await this.findCommentLocation(postId, commentId);
      if (!commentLocation) {
        return {success: false, error: 'Comment not found'};
      }

      const commentDoc = await commentLocation.commentRef.get();
      const commentData = commentDoc.data();

      if (!commentData) {
        return {success: false, error: 'Comment data not found'};
      }

      const likedBy = commentData.likedBy || [];
      const isLiked = likedBy.includes(currentUser.uid);

      await commentLocation.commentRef.update({
        likedBy: isLiked
          ? firestore.FieldValue.arrayRemove(currentUser.uid)
          : firestore.FieldValue.arrayUnion(currentUser.uid),
        likes: firestore.FieldValue.increment(isLiked ? -1 : 1),
      });

      return {success: true, liked: !isLiked};
    } catch (error) {
      console.error('Error in likeComment:', error);
      return {success: false, error: 'Failed to update like status'};
    }
  }

  async editComment(
    postId: string,
    commentId: string,
    text: string,
  ): Promise<{success: boolean; error?: string}> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      const commentLocation = await this.findCommentLocation(postId, commentId);
      if (!commentLocation) {
        return {success: false, error: 'Comment not found'};
      }

      const commentDoc = await commentLocation.commentRef.get();
      const commentData = commentDoc.data();

      if (!commentData) {
        return {success: false, error: 'Comment data not found'};
      }

      if (commentData.userId !== currentUser.uid) {
        return {success: false, error: 'Not authorized to edit this comment'};
      }

      await commentLocation.commentRef.update({
        text,
        editedAt: firestore.FieldValue.serverTimestamp(),
      });

      return {success: true};
    } catch (error) {
      console.error('Error in editComment:', error);
      return {success: false, error: 'Failed to edit comment'};
    }
  }

  async deleteComment(
    postId: string,
    commentId: string,
  ): Promise<{success: boolean; error?: string}> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      const commentLocation = await this.findCommentLocation(postId, commentId);
      if (!commentLocation) {
        return {success: false, error: 'Comment not found'};
      }

      const commentDoc = await commentLocation.commentRef.get();
      const commentData = commentDoc.data();

      if (!commentData) {
        return {success: false, error: 'Comment data not found'};
      }

      if (commentData.userId !== currentUser.uid) {
        return {success: false, error: 'Not authorized to delete this comment'};
      }

      const postRef = firestore().collection('posts').doc(postId);
      const batch = firestore().batch();

      if (commentLocation.type === 'main') {
        // Delete all replies first
        const repliesSnapshot = await commentLocation.commentRef
          .collection('replies')
          .get();

        repliesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

        // Delete the main comment
        batch.delete(commentLocation.commentRef);

        // Update post comments count
        const replyCount = repliesSnapshot.size;
        await postRef.update({
          comments: firestore.FieldValue.increment(-(replyCount + 1)),
        });
      } else {
        // Delete the reply
        batch.delete(commentLocation.commentRef);

        // Update post comments count
        await postRef.update({
          comments: firestore.FieldValue.increment(-1),
        });
      }

      await batch.commit();
      return {success: true};
    } catch (error) {
      console.error('Error in deleteComment:', error);
      return {success: false, error: 'Failed to delete comment'};
    }
  }

  async addReply(
    postId: string,
    parentCommentId: string,
    text: string,
  ): Promise<{success: boolean; reply?: any; error?: string}> {
    try {
      console.log('Adding reply:', {postId, parentCommentId, text});

      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('No authenticated user found');
        return {success: false, error: 'User not authenticated'};
      }

      // Find the parent comment using our helper
      const commentLocation = await this.findCommentLocation(
        postId,
        parentCommentId,
      );
      if (!commentLocation) {
        console.log('Parent comment not found:', {postId, parentCommentId});
        return {success: false, error: 'Parent comment not found'};
      }

      // Get user data
      const userDoc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .get();

      if (!userDoc.exists) {
        console.log('User data not found for ID:', currentUser.uid);
        return {success: false, error: 'User data not found'};
      }

      const userData = userDoc.data();
      // Determine username: use Firestore username or currentUser.displayName or email prefix
      let username = (userData && userData.username) || currentUser.displayName;
      if (!username && currentUser.email) {
        username = currentUser.email.split('@')[0];
      }
      if (!username) {
        console.log('Invalid user data, no username available:', userData);
        return {success: false, error: 'Invalid user data: username missing'};
      }

      // Set userImage: check Firestore field 'image', otherwise fallback to currentUser.photoURL, else default
      const userImage =
        (userData && userData.image) ||
        currentUser.photoURL ||
        'default_avatar_url';

      // Create timestamp first to ensure it's valid
      const timestamp = firestore.FieldValue.serverTimestamp();

      const replyData = {
        userId: currentUser.uid,
        username,
        userImage,
        text: text.trim(),
        likes: 0,
        likedBy: [],
        timestamp,
        editedAt: null,
      };

      console.log('Creating reply with data:', replyData);

      // Use a batch to ensure atomic operations
      const batch = firestore().batch();

      // Create the reply in the correct location
      const replyRef = commentLocation.commentRef.collection('replies').doc();
      batch.set(replyRef, replyData);

      // Update post comments count
      const postRef = firestore().collection('posts').doc(postId);
      batch.update(postRef, {
        comments: firestore.FieldValue.increment(1),
      });

      // Commit the batch
      await batch.commit();
      console.log('Reply created successfully with ID:', replyRef.id);

      // Return the reply with its ID
      const reply = {
        id: replyRef.id,
        ...replyData,
      };

      return {success: true, reply};
    } catch (error) {
      console.error('Error in addReply:', error);
      return {success: false, error: 'Failed to add reply: ' + error.message};
    }
  }

  async getPostComments(postRef: FirebaseFirestoreTypes.DocumentReference) {
    try {
      const commentsSnapshot = await postRef
        .collection('comments')
        .orderBy('timestamp', 'desc')
        .get();

      const comments = await Promise.all(
        commentsSnapshot.docs.map(
          async (commentDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
            const commentData = commentDoc.data();
            const repliesSnapshot = await commentDoc.ref
              .collection('replies')
              .orderBy('timestamp', 'asc')
              .get();

            const replies = repliesSnapshot.docs.map(
              (replyDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
                id: replyDoc.id,
                ...replyDoc.data(),
              }),
            );

            return {
              id: commentDoc.id,
              ...commentData,
              replies,
            };
          },
        ),
      );

      return comments as FirestoreComment[];
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }
}
