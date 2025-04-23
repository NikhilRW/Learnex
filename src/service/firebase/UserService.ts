import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {AuthResponse} from '../../types/firebase';

export class UserService {
  async getNameUsernamestring(): Promise<{fullName: string; username: string}> {
    try {
      const doc = (
        await firestore()
          .collection('users')
          .where('email', '==', auth().currentUser?.email)
          .get()
      ).docs[0].data();
      if (doc.fullName && doc.username) {
        return {fullName: doc.fullName, username: doc.username};
      }
      return {fullName: '', username: doc.email};
    } catch (error) {
      console.log('UserService :: getNameUsernamestring() ::', error);
      throw error;
    }
  }

  async checkUsernameIsAvailable(username: string): Promise<AuthResponse> {
    try {
      const user = await firestore()
        .collection('users')
        .where('username', '==', username)
        .get();
      return {success: user.empty};
    } catch (error) {
      console.log('UserService :: checkUsernameIsAvailable() ::', error);
      return {success: false, error};
    }
  }
  async checkEmailIsAvailable(email: string): Promise<AuthResponse> {
    try {
      const user = await firestore()
        .collection('users')
        .where('email', '==', email)
        .get();
      return {success: user.empty};
    } catch (error) {
      console.log('UserService :: checkEmailIsAvailable() ::', error);
      return {success: false, error};
    }
  }

  async checkUsernameOrEmailRegistered(
    emailOrUsername: string,
  ): Promise<{success: boolean; email?: string; error?: Error}> {
    try {
      const email = await firestore()
        .collection('users')
        .where('email', '==', emailOrUsername)
        .get();
      const username = await firestore()
        .collection('users')
        .where('username', '==', emailOrUsername)
        .get();

      if (!email.empty) return {success: true, email: emailOrUsername};

      if (!username.empty) {
        const emailValue = username.docs[0].data().email;
        return {success: true, email: emailValue};
      }

      return {success: false};
    } catch (error: any) {
      console.log('UserService :: checkUsernameOrEmailRegistered() ::', error);
      return {success: false, error};
    }
  }

  async getUserEmailById(userId: string): Promise<string | null> {
    try {
      const userDoc = await firestore().collection('users').doc(userId).get();

      if (userDoc.exists && userDoc.data()?.email) {
        return userDoc.data()?.email;
      }
      return null;
    } catch (error) {
      console.log('UserService :: getUserEmailById() ::', error);
      return null;
    }
  }

  async getUserInfoById(userId: string): Promise<{
    email: string | null;
    fullName: string | null;
    username: string | null;
  }> {
    try {
      const userDoc = await firestore().collection('users').doc(userId).get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        return {
          email: userData?.email || null,
          fullName: userData?.fullName || null,
          username: userData?.username || null,
        };
      }
      return {email: null, fullName: null, username: null};
    } catch (error) {
      console.log('UserService :: getUserInfoById() ::', error);
      return {email: null, fullName: null, username: null};
    }
  }

  async updateProfilePhoto(photoURI: string): Promise<AuthResponse> {
    try {
      // 1. Update auth user photoURL
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {
          success: false,
          error: new Error('No authenticated user found'),
        };
      }

      // 2. Update the profile
      await currentUser.updateProfile({
        photoURL: photoURI,
      });

      // 3. Update Firestore user document
      await firestore().collection('users').doc(currentUser.uid).update({
        image: photoURI,
      });

      return {success: true};
    } catch (error) {
      console.log('UserService :: updateProfilePhoto() ::', error);
      return {success: false, error};
    }
  }

  /**
   * Search for users by username or email
   * @param searchQuery The search query to match against username or email
   * @returns Array of user objects containing id, username, fullName, email, and image
   */
  async searchUsers(searchQuery: string): Promise<
    Array<{
      id: string;
      username: string;
      fullName: string;
      email: string;
      image?: string;
    }>
  > {
    try {
      if (!searchQuery || searchQuery.trim() === '') {
        return [];
      }

      const currentUserId = auth().currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      // Search by email or username containing the query
      const searchQueryLower = searchQuery.toLowerCase();

      // Get users where email contains the search query
      const emailResults = await firestore()
        .collection('users')
        .where('email', '>=', searchQueryLower)
        .where('email', '<=', searchQueryLower + '\uf8ff')
        .limit(10)
        .get();

      // Get users where username contains the search query
      const usernameResults = await firestore()
        .collection('users')
        .where('username', '>=', searchQueryLower)
        .where('username', '<=', searchQueryLower + '\uf8ff')
        .limit(10)
        .get();

      // Get users where fullName contains the search query
      const nameResults = await firestore()
        .collection('users')
        .where('fullName', '>=', searchQueryLower)
        .where('fullName', '<=', searchQueryLower + '\uf8ff')
        .limit(10)
        .get();

      // Combine and deduplicate results
      const userMap = new Map();

      // Process email results
      emailResults.docs.forEach(doc => {
        const userData = doc.data();
        if (doc.id !== currentUserId) {
          // Exclude current user
          userMap.set(doc.id, {
            id: doc.id,
            username: userData.username || '',
            fullName: userData.fullName || '',
            email: userData.email || '',
            image: userData.image || null,
          });
        }
      });

      // Process username results
      usernameResults.docs.forEach(doc => {
        const userData = doc.data();
        if (doc.id !== currentUserId) {
          // Exclude current user
          userMap.set(doc.id, {
            id: doc.id,
            username: userData.username || '',
            fullName: userData.fullName || '',
            email: userData.email || '',
            image: userData.image || null,
          });
        }
      });

      // Process name results
      nameResults.docs.forEach(doc => {
        const userData = doc.data();
        if (doc.id !== currentUserId) {
          // Exclude current user
          userMap.set(doc.id, {
            id: doc.id,
            username: userData.username || '',
            fullName: userData.fullName || '',
            email: userData.email || '',
            image: userData.image || null,
          });
        }
      });

      return Array.from(userMap.values());
    } catch (error) {
      console.log('UserService :: searchUsers() ::', error);
      return [];
    }
  }
}
