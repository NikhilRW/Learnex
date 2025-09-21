import {
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  OIDCAuthProvider,
} from '@react-native-firebase/auth';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {authorize} from 'react-native-app-auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import Config from 'react-native-config';
import {signUpData} from 'shared/types/authTypes';
import {AuthResponse, FirebaseUser} from 'shared/types/firebase';

export class AuthService {
  constructor() {
    GoogleSignin.configure({
      webClientId:
        '378245937295-p9lvf9tenrtchg6d2t5g6tamlhm5a168.apps.googleusercontent.com',
    });
    console.log('UserID ' + getAuth().currentUser?.uid);
  }

  currentUser() {
    return getAuth().currentUser;
  }

  async signUpWithEmailAndPassword({
    email,
    username,
    fullName,
    password,
  }: signUpData): Promise<AuthResponse> {
    try {
      const userCredential = await getAuth().createUserWithEmailAndPassword(
        email,
        password,
      );

      const userData: Omit<FirebaseUser, 'uid'> = {
        email,
        username,
        fullName,
        isLoggedIn: true,
        savedPosts: [],
        createdAt: serverTimestamp(),
        image: `https://avatar.iran.liara.run/username?username=${encodeURIComponent(
          fullName,
        )}`,
      };

      const db = getFirestore();
      const usersRef = collection(
        db,
        'users',
      ) as FirebaseFirestoreTypes.CollectionReference<FirebaseUser>;
      await setDoc(doc(usersRef, userCredential.user.uid), {
        uid: userCredential.user.uid,
        ...userData,
      });

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
      await getAuth().signInWithEmailAndPassword(email, password);

      // Update user's isLoggedIn status in Firestore
      const user = getAuth().currentUser;
      if (user) {
        const db = getFirestore();
        await updateDoc(doc(db, 'users', user.uid), {
          isLoggedIn: true,
          lastLogin: serverTimestamp(),
        });

        // Start notification listeners for the logged in user
        try {
          const notificationService =
            require('shared/services/NotificationService').default;
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
      await getAuth().sendPasswordResetEmail(email);
      return {success: true};
    } catch (error) {
      console.log('AuthService :: sendPasswordResetEmail() ::', error);
      return {success: false, error};
    }
  }

  async signOut(): Promise<AuthResponse> {
    try {
      // Update the user's isLoggedIn status before signing out
      const user = getAuth().currentUser;
      if (user) {
        const db = getFirestore();
        await updateDoc(doc(db, 'users', user.uid), {
          isLoggedIn: false,
          lastLogout: serverTimestamp(),
        });
      }

      // Clean up notification listeners before signing out
      try {
        const notificationService = require('shared/services/NotificationService').default;
        notificationService.removeMessageListener();
      } catch (error) {
        console.error('Failed to clean up notification listeners:', error);
      }

      await getAuth().signOut();
      if (GoogleSignin.hasPreviousSignIn()) {
        await GoogleSignin.signOut();
      }
      return {success: true};
    } catch (error: any) {
      console.log('AuthService :: signOut() ::', error);
      return {success: false, error};
    }
  }

  async googleSignIn(): Promise<AuthResponse> {
    try {
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      await GoogleSignin.signIn();
      const {accessToken} = await GoogleSignin.getTokens();

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const googleCredential = GoogleAuthProvider.credential(null, accessToken);
      await getAuth().signInWithCredential(googleCredential);

      // Handle user document (create or update)
      const user = getAuth().currentUser;
      if (user) {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
          // First time user - create new document
          const usersRef = collection(
            db,
            'users',
          ) as FirebaseFirestoreTypes.CollectionReference<FirebaseUser>;
          const newUserDoc: FirebaseUser = {
            uid: user.uid,
            email: user.email || '',
            username: user.email?.split('@')[0] || 'User',
            fullName: user.displayName || 'User',
            isLoggedIn: true,
            savedPosts: [],
            createdAt: serverTimestamp() as any,
            image:
              user.photoURL ||
              `https://avatar.iran.liara.run/username?username=${encodeURIComponent(
                user.displayName || 'Anonymous',
              )}`,
          };
          await setDoc(doc(usersRef, user.uid), newUserDoc);
        } else {
          // Returning user - update isLoggedIn status
          await updateDoc(doc(db, 'users', user.uid), {
            isLoggedIn: true,
            lastLogin: serverTimestamp(),
          });

          // Start notification listeners for the logged in user
          try {
            const notificationService =
              require('shared/services/NotificationService').default;
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
      const githubCredential = GithubAuthProvider.credential(
        authState.accessToken,
      );
      await getAuth().signInWithCredential(githubCredential);

      // Handle user document (create or update)
      const user = getAuth().currentUser;
      if (user) {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
          // First time user - create new document
          const usersRef = collection(
            db,
            'users',
          ) as FirebaseFirestoreTypes.CollectionReference<FirebaseUser>;
          const newUserDoc: FirebaseUser = {
            uid: user.uid,
            email: user.email || '',
            username:
              user.displayName || user.email?.split('@')[0] || 'GitHub User',
            fullName: user.displayName || 'GitHub User',
            isLoggedIn: true,
            savedPosts: [],
            createdAt: serverTimestamp() as any,
            image:
              user.photoURL ||
              `https://avatar.iran.liara.run/username?username=${encodeURIComponent(
                user.displayName || 'Anonymous',
              )}`,
          };
          await setDoc(doc(usersRef, user.uid), newUserDoc);
        } else {
          // Returning user - update isLoggedIn status
          await updateDoc(doc(db, 'users', user.uid), {
            isLoggedIn: true,
            lastLogin: serverTimestamp(),
          });
        }
      }

      return {success: true};
    } catch (error) {
      console.log('AuthService :: githubSignIn() ::', error);
      return {success: false, error};
    }
  }

  async linkedinSignIn(accessToken: string): Promise<AuthResponse> {
    try {
      const linkedinCredential = OIDCAuthProvider.credential(
        'azure-test',
        accessToken,
      );
      console.log('accessToken', accessToken);
      await getAuth().signInWithCredential(linkedinCredential);

      // Handle user document (create or update)
      const user = getAuth().currentUser;
      if (user) {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
          // First time user - create new document
          const usersRef = collection(
            db,
            'users',
          ) as FirebaseFirestoreTypes.CollectionReference<FirebaseUser>;
          const newUserDoc: FirebaseUser = {
            uid: user.uid,
            email: user.email || '',
            username:
              user.displayName || user.email?.split('@')[0] || 'LinkedIn User',
            fullName: user.displayName || 'LinkedIn User',
            isLoggedIn: true,
            savedPosts: [],
            createdAt: serverTimestamp() as any,
            image:
              user.photoURL ||
              `https://avatar.iran.liara.run/username?username=${encodeURIComponent(
                user.displayName || 'Anonymous',
              )}`,
          };
          await setDoc(doc(usersRef, user.uid), newUserDoc);
        } else {
          // Returning user - update isLoggedIn status
          await updateDoc(doc(db, 'users', user.uid), {
            isLoggedIn: true,
            lastLogin: serverTimestamp(),
          });
        }
      }
      return {success: true};
    } catch (error) {
      console.log('AuthService :: linkedinSignIn() ::', error);
      return {success: false, error};
    }
  }

  isUserLoggedIn(): boolean {
    return getAuth().currentUser != null;
  }
}
