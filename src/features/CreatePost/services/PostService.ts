import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import {getAuth} from '@react-native-firebase/auth';

interface MediaUrl {
  url: string;
  isVideo: boolean;
  isVertical: boolean;
}

/**
 * Creates a new post document in Firestore.
 */
export const savePostToFirestore = async (
  description: string,
  mediaUrls: MediaUrl[],
  allHashtags: string[],
  searchKeywords: string[],
  isPublic: boolean,
  isVertical: boolean,
  firebase: any,
): Promise<void> => {
  const currentUser = getAuth().currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  const {fullName} = await firebase.user.getNameUsernamestring();

  const postImages = mediaUrls
    .filter(item => !item.isVideo)
    .map(item => item.url);

  const postVideos = mediaUrls
    .filter(item => item.isVideo)
    .map(item => item.url);

  const postData = {
    user: {
      id: currentUser.uid,
      username: currentUser.displayName || fullName || 'Anonymous',
      image:
        currentUser.photoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          currentUser.displayName || fullName || 'Anonymous',
        )}`,
    },
    description,
    postImages,
    postVideo: postVideos.length > 0 ? postVideos[0] : null,
    isVideo: postVideos.length > 0,
    hasMultipleMedia: mediaUrls.length > 1,
    isVertical,
    hashtags: allHashtags,
    searchKeywords,
    isPublic,
    likes: 0,
    likedBy: [],
    comments: 0,
    timestamp: serverTimestamp(),
  };

  console.log('Creating post with data:', JSON.stringify(postData, null, 2));
  await addDoc(collection(getFirestore(), 'posts'), postData);
};
