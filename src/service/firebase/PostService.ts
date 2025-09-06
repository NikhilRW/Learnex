import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {LikeCache} from './LikeCache';
import {
  GetPostsResponse,
  LikeResponse,
  SavePostResponse,
  AddCommentResponse,
} from '../../types/responses';
import {CommentService} from './CommentService';
import {SavedPostService} from './SavedPostService';
import {PostQueryService} from './PostQueryService';
import axios from 'axios';

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

      if (!postDoc.exists()) {
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

  // Helper function to extract public_id from Cloudinary URL
  private extractCloudinaryPublicId(
    url: string,
  ): {publicId: string; resourceType: string} | null {
    try {
      if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
        return null;
      }

      // Format: https://res.cloudinary.com/CLOUD_NAME/image|video/upload/v1234567890/folder/public_id.extension
      const urlParts = url.split('/');
      const fileNameWithExtension = urlParts[urlParts.length - 1];
      const publicIdWithoutExtension = fileNameWithExtension.split('.')[0];

      // Determine resource type (image or video)
      const resourceType = url.includes('/image/') ? 'image' : 'video';

      // If the URL has a folder structure, include it in the public_id
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex !== -1 && uploadIndex < urlParts.length - 2) {
        const folderPath = urlParts
          .slice(uploadIndex + 1, urlParts.length - 1)
          .join('/');
        const fullPublicId = `${folderPath}/${publicIdWithoutExtension}`;
        return {publicId: fullPublicId, resourceType};
      }

      return {publicId: publicIdWithoutExtension, resourceType};
    } catch (error) {
      console.error('Error extracting public_id from URL:', error);
      return null;
    }
  }

  async deletePost(postId: string) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      // Get the post to check ownership
      const postRef = firestore().collection('posts').doc(postId);
      const postDoc = await postRef.get();

      if (!postDoc.exists()) {
        return {success: false, error: 'Post not found'};
      }

      // Verify that the current user is the creator of the post
      const postData = postDoc.data();
      if (postData?.user?.id !== currentUser.uid) {
        return {success: false, error: 'Not authorized to delete this post'};
      }

      // Extract media URLs from post data
      const mediaToDelete = [];
      if (postData?.postImages && Array.isArray(postData.postImages)) {
        mediaToDelete.push(...postData.postImages);
      }
      if (postData?.postVideo) {
        mediaToDelete.push(postData.postVideo);
      }

      // Create a batch to delete the post and all its associated data
      const batch = firestore().batch();

      // 1. Delete all comments
      const commentsSnapshot = await postRef.collection('comments').get();
      commentsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // 2. Delete the post itself
      batch.delete(postRef);

      // 3. Commit the batch
      await batch.commit();

      // 4. Delete media from Cloudinary
      if (mediaToDelete.length > 0) {
        try {
          // Process each media URL to extract public_id
          const deletePromises = mediaToDelete.map(async url => {
            const cloudinaryInfo = this.extractCloudinaryPublicId(url);
            if (cloudinaryInfo) {
              const {publicId, resourceType} = cloudinaryInfo;
              console.log(
                `Deleting ${resourceType} from Cloudinary:`,
                publicId.split('/')[1],
              );
              const response = await axios.post(
                `https://learnex-backend.vercel.app/api/cloudinary/delete`,
                {
                  public_id: publicId.split('/')[1],
                },
                {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                },
              );
              if (response.status === 200) {
                console.log(`Successfully deleted media: ${publicId}`);
              } else {
                console.error(
                  `Failed to delete media: ${publicId}`,
                  response.data,
                );
              }
            }
          });
          await Promise.all(deletePromises);
        } catch (error) {
          console.error('Error deleting media files from Cloudinary:', error);
          // Continue with success response as the post was deleted successfully from Firestore
        }
      }

      return {success: true};
    } catch (error) {
      console.log('PostsModule :: deletePost() ::', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete post',
      };
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

      if (!userDoc.exists()) {
        return {success: false, error: 'User document not found'};
      }

      if (!postDoc.exists()) {
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

      if (!userDoc.exists()) {
        return {success: false, error: 'User document not found'};
      }

      if (!postDoc.exists()) {
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

      if (!userDoc.exists()) return false;

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

      if (!userDoc.exists()) {
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
