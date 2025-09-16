import {PostType, Comment} from 'shared/types/post';

export interface GetPostsResponse {
  success: boolean;
  posts?: PostType[];
  lastVisible?: any;
  error?: string;
}

export interface LikeResponse {
  success: boolean;
  liked?: boolean;
  error?: string;
}

export interface SavePostResponse {
  success: boolean;
  saved?: boolean;
  error?: string;
}

export interface AddCommentResponse {
  success: boolean;
  comment?: Comment;
  error?: string;
}
