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
    console.log('UserID ' + auth().currentUser?.uid);
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
        image: `https://avatar.iran.liara.run/username?username=${encodeURIComponent(
          fullName,
        )}`,
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

      // Update user's isLoggedIn status in Firestore
      const user = auth().currentUser;
      if (user) {
        await firestore().collection('users').doc(user.uid).update({
          isLoggedIn: true,
          lastLogin: firestore.FieldValue.serverTimestamp(),
        });

        // Start notification listeners for the logged in user
        try {
          const notificationService =
            require('../../service/NotificationService').default;
          notificationService.setupMessageListener();
        } catch (error) {
          console.error('Failed to setup notification listeners:', error);
        }
      }

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
      // Update the user's isLoggedIn status before signing out
      const user = auth().currentUser;
      if (user) {
        await firestore().collection('users').doc(user.uid).update({
          isLoggedIn: false,
          lastLogout: firestore.FieldValue.serverTimestamp(),
        });
      }

      // Clean up notification listeners before signing out
      try {
        const notificationService =
          require('../../service/NotificationService').default;
        notificationService.removeMessageListener();
      } catch (error) {
        console.error('Failed to clean up notification listeners:', error);
      }

      await auth().signOut();
      await GoogleSignin.signOut();
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

      // Handle user document (create or update)
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .get();

        if (!userDoc.exists) {
          // First time user - create new document
          await firestore()
            .collection('users')
            .doc(user.uid)
            .set({
              email: user.email,
              username: user.displayName || user.email?.split('@')[0] || 'User',
              fullName: user.displayName || 'User',
              isLoggedIn: true,
              savedPosts: [],
              createdAt: firestore.FieldValue.serverTimestamp(),
              image:
                user.photoURL ||
                `https://avatar.iran.liara.run/username?username=${encodeURIComponent(
                  user.displayName || 'Anonymous',
                )}`,
            });
        } else {
          // Returning user - update isLoggedIn status
          await firestore().collection('users').doc(user.uid).update({
            isLoggedIn: true,
            lastLogin: firestore.FieldValue.serverTimestamp(),
          });

          // Start notification listeners for the logged in user
          try {
            const notificationService =
              require('../../service/NotificationService').default;
            notificationService.setupMessageListener();
          } catch (error) {
            console.error('Failed to setup notification listeners:', error);
          }
        }
      }

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

      // Handle user document (create or update)
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .get();

        if (!userDoc.exists) {
          // First time user - create new document
          await firestore()
            .collection('users')
            .doc(user.uid)
            .set({
              email: user.email,
              username:
                user.displayName || user.email?.split('@')[0] || 'GitHub User',
              fullName: user.displayName || 'GitHub User',
              isLoggedIn: true,
              savedPosts: [],
              createdAt: firestore.FieldValue.serverTimestamp(),
              image:
                user.photoURL ||
                `https://avatar.iran.liara.run/username?username=${encodeURIComponent(
                  user.displayName || 'Anonymous',
                )}`,
            });
        } else {
          // Returning user - update isLoggedIn status
          await firestore().collection('users').doc(user.uid).update({
            isLoggedIn: true,
            lastLogin: firestore.FieldValue.serverTimestamp(),
          });
        }
      }

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
