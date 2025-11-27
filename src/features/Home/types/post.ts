import {ImageSourcePropType} from 'react-native';

interface User {
  id: string;
  username: string;
  image: string;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  userImage: string;
  text: string;
  likes: number;
  timestamp: string;
  isLiked: boolean; // Make isLiked required instead of optional
  replies?: Comment[]; // Add optional replies support
  editedAt?: string; // Add optional editedAt timestamp
}

// Firestore comment shape as stored in the database
export interface FirestoreComment {
  id: string;
  userId: string;
  username: string;
  userImage: string;
  text: string;
  likes: number;
  likedBy?: string[];
  timestamp: any; // Firestore Timestamp or serialized
  replies?: FirestoreComment[];
  editedAt?: any;
}

export interface PostType {
  id: string;
  user: User;
  description: string;
  likes: number;
  hashtags: string[];
  isSaved: boolean;
  comments: number;
  timestamp: string;
  postImage?: ImageSourcePropType;
  postImages?: ImageSourcePropType[];
  postVideo?: number | string; // For require('../path/to/video.mp4')
  isVideo?: boolean;
  commentsList?: Comment[];
  isLiked: boolean; // Change from optional to required
  isVertical?: boolean;
}

export interface AddCommentResponse {
  success: boolean;
  comment?: Comment;
  error?: string;
}
