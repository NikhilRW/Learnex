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

      // Add a small delay to ensure Firestore has indexed the new posts
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Fetching all posts...');
      const postsRef = firestore().collection('posts');
      console.log('Posts collection reference:', postsRef.path);

      const query = postsRef.orderBy('timestamp', 'desc');
      console.log('Query:', query);

      const postsSnapshot = await query.get();
      console.log(`Found ${postsSnapshot.size} posts in Firestore`);

      if (postsSnapshot.empty) {
        console.log('No posts found in Firestore');
        return {success: true, posts: []};
      }

    console.log('Iterating through posts...');
      const allPosts = postsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(
            `\nRaw post data for ${doc.id}:`,
            JSON.stringify(data, null, 2),
        );
        // Ensure hashtags are properly extracted
        const post = {
            id: doc.id,
            ...data,
            hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
        } as FirestorePost;
        console.log(`Processed post ${doc.id}:`, {
            hashtags: post.hashtags,
            hasHashtags: Array.isArray(post.hashtags) && post.hashtags.length > 0,
            description: post.description,
        });
        return post;
      });
      console.log('allPosts', allPosts);

      console.log('\nConverting posts to PostType...');
      const posts = allPosts
        .filter(post => {
          const hasHashtags =
            Array.isArray(post.hashtags) && post.hashtags.length > 0;
          console.log(`\nPost ${post.id} hashtag check:`, {
            hasHashtags,
            hashtags: post.hashtags,
            isArray: Array.isArray(post.hashtags),
            length: post.hashtags?.length,
          });
          return hasHashtags;
        })
        .map(post => {
          const converted = convertFirestorePost(post, currentUser.uid);
          console.log(`Converted post ${post.id}:`, {
            hashtags: converted.hashtags,
            engagement: converted.likes + converted.comments,
            description: converted.description,
          });
          return converted;
        })
        .sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
        .slice(0, limit);

      console.log('\nFinal processed posts:', posts.length);
      posts.forEach(post => {
        console.log('\nFinal post data:', {
          id: post.id,
          hashtags: post.hashtags,
          engagement: post.likes + post.comments,
          description: post.description,
        });
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
