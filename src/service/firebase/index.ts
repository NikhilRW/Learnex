import {AuthService} from './AuthService';
import {UserService} from './UserService';
import {PostService} from './PostService';
import {TrendingService} from './TrendingService';
import {CommentService} from './CommentService';
import {SavedPostService} from './SavedPostService';
import {PostQueryService} from './PostQueryService';
import {LikeCache} from './LikeCache';
import {FirebaseAuthTypes} from '@react-native-firebase/auth';

/**
 * Main Firebase service that integrates all modular services.
 * Each service handles a specific domain of functionality:
 *
 * - AuthService: Authentication and user session management
 * - UserService: User profile and data management
 * - PostService: Core post operations (create, like, save)
 * - PostQueryService: Post querying and real-time updates
 * - CommentService: Comment operations
 * - SavedPostService: Saved posts management
 * - TrendingService: Trending and hashtag features
 * - LikeCache: Caching for post likes
 */
class Firebase {
  // Core services
  auth: AuthService;
  user: UserService;
  posts: PostService;
  trending: TrendingService;

  // Supporting services
  private commentService: CommentService;
  private savedPostService: SavedPostService;
  private postQueryService: PostQueryService;
  private likeCache: LikeCache;

  constructor() {
    // Initialize caches and base services
    this.likeCache = LikeCache.getInstance();

    // Initialize core services
    this.auth = new AuthService();
    this.user = new UserService();

    // Initialize supporting services
    this.commentService = new CommentService();
    this.savedPostService = new SavedPostService();

    // Initialize query service with dependencies
    this.postQueryService = new PostQueryService(
      this.commentService,
      this.savedPostService,
      this.likeCache,
    );

    // Initialize main services with their dependencies
    this.posts = new PostService(
      this.likeCache,
      this.commentService,
      this.savedPostService,
      this.postQueryService,
    );
    this.trending = new TrendingService();
  }

  /**
   * Get the currently authenticated user
   */
  currentUser(): FirebaseAuthTypes.User | null {
    return this.auth.currentUser();
  }

  /**
   * Clean up all services, caches, and listeners
   */
  cleanup() {
    // Clean up all services that have cleanup methods
    this.posts.cleanup();
    this.trending.cleanup();
    this.postQueryService.cleanup();
    this.savedPostService.cleanup();
    this.likeCache.clear();
  }

  /**
   * Subscribe to saved posts changes
   * @param callback Function to be called when saved posts change
   * @returns Unsubscribe function
   */
  subscribeToSavedPosts(callback: () => void): () => void {
    return this.savedPostService.subscribeToSavedPosts(callback);
  }
}

export default Firebase;