import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {GetPostsResponse} from '../../types/firebase';
import {FirestorePost} from '../../types/post';
import {convertFirestorePost} from './utils';

export class TrendingService {
  private queryCache: Map<string, any[]> = new Map();
  private readonly QUERY_CACHE_TTL = 30 * 1000; // 30 seconds TTL
  private queryCacheTimestamps: Map<string, number> = new Map();

  private getCacheKey(query: any): string {
    return JSON.stringify(query);
  }

  private isQueryCacheValid(cacheKey: string): boolean {
    const timestamp = this.queryCacheTimestamps.get(cacheKey);
    return timestamp ? Date.now() - timestamp < this.QUERY_CACHE_TTL : false;
  }

  async getTrendingPosts(
    timeRange: 'day' | 'week' = 'day',
    limit = 10,
  ): Promise<GetPostsResponse> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      const cacheKey = `trending_${timeRange}_${limit}`;

      if (this.isQueryCacheValid(cacheKey)) {
        const cachedPosts = this.queryCache.get(cacheKey);
        if (cachedPosts) {
          return {success: true, posts: cachedPosts};
        }
      }

      const startDate = new Date();
      if (timeRange === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setDate(startDate.getDate() - 1);
      }

      const postsSnapshot = await firestore()
        .collection('posts')
        .where('timestamp', '>=', startDate)
        .orderBy('timestamp', 'desc')
        .orderBy('likes', 'desc')
        .limit(limit)
        .get();

      const posts = postsSnapshot.docs.map(doc => {
        const postData = {id: doc.id, ...doc.data()} as FirestorePost;
        return convertFirestorePost(postData, currentUser.uid);
      });

      // Update cache
      this.queryCache.set(cacheKey, posts);
      this.queryCacheTimestamps.set(cacheKey, Date.now());

      return {success: true, posts};
    } catch (error) {
      console.error('TrendingService :: getTrendingPosts() ::', error);
      return {success: false, error: 'Failed to fetch trending posts'};
    }
  }

  async getPostsByHashtag(
    hashtag: string,
    limit = 10,
  ): Promise<GetPostsResponse & {engagementRate?: number}> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      const cacheKey = `hashtag_${hashtag}_${limit}`;

      if (this.isQueryCacheValid(cacheKey)) {
        const cachedPosts = this.queryCache.get(cacheKey);
        if (cachedPosts) {
          return {success: true, posts: cachedPosts};
        }
      }

      const postsSnapshot = await firestore()
        .collection('posts')
        .where('hashtags', 'array-contains', hashtag)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const posts = postsSnapshot.docs.map(doc => {
        const postData = {id: doc.id, ...doc.data()} as FirestorePost;
        return convertFirestorePost(postData, currentUser.uid);
      });

      // Calculate engagement rate
      const totalEngagement = posts.reduce(
        (sum, post) => sum + post.likes + post.comments,
        0,
      );
      const engagementRate = totalEngagement / (posts.length || 1);

      // Update cache
      this.queryCache.set(cacheKey, posts);
      this.queryCacheTimestamps.set(cacheKey, Date.now());

      return {success: true, posts, engagementRate};
    } catch (error) {
      console.error('TrendingService :: getPostsByHashtag() ::', error);
      return {success: false, error: 'Failed to fetch posts by hashtag'};
    }
  }

  cleanup() {
    this.queryCache.clear();
    this.queryCacheTimestamps.clear();
  }
}
