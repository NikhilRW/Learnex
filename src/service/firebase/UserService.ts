import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {AuthResponse, EmailCheckResponse} from '../../types/firebase';

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
  ): Promise<EmailCheckResponse> {
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
}
