import {FirestorePost, PostType} from '../../types/post';

export function convertFirestorePost(
  firestorePost: FirestorePost,
  currentUserId: string,
): PostType {
  return {
    ...firestorePost,
    isLiked: firestorePost.likedBy?.includes(currentUserId) || false,
    hashtags: firestorePost.hashtags || [], // Ensure hashtags are included
  };
}

export function convertFirestoreComment(comment: any) {
  return {
    ...comment,
    timestamp: comment.timestamp
      ? comment.timestamp.toDate().toLocaleString()
      : '',
  };
}
