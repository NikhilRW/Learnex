import React from 'react';
import {PostType, Comment} from './post';

export interface PostProps {
  post: PostType;
  isVisible?: boolean;
}

export interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  comments: Comment[];
  isDark: boolean;
  onAddComment?: () => Promise<void>;
  newComment?: string;
  setNewComment?: (text: string) => void;
  isAddingComment?: boolean;
  postId?: string;
}

export interface FullPostModalProps {
  currentMediaIndex: number;
  allMedia: {type: string; source: string | number}[];
  renderImageContent: (source: any, isFullModal: boolean) => React.ReactNode;
  renderVideoContent: (source: any) => React.ReactNode;
  showFullPostModal: boolean;
  setShowFullPostModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowComments: React.Dispatch<React.SetStateAction<boolean>>;
  post: PostType;
  userProfileImage?: string;
  handleLikePost: () => Promise<void>;
  handleMessageUser: () => void;
  handleSavePost: () => void;
  isLiked: boolean;
  isSaved: boolean;
  isSaving: boolean;
  screenWidth: number;
  imageHeight: number;
  formattedDescription?: React.ReactNode;
}

export interface HomeHeaderProps {
  handleTagPress: (tag: string) => void;
  trendingTags: string[];
  selectedTag: string | null;
  isDark: boolean;
}

export interface PostOptionsModalProps {
  showOptions: boolean;
  setShowOptions: React.Dispatch<React.SetStateAction<boolean>>;
  isCurrentUserPost: boolean;
  isHiding: boolean;
  post: PostType;
  isDeleting: boolean;
  handleDeletePost: () => void;
  handleMessageUser: () => void;
  handleHidePost: () => void;
}

export interface PostHeaderProps {
  username: string;
  userProfileImage: string | null;
  isDark: boolean;
  onOptionsPress: () => void;
  styles: any;
}

export interface PostActionsProps {
  isLiked: boolean;
  isSaved: boolean;
  isSaving: boolean;
  isDark: boolean;
  onLikePress: () => void;
  onCommentPress: () => void;
  onSharePress: () => void;
  onSavePress: () => void;
  styles: any;
}

export interface PostFooterProps {
  likes: number;
  username: string;
  formattedDescription: React.ReactNode;
  commentsCount: number;
  hasComments: boolean;
  timestamp: string;
  onViewCommentsPress: () => void;
  onCaptionPress: () => void;
  styles: any;
}

export interface PostMediaProps {
  allMedia: Array<{type: 'video' | 'image'; source: any}>;
  currentMediaIndex: number;
  showDots: boolean;
  screenWidth: number;
  imageHeight: number;
  isVertical: boolean;
  isPaused: boolean;
  videoRef: any;
  onVideoPress: () => void;
  onMediaTouch: () => void;
  onPreviousMedia: () => void;
  onNextMedia: () => void;
  onVideoProgress: (progress: any) => void;
  styles: any;
}
