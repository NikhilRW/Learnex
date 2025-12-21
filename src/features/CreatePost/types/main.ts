export interface MediaItem {
  uri: string;
  type: string;
  isVideo: boolean;
  isVertical: boolean;
  width?: number;
  height?: number;
  size?: number;
  name?: string;
  cloudinaryUrl?: string;
}

export interface PostFormData {
  description: string;
  mediaItems: MediaItem[];
  hashtags: string[];
  isPublic: boolean;
}
