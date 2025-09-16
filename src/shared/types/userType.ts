import {ImageSourcePropType} from 'react-native';

export type userState = {
  isLoggedIn: boolean;
  userProfileColor: string | null;
  theme: string;
  userNewlyOpenedApp: boolean | null;
  customColorPrefrence: boolean;
  userPhoto: string | null;
};

export type MediaType = {
  uri: string;
  type: 'image' | 'video';
  thumbnail?: string;
  aspectRatio?: number;
};

export type postType = {
  id: number;
  user: string;
  userImage: ImageSourcePropType;
  postImage?: ImageSourcePropType;
  postImages?: ImageSourcePropType[];
  postMedia?: MediaType[];
  description?: string;
  // TODO: number For The Development And Put Url For The Production
};
