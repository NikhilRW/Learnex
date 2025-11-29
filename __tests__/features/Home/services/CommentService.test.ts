import {CommentService} from '../../../../src/features/Home/services/CommentService';

// Mock firebase modules
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      uid: 'test-user-123',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
      email: 'test@example.com',
    },
  })),
}));

// Create mock document reference
const mockDocRef = {
  id: 'comment-123',
};

const mockDocData = {
  userId: 'test-user-123',
  username: 'Test User',
  text: 'Test comment',
  likes: 5,
  likedBy: ['user-1', 'user-2'],
  timestamp: {toDate: () => new Date()},
};

const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({
    batch: jest.fn(() => mockBatch),
  })),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => mockDocRef),
  getDoc: jest.fn(() =>
    Promise.resolve({
      exists: () => true,
      data: () => mockDocData,
      ref: mockDocRef,
    }),
  ),
  getDocs: jest.fn(() =>
    Promise.resolve({
      docs: [],
      size: 0,
    }),
  ),
  updateDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => ({type: 'serverTimestamp'})),
  arrayUnion: jest.fn(value => ({type: 'arrayUnion', value})),
  arrayRemove: jest.fn(value => ({type: 'arrayRemove', value})),
  increment: jest.fn(value => ({type: 'increment', value})),
  query: jest.fn((...args) => args),
  orderBy: jest.fn(() => ({})),
  writeBatch: jest.fn(() => mockBatch),
}));

describe('CommentService', () => {
  let commentService: CommentService;

  beforeEach(() => {
    jest.clearAllMocks();
    commentService = new CommentService();
  });

  describe('addComment', () => {
    it('should add a comment successfully', async () => {
      const {getDoc} = require('@react-native-firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({title: 'Test Post'}),
      });
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({username: 'Test User', image: 'https://example.com/photo.jpg'}),
      });

      const result = await commentService.addComment('post-123', 'Great post!');

      expect(result.success).toBe(true);
      expect(result.comment).toBeDefined();
    });

    it('should fail when user is not authenticated', async () => {
      const {getAuth} = require('@react-native-firebase/auth');
      getAuth.mockReturnValueOnce({currentUser: null});

      const result = await commentService.addComment('post-123', 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
    });

    it('should fail when post does not exist', async () => {
      const {getDoc} = require('@react-native-firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const result = await commentService.addComment('nonexistent-post', 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Post not found');
    });

    it('should fail when user data does not exist', async () => {
      const {getDoc} = require('@react-native-firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({title: 'Test Post'}),
      });
      getDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const result = await commentService.addComment('post-123', 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User data not found');
    });
  });

  describe('likeComment', () => {
    it('should like a comment successfully', async () => {
      const {getDoc, updateDoc} = require('@react-native-firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({title: 'Test Post'}),
      });
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockDocData,
        ref: mockDocRef,
      });
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({...mockDocData, likedBy: []}),
      });

      const result = await commentService.likeComment('post-123', 'comment-123');

      expect(result.success).toBe(true);
    });

    it('should fail when user is not authenticated', async () => {
      const {getAuth} = require('@react-native-firebase/auth');
      getAuth.mockReturnValueOnce({currentUser: null});

      const result = await commentService.likeComment('post-123', 'comment-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
    });
  });

  describe('editComment', () => {
    it('should fail when user is not authenticated', async () => {
      const {getAuth} = require('@react-native-firebase/auth');
      getAuth.mockReturnValueOnce({currentUser: null});

      const result = await commentService.editComment('post-123', 'comment-123', 'Updated text');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
    });

    it('should fail when comment is not found', async () => {
      const {getDoc} = require('@react-native-firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({title: 'Test Post'}),
      });
      getDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const result = await commentService.editComment('post-123', 'nonexistent', 'Updated text');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Comment not found');
    });
  });

  describe('deleteComment', () => {
    it('should fail when user is not authenticated', async () => {
      const {getAuth} = require('@react-native-firebase/auth');
      getAuth.mockReturnValueOnce({currentUser: null});

      const result = await commentService.deleteComment('post-123', 'comment-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
    });

    it('should fail when comment is not found', async () => {
      const {getDoc} = require('@react-native-firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({title: 'Test Post'}),
      });
      getDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const result = await commentService.deleteComment('post-123', 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Comment not found');
    });
  });

  describe('addReply', () => {
    it('should fail when user is not authenticated', async () => {
      const {getAuth} = require('@react-native-firebase/auth');
      getAuth.mockReturnValueOnce({currentUser: null});

      const result = await commentService.addReply('post-123', 'comment-123', 'Reply text');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
    });

    it('should fail when post does not exist', async () => {
      const {getDoc} = require('@react-native-firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const result = await commentService.addReply('nonexistent-post', 'comment-123', 'Reply text');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Post not found');
    });

    it('should fail when parent comment does not exist', async () => {
      const {getDoc} = require('@react-native-firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({title: 'Test Post'}),
      });
      getDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const result = await commentService.addReply('post-123', 'nonexistent-comment', 'Reply text');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Parent comment not found');
    });

    it('should add a reply successfully', async () => {
      const {getDoc} = require('@react-native-firebase/firestore');
      // Post exists
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({title: 'Test Post'}),
      });
      // Parent comment exists
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockDocData,
      });
      // User data exists
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({username: 'Test User', image: 'https://example.com/photo.jpg'}),
      });

      const result = await commentService.addReply('post-123', 'comment-123', 'This is a reply');

      expect(result.success).toBe(true);
      expect(result.reply).toBeDefined();
      expect(result.reply?.text).toBe('This is a reply');
    });
  });
});
