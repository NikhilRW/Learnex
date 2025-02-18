import auth from '@react-native-firebase/auth';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {authorize} from 'react-native-app-auth';
import firestore from '@react-native-firebase/firestore';
import Config from 'react-native-config';
import {signUpData} from '../../types/authTypes';
import {AuthResponse} from '../../types/firebase';

export class AuthService {
  constructor() {
    GoogleSignin.configure({
      webClientId:
        '378245937295-p9lvf9tenrtchg6d2t5g6tamlhm5a168.apps.googleusercontent.com',
    });
  }

  currentUser() {
    return auth().currentUser;
  }

  async signUpWithEmailAndPassword({
    email,
    username,
    fullName,
    password,
  }: signUpData): Promise<AuthResponse> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );

      const userData = {
        email,
        username,
        fullName,
        isLoggedIn: true,
        savedPosts: [],
        createdAt: firestore.FieldValue.serverTimestamp(),
        image:
          'https://www.gravatar.com/avatar/' +
          Math.random().toString(36).substring(7),
      };

      await firestore()
        .collection('users')
        .doc(userCredential.user.uid)
        .set(userData);

      return {success: true};
    } catch (error: any) {
      console.log('AuthService :: signUpWithEmailAndPassword() ::', error);
      return {success: false, error};
    }
  }

  async loginWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    try {
      await auth().signInWithEmailAndPassword(email, password);
      return {success: true};
    } catch (error: any) {
      console.log('AuthService :: loginWithEmailAndPassword() ::', error);
      return {success: false, error};
    }
  }

  async sendPasswordResetEmail(email: string): Promise<AuthResponse> {
    try {
      await auth().sendPasswordResetEmail(email);
      return {success: true};
    } catch (error) {
      console.log('AuthService :: sendPasswordResetEmail() ::', error);
      return {success: false, error};
    }
  }

  async signOut(): Promise<AuthResponse> {
    try {
      await auth().signOut();
      return {success: true};
    } catch (error: any) {
      console.log('AuthService :: signOut() ::', error);
      return {success: false, error};
    }
  }

  async googleSignIn(): Promise<AuthResponse> {
    try {
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      const userInfo = await GoogleSignin.signIn();
      const {accessToken} = await GoogleSignin.getTokens();

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const googleCredential = auth.GoogleAuthProvider.credential(
        null,
        accessToken,
      );
      await auth().signInWithCredential(googleCredential);

      return {success: true};
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return {success: false, error: 'Sign in cancelled'};
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return {success: false, error: 'Sign in already in progress'};
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {success: false, error: 'Play services not available'};
      }
      console.log('AuthService :: googleSignIn() ::', error);
      return {success: false, error};
    }
  }

  async githubSignIn(): Promise<AuthResponse> {
    try {
      const config = {
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

      return {success: true};
    } catch (error) {
      console.log('AuthService :: githubSignIn() ::', error);
      return {success: false, error};
    }
  }

  isUserLoggedIn(): boolean {
    return auth().currentUser != null;
  }
}
