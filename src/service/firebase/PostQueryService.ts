import {getAuth} from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {GetPostsResponse} from 'shared/types/firebase';
import {FirestorePost} from '@/features/Home/types/post';
import {convertFirestorePost} from '../../shared/service/utils';
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
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        console.error('Cannot subscribe to posts: User not authenticated');
        return () => {};
      }

      // Get the user ref - we'll need this for blocked posts
      const userRef = doc(collection(getFirestore(), 'users'), currentUser.uid);

      // Setup the subscription
      const unsubscribe = onSnapshot(
        query(
          collection(getFirestore(), 'posts'),
          orderBy('timestamp', 'desc'),
          limit(10),
        ),
        async (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
          try {
            // Get the latest blocked post IDs on each update
            const userDoc = await getDoc(userRef);
            const blockedPostIds = userDoc.exists()
              ? userDoc.data()?.blockedPostIds || []
              : [];

            const postsPromises = snapshot.docs
              .filter(doc => !blockedPostIds.includes(doc.id)) // Filter out blocked posts
              .map(async doc => {
                const postData = {id: doc.id, ...doc.data()} as FirestorePost;
                const likedBy = postData.likedBy || [];
                const comments = await this.commentService.getPostComments(
                  doc.ref,
                );
                postData.commentsList = comments;
                postData.comments = comments.length;
                this.likeCache.setPostLikes(doc.id, likedBy);
                const post = convertFirestorePost(postData, currentUser.uid);
                post.isSaved = this.savedPostService.isPostSaved(doc.id);
                return post;
              });

            const posts = await Promise.all(postsPromises);
            callback(posts);
          } catch (error) {
            console.error(
              'PostQueryService: Error processing posts snapshot:',
              error,
            );
          }
        },
        error => {
          console.error(
            'PostQueryService: Error in posts subscription:',
            error,
          );
        },
      );

      // Store the unsubscribe function
      this.activeListeners.set('posts', unsubscribe);
      return () => {
        unsubscribe();
        this.activeListeners.delete('posts');
      };
    } catch (error) {
      console.error(
        'PostQueryService: Error setting up posts subscription:',
        error,
      );
      return () => {};
    }
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
      const currentUser = getAuth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Get the user's blocked post IDs
      const userRef = doc(collection(getFirestore(), 'users'), currentUser.uid);
      const userDoc = await getDoc(userRef);
      const blockedPostIds = userDoc.exists()
        ? userDoc.data()?.blockedPostIds || []
        : [];

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
          // Filter out blocked posts from cache
          const filteredPosts = cachedPosts.filter(
            post => !blockedPostIds.includes(post.id),
          );
          return {success: true, posts: filteredPosts, lastVisible};
        }
      }

      let postsQuery = query(collection(getFirestore(), 'posts'));

      if (userId) {
        postsQuery = query(
          collection(getFirestore(), 'posts'),
          where('user.id', '==', userId),
        );
      }

      if (likedByUser) {
        postsQuery = query(
          collection(getFirestore(), 'posts'),
          where('likedBy', 'array-contains', likedByUser),
        );
      }

      // Special handling for hashtag search
      let postsWithHashtagInDesc: PostType[] = [];
      let hashtagArrayPostIds: Set<string> = new Set();

      if (hashtag) {
        // If searching by hashtag, we need to handle two queries:
        // 1. Posts with hashtag in the hashtags array
        // 2. Posts with hashtag in the description

        // First, get posts with hashtag in hashtags array
        const hashtagArrayQuery = query(
          collection(getFirestore(), 'posts'),
          where('hashtags', 'array-contains', hashtag),
          orderBy('timestamp', 'desc'),
          limit(limit),
        );

        const hashtagArraySnapshot = await getDocs(hashtagArrayQuery);

        const hashtagArrayPosts = hashtagArraySnapshot.docs.map(doc => {
          const data = doc.data();
          hashtagArrayPostIds.add(doc.id); // Track IDs to avoid duplicates

          return {
            id: doc.id,
            ...data,
          };
        });

        // Second, look for hashtag in descriptions (only if we didn't fill the limit)
        if (hashtagArrayPosts.length < limit) {
          const descQuery = query(
            collection(getFirestore(), 'posts'),
            orderBy('timestamp', 'desc'),
            limit(limit * 2), // Get more to filter
          );

          const descQuerySnapshot = await getDocs(descQuery);

          postsWithHashtagInDesc = descQuerySnapshot.docs
            .filter(doc => {
              // Skip if already in array-contains results
              if (hashtagArrayPostIds.has(doc.id)) return false;

              // Check description for hashtag
              const data = doc.data();
              return (data.description || '').includes(`#${hashtag}`);
            })
            .map(doc => {
              return {
                id: doc.id,
                ...doc.data(),
              };
            });
        }

        // Process results after all queries
        let snapshot;
        if (postsWithHashtagInDesc.length > 0) {
          // We need to combine results and sort them
          const allPosts = [...hashtagArrayPosts, ...postsWithHashtagInDesc];

          // Convert to PostType and filter blocked
          const postsData = allPosts
            .sort((a, b) => {
              // Sort by timestamp descending
              return b.timestamp?.seconds - a.timestamp?.seconds;
            })
            .slice(0, limit) // Limit to requested number
            .filter(post => !blockedPostIds.includes(post.id))
            .map(postData => {
              return convertFirestorePost(
                postData as FirestorePost,
                currentUser.uid,
              );
            });

          const lastDoc =
            allPosts.length > 0 ? allPosts[allPosts.length - 1] : null;

          // Update cache
          this.queryCache.set(cacheKey, postsData);
          this.queryCacheTimestamps.set(cacheKey, Date.now());

          return {
            success: true,
            posts: postsData,
            lastVisible: lastDoc,
          };
        } else {
          snapshot = hashtagArraySnapshot;
        }
      } else {
        // Handle normal query without hashtag
        const queryConstraints = [orderBy('timestamp', 'desc'), limit(limit)];

        if (timeRange) {
          // Add time range filter if specified
          const rangeStart = this.getTimeRangeStart(timeRange);
          queryConstraints.unshift(where('timestamp', '>=', rangeStart));
        }

        postsQuery = query(
          collection(getFirestore(), 'posts'),
          ...queryConstraints,
        );

        const snapshot = await getDocs(postsQuery);

        // Process query results
        const postsData = snapshot.docs
          .filter(doc => !blockedPostIds.includes(doc.id))
          .map(doc => {
            const postData = {id: doc.id, ...doc.data()} as FirestorePost;
            return convertFirestorePost(postData, currentUser.uid);
          });

        const lastDoc =
          snapshot.docs.length > 0
            ? snapshot.docs[snapshot.docs.length - 1]
            : null;

        // Update cache
        this.queryCache.set(cacheKey, postsData);
        this.queryCacheTimestamps.set(cacheKey, Date.now());

        return {
          success: true,
          posts: postsData,
          lastVisible: lastDoc,
        };
      }
    } catch (error) {
      console.error('Error getting posts:', error);
      return {success: false, error: 'Failed to fetch posts'};
    }
  }

  async getPostsBySearch(searchText: string): Promise<GetPostsResponse> {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Get the user's blocked post IDs
      const userRef = doc(collection(getFirestore(), 'users'), currentUser.uid);
      const userDoc = await getDoc(userRef);
      const blockedPostIds = userDoc.exists()
        ? userDoc.data()?.blockedPostIds || []
        : [];

      const cacheKey = this.getCacheKey({
        type: 'search',
        searchText: searchText.toLowerCase(),
      });

      if (this.isQueryCacheValid(cacheKey)) {
        const cachedPosts = this.queryCache.get(cacheKey);
        if (cachedPosts) {
          // Filter out blocked posts from cache
          const filteredPosts = cachedPosts.filter(
            post => !blockedPostIds.includes(post.id),
          );
          return {success: true, posts: filteredPosts, lastVisible: null};
        }
      }

      const searchWords = searchText
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 0);

      let postsQuery = query(collection(getFirestore(), 'posts'));

      if (searchWords.length > 0) {
        // Use array-contains-any to match any of the search words
        postsQuery = query(
          collection(getFirestore(), 'posts'),
          where('searchKeywords', 'array-contains-any', searchWords),
          orderBy('timestamp', 'desc'),
          limit(20),
        );
      } else {
        postsQuery = query(
          collection(getFirestore(), 'posts'),
          orderBy('timestamp', 'desc'),
          limit(20),
        );
      }

      const postsSnapshot = await getDocs(postsQuery);
      const lastVisibleDoc = postsSnapshot.docs[postsSnapshot.docs.length - 1];

      const posts = await Promise.all(
        postsSnapshot.docs
          .filter(doc => !blockedPostIds.includes(doc.id)) // Filter out blocked posts
          .map(async doc => {
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

  // Helper function to determine the start date for a time range filter
  private getTimeRangeStart(
    timeRange: 'day' | 'week' | 'month' | 'year',
  ): Date {
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

    return startDate;
  }
}
