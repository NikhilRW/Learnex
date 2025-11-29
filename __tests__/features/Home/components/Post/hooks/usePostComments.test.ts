import {renderHook, act} from '@testing-library/react-native';
import {usePostComments} from '../../../../../../src/features/Home/components/Post/hooks/usePostComments';
import Snackbar from 'react-native-snackbar';

// Mock react-native-snackbar
jest.mock('react-native-snackbar', () => ({
  show: jest.fn(),
  LENGTH_LONG: 0,
  LENGTH_SHORT: 1,
}));

// Create mock firebase object
const createMockFirebase = (
  addCommentResult = {success: true, comment: {id: 'comment-1', text: 'Test comment'}},
  currentUser = {uid: 'test-user-123', displayName: 'Test User'},
) => ({
  posts: {
    addComment: jest.fn().mockResolvedValue(addCommentResult),
  },
  currentUser: jest.fn().mockReturnValue(currentUser),
});

describe('usePostComments hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should initialize with empty comment and hidden comments', () => {
      const mockFirebase = createMockFirebase();
      const {result} = renderHook(() =>
        usePostComments('post-123', mockFirebase as any),
      );

      expect(result.current.showComments).toBe(false);
      expect(result.current.newComment).toBe('');
      expect(result.current.isAddingComment).toBe(false);
    });
  });

  describe('setShowComments', () => {
    it('should toggle showComments state', () => {
      const mockFirebase = createMockFirebase();
      const {result} = renderHook(() =>
        usePostComments('post-123', mockFirebase as any),
      );

      act(() => {
        result.current.setShowComments(true);
      });

      expect(result.current.showComments).toBe(true);

      act(() => {
        result.current.setShowComments(false);
      });

      expect(result.current.showComments).toBe(false);
    });
  });

  describe('setNewComment', () => {
    it('should update newComment state', () => {
      const mockFirebase = createMockFirebase();
      const {result} = renderHook(() =>
        usePostComments('post-123', mockFirebase as any),
      );

      act(() => {
        result.current.setNewComment('This is my comment');
      });

      expect(result.current.newComment).toBe('This is my comment');
    });
  });

  describe('handleAddComment', () => {
    it('should add a comment successfully', async () => {
      const mockComment = {
        id: 'comment-1',
        text: 'Great post!',
        userId: 'test-user-123',
      };
      const mockFirebase = createMockFirebase({
        success: true,
        comment: mockComment,
      });
      const onCommentAdded = jest.fn();
      const {result} = renderHook(() =>
        usePostComments('post-123', mockFirebase as any, onCommentAdded),
      );

      act(() => {
        result.current.setNewComment('Great post!');
      });

      await act(async () => {
        await result.current.handleAddComment();
      });

      expect(mockFirebase.posts.addComment).toHaveBeenCalledWith(
        'post-123',
        'Great post!',
      );
      expect(onCommentAdded).toHaveBeenCalledWith(mockComment);
      expect(result.current.newComment).toBe('');
      expect(result.current.showComments).toBe(true);
      expect(Snackbar.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Comment added successfully',
          backgroundColor: '#2379C2',
        }),
      );
    });

    it('should not add an empty comment', async () => {
      const mockFirebase = createMockFirebase();
      const onCommentAdded = jest.fn();
      const {result} = renderHook(() =>
        usePostComments('post-123', mockFirebase as any, onCommentAdded),
      );

      await act(async () => {
        await result.current.handleAddComment();
      });

      expect(mockFirebase.posts.addComment).not.toHaveBeenCalled();
      expect(onCommentAdded).not.toHaveBeenCalled();
    });

    it('should not add a whitespace-only comment', async () => {
      const mockFirebase = createMockFirebase();
      const onCommentAdded = jest.fn();
      const {result} = renderHook(() =>
        usePostComments('post-123', mockFirebase as any, onCommentAdded),
      );

      act(() => {
        result.current.setNewComment('   ');
      });

      await act(async () => {
        await result.current.handleAddComment();
      });

      expect(mockFirebase.posts.addComment).not.toHaveBeenCalled();
      expect(onCommentAdded).not.toHaveBeenCalled();
    });

    it('should show error when user is not logged in', async () => {
      const mockFirebase = createMockFirebase({success: true}, null);
      const {result} = renderHook(() =>
        usePostComments('post-123', mockFirebase as any),
      );

      act(() => {
        result.current.setNewComment('My comment');
      });

      await act(async () => {
        await result.current.handleAddComment();
      });

      expect(Snackbar.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'You must be logged in to comment',
          backgroundColor: '#ff3b30',
        }),
      );
    });

    it('should show error snackbar on API failure', async () => {
      const mockFirebase = createMockFirebase({
        success: false,
        error: 'Failed to add comment',
      });
      const {result} = renderHook(() =>
        usePostComments('post-123', mockFirebase as any),
      );

      act(() => {
        result.current.setNewComment('My comment');
      });

      await act(async () => {
        await result.current.handleAddComment();
      });

      expect(Snackbar.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Failed to add comment',
          backgroundColor: '#ff3b30',
        }),
      );
    });

    it('should use default error message when API returns no error message', async () => {
      const mockFirebase = createMockFirebase({success: false});
      const {result} = renderHook(() =>
        usePostComments('post-123', mockFirebase as any),
      );

      act(() => {
        result.current.setNewComment('My comment');
      });

      await act(async () => {
        await result.current.handleAddComment();
      });

      expect(Snackbar.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Failed to add comment',
        }),
      );
    });

    it('should handle network errors gracefully', async () => {
      const mockFirebase = {
        posts: {
          addComment: jest.fn().mockRejectedValue(new Error('Network error')),
        },
        currentUser: jest.fn().mockReturnValue({uid: 'test-user'}),
      };
      const {result} = renderHook(() =>
        usePostComments('post-123', mockFirebase as any),
      );

      act(() => {
        result.current.setNewComment('My comment');
      });

      await act(async () => {
        await result.current.handleAddComment();
      });

      expect(result.current.isAddingComment).toBe(false);
      expect(Snackbar.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'An error occurred while adding your comment',
          backgroundColor: '#ff3b30',
        }),
      );
    });

    it('should set isAddingComment to true during the operation', async () => {
      let resolvePromise: (value: any) => void;
      const addPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      const mockFirebase = {
        posts: {
          addComment: jest.fn().mockReturnValue(addPromise),
        },
        currentUser: jest.fn().mockReturnValue({uid: 'test-user'}),
      };

      const {result} = renderHook(() =>
        usePostComments('post-123', mockFirebase as any),
      );

      act(() => {
        result.current.setNewComment('My comment');
      });

      // Start the operation but don't await
      act(() => {
        result.current.handleAddComment();
      });

      // isAddingComment should be true while the operation is in progress
      expect(result.current.isAddingComment).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({success: true, comment: {id: '1', text: 'test'}});
      });

      expect(result.current.isAddingComment).toBe(false);
    });

    it('should trim whitespace from comment text', async () => {
      const mockFirebase = createMockFirebase();
      const {result} = renderHook(() =>
        usePostComments('post-123', mockFirebase as any),
      );

      act(() => {
        result.current.setNewComment('  My comment with spaces  ');
      });

      await act(async () => {
        await result.current.handleAddComment();
      });

      expect(mockFirebase.posts.addComment).toHaveBeenCalledWith(
        'post-123',
        'My comment with spaces',
      );
    });

    it('should work without onCommentAdded callback', async () => {
      const mockFirebase = createMockFirebase({
        success: true,
        comment: {id: 'comment-1', text: 'Test'},
      });
      const {result} = renderHook(() =>
        usePostComments('post-123', mockFirebase as any),
      );

      act(() => {
        result.current.setNewComment('My comment');
      });

      await act(async () => {
        await result.current.handleAddComment();
      });

      // Should complete successfully without errors
      expect(result.current.newComment).toBe('');
      expect(result.current.showComments).toBe(true);
    });
  });
});
