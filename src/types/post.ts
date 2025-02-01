import {ImageSourcePropType} from 'react-native';

interface User {
  id: string;
  username: string;
  image: ImageSourcePropType;
}

export interface PostType {
  id: string;
  user: User;
  description: string;
  likes: number;
  comments: number;
  timestamp: string;
  postImage?: ImageSourcePropType;
  postImages?: ImageSourcePropType[];
  postVideo?: number; // For require('../path/to/video.mp4')
  isVideo?: boolean;
}
