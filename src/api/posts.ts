import {Request, Response} from 'express';
import Post, {IPost} from '../models/Post';
import {uploadToCloudinary} from '../utils/cloudinary';

// Create a new post
export const createPost = async (req: Request, res: Response) => {
  try {
    const {title, content, category, tags} = req.body;
    const author = req.user?._id; // Assuming user is attached to request by auth middleware

    if (!author) {
      return res.status(401).json({message: 'User not authenticated'});
    }

    // Handle image upload if present
    let imageUrl;
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file);
      imageUrl = uploadResult.secure_url;
    }

    // Create new post
    const post = new Post({
      title,
      content,
      category,
      tags: tags || [],
      author,
      imageUrl,
    });

    await post.save();

    // Populate author information
    await post.populate('author', 'name avatar');

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get all posts with pagination and filters
export const getPosts = async (req: Request, res: Response) => {
  try {
    const {page = 1, limit = 10, category, tag, author, search} = req.query;

    const query: any = {};

    // Apply filters
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (author) query.author = author;
    if (search) {
      query.$text = {$search: search as string};
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .sort({createdAt: -1})
      .skip(skip)
      .limit(Number(limit))
      .populate('author', 'name avatar')
      .populate('comments');

    res.json({
      success: true,
      data: posts,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get a single post by ID
export const getPost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate('comments');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching post',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update a post
export const updatePost = async (req: Request, res: Response) => {
  try {
    const {title, content, category, tags} = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post',
      });
    }

    // Handle image upload if present
    let imageUrl = post.imageUrl;
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file);
      imageUrl = uploadResult.secure_url;
    }

    // Update post
    post.title = title || post.title;
    post.content = content || post.content;
    post.category = category || post.category;
    post.tags = tags || post.tags;
    post.imageUrl = imageUrl;

    await post.save();

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating post',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete a post
export const deletePost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post',
      });
    }

    await post.deleteOne();

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Like/Unlike a post
export const toggleLike = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const userId = req.user?._id;
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling like',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
