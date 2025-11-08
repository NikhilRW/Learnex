import {Text} from 'react-native';
import React from 'react';

/**
 * Extract hashtags from description text
 */
export const extractHashtags = (text: string): string[] => {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex) || [];
  return matches
    .map(tag => tag.replace('#', '').trim())
    .filter(tag => tag.length > 0);
};

/**
 * Format description with clickable hashtags
 */
export const formatDescriptionWithHashtags = (
  description: string,
  styles: any,
): React.ReactNode => {
  if (!description) {
    return null;
  }

  const parts = description.split(/(#\w+)/g);
  const formattedParts = parts.map((part, index) => {
    if (part.startsWith('#')) {
      return React.createElement(
        Text,
        {key: index, style: styles.hashtag},
        part,
      );
    }
    return React.createElement(Text, {key: index}, part);
  });

  return formattedParts;
};

/**
 * Combine all media (video + images) into a single array for navigation
 */
export const combineMediaArray = (
  postVideo: any,
  postImages: any[],
): Array<{type: 'video' | 'image'; source: any}> => {
  const mediaArray: Array<{type: 'video' | 'image'; source: any}> = [];

  if (postVideo) {
    mediaArray.push({
      type: 'video',
      source: postVideo,
    });
  }

  if (postImages && postImages.length > 0) {
    postImages.forEach(image => {
      mediaArray.push({
        type: 'image',
        source: image,
      });
    });
  }

  return mediaArray;
};
