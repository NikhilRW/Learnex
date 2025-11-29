import {renderHook, act} from '@testing-library/react-native';
import {usePostSave} from '../../../../../../src/features/Home/components/Post/hooks/usePostSave';
import Snackbar from 'react-native-snackbar';

// Mock react-native-snackbar
jest.mock('react-native-snackbar', () => ({
  show: jest.fn(),
  LENGTH_LONG: 0,
  LENGTH_SHORT: 1,
}));

// Mock firestore
jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
      })),
    })),
  })),
}));

// Create mock firebase object
const createMockFirebase = (
  savePostResult = {success: true, saved: true},
  currentUser = {uid: 'test-user-123'},
) => ({
  posts: {
    savePost: jest.fn().mockResolvedValue(savePostResult),
  },
  currentUser: jest.fn().mockReturnValue(currentUser),
});

describe('usePostSave hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should initialize as saved when initialIsSaved is true', () => {
      const mockFirebase = createMockFirebase();
      const {result} = renderHook(() =>
        usePostSave('post-123', true, mockFirebase as any),
      );

      expect(result.current.isSaved).toBe(true);
      expect(result.current.isSaving).toBe(false);
    });

    it('should initialize as not saved when initialIsSaved is false', () => {
      const mockFirebase = createMockFirebase();
      const {result} = renderHook(() =>
        usePostSave('post-123', false, mockFirebase as any),
      );

      expect(result.current.isSaved).toBe(false);
    });

    it('should initialize as not saved when initialIsSaved is undefined', () => {
      const mockFirebase = createMockFirebase();
      const {result} = renderHook(() =>
        usePostSave('post-123', undefined, mockFirebase as any),
      );

      expect(result.current.isSaved).toBe(false);
    });
  });

  describe('handleSavePost', () => {
    it('should save a post successfully', async () => {
      const mockFirebase = createMockFirebase({success: true, saved: true});
      const {result} = renderHook(() =>
        usePostSave('post-123', false, mockFirebase as any),
      );

      await act(async () => {
        await result.current.handleSavePost();
      });

      expect(result.current.isSaved).toBe(true);
      expect(result.current.isSaving).toBe(false);
      expect(mockFirebase.posts.savePost).toHaveBeenCalledWith('post-123');
      expect(Snackbar.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Post saved',
          backgroundColor: '#2379C2',
        }),
      );
    });

    it('should unsave a post successfully', async () => {
      const mockFirebase = createMockFirebase({success: true, saved: false});
      const {result} = renderHook(() =>
        usePostSave('post-123', true, mockFirebase as any),
      );

      await act(async () => {
        await result.current.handleSavePost();
      });

      expect(result.current.isSaved).toBe(false);
      expect(Snackbar.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Post unsaved',
        }),
      );
    });

    it('should show error snackbar on API failure', async () => {
      const mockFirebase = createMockFirebase({
        success: false,
        error: 'Failed to save',
      });
      const {result} = renderHook(() =>
        usePostSave('post-123', false, mockFirebase as any),
      );

      await act(async () => {
        await result.current.handleSavePost();
      });

      expect(Snackbar.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Failed to save',
          backgroundColor: '#ff3b30',
        }),
      );
    });

    it('should use default error message when API returns no error message', async () => {
      const mockFirebase = createMockFirebase({success: false});
      const {result} = renderHook(() =>
        usePostSave('post-123', false, mockFirebase as any),
      );

      await act(async () => {
        await result.current.handleSavePost();
      });

      expect(Snackbar.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Failed to save post',
        }),
      );
    });

    it('should handle network errors gracefully', async () => {
      const mockFirebase = {
        posts: {
          savePost: jest.fn().mockRejectedValue(new Error('Network error')),
        },
        currentUser: jest.fn().mockReturnValue({uid: 'test-user'}),
      };
      const {result} = renderHook(() =>
        usePostSave('post-123', false, mockFirebase as any),
      );

      await act(async () => {
        await result.current.handleSavePost();
      });

      expect(result.current.isSaving).toBe(false);
      expect(Snackbar.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'An error occurred while saving the post',
          backgroundColor: '#ff3b30',
        }),
      );
    });

    it('should set isSaving to true during the save operation', async () => {
      let resolvePromise: (value: {success: boolean; saved: boolean}) => void;
      const savePromise = new Promise<{success: boolean; saved: boolean}>(resolve => {
        resolvePromise = resolve;
      });

      const mockFirebase = {
        posts: {
          savePost: jest.fn().mockReturnValue(savePromise),
        },
        currentUser: jest.fn().mockReturnValue({uid: 'test-user'}),
      };

      const {result} = renderHook(() =>
        usePostSave('post-123', false, mockFirebase as any),
      );

      // Start the save operation but don't await
      act(() => {
        result.current.handleSavePost();
      });

      // isSaving should be true while the operation is in progress
      expect(result.current.isSaving).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise({success: true, saved: true});
      });

      expect(result.current.isSaving).toBe(false);
    });

    it('should prevent multiple save operations when already saving', async () => {
      let resolvePromise: (value: {success: boolean; saved: boolean}) => void;
      const savePromise = new Promise<{success: boolean; saved: boolean}>(resolve => {
        resolvePromise = resolve;
      });

      const mockFirebase = {
        posts: {
          savePost: jest.fn().mockReturnValue(savePromise),
        },
        currentUser: jest.fn().mockReturnValue({uid: 'test-user'}),
      };

      const {result} = renderHook(() =>
        usePostSave('post-123', false, mockFirebase as any),
      );

      // Start first save operation
      act(() => {
        result.current.handleSavePost();
      });

      // Try to start a second save operation
      act(() => {
        result.current.handleSavePost();
      });

      // savePost should only be called once
      expect(mockFirebase.posts.savePost).toHaveBeenCalledTimes(1);

      // Cleanup
      await act(async () => {
        resolvePromise({success: true, saved: true});
      });
    });
  });
});
