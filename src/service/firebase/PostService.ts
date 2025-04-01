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
  getPostsBySearch(searchText:string): Promise<GetPostsResponse> {
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
}
