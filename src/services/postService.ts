import Firebase from '../service/FirebaseService';

const firebase = new Firebase();

export const likePost = async (postId: string) => {
  const result = await firebase.posts.likePost(postId);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.liked;
};
