import axios from 'axios';
import {API_URL} from '../config';

// Types
export interface Post {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  likes: number;
  comments: any[];
}

export interface CreatePostData {
  title: string;
  content: string;
  category: string;
  tags: string[];
  image?: File;
}

export interface GetPostsParams {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  author?: string;
  search?: string;
}

// Create a new post
export const createPost = async (data: CreatePostData): Promise<Post> => {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('content', data.content);
  formData.append('category', data.category);
  data.tags.forEach(tag => formData.append('tags', tag));
  if (data.image) {
    formData.append('image', data.image);
  }

  const response = await axios.post(`${API_URL}/posts`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
};

// Get all posts
export const getPosts = async (params: GetPostsParams = {}) => {
  const response = await axios.get(`${API_URL}/posts`, {params});
  return response.data;
};

// Get a single post
export const getPost = async (id: string): Promise<Post> => {
  const response = await axios.get(`${API_URL}/posts/${id}`);
  return response.data.data;
};

// Update a post
export const updatePost = async (
  id: string,
  data: Partial<CreatePostData>,
): Promise<Post> => {
  const formData = new FormData();
  if (data.title) formData.append('title', data.title);
  if (data.content) formData.append('content', data.content);
  if (data.category) formData.append('category', data.category);
  if (data.tags) data.tags.forEach(tag => formData.append('tags', tag));
  if (data.image) formData.append('image', data.image);

  const response = await axios.put(`${API_URL}/posts/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
};

// Delete a post
export const deletePost = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/posts/${id}`);
};

// Toggle like on a post
export const toggleLike = async (id: string): Promise<Post> => {
  const response = await axios.post(`${API_URL}/posts/${id}/like`);
  return response.data.data;
};
