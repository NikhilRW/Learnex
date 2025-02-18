import Firebase from '../service/firebase/index.ts';

const firebase = new Firebase();

export const likePost = async (postId: string) => {
  const result = await firebase.posts.likePost(postId);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.liked;
};
