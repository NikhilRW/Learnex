import {
  FirestorePost,
  Comment,
  PostType,
  FirestoreComment,
} from '../../types/post';
import {ImageSourcePropType} from 'react-native';

// Helper function to convert string URLs to ImageSourcePropType
export function toImageSource(url: string): ImageSourcePropType {
  return {uri: url};
}

// Helper function to format timestamps
export function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2419200)
    return `${Math.floor(diffInSeconds / 604800)}w ago`;

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// Helper function to convert Firestore timestamp to formatted string
export function formatFirestoreTimestamp(timestamp: any): string {
  return timestamp?.toDate ? formatTimestamp(timestamp.toDate()) : '';
}

// Helper function to convert FirestoreComment to Comment
export function convertFirestoreComment(comment: FirestoreComment): Comment {
  return {
    ...comment,
    userImage: comment.userImage, // Keep as string for now
    timestamp: formatFirestoreTimestamp(comment.timestamp),
    isLiked: false,
  };
}

// Helper function to convert FirestorePost to PostType
export function convertFirestorePost(
  postData: FirestorePost,
  currentUserId: string,
): PostType {
  return {
    id: postData.id,
    user: {
      id: postData.user.id,
      username: postData.user.username,
      image: postData.user.image, // Keep as string for now
    },
    description: postData.description,
    likes: postData.likes || 0,
    comments: postData.comments || 0,
    timestamp: formatFirestoreTimestamp(postData.timestamp),
    postImages: postData.postImages, // Keep as string array
    postVideo: postData.postVideo,
    hashtags: postData.hashtags || [],
    isVideo: postData.isVideo,
    commentsList: postData.commentsList?.map(convertFirestoreComment),
    isLiked: (postData.likedBy || []).includes(currentUserId),
    likedBy: postData.likedBy || [],
  };
}
