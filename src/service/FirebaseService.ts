import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {
  statusCodes,
  GoogleSignin,
} from '@react-native-google-signin/google-signin';
import Config from 'react-native-config';
import firestore from '@react-native-firebase/firestore';
import {authorize, AuthConfiguration} from 'react-native-app-auth';
import {signUpData} from '../types/authTypes';
class Firebase {
  constructor() {
    GoogleSignin.configure({
      webClientId:
        '378245937295-p9lvf9tenrtchg6d2t5g6tamlhm5a168.apps.googleusercontent.com',
    });
    console.log(auth().currentUser);
  }
  currentUser(): FirebaseAuthTypes.User | null {
    return auth().currentUser;
  }
  async getNameUsernamestring(): Promise<{fullName: string; username: string}> {
    const doc = (
      await firestore()
        .collection('users')
        .where('email', '==', auth().currentUser?.email)
        .get()
    ).docs[0].data();
    return {fullName: doc.fullName, username: doc.username};
  }
  async signUpWithEmailAndPassword({
    email,
    username,
    fullName,
    password,
  }: signUpData) {
    try {
      const data = {
        email,
        username,
        fullName,
        isLoggedIn: true,
      };
      await auth().createUserWithEmailAndPassword(email, password);
      await firestore().collection('users').add(data);
      return {success: true};
    } catch (error: any) {
      console.log('firebase :: signUpWithEmailAndPassword() ::' + error);
      return {success: false, error};
    }
  }
  async checkUsernameIsAvailable(username: string) {
    try {
      const user = await firestore()
        .collection('users')
        .where('username', '==', username)
        .get();
      return {success: user.empty};
    } catch (error) {
      console.log('firebase :: checkUsernameIsAvailable() ::' + error);
      return {success: false, error};
    }
  }
  async checkEmailIsAvailable(email: string) {
    try {
      const user = await firestore()
        .collection('users')
        .where('email', '==', email)
        .get();
      return {success: user.empty};
    } catch (error) {
      console.log('firebase :: checkUsernameIsAvailable() ::' + error);
      return {success: false, error};
    }
  }
  async loginWithEmailAndPassword(email: string, password: string) {
    try {
      const response = await auth().signInWithEmailAndPassword(email, password);
      return {success: true};
    } catch (error: any) {
      console.log('firebase :: signUpWithEmailAndPassword() ::' + error);
      return {success: false, error};
    }
  }
  async sendPasswordResetEmail(email: string) {
    try {
      const response = await auth().sendPasswordResetEmail(email);
      return {success: true};
    } catch (error) {
      console.log('firebase :: sendPasswordResetEmail() ::' + error);
      return {success: false, error};
    }
  }
  async checkUsernameOrEmailRegistered(emailOrUsername: string) {
    try {
      const email = await firestore()
        .collection('users')
        .where('email', '==', emailOrUsername)
        .get();
      const username = await firestore()
        .collection('users')
        .where('username', '==', emailOrUsername)
        .get();
      if (email.empty) {
        if (!username.empty) {
          const emailValue = await (
            await firestore()
              .collection('users')
              .where('username', '==', emailOrUsername)
              .get()
          ).docs[0].data().email;
          console.log(emailValue);
          return {success: true, email: emailValue};
        }
        return {success: false};
      }
      if (!email.empty) {
        return {success: true, email: emailOrUsername};
      }
      return {success: false};
    } catch (error: any) {
      console.log('firebase :: loginWithEmailAndPassword() ::' + error);
      return {success: false, error};
    }
  }
  async signOut() {
    try {
      await auth().signOut();
    } catch (error: any) {
      console.log('firebase :: signOut() ::' + error);
    }
  }
  async googleSignIn() {
    try {
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      const signInData = await GoogleSignin.signIn();
      if (!signInData.data?.idToken) {
        throw new Error('No ID Token found');
      }
      const googleCredential = auth.GoogleAuthProvider.credential(
        signInData.data?.idToken!,
      );
      await auth().signInWithCredential(googleCredential);
      console.log(auth().currentUser);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log(error);
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log(error);
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log(error);
      } else {
      }
    }
  }
  async githubSignIn() {
    try {
      const config: AuthConfiguration = {
        issuer: 'https://github.com',
        clientId: Config.GITHUB_CLIENT_ID!,
        clientSecret: Config.GITHUB_CLIENT_SECRET,
        redirectUrl: 'myapp://callback',
        scopes: ['user:email'],
        serviceConfiguration: {
          authorizationEndpoint: 'https://github.com/login/oauth/authorize',
          tokenEndpoint: 'https://github.com/login/oauth/access_token',
        },
      };
      const authState = await authorize(config);
      const githubCredential = auth.GithubAuthProvider.credential(
        authState.accessToken,
      );
      await auth().signInWithCredential(githubCredential);
    } catch (error) {
      console.log('FirebaseService.ts :: githubSignIn() ::', error);
    }
  }
  isUserLoggedIn(): boolean {
    return auth().currentUser != null;
  }
}

export default Firebase;
