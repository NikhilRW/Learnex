import {Comment, PostType, FirestoreComment} from '../../types/post';
import {ImageSourcePropType} from 'react-native';

// FirestoreComment now imported from types/post

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
  // Check if date is valid
  if (!date || isNaN(date.getTime())) {
    return 'just now';
  }

  const now = new Date();

  // Calculate time difference in seconds without timezone adjustments
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Check if the timestamp string contains negative value
  if (diffInSeconds < 0) {
    // For any negative time difference, always show "just now"
    console.log('Negative time detected:', diffInSeconds, 'seconds');
    return 'just now';
  }

  // Very recent timestamps
  if (diffInSeconds < 15) return 'just now';
  if (diffInSeconds < 60) return `${Math.abs(diffInSeconds)}s ago`;

  // Minutes, hours, days, weeks
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2419200)
    return `${Math.floor(diffInSeconds / 604800)}w ago`;

  // For older content, show the date
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// Helper function to convert Firestore timestamp to formatted string
export function formatFirestoreTimestamp(timestamp: any): string {
  if (!timestamp) return 'just now';

  try {
    let date: Date | null = null;

    // Handle different timestamp formats
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      // Standard Firestore timestamp object with toDate() method
      date = timestamp.toDate();
    } else if (
      timestamp._seconds !== undefined &&
      timestamp._nanoseconds !== undefined
    ) {
      // Raw Firestore timestamp object with _seconds and _nanoseconds
      date = new Date(timestamp._seconds * 1000);
    } else if (timestamp instanceof Date) {
      // Already a Date object
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      // Timestamp as milliseconds
      date = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      // Check for the special Firestore timestamp format "v2025-04-11T16:37:14.111Z"
      if (
        timestamp.startsWith('v') &&
        timestamp.includes('T') &&
        timestamp.includes('Z')
      ) {
        // Remove the 'v' prefix and parse as ISO string
        const isoString = timestamp.substring(1);
        date = new Date(isoString);
      } else if (isNaN(Date.parse(timestamp))) {
        // Not a valid date string, just show as text
        return timestamp;
      } else {
        // Standard ISO string or other parseable date format
        date = new Date(timestamp);
      }
    }

    if (!date || isNaN(date.getTime())) {
      return 'just now';
    }

    // Ensure the date is not in the future
    const now = new Date();
    if (date.getTime() > now.getTime()) {
      return 'just now';
    }

    return formatTimestamp(date);
  } catch (error) {
    console.error('Error formatting timestamp:', error, timestamp);
    return 'just now';
  }

  // Fallback for unknown format
  return 'just now';
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

// Helper function to extract hashtags from description
export function extractHashtagsFromText(text: string): string[] {
  if (!text) return [];

  // Regex to match hashtags
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex) || [];

  // Remove the # symbol and filter out empty strings
  return matches
    .map(tag => tag.replace('#', '').trim())
    .filter(tag => tag.length > 0);
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

  // Ensure hashtags is always an array even if it's undefined or null
  let hashtags = Array.isArray(postData.hashtags)
    ? [...postData.hashtags] // Create a copy to avoid reference issues
    : [];

  // Extract hashtags from description and combine with existing hashtags
  if (postData.description) {
    const extractedTags = extractHashtagsFromText(postData.description);
    if (extractedTags.length > 0) {
      // Combine both arrays and remove duplicates
      hashtags = [...new Set([...hashtags, ...extractedTags])];
    }
  }

  console.log(`Converting post ${postData.id} with hashtags:`, hashtags);

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
    hashtags: hashtags, // Use the combined hashtags array
    isVideo: postData.isVideo,
    commentsList: postData.commentsList?.map(convertFirestoreComment),
    isLiked: (postData.likedBy || []).includes(currentUserId),
    isSaved: false, // Adding missing required property
  };
}
