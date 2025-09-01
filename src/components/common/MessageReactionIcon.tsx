import {View, Text} from 'react-native';
import React from 'react';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';

const MessageReactionIcon = ({text}: {text: string}) => {
  return (
    <Animated.Text
      className={'text-sm font-bold'}
      entering={FadeIn}
      exiting={FadeOut}>
      {text}
    </Animated.Text>
  );
};

export default MessageReactionIcon;
