import {useState, useEffect, useRef, useCallback} from 'react';
import {Dimensions, Image, ImageURISource} from 'react-native';

interface VideoProgress {
  currentTime: number;
  playableDuration: number;
  seekableDuration: number;
}

export const usePostMedia = (
  isVideo: boolean,
  isVertical: boolean,
  postImages: any[] | undefined,
  postImage: any,
  postVideo: any,
  isVisible: boolean,
) => {
  const screenWidth = Dimensions.get('window').width;
  const [imageHeight, setImageHeight] = useState(300);
  const [isPaused, setIsPaused] = useState(!isVisible);
  const [showDots, setShowDots] = useState(true);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const videoRef = useRef<any>(null);
  const lastPosition = useRef(0);
  const dotsTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVideo) {
      setIsPaused(!isVisible);
    }
  }, [isVisible, isVideo]);

  useEffect(() => {
    if (isVertical) {
      setImageHeight(Math.min(480, screenWidth * 1.5));
    } else {
      setImageHeight(Math.min(300, screenWidth * 0.6));
    }

    const firstImage = postImages?.[0] || postImage;
    if (firstImage) {
      if (typeof firstImage === 'number') {
        const imageSource = Image.resolveAssetSource(firstImage);
        if (imageSource) {
          const {width, height} = imageSource;
          const actualScreenWidth = Dimensions.get('window').width - 24;
          const scaledHeight = (height / width) * actualScreenWidth;
          setImageHeight(scaledHeight || (isVertical ? 480 : 300));
        }
      } else {
        const imageUri =
          typeof firstImage === 'string'
            ? firstImage
            : (firstImage as ImageURISource).uri;
        if (imageUri) {
          Image.getSize(
            imageUri,
            (width, height) => {
              const scaledHeight =
                (height / width) * Dimensions.get('window').width;
              setImageHeight(scaledHeight || (isVertical ? 480 : 300));
            },
            () => {
              setImageHeight(isVertical ? 480 : 300);
            },
          );
        }
      }
    }

    return () => {
      if (dotsTimeout.current) clearTimeout(dotsTimeout.current);
    };
  }, [postImages, postImage, isVertical, screenWidth]);

  const handleVideoProgress = useCallback((progress: VideoProgress) => {
    lastPosition.current = progress.currentTime;
  }, []);

  const handleVideoPress = () => {
    setIsPaused(prevState => !prevState);
    handleMediaTouch();
  };

  const handleMediaTouch = () => {
    setShowDots(true);
    if (dotsTimeout.current) {
      clearTimeout(dotsTimeout.current);
    }
    dotsTimeout.current = setTimeout(() => {
      setShowDots(false);
    }, 3000);
  };

  const goToPreviousMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  const goToNextMedia = () => {
    setCurrentMediaIndex(currentMediaIndex + 1);
  };

  return {
    imageHeight,
    isPaused,
    showDots,
    currentMediaIndex,
    videoRef,
    screenWidth,
    handleVideoProgress,
    handleVideoPress,
    handleMediaTouch,
    goToPreviousMedia,
    goToNextMedia,
    setCurrentMediaIndex,
  };
};
