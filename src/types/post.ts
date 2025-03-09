import {ImageSourcePropType} from 'react-native';

interface User {
  id: string;
  username: string;
  image: ImageSourcePropType;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  userImage: string;
  text: string;
  likes: number;
  likedBy: string[];
  timestamp: any;
  editedAt?: any;
  replies?: Comment[];
  isLiked?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface PostType {
  id: string;
  user: {
    id: string;
    username: string;
    image: string;
  };
  description: string;
  postImages?: string[];
  postVideo?: string;
  isVideo?: boolean;
  isVertical?: boolean;
  likes: number;
  comments: number;
  timestamp: any;
  commentsList?: Comment[];
  isLiked?: boolean;
  isSaved?: boolean;
  likedBy: string[];
  hashtags: string[];
}

export interface FirestoreComment {
  id: string;
  userId: string;
  username: string;
  userImage: string;
  text: string;
  likes: number;
  likedBy: string[];
  timestamp: any;
  editedAt: any | null;
  replies: FirestoreComment[];
}

export interface FirestorePost {
  id: string;
  user: {
    id: string;
    username: string;
    image: string;
  };
  description: string;
  postImages: string[];
  likes: number;
  likedBy: string[];
  comments: number;
  timestamp: any;
  commentsList: FirestoreComment[];
  hashtags: string[];
  isSaved?: boolean;
}
