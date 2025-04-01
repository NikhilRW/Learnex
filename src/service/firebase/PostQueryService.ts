import auth from '@react-native-firebase/auth';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {GetPostsResponse} from '../../types/firebase';
import {FirestorePost} from '../../types/post';
import {convertFirestorePost} from './utils';
import {CommentService} from './CommentService';
import {SavedPostService} from './SavedPostService';
import {LikeCache} from './LikeCache';

export class PostQueryService {
  private activeListeners: Map<string, () => void> = new Map();
  private queryCache: Map<string, any[]> = new Map();
  private readonly QUERY_CACHE_TTL = 30 * 1000; // 30 seconds TTL
  private queryCacheTimestamps: Map<string, number> = new Map();

  constructor(
    private commentService: CommentService,
    private savedPostService: SavedPostService,
    private likeCache: LikeCache,
  ) {}

  private getCacheKey(query: any): string {
    return JSON.stringify(query);
  }

  private isQueryCacheValid(cacheKey: string): boolean {
    const timestamp = this.queryCacheTimestamps.get(cacheKey);
    return timestamp ? Date.now() - timestamp < this.QUERY_CACHE_TTL : false;
  }

  subscribeToPostUpdates(callback: (posts: any[]) => void): () => void {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    const unsubscribe = firestore()
      .collection('posts')
      .orderBy('timestamp', 'desc')
      .onSnapshot(
        async snapshot => {
          try {
            if (!snapshot) {
              console.warn(
                'PostQueryService: Received null snapshot in posts listener',
              );
              return;
            }

            const posts = await Promise.all(
              snapshot.docs.map(async doc => {
                const postData = {id: doc.id, ...doc.data()} as FirestorePost;
                const likedBy = postData.likedBy || [];

                // Get comments using CommentService
                const comments = await this.commentService.getPostComments(
                  doc.ref,
                );
                postData.commentsList = comments;
                postData.comments = comments.length;

                this.likeCache.setPostLikes(doc.id, likedBy);
                const post = convertFirestorePost(postData, currentUser.uid);
                post.isSaved = this.savedPostService.isPostSaved(doc.id);
                return post;
              }),
            );

            callback(posts);
          } catch (error) {
            console.error(
              'PostQueryService: Error processing posts snapshot:',
              error,
            );
          }
        },
        error => {
          console.error('PostQueryService: Error in posts listener:', error);
        },
      );

    this.activeListeners.set('posts', unsubscribe);
    return () => {
      unsubscribe();
      this.activeListeners.delete('posts');
    };
  }

  async getPosts(
    options: {
      lastVisible?: any;
      limit?: number;
      userId?: string;
      hashtag?: string;
      likedByUser?: string;
      timeRange?: 'day' | 'week' | 'month' | 'year';
    } = {},
  ): Promise<GetPostsResponse> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const {
        lastVisible,
        limit = 10,
        userId,
        hashtag,
        likedByUser,
        timeRange,
      } = options;

      const cacheKey = this.getCacheKey({
        lastVisible: lastVisible?.id,
        limit,
        userId,
        hashtag,
        likedByUser,
        timeRange,
      });

      if (this.isQueryCacheValid(cacheKey)) {
        const cachedPosts = this.queryCache.get(cacheKey);
        if (cachedPosts) {
          return {success: true, posts: cachedPosts, lastVisible};
        }
      }

      let query: FirebaseFirestoreTypes.Query<FirebaseFirestoreTypes.DocumentData> =
        firestore().collection('posts');

      if (userId) {
        query = query.where('user.id', '==', userId);
      }

      if (likedByUser) {
        query = query.where('likedBy', 'array-contains', likedByUser);
      }

      if (hashtag) {
        query = query.where('hashtags', 'array-contains', hashtag);
      }

      if (timeRange) {
        const now = new Date();
        let startDate = new Date();
        switch (timeRange) {
          case 'day':
            startDate.setDate(now.getDate() - 1);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        query = query.where('timestamp', '>=', startDate);
      }

      query = query.orderBy('timestamp', 'desc');

      if (lastVisible) {
        query = query.startAfter(lastVisible);
      }

      query = query.limit(limit);

      const postsSnapshot = await query.get();
      const lastVisibleDoc = postsSnapshot.docs[postsSnapshot.docs.length - 1];

      const posts = await Promise.all(
        postsSnapshot.docs.map(async doc => {
          const postData = {id: doc.id, ...doc.data()} as FirestorePost;
          const likedBy = postData.likedBy || [];

          const comments = await this.commentService.getPostComments(doc.ref);
          postData.commentsList = comments;
          postData.comments = comments.length;

          this.likeCache.setPostLikes(doc.id, likedBy);
          return convertFirestorePost(postData, currentUser.uid);
        }),
      );

      this.queryCache.set(cacheKey, posts);
      this.queryCacheTimestamps.set(cacheKey, Date.now());

      return {success: true, posts, lastVisible: lastVisibleDoc};
    } catch (error) {
      console.error('PostQueryService :: getPosts() ::', error);
      return {success: false, error: 'Failed to fetch posts'};
    }
  }

  async getPostsBySearch(searchText: string): Promise<GetPostsResponse> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const cacheKey = this.getCacheKey({
        type: 'search',
        searchText: searchText.toLowerCase(),
      });

      if (this.isQueryCacheValid(cacheKey)) {
        const cachedPosts = this.queryCache.get(cacheKey);
        if (cachedPosts) {
          return {success: true, posts: cachedPosts, lastVisible: null};
        }
      }

      const searchWords = searchText
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 0);

      let query:any = firestore().collection('posts');

      if (searchWords.length > 0) {
        // Use array-contains-any to match any of the search words
        query = query.where(
          'searchKeywords',
          'array-contains-any',
          searchWords,
        );
      }

      query = query.orderBy('timestamp', 'desc').limit(20);

      const postsSnapshot = await query.get();
      const lastVisibleDoc = postsSnapshot.docs[postsSnapshot.docs.length - 1];

      const posts = await Promise.all(
        postsSnapshot.docs.map(async doc  => {
          const postData = {id: doc.id, ...doc.data()} as FirestorePost;
          const likedBy = postData.likedBy || [];
          const comments = await this.commentService.getPostComments(doc.ref);
          postData.commentsList = comments;
          postData.comments = comments.length;
          this.likeCache.setPostLikes(doc.id, likedBy);
          return convertFirestorePost(postData, currentUser.uid);
        }),
      );

      this.queryCache.set(cacheKey, posts);
      this.queryCacheTimestamps.set(cacheKey, Date.now());

      return {success: true, posts, lastVisible: lastVisibleDoc};
    } catch (error) {
      console.error('PostQueryService :: getPostsBySearch ::', error);
      return {success: false, error: 'Failed to fetch posts'};
    }
  }

  cleanup() {
    this.queryCache.clear();
    this.queryCacheTimestamps.clear();
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners.clear();
  }
}
