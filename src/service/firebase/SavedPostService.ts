import {getAuth} from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {SavePostResponse} from '../../types/firebase';

export class SavedPostService {
  // Simple list to store saved post IDs
  private savedPosts: string[] = [];

  // List of functions to call when saved posts change
  private listeners: (() => void)[] = [];

  constructor() {
    // Start listening to saved posts when service is created
    this.setupSavedPostsListener();
  }

  private setupSavedPostsListener() {
    const user = getAuth().currentUser;
    if (!user) return;

    // Listen to changes in user's saved posts
    onSnapshot(
      doc(collection(getFirestore(), 'users'), user.uid),
      (doc: FirebaseFirestoreTypes.DocumentSnapshot) => {
        try {
          if (!doc) {
            console.warn(
              'SavedPostService: Received null snapshot in saved posts listener',
            );
            return;
          }

          if (doc.exists()) {
            // Update our list of saved posts
            this.savedPosts = doc.data()?.savedPosts || [];
            // Tell everyone who's listening that saved posts changed
            this.notifyListeners();
          }
        } catch (error) {
          console.error(
            'SavedPostService: Error processing saved posts snapshot:',
            error,
          );
        }
      },
      error => {
        console.error(
          'SavedPostService: Error in saved posts listener:',
          error,
        );
      },
    );
  }

  // Add a new listener
  subscribeToSavedPosts(onSavedPostsChange: () => void): () => void {
    this.listeners.push(onSavedPostsChange);
    // Return function to remove listener
    return () => {
      this.listeners = this.listeners.filter(
        listener => listener !== onSavedPostsChange,
      );
    };
  }

  // Tell all listeners that saved posts changed
  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  // Check if a post is saved
  isPostSaved(postId: string): boolean {
    return this.savedPosts.includes(postId);
  }

  // Save or unsave a post
  async savePost(postId: string): Promise<SavePostResponse> {
    try {
      const user = getAuth().currentUser;
      if (!user) {
        return {success: false, error: 'Not logged in'};
      }

      const userRef = doc(collection(getFirestore(), 'users'), user.uid);
      const isSaved = this.isPostSaved(postId);

      // If post is already saved, remove it. If not saved, add it.
      await updateDoc(userRef, {
        savedPosts: isSaved ? arrayRemove(postId) : arrayUnion(postId),
      });

      return {success: true, saved: !isSaved};
    } catch (error) {
      console.error('Error saving post:', error);
      return {success: false, error: 'Failed to save post'};
    }
  }

  // Clean up when service is no longer needed
  cleanup() {
    this.listeners = [];
    this.savedPosts = [];
  }
}
