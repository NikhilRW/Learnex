import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {
  statusCodes,
  GoogleSignin,
} from '@react-native-google-signin/google-signin';
import Config from 'react-native-config';
import firestore from '@react-native-firebase/firestore';
import {authorize, AuthConfiguration} from 'react-native-app-auth';
import {signUpData} from '../types/authTypes';
import {PostType} from '../types/post';

interface GetPostsResponse {
  success: boolean;
  posts?: PostType[];
  error?: string;
}

// Auth Module
class AuthModule {
  constructor() {
    GoogleSignin.configure({
      webClientId:
        '378245937295-p9lvf9tenrtchg6d2t5g6tamlhm5a168.apps.googleusercontent.com',
    });
  }

  currentUser(): FirebaseAuthTypes.User | null {
    return auth().currentUser;
  }

  async signUpWithEmailAndPassword({
    email,
    username,
    fullName,
    password,
  }: signUpData) {
    try {
      const data = {email, username, fullName, isLoggedIn: true};
      await auth().createUserWithEmailAndPassword(email, password);
      await firestore().collection('users').add(data);
      return {success: true};
    } catch (error: any) {
      console.log('AuthModule :: signUpWithEmailAndPassword() ::', error);
      return {success: false, error};
    }
  }

  async loginWithEmailAndPassword(email: string, password: string) {
    try {
      await auth().signInWithEmailAndPassword(email, password);
      return {success: true};
    } catch (error: any) {
      console.log('AuthModule :: loginWithEmailAndPassword() ::', error);
      return {success: false, error};
    }
  }

  async sendPasswordResetEmail(email: string) {
    try {
      await auth().sendPasswordResetEmail(email);
      return {success: true};
    } catch (error) {
      console.log('AuthModule :: sendPasswordResetEmail() ::', error);
      return {success: false, error};
    }
  }

  async signOut() {
    try {
      await auth().signOut();
      return {success: true};
    } catch (error: any) {
      console.log('AuthModule :: signOut() ::', error);
      return {success: false, error};
    }
  }

  async googleSignIn() {
    try {
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      const userInfo = await GoogleSignin.signIn();
      const {accessToken} = await GoogleSignin.getTokens();

      if (!accessToken) {
        throw new Error('No access token found');
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(
        null,
        accessToken,
      );
      await auth().signInWithCredential(googleCredential);

      // Create user document if it doesn't exist
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .get();
        if (!userDoc.exists) {
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
                'https://www.gravatar.com/avatar/' +
                  Math.random().toString(36).substring(7),
            });
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
      console.log('AuthModule :: googleSignIn() ::', error);
      return {success: false, error};
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

      // Create user document if it doesn't exist
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .get();
        if (!userDoc.exists) {
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
                'https://www.gravatar.com/avatar/' +
                  Math.random().toString(36).substring(7),
            });
        }
      }

      return {success: true};
    } catch (error) {
      console.log('AuthModule :: githubSignIn() ::', error);
      return {success: false, error};
    }
  }

  isUserLoggedIn(): boolean {
    return auth().currentUser != null;
  }
}

// User Module
class UserModule {
  async getNameUsernamestring(): Promise<{fullName: string; username: string}> {
    try {
      const doc = (
        await firestore()
          .collection('users')
          .where('email', '==', auth().currentUser?.email)
          .get()
      ).docs[0].data();
      return {fullName: doc.fullName, username: doc.username};
    } catch (error) {
      console.log('UserModule :: getNameUsernamestring() ::', error);
      throw error;
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
      console.log('UserModule :: checkUsernameIsAvailable() ::', error);
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
      console.log('UserModule :: checkEmailIsAvailable() ::', error);
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

      if (!email.empty) return {success: true, email: emailOrUsername};

      if (!username.empty) {
        const emailValue = username.docs[0].data().email;
        return {success: true, email: emailValue};
      }

      return {success: false};
    } catch (error: any) {
      console.log('UserModule :: checkUsernameOrEmailRegistered() ::', error);
      return {success: false, error};
    }
  }
}

// Posts Module
class PostsModule {
  // Helper function to format timestamps
  private formatTimestamp(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else if (diffInSeconds < 2419200) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks}w ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  }

  async createPost(postData: {
    description: string;
    postImages?: string[];
    postVideo?: string;
    isVideo?: boolean;
  }) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const userModule = new UserModule();
      const {fullName: username} = await userModule.getNameUsernamestring();

      const postRef = firestore().collection('posts');
      const newPost = {
        user: {
          id: currentUser.uid,
          username,
          image: currentUser.photoURL || '',
        },
        ...postData,
        likes: 0,
        comments: 0,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await postRef.add(newPost);
      return {success: true, postId: docRef.id};
    } catch (error) {
      console.log('PostsModule :: createPost() ::', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create post',
      };
    }
  }

  async getPosts(limit = 10): Promise<GetPostsResponse> {
    try {
      const currentUser = auth().currentUser;
      const postsRef = firestore().collection('posts');

      let snapshot;
      try {
        snapshot = await postsRef
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .get();
      } catch (orderByError) {
        console.log(
          'Error with orderBy, fetching without sorting:',
          orderByError,
        );
        snapshot = await postsRef.limit(limit).get();
      }

      const postsWithLikes = await Promise.all(
        snapshot.docs.map(async doc => {
          const data = doc.data();
          // Check if current user has liked this post
          const isLiked = currentUser
            ? await this.isPostLikedByUser(doc.id)
            : false;

          // Get comments with their like status
          const commentsSnapshot = await doc.ref
            .collection('comments')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

          const comments = commentsSnapshot.docs.map(commentDoc => {
            const commentData = commentDoc.data();
            return {
              id: commentDoc.id,
              userId: commentData.userId,
              username: commentData.username,
              userImage: commentData.userImage,
              text: commentData.text,
              likes: commentData.likes || 0,
              timestamp: this.formatTimestamp(
                commentData.createdAt?.toDate() || new Date(),
              ),
              isLiked: false, // You can implement comment likes similarly if needed
            };
          });

          return {
            id: doc.id,
            user: {
              id: data.user.id,
              username: data.user.username,
              image: data.user.image,
            },
            description: data.description || '',
            likes: data.likes || 0,
            comments: data.comments || 0,
            timestamp: this.formatTimestamp(
              data.createdAt?.toDate() || new Date(),
            ),
            postImages: data.postImages || [],
            postVideo: data.postVideo,
            isVideo: data.isVideo,
            commentsList: comments,
            isLiked, // Include the like status
          };
        }),
      );

      return {success: true, posts: postsWithLikes};
    } catch (error) {
      console.error('PostsModule :: getPosts() ::', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch posts',
      };
    }
  }

  async isPostLikedByUser(postId: string): Promise<boolean> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return false;

      const likeDoc = await firestore()
        .collection('likes')
        .doc(`${postId}_${currentUser.uid}`)
        .get();

      return likeDoc.exists;
    } catch (error) {
      console.error('Error checking if post is liked:', error);
      return false;
    }
  }

  async likePost(postId: string) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const postRef = firestore().collection('posts').doc(postId);
      const likeDocRef = firestore()
        .collection('likes')
        .doc(`${postId}_${currentUser.uid}`);

      await firestore().runTransaction(async transaction => {
        const likeDoc = await transaction.get(likeDocRef);
        if (likeDoc.exists) {
          transaction.delete(likeDocRef);
          transaction.update(postRef, {
            likes: firestore.FieldValue.increment(-1),
          });
        } else {
          transaction.set(likeDocRef, {
            userId: currentUser.uid,
            postId,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
          transaction.update(postRef, {
            likes: firestore.FieldValue.increment(1),
          });
        }
      });

      // Determine new status after transaction
      const updatedLikeDoc = await likeDocRef.get();
      return {success: true, liked: updatedLikeDoc.exists};
    } catch (error) {
      console.log('PostsModule :: likePost() ::', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle like',
      };
    }
  }

  async addComment(postId: string, comment: string) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const userModule = new UserModule();
      const {fullName: username} = await userModule.getNameUsernamestring();

      // Create a batch to ensure atomic operations
      const batch = firestore().batch();

      // Get post reference
      const postRef = firestore().collection('posts').doc(postId);

      // Get post data first to verify it exists
      const postDoc = await postRef.get();
      if (!postDoc.exists) {
        throw new Error('Post not found');
      }

      // Create a direct comments collection in the post document
      const commentRef = postRef.collection('comments').doc();

      // Get current timestamp
      const timestamp = firestore.FieldValue.serverTimestamp();

      // Create the comment data
      const newComment = {
        postId,
        userId: currentUser.uid,
        username,
        userImage: currentUser.photoURL || '',
        text: comment,
        likes: 0,
        likedBy: [],
        timestamp,
        createdAt: timestamp,
      };

      // Add comment to the batch
      batch.set(commentRef, newComment);

      // Increment comment count in post
      batch.update(postRef, {
        comments: firestore.FieldValue.increment(1),
      });

      // Commit the batch
      await batch.commit();

      // Construct the comment object to return for immediate UI update
      return {
        success: true,
        comment: {
          id: commentRef.id,
          userId: currentUser.uid,
          username,
          userImage: currentUser.photoURL || '',
          text: comment,
          likes: 0,
          timestamp: new Date().toISOString(),
          isLiked: false,
        },
      };
    } catch (error) {
      console.log('PostsModule :: addComment() ::', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add comment',
      };
    }
  }

  async savePost(postId: string) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      // Check if post exists
      const postDoc = await firestore().collection('posts').doc(postId).get();
      if (!postDoc.exists) {
        return {success: false, error: 'Post not found'};
      }

      // Get user document
      const userRef = firestore().collection('users').doc(currentUser.uid);
      const userDoc = await userRef.get();

      // If user document doesn't exist, create it with savedPosts field
      if (!userDoc.exists) {
        await userRef.set({
          savedPosts: [postId],
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        return {success: true, saved: true};
      }

      // Check if post is already saved
      const userData = userDoc.data();
      const savedPosts = userData?.savedPosts || [];
      const isSaved = savedPosts.includes(postId);

      // Toggle saved status
      await userRef.update({
        savedPosts: isSaved
          ? firestore.FieldValue.arrayRemove(postId)
          : firestore.FieldValue.arrayUnion(postId),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      return {success: true, saved: !isSaved};
    } catch (error) {
      console.log('PostsModule :: savePost() ::', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save post',
      };
    }
  }

  async deletePost(postId: string) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return {success: false, error: 'User not authenticated'};
      }

      // Get the post to check ownership
      const postRef = firestore().collection('posts').doc(postId);
      const postDoc = await postRef.get();

      if (!postDoc.exists) {
        return {success: false, error: 'Post not found'};
      }

      // Verify that the current user is the creator of the post
      const postData = postDoc.data();
      if (postData?.user?.id !== currentUser.uid) {
        return {success: false, error: 'Not authorized to delete this post'};
      }

      // Create a batch to delete the post and all its associated data
      const batch = firestore().batch();

      // 1. Delete all comments
      const commentsSnapshot = await postRef.collection('comments').get();
      commentsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // 2. Delete the post itself
      batch.delete(postRef);

      // 3. Commit the batch
      await batch.commit();

      return {success: true};
    } catch (error) {
      console.log('PostsModule :: deletePost() ::', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete post',
      };
    }
  }

  isPostSaved(postId: string): boolean {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return false;

      // This is a synchronous check, so we need to have the data already cached
      // Return false if we're not sure, the UI will update once the actual status is fetched
      return false;
    } catch (error) {
      console.error('Error checking saved status:', error);
      return false;
    }
  }
}

// Main Firebase Service Class
class Firebase {
  auth: AuthModule;
  user: UserModule;
  posts: PostsModule;

  constructor() {
    this.auth = new AuthModule();
    this.user = new UserModule();
    this.posts = new PostsModule();
  }

  currentUser(): FirebaseAuthTypes.User | null {
    return this.auth.currentUser();
  }
}

export default Firebase;
