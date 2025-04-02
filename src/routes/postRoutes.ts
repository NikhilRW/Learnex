import express from 'express';
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  toggleLike,
} from '../api/posts';
import {authenticate} from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

// Public routes
router.get('/', getPosts);
router.get('/:id', getPost);

// Protected routes
router.post('/', authenticate, upload.single('image'), createPost);
router.put('/:id', authenticate, upload.single('image'), updatePost);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/like', authenticate, toggleLike);

export default router;
