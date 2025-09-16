import {getAuth} from '@react-native-firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  query,
  orderBy,
  FirebaseFirestoreTypes,
  writeBatch,
} from '@react-native-firebase/firestore';
import {FirestoreComment, AddCommentResponse} from '@/features/Home/types/post';
import {convertFirestoreComment} from '../../shared/service/utils';

export class CommentService {
  async addComment(postId: string, text: string): Promise<AddCommentResponse> {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      const db = getFirestore();
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        return {success: false, error: 'Post not found'};
      }

      // Use the document with currentUser.uid to retrieve user data
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

      if (!userDoc.exists()) {
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
      const timestamp = serverTimestamp();

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
      const batch = writeBatch(getFirestore());

      // Create the comment
      const commentsCol = collection(postRef, 'comments');
      const commentRef = doc(commentsCol);
      batch.set(
        commentRef as unknown as FirebaseFirestoreTypes.DocumentReference,
        commentData,
      );

      // Update post comment count
      batch.update(
        postRef as unknown as FirebaseFirestoreTypes.DocumentReference,
        {
          comments: increment(1),
        },
      );

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
    try {
      console.log(
        `Finding comment location for postId: ${postId}, commentId: ${commentId}`,
      );
      const db = getFirestore();
      const postRef = doc(db, 'posts', postId);

      // Check if post exists
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) {
        console.error(`Post with ID ${postId} does not exist`);
        return null;
      }

      // First check if it's a main comment
      const commentRef = doc(collection(postRef, 'comments'), commentId);
      const commentDoc = await getDoc(commentRef);

      if (commentDoc.exists()) {
        console.log(`Found main comment with ID ${commentId}`);
        return {
          type: 'main',
          commentRef,
        };
      }

      // If not found as main comment, search in replies
      console.log(
        `Comment ${commentId} not found as main comment, searching in replies...`,
      );

      // Get all main comments
      const commentsSnapshot = await getDocs(collection(postRef, 'comments'));
      console.log(
        `Found ${commentsSnapshot.size} main comments to search through`,
      );

      // Improved reply search - iterate through each main comment and check its replies collection
      for (const mainComment of commentsSnapshot.docs) {
        const mainCommentRef = mainComment.ref;

        // Look for the reply directly in this comment's replies collection
        const replyRef = doc(collection(mainCommentRef, 'replies'), commentId);
        const replyDoc = await getDoc(replyRef);

        if (replyDoc.exists()) {
          console.log(
            `Found reply with ID ${commentId} under main comment ${mainComment.id}`,
          );
          return {
            type: 'reply',
            commentRef: replyRef,
            parentCommentRef: mainCommentRef,
          };
        }
      }

      console.error(`Comment ${commentId} not found as main comment or reply`);
      return null;
    } catch (error) {
      console.error('Error in findCommentLocation:', error);
      return null;
    }
  }

  async likeComment(
    postId: string,
    commentId: string,
  ): Promise<{success: boolean; liked?: boolean; error?: string}> {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      const commentLocation = await this.findCommentLocation(postId, commentId);
      if (!commentLocation) {
        return {success: false, error: 'Comment not found'};
      }

      const commentDoc = await getDoc(
        commentLocation.commentRef as unknown as FirebaseFirestoreTypes.DocumentReference,
      );
      const commentData = commentDoc.data() as any;

      if (!commentData) {
        return {success: false, error: 'Comment data not found'};
      }

      const likedBy = commentData.likedBy || [];
      const isLiked = likedBy.includes(currentUser.uid);

      await updateDoc(
        commentLocation.commentRef as unknown as FirebaseFirestoreTypes.DocumentReference,
        {
          likedBy: isLiked
            ? arrayRemove(currentUser.uid)
            : arrayUnion(currentUser.uid),
          likes: increment(isLiked ? -1 : 1),
        },
      );

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
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      const commentLocation = await this.findCommentLocation(postId, commentId);
      if (!commentLocation) {
        return {success: false, error: 'Comment not found'};
      }

      const commentDoc = await getDoc(
        commentLocation.commentRef as unknown as FirebaseFirestoreTypes.DocumentReference,
      );
      const commentData = commentDoc.data() as any;

      if (!commentData) {
        return {success: false, error: 'Comment data not found'};
      }

      if (commentData.userId !== currentUser.uid) {
        return {success: false, error: 'Not authorized to edit this comment'};
      }

      await updateDoc(
        commentLocation.commentRef as unknown as FirebaseFirestoreTypes.DocumentReference,
        {
          text,
          editedAt: serverTimestamp(),
        },
      );

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
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      const commentLocation = await this.findCommentLocation(postId, commentId);
      if (!commentLocation) {
        return {success: false, error: 'Comment not found'};
      }

      const commentDoc = await getDoc(
        commentLocation.commentRef as unknown as FirebaseFirestoreTypes.DocumentReference,
      );
      const commentData = commentDoc.data() as any;

      if (!commentData) {
        return {success: false, error: 'Comment data not found'};
      }

      if (commentData.userId !== currentUser.uid) {
        return {success: false, error: 'Not authorized to delete this comment'};
      }

      const db = getFirestore();
      const postRef = doc(db, 'posts', postId);
      const batch = writeBatch(getFirestore());

      if (commentLocation.type === 'main') {
        // Delete all replies first
        const repliesSnapshot = await getDocs(
          collection(
            commentLocation.commentRef as unknown as FirebaseFirestoreTypes.DocumentReference,
            'replies',
          ),
        );

        repliesSnapshot.docs.forEach(
          (docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
            batch.delete(
              docSnap.ref as unknown as FirebaseFirestoreTypes.DocumentReference,
            ),
        );

        // Delete the main comment
        batch.delete(
          commentLocation.commentRef as unknown as FirebaseFirestoreTypes.DocumentReference,
        );

        // Update post comments count
        const replyCount = repliesSnapshot.size;
        await updateDoc(postRef, {
          comments: increment(-(replyCount + 1)),
        });
      } else {
        // Delete the reply
        batch.delete(
          commentLocation.commentRef as unknown as FirebaseFirestoreTypes.DocumentReference,
        );

        // Update post comments count
        await updateDoc(postRef, {
          comments: increment(-1),
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

      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        console.log('No authenticated user found');
        return {success: false, error: 'User not authenticated'};
      }

      // Verify the post exists
      const db = getFirestore();
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) {
        console.error(`Post with ID ${postId} does not exist`);
        return {success: false, error: 'Post not found'};
      }

      // Directly verify the parent comment exists instead of using findCommentLocation
      const parentCommentRef = doc(
        collection(postRef, 'comments'),
        parentCommentId,
      );
      const parentCommentDoc = await getDoc(parentCommentRef);

      if (!parentCommentDoc.exists()) {
        console.error(
          `Parent comment with ID ${parentCommentId} does not exist`,
        );
        return {success: false, error: 'Parent comment not found'};
      }

      // Get user data
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

      if (!userDoc.exists()) {
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
      const timestamp = serverTimestamp();

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
      const batch = getFirestore().batch();

      // Create the reply directly under the parent comment's replies collection
      const replyRef = doc(collection(parentCommentRef, 'replies'));
      batch.set(
        replyRef as unknown as FirebaseFirestoreTypes.DocumentReference,
        replyData,
      );

      // Update post comments count
      batch.update(
        postRef as unknown as FirebaseFirestoreTypes.DocumentReference,
        {
          comments: increment(1),
        },
      );

      // Commit the batch
      await batch.commit();
      console.log('Reply created successfully with ID:', replyRef.id);

      // Return the reply with its ID and a fixed timestamp
      const reply = {
        id: replyRef.id,
        userId: currentUser.uid,
        username,
        userImage,
        text: text.trim(),
        likes: 0,
        likedBy: [],
        timestamp: 'just now', // Use fixed string instead of timestamp
        editedAt: null,
        isLiked: false,
        replies: [],
      };

      return {success: true, reply};
    } catch (error) {
      console.error('Error in addReply:', error);
      return {
        success: false,
        error:
          'Failed to add reply' +
          (error && (error as any).message
            ? `: ${(error as any).message}`
            : ''),
      };
    }
  }

  async getPostComments(postRef: FirebaseFirestoreTypes.DocumentReference) {
    try {
      const commentsRef = collection(postRef, 'comments');
      const commentsQuery = query(commentsRef, orderBy('timestamp', 'desc'));
      const commentsSnapshot = await getDocs(commentsQuery);

      const comments = await Promise.all(
        commentsSnapshot.docs.map(
          async (commentDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
            const commentData = commentDoc.data();
            const repliesRef = collection(commentDoc.ref, 'replies');
            const repliesQuery = query(repliesRef, orderBy('timestamp', 'asc'));
            const repliesSnapshot = await getDocs(repliesQuery);

            // Convert replies with proper timestamp formatting
            const replies = repliesSnapshot.docs.map(
              (replyDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
                const replyData = replyDoc.data();
                return convertFirestoreComment({
                  id: replyDoc.id,
                  userId: replyData.userId,
                  username: replyData.username,
                  userImage: replyData.userImage,
                  text: replyData.text,
                  likes: replyData.likes || 0,
                  likedBy: replyData.likedBy || [],
                  timestamp: replyData.timestamp,
                  editedAt: replyData.editedAt || null,
                });
              },
            );

            // Convert main comment with proper timestamp formatting
            return convertFirestoreComment({
              id: commentDoc.id,
              userId: commentData.userId,
              username: commentData.username,
              userImage: commentData.userImage,
              text: commentData.text,
              likes: commentData.likes || 0,
              likedBy: commentData.likedBy || [],
              timestamp: commentData.timestamp,
              editedAt: commentData.editedAt || null,
              replies,
            });
          },
        ),
      );

      return comments;
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }
}
