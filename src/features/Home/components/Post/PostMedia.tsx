import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  Animated,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Video from 'react-native-video';
import {PostMediaProps} from '../../types';

export const PostMedia: React.FC<PostMediaProps> = ({
  allMedia,
  currentMediaIndex,
  showDots,
  screenWidth,
  imageHeight,
  isVertical,
  isPaused,
  videoRef,
  onVideoPress,
  onMediaTouch,
  onPreviousMedia,
  onNextMedia,
  onVideoProgress,
  styles,
}) => {
  if (!allMedia || allMedia.length === 0) {
    return null;
  }

  const renderVideoContent = (videoSource: any) => {
    let source;
    if (typeof videoSource === 'number') {
      source = videoSource as unknown as NodeRequire;
    } else if (typeof videoSource === 'string') {
      source = videoSource;
    } else if (videoSource && typeof videoSource === 'object') {
      const videoObject = videoSource as {uri?: string};
      if (videoObject.uri) {
        source = videoObject.uri;
      } else {
        return (
          <View style={localStyles.errorContainer}>
            <Text>Invalid video format</Text>
          </View>
        );
      }
    } else {
      return (
        <View style={localStyles.errorContainer}>
          <Text>Invalid video format</Text>
        </View>
      );
    }

    return (
      <TouchableWithoutFeedback onPress={onVideoPress}>
        <View
          style={[
            styles.videoContainer,
            {width: screenWidth - 24, height: imageHeight},
          ]}>
          <Video
            ref={videoRef}
            source={{uri: source}}
            style={styles.postImage}
            resizeMode={isVertical ? 'cover' : 'contain'}
            paused={isPaused}
            repeat
            onProgress={onVideoProgress}
            onError={error => console.error('Video loading error:', error)}
          />
          {isPaused && <View style={styles.pausedOverlay} />}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const renderImageContent = (imageSource: any) => {
    let source;
    if (typeof imageSource === 'number') {
      source = imageSource;
    } else if (typeof imageSource === 'string') {
      source = {uri: imageSource};
    } else if (
      imageSource &&
      typeof imageSource === 'object' &&
      'uri' in imageSource
    ) {
      source = {uri: imageSource.uri};
    } else {
      return null;
    }

    return (
      <TouchableWithoutFeedback onPress={onMediaTouch}>
        <Image
          source={source}
          style={[
            styles.postImage,
            {height: imageHeight || (isVertical ? 480 : 300)},
          ]}
          resizeMode={isVertical ? 'cover' : 'contain'}
          onError={error =>
            console.error(
              'Image loading error for source',
              source,
              ':',
              error.nativeEvent.error,
            )
          }
        />
      </TouchableWithoutFeedback>
    );
  };

  if (allMedia.length === 1) {
    if (allMedia[0].type === 'video') {
      return renderVideoContent(allMedia[0].source);
    } else {
      return renderImageContent(allMedia[0].source);
    }
  }

  return (
    <View style={[styles.mediaContainer]}>
      {allMedia[currentMediaIndex].type === 'video'
        ? renderVideoContent(allMedia[currentMediaIndex].source)
        : renderImageContent(allMedia[currentMediaIndex].source)}

      {showDots && allMedia.length > 1 && (
        <>
          {currentMediaIndex > 0 && (
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={onPreviousMedia}>
              <Icon name="chevron-left" size={30} color="white" />
            </TouchableOpacity>
          )}

          {currentMediaIndex < allMedia.length - 1 && (
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={onNextMedia}>
              <Icon name="chevron-right" size={30} color="white" />
            </TouchableOpacity>
          )}

          <View style={styles.paginationDots}>
            {allMedia.map((_, index) => {
              const bgColor =
                index === currentMediaIndex
                  ? '#fff'
                  : 'rgba(255, 255, 255, 0.5)';
              const dotBgStyle = {backgroundColor: bgColor};
              return (
                <Animated.View key={index} style={[styles.dot, dotBgStyle]} />
              );
            })}
          </View>
        </>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  errorContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
});
