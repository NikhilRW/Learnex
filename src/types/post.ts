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
  timestamp: string;
  isLiked: boolean; // Make isLiked required instead of optional
  replies?: Comment[]; // Add optional replies support
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
}