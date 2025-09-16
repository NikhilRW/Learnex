import {getAuth} from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {Platform} from 'react-native';

/**
 * Manages FCM tokens for the current user, storing them in Firestore
 * This allows the server to send targeted notifications to specific devices
 *
 * We use a direct device-to-device messaging approach rather than topic-based messaging:
 * 1. Each device's FCM token is stored in Firestore with the user's ID
 * 2. When sending a notification, we retrieve all tokens for the recipient
 * 3. The notification is sent directly to each specific device token
 * 4. This approach is better for direct messages as it's more targeted than topics
 *
 * IMPORTANT: Tokens are preserved even when the app is closed or the user logs out
 * to ensure notifications can still be delivered in these states.
 */
export class FCMTokenManager {
  private static tokensCollection = collection(
    getFirestore(),
    'fcmTokens',
  ) as FirebaseFirestoreTypes.CollectionReference<any>;

  /**
   * Save a new FCM token for the current user
   * This should be called after getting a new token from Firebase
   *
   * @param token The FCM token to save
   * @returns Promise that resolves to true if successful
   */
  public static async saveToken(token: string): Promise<boolean> {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        console.error('Cannot save FCM token: No user is logged in');
        return false;
      }

      const userId = currentUser.uid;

      // Get device info in a type-safe way
      const deviceInfo = {
        platform: Platform.OS,
        // Handle model safely with optional chaining and type assertion
        model:
          Platform.OS === 'android'
            ? (Platform.constants as any)?.model || 'Unknown'
            : 'iOS Device',
        version: Platform.Version,
      };

      // Create a unique ID for this device's token
      // This allows a user to have multiple devices
      const tokenDoc = {
        userId,
        token,
        device: deviceInfo,
        active: true, // Mark the token as active
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // We'll use the token itself as part of the document ID
      // to ensure we don't store duplicate tokens
      const tokenId = `${userId}_${token.substring(token.length - 12)}`;

      await setDoc(doc(this.tokensCollection, tokenId), tokenDoc);
      console.log('FCM token saved to Firestore');
      return true;
    } catch (error) {
      console.error('Error saving FCM token:', error);
      return false;
    }
  }

  /**
   * Mark a token as inactive instead of removing it
   * This preserves the token for background notifications but helps
   * track which tokens are from active app instances
   *
   * @param token The FCM token to mark as inactive
   * @returns Promise that resolves to true if successful
   */
  public static async markTokenInactive(token: string): Promise<boolean> {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        console.log('No user logged in to update FCM token status');
        return false;
      }

      const userId = currentUser.uid;
      const tokenId = `${userId}_${token.substring(token.length - 12)}`;

      await updateDoc(doc(this.tokensCollection, tokenId), {
        active: false,
        updatedAt: serverTimestamp(),
      });

      console.log('FCM token marked as inactive');
      return true;
    } catch (error) {
      console.error('Error marking FCM token as inactive:', error);
      return false;
    }
  }

  /**
   * Remove an FCM token when a user logs out
   * NOTE: This method is no longer used in the regular flow to ensure
   * notifications can be delivered even when the app is closed
   *
   * @param token The FCM token to remove
   * @returns Promise that resolves to true if successful
   */
  public static async removeToken(token: string): Promise<boolean> {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        console.log('No user logged in to remove FCM token for');
        return false;
      }

      const userId = currentUser.uid;
      const tokenId = `${userId}_${token.substring(token.length - 12)}`;

      await deleteDoc(doc(this.tokensCollection, tokenId));
      console.log('FCM token removed from Firestore');
      return true;
    } catch (error) {
      console.error('Error removing FCM token:', error);
      return false;
    }
  }

  /**
   * Remove all FCM tokens for the current user
   * NOTE: This method should only be used in specific cleanup operations,
   * not during normal app usage, to ensure background notifications work
   *
   * @returns Promise that resolves to true if successful
   */
  public static async removeAllUserTokens(): Promise<boolean> {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        console.log('No user logged in to remove FCM tokens for');
        return false;
      }

      const userId = currentUser.uid;
      const batch = writeBatch(getFirestore());

      // Get all tokens for this user
      const snapshot = await getDocs(
        query(this.tokensCollection, where('userId', '==', userId)),
      );

      if (snapshot.empty) {
        console.log('No FCM tokens found for this user');
        return true;
      }

      // Add each token document to the batch for deletion
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Commit the batch delete
      await batch.commit();
      console.log(`Removed ${snapshot.size} FCM tokens for the user`);
      return true;
    } catch (error) {
      console.error('Error removing all FCM tokens:', error);
      return false;
    }
  }
}
