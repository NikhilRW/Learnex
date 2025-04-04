import {Comment, PostType} from '../../types/post';
import {ImageSourcePropType} from 'react-native';

// Define FirestorePost and FirestoreComment interfaces since they're missing from the types/post.ts file
export interface FirestoreComment {
  id: string;
  userId: string;
  username: string;
  userImage: string;
  text: string;
  likes: number;
  timestamp: any; // Firestore timestamp
  replies?: FirestoreComment[];
  editedAt?: any;
}

export interface FirestorePost {
  id: string;
  user: {
    id: string;
    username: string;
    image: string;
  };
  description: string;
  likes: number;
  hashtags: string[];
  comments: number;
  timestamp: any; // Firestore timestamp
  postImages?: string[];
  postVideo?: string;
  isVideo?: boolean;
  commentsList?: FirestoreComment[];
  likedBy?: string[];
}

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
  if (!timestamp) return '';

  // Handle different timestamp formats
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    // Standard Firestore timestamp object with toDate() method
    return formatTimestamp(timestamp.toDate());
  } else if (
    timestamp._seconds !== undefined &&
    timestamp._nanoseconds !== undefined
  ) {
    // Raw Firestore timestamp object with _seconds and _nanoseconds
    const date = new Date(timestamp._seconds * 1000);
    return formatTimestamp(date);
  } else if (timestamp instanceof Date) {
    // Already a Date object
    return formatTimestamp(timestamp);
  } else if (typeof timestamp === 'number') {
    // Timestamp as milliseconds
    return formatTimestamp(new Date(timestamp));
  } else if (typeof timestamp === 'string') {
    // Already formatted string or ISO date string
    if (isNaN(Date.parse(timestamp))) {
      // Not a valid date string, return as is
      return timestamp;
    }
    return formatTimestamp(new Date(timestamp));
  }

  // Fallback for unknown format
  return '';
}

// Helper function to convert FirestoreComment to Comment
export function convertFirestoreComment(comment: FirestoreComment): Comment {
  // Convert replies if they exist
  const convertedReplies = comment.replies
    ? comment.replies.map(reply => convertFirestoreComment(reply))
    : undefined;

  return {
    ...comment,
    userImage: comment.userImage, // Keep as string as required by Comment interface
    timestamp: formatFirestoreTimestamp(comment.timestamp),
    isLiked: false,
    replies: convertedReplies,
  };
}

// Helper function to convert FirestorePost to PostType
export function convertFirestorePost(
  postData: FirestorePost,
  currentUserId: string,
): PostType {
  // Convert post images if they exist
  const convertedPostImages = postData.postImages
    ? postData.postImages.map(img => toImageSource(img))
    : undefined;

  return {
    id: postData.id,
    user: {
      id: postData.user.id,
      username: postData.user.username,
      image: toImageSource(postData.user.image), // Convert string to ImageSourcePropType
    },
    description: postData.description,
    likes: postData.likes || 0,
    comments: postData.comments || 0,
    timestamp: formatFirestoreTimestamp(postData.timestamp),
    postImages: convertedPostImages, // Use converted images array
    postVideo: postData.postVideo,
    hashtags: postData.hashtags || [],
    isVideo: postData.isVideo,
    commentsList: postData.commentsList?.map(convertFirestoreComment),
    isLiked: (postData.likedBy || []).includes(currentUserId),
    isSaved: false, // Adding missing required property
  };
}
