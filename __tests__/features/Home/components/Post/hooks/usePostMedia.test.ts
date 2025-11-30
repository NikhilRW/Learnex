import {renderHook, act, waitFor} from '@testing-library/react-native';
import {usePostMedia} from '../../../../../../src/features/Home/components/Post/hooks/usePostMedia';
import {Dimensions, Image} from 'react-native';

// Mock Dimensions and Image separately
jest.spyOn(Dimensions, 'get').mockReturnValue({
  width: 375,
  height: 812,
  scale: 2,
  fontScale: 1,
});

jest.spyOn(Image, 'getSize').mockImplementation((uri, success, failure) => {
  if (uri && typeof uri === 'string') {
    success?.(400, 300);
  } else {
    failure?.(new Error('Invalid URI'));
  }
});

jest.spyOn(Image, 'resolveAssetSource').mockImplementation((source) => {
  if (typeof source === 'number') {
    return {width: 400, height: 300, uri: 'asset://image.png', scale: 1};
  }
  return null as any;
});

describe('usePostMedia hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (Dimensions.get as jest.Mock).mockReturnValue({width: 375, height: 812});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial state', () => {
    it('should initialize with default values for image posts', () => {
      const {result} = renderHook(() =>
        usePostMedia(false, false, ['image1.jpg'], undefined, undefined, true),
      );

      expect(result.current.isPaused).toBe(false);
      expect(result.current.showDots).toBe(true);
      expect(result.current.currentMediaIndex).toBe(0);
      expect(result.current.screenWidth).toBe(375);
      expect(typeof result.current.imageHeight).toBe('number');
    });

    it('should initialize with video paused when not visible', () => {
      const {result} = renderHook(() =>
        usePostMedia(true, false, [], undefined, 'video.mp4', false),
      );

      expect(result.current.isPaused).toBe(true);
    });

    it('should initialize with video playing when visible', () => {
      const {result} = renderHook(() =>
        usePostMedia(true, false, [], undefined, 'video.mp4', true),
      );

      expect(result.current.isPaused).toBe(false);
    });

    it('should set taller image height for vertical content', () => {
      const {result} = renderHook(() =>
        usePostMedia(false, true, ['image.jpg'], undefined, undefined, true),
      );

      // For vertical content, height should be min(480, screenWidth * 1.5)
      expect(result.current.imageHeight).toBeLessThanOrEqual(480);
    });

    it('should set shorter image height for horizontal content', () => {
      const {result} = renderHook(() =>
        usePostMedia(false, false, ['image.jpg'], undefined, undefined, true),
      );

      // For horizontal content, height should be min(300, screenWidth * 0.6)
      expect(result.current.imageHeight).toBeLessThanOrEqual(300);
    });
  });

  describe('Video visibility handling', () => {
    it('should pause video when visibility changes to false', () => {
      const {result, rerender} = renderHook(
        ({isVisible}) =>
          usePostMedia(true, false, [], undefined, 'video.mp4', isVisible),
        {initialProps: {isVisible: true}},
      );

      expect(result.current.isPaused).toBe(false);

      rerender({isVisible: false});

      expect(result.current.isPaused).toBe(true);
    });

    it('should resume video when visibility changes to true', () => {
      const {result, rerender} = renderHook(
        ({isVisible}) =>
          usePostMedia(true, false, [], undefined, 'video.mp4', isVisible),
        {initialProps: {isVisible: false}},
      );

      expect(result.current.isPaused).toBe(true);

      rerender({isVisible: true});

      expect(result.current.isPaused).toBe(false);
    });

    it('should not affect isPaused for non-video content', () => {
      const {result, rerender} = renderHook(
        ({isVisible}) =>
          usePostMedia(false, false, ['image.jpg'], undefined, undefined, isVisible),
        {initialProps: {isVisible: true}},
      );

      // Initial state for non-video should be paused = !isVisible (false since isVisible=true)
      expect(result.current.isPaused).toBe(false);

      rerender({isVisible: false});

      // For non-video content, the useEffect with isVideo dependency won't trigger
      // because isVideo is false - so state shouldn't change from initial
      expect(result.current.isPaused).toBe(false);
    });
  });

  describe('handleVideoPress', () => {
    it('should toggle isPaused state when video is pressed', () => {
      const {result} = renderHook(() =>
        usePostMedia(true, false, [], undefined, 'video.mp4', true),
      );

      expect(result.current.isPaused).toBe(false);

      act(() => {
        result.current.handleVideoPress();
      });

      expect(result.current.isPaused).toBe(true);

      act(() => {
        result.current.handleVideoPress();
      });

      expect(result.current.isPaused).toBe(false);
    });

    it('should show dots temporarily when video is pressed', async () => {
      jest.useRealTimers();
      const {result} = renderHook(() =>
        usePostMedia(true, false, [], undefined, 'video.mp4', true),
      );

      act(() => {
        result.current.handleVideoPress();
      });

      // Dots should be shown after video press
      expect(result.current.showDots).toBe(true);
      
      // Note: The timeout functionality is tested in handleMediaTouch tests
      // This test just verifies that pressing video triggers showDots
      jest.useFakeTimers();
    });
  });

  describe('handleMediaTouch', () => {
    it('should show dots when media is touched', () => {
      const {result} = renderHook(() =>
        usePostMedia(false, false, ['image.jpg'], undefined, undefined, true),
      );

      act(() => {
        result.current.handleMediaTouch();
      });

      expect(result.current.showDots).toBe(true);
    });

    it('should hide dots after 3 seconds', () => {
      const {result} = renderHook(() =>
        usePostMedia(false, false, ['image.jpg'], undefined, undefined, true),
      );

      act(() => {
        result.current.handleMediaTouch();
      });

      expect(result.current.showDots).toBe(true);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.showDots).toBe(false);
    });

    it('should reset timer when touched again before timeout', () => {
      const {result} = renderHook(() =>
        usePostMedia(false, false, ['image.jpg'], undefined, undefined, true),
      );

      act(() => {
        result.current.handleMediaTouch();
      });

      // Advance partially through the timeout
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.showDots).toBe(true);

      // Touch again to reset the timer
      act(() => {
        result.current.handleMediaTouch();
      });

      // Advance by 2 seconds again (would have triggered hide if timer wasn't reset)
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.showDots).toBe(true);

      // Advance to complete the new timeout
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.showDots).toBe(false);
    });
  });

  describe('Media navigation', () => {
    it('should navigate to previous media correctly', () => {
      const {result} = renderHook(() =>
        usePostMedia(false, false, ['image1.jpg', 'image2.jpg', 'image3.jpg'], undefined, undefined, true),
      );

      // Set to middle image first
      act(() => {
        result.current.goToNextMedia();
      });

      expect(result.current.currentMediaIndex).toBe(1);

      act(() => {
        result.current.goToPreviousMedia();
      });

      expect(result.current.currentMediaIndex).toBe(0);
    });

    it('should not navigate before first media', () => {
      const {result} = renderHook(() =>
        usePostMedia(false, false, ['image1.jpg', 'image2.jpg'], undefined, undefined, true),
      );

      expect(result.current.currentMediaIndex).toBe(0);

      act(() => {
        result.current.goToPreviousMedia();
      });

      expect(result.current.currentMediaIndex).toBe(0);
    });

    it('should navigate to next media correctly', () => {
      const {result} = renderHook(() =>
        usePostMedia(false, false, ['image1.jpg', 'image2.jpg', 'image3.jpg'], undefined, undefined, true),
      );

      expect(result.current.currentMediaIndex).toBe(0);

      act(() => {
        result.current.goToNextMedia();
      });

      expect(result.current.currentMediaIndex).toBe(1);

      act(() => {
        result.current.goToNextMedia();
      });

      expect(result.current.currentMediaIndex).toBe(2);
    });

    it('should allow setting media index directly', () => {
      const {result} = renderHook(() =>
        usePostMedia(false, false, ['image1.jpg', 'image2.jpg', 'image3.jpg'], undefined, undefined, true),
      );

      act(() => {
        result.current.setCurrentMediaIndex(2);
      });

      expect(result.current.currentMediaIndex).toBe(2);
    });
  });

  describe('handleVideoProgress', () => {
    it('should track video progress', () => {
      const {result} = renderHook(() =>
        usePostMedia(true, false, [], undefined, 'video.mp4', true),
      );

      act(() => {
        result.current.handleVideoProgress({
          currentTime: 10,
          playableDuration: 100,
          seekableDuration: 100,
        });
      });

      // The hook stores progress internally via ref, so we just verify no errors
      expect(result.current.handleVideoProgress).toBeDefined();
    });
  });

  describe('videoRef', () => {
    it('should provide a video ref', () => {
      const {result} = renderHook(() =>
        usePostMedia(true, false, [], undefined, 'video.mp4', true),
      );

      expect(result.current.videoRef).toBeDefined();
      expect(result.current.videoRef.current).toBe(null);
    });
  });

  describe('Image size calculation with local assets', () => {
    it('should handle local asset images using resolveAssetSource', () => {
      // Mock local asset number (e.g., require('image.png'))
      (Image.resolveAssetSource as jest.Mock).mockReturnValue({
        width: 400,
        height: 300,
      });

      const {result} = renderHook(() =>
        usePostMedia(false, false, [1], undefined, undefined, true),
      );

      // The hook should call resolveAssetSource for numeric sources
      expect(Image.resolveAssetSource).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should clean up timeout on unmount', () => {
      const {result, unmount} = renderHook(() =>
        usePostMedia(false, false, ['image.jpg'], undefined, undefined, true),
      );

      // Trigger a timeout
      act(() => {
        result.current.handleMediaTouch();
      });

      // Unmount should clean up without errors
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });
});
