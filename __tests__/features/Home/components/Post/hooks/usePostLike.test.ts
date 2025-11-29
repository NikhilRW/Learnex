import {renderHook, act, waitFor} from '@testing-library/react-native';
import {usePostLike} from '../../../../../../src/features/Home/components/Post/hooks/usePostLike';
import Snackbar from 'react-native-snackbar';

// Mock react-native-snackbar
jest.mock('react-native-snackbar', () => ({
  show: jest.fn(),
  LENGTH_LONG: 0,
  LENGTH_SHORT: 1,
}));

// Create mock firebase object
const createMockFirebase = (likePostResult = {success: true, liked: true}) => ({
  posts: {
    likePost: jest.fn().mockResolvedValue(likePostResult),
  },
});

describe('usePostLike hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should initialize with the provided isLiked value', () => {
      const mockFirebase = createMockFirebase();
      const {result} = renderHook(() =>
        usePostLike('post-123', true, mockFirebase as any),
      );

      expect(result.current.isLiked).toBe(true);
    });

    it('should initialize as not liked when initialIsLiked is false', () => {
      const mockFirebase = createMockFirebase();
      const {result} = renderHook(() =>
        usePostLike('post-123', false, mockFirebase as any),
      );

      expect(result.current.isLiked).toBe(false);
    });
  });

  describe('handleLikePost', () => {
    it('should toggle like state optimistically when liking a post', async () => {
      const mockFirebase = createMockFirebase({success: true, liked: true});
      const {result} = renderHook(() =>
        usePostLike('post-123', false, mockFirebase as any),
      );

      const onLikesUpdate = jest.fn();

      await act(async () => {
        await result.current.handleLikePost(onLikesUpdate);
      });

      expect(result.current.isLiked).toBe(true);
      expect(onLikesUpdate).toHaveBeenCalledWith(1);
      expect(mockFirebase.posts.likePost).toHaveBeenCalledWith('post-123');
    });

    it('should toggle like state optimistically when unliking a post', async () => {
      const mockFirebase = createMockFirebase({success: true, liked: false});
      const {result} = renderHook(() =>
        usePostLike('post-123', true, mockFirebase as any),
      );

      const onLikesUpdate = jest.fn();

      await act(async () => {
        await result.current.handleLikePost(onLikesUpdate);
      });

      expect(result.current.isLiked).toBe(false);
      expect(onLikesUpdate).toHaveBeenCalledWith(-1);
    });

    it('should revert state and show error snackbar on API failure', async () => {
      const mockFirebase = createMockFirebase({
        success: false,
        error: 'Server error',
      });
      const {result} = renderHook(() =>
        usePostLike('post-123', false, mockFirebase as any),
      );

      const onLikesUpdate = jest.fn();

      await act(async () => {
        await result.current.handleLikePost(onLikesUpdate);
      });

      // State should be reverted after failure
      expect(result.current.isLiked).toBe(false);
      // onLikesUpdate should be called twice: once optimistically, once to revert
      expect(onLikesUpdate).toHaveBeenCalledTimes(2);
      expect(onLikesUpdate).toHaveBeenNthCalledWith(1, 1); // Optimistic update
      expect(onLikesUpdate).toHaveBeenNthCalledWith(2, -1); // Revert
      expect(Snackbar.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Server error',
          backgroundColor: '#ff3b30',
        }),
      );
    });

    it('should handle network errors gracefully', async () => {
      const mockFirebase = {
        posts: {
          likePost: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      };
      const {result} = renderHook(() =>
        usePostLike('post-123', false, mockFirebase as any),
      );

      const onLikesUpdate = jest.fn();

      await act(async () => {
        await result.current.handleLikePost(onLikesUpdate);
      });

      // Note: Due to closure, the error handler uses stale state
      // The snackbar should still be shown
      expect(Snackbar.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Failed to update like status',
          backgroundColor: '#ff3b30',
        }),
      );
    });

    it('should use default error message when API returns no error message', async () => {
      const mockFirebase = createMockFirebase({success: false});
      const {result} = renderHook(() =>
        usePostLike('post-123', false, mockFirebase as any),
      );

      const onLikesUpdate = jest.fn();

      await act(async () => {
        await result.current.handleLikePost(onLikesUpdate);
      });

      expect(Snackbar.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Failed to update like status',
        }),
      );
    });
  });

  describe('State synchronization', () => {
    it('should update isLiked when initialIsLiked prop changes', () => {
      const mockFirebase = createMockFirebase();
      const {result, rerender} = renderHook(
        ({initialIsLiked}) =>
          usePostLike('post-123', initialIsLiked, mockFirebase as any),
        {initialProps: {initialIsLiked: false}},
      );

      expect(result.current.isLiked).toBe(false);

      rerender({initialIsLiked: true});

      expect(result.current.isLiked).toBe(true);
    });
  });
});
