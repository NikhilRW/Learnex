import React from 'react';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

const MessageReactionIcon = ({text}: {text: string}) => {
  return (
    <Animated.Text
      className={'text-[11px] font-bold'}
      entering={FadeIn}
      exiting={FadeOut}>
      {text}
    </Animated.Text>
  );
};

export default MessageReactionIcon;
