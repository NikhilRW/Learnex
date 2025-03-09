export class LikeCache {
  private static instance: LikeCache;
  private cache: Map<string, Set<string>> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes TTL
  private cacheTimestamps: Map<string, number> = new Map();
  private likeListeners: Map<string, Map<string, () => void>> = new Map();

  private constructor() {}

  static getInstance(): LikeCache {
    if (!LikeCache.instance) {
      LikeCache.instance = new LikeCache();
    }
    return LikeCache.instance;
  }

  setPostLikes(postId: string, likedBy: string[]) {
    this.cache.set(postId, new Set(likedBy));
    this.cacheTimestamps.set(postId, Date.now());
    this.notifyListeners(postId);
  }

  isLikedByUser(postId: string, userId: string): boolean | null {
    const timestamp = this.cacheTimestamps.get(postId);
    if (!timestamp || Date.now() - timestamp > this.cacheTTL) {
      this.invalidate(postId);
      return null;
    }
    const likedBy = this.cache.get(postId);
    return likedBy ? likedBy.has(userId) : null;
  }

  invalidate(postId: string) {
    this.cache.delete(postId);
    this.cacheTimestamps.delete(postId);
    this.notifyListeners(postId);
  }

  clear() {
    this.cache.clear();
    this.cacheTimestamps.clear();
    this.likeListeners.clear();
  }

  private notifyListeners(postId: string) {
    const listeners = this.likeListeners.get(postId);
    if (listeners) {
      listeners.forEach(callback => callback());
    }
  }

  subscribeToLikes(postId: string, callback: () => void): () => void {
    if (!this.likeListeners.has(postId)) {
      this.likeListeners.set(postId, new Map());
    }

    const listenerId = Math.random().toString(36).substring(7);
    this.likeListeners.get(postId)!.set(listenerId, callback);

    return () => {
      const listeners = this.likeListeners.get(postId);
      if (listeners) {
        listeners.delete(listenerId);
        if (listeners.size === 0) {
          this.likeListeners.delete(postId);
        }
      }
    };
  }
}
