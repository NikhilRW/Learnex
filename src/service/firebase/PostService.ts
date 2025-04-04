import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {LikeCache} from './LikeCache';
import {
  GetPostsResponse,
  LikeResponse,
  SavePostResponse,
  AddCommentResponse,
} from '../../types/authTypes';
import {CommentService} from './CommentService';
import {SavedPostService} from './SavedPostService';
import {PostQueryService} from './PostQueryService';

export class PostService {
  constructor(
    private likeCache: LikeCache,
    private commentService: CommentService,
    private savedPostService: SavedPostService,
    private queryService: PostQueryService,
  ) {}

  async likePost(postId: string): Promise<LikeResponse> {
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

      const postData = postDoc.data();
      const likedBy = postData?.likedBy || [];
      const isLiked = likedBy.includes(currentUser.uid);

      if (isLiked) {
        await postRef.update({
          likedBy: firestore.FieldValue.arrayRemove(currentUser.uid),
          likes: firestore.FieldValue.increment(-1),
        });
        const newLikedBy = likedBy.filter(
          (id: string) => id !== currentUser.uid,
        );
        this.likeCache.setPostLikes(postId, newLikedBy);
        return {success: true, liked: false};
      } else {
        await postRef.update({
          likedBy: firestore.FieldValue.arrayUnion(currentUser.uid),
          likes: firestore.FieldValue.increment(1),
        });
        const newLikedBy = [...likedBy, currentUser.uid];
        this.likeCache.setPostLikes(postId, newLikedBy);
        return {success: true, liked: true};
      }
    } catch (error) {
      console.error('Error in likePost:', error);
      return {success: false, error: 'Failed to update like status'};
    }
  }

  async savePost(postId: string): Promise<SavePostResponse> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      const userRef = firestore().collection('users').doc(currentUser.uid);
      const postRef = firestore().collection('posts').doc(postId);

      const [userDoc, postDoc] = await Promise.all([
        userRef.get(),
        postRef.get(),
      ]);

      if (!userDoc.exists) {
        return {success: false, error: 'User document not found'};
      }

      if (!postDoc.exists) {
        return {success: false, error: 'Post not found'};
      }

      return await this.savedPostService.savePost(postId);
    } catch (error) {
      console.error('Error in savePost:', error);
      return {success: false, error: 'Failed to save post'};
    }
  }

  isPostSaved(postId: string): boolean {
    return this.savedPostService.isPostSaved(postId);
  }

  async addComment(postId: string, text: string): Promise<AddCommentResponse> {
    return this.commentService.addComment(postId, text);
  }

  getPosts(options = {}): Promise<GetPostsResponse> {
    return this.queryService.getPosts(options);
  }
  getPostsBySearch(searchText: string): Promise<GetPostsResponse> {
    return this.queryService.getPostsBySearch(searchText);
  }
  subscribeToPostUpdates(callback: (posts: any[]) => void): () => void {
    return this.queryService.subscribeToPostUpdates(callback);
  }

  subscribeToLikes(postId: string, callback: () => void): () => void {
    return this.likeCache.subscribeToLikes(postId, callback);
  }

  isPostLiked(postId: string): boolean | null {
    const currentUser = auth().currentUser;
    if (!currentUser) return false;
    return this.likeCache.isLikedByUser(postId, currentUser.uid);
  }

  cleanup() {
    this.likeCache.clear();
    this.queryService.cleanup();
    this.savedPostService.cleanup();
  }

  async likeComment(
    postId: string,
    commentId: string,
  ): Promise<{success: boolean; error?: string}> {
    return this.commentService.likeComment(postId, commentId);
  }

  async editComment(
    postId: string,
    commentId: string,
    text: string,
  ): Promise<{success: boolean; error?: string}> {
    return this.commentService.editComment(postId, commentId, text);
  }

  async deleteComment(
    postId: string,
    commentId: string,
  ): Promise<{success: boolean; error?: string}> {
    return this.commentService.deleteComment(postId, commentId);
  }

  async addReply(
    postId: string,
    parentCommentId: string,
    text: string,
  ): Promise<{success: boolean; reply?: any; error?: string}> {
    return this.commentService.addReply(postId, parentCommentId, text);
  }

  private prepareSearchKeywords(text: string): string[] {
    return [
      ...new Set(
        text
          .toLowerCase()
          .split(/\s+/)
          .map(word => word.replace(/[^\w\s]/g, ''))
          .filter(word => word.length > 0),
      ),
    ];
  }

  /**
   * Hide a post by adding it to the user's blockedPosts collection
   * This prevents the post from appearing in the user's feed
   * @param postId The ID of the post to hide
   * @returns Success status and optional error message
   */
  async hidePost(postId: string): Promise<{success: boolean; error?: string}> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      const userRef = firestore().collection('users').doc(currentUser.uid);
      const postRef = firestore().collection('posts').doc(postId);

      const [userDoc, postDoc] = await Promise.all([
        userRef.get(),
        postRef.get(),
      ]);

      if (!userDoc.exists) {
        return {success: false, error: 'User document not found'};
      }

      if (!postDoc.exists) {
        return {success: false, error: 'Post not found'};
      }

      // Create blockedPosts collection if it doesn't exist already
      const blockedPostsRef = userRef.collection('blockedPosts');

      // Add the post to blockedPosts collection
      await blockedPostsRef.doc(postId).set({
        blockedAt: firestore.FieldValue.serverTimestamp(),
        postId: postId,
        postCreatorId: postDoc.data()?.user?.id || '',
      });

      // Also add to blockedPostIds field in user document for efficient querying
      await userRef.update({
        blockedPostIds: firestore.FieldValue.arrayUnion(postId),
      });

      return {success: true};
    } catch (error) {
      console.error('Error in hidePost:', error);
      return {success: false, error: 'Failed to hide post'};
    }
  }

  /**
   * Check if a post is hidden by the current user
   * @param postId The ID of the post to check
   * @returns Boolean indicating if the post is hidden
   */
  async isPostHidden(postId: string): Promise<boolean> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return false;

      const userRef = firestore().collection('users').doc(currentUser.uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) return false;

      const userData = userDoc.data();
      const blockedPostIds = userData?.blockedPostIds || [];

      return blockedPostIds.includes(postId);
    } catch (error) {
      console.error('Error checking if post is hidden:', error);
      return false;
    }
  }

  /**
   * Unhide a post by removing it from the user's blockedPosts collection
   * This allows the post to appear in the user's feed again
   * @param postId The ID of the post to unhide
   * @returns Success status and optional error message
   */
  async unhidePost(
    postId: string,
  ): Promise<{success: boolean; error?: string}> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      const userRef = firestore().collection('users').doc(currentUser.uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return {success: false, error: 'User document not found'};
      }

      // Remove from blockedPosts collection
      const blockedPostRef = userRef.collection('blockedPosts').doc(postId);
      await blockedPostRef.delete();

      // Also remove from blockedPostIds array
      await userRef.update({
        blockedPostIds: firestore.FieldValue.arrayRemove(postId),
      });

      return {success: true};
    } catch (error) {
      console.error('Error in unhidePost:', error);
      return {success: false, error: 'Failed to unhide post'};
    }
  }
}
