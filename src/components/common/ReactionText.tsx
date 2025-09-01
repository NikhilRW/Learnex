import {View, Text} from 'react-native';
import React from 'react';
import Reanimated, {FadeIn, FadeOut} from 'react-native-reanimated';

const ReactionText = ({text}: {text: string}) => {
  return (
    <Reanimated.Text entering={FadeIn} exiting={FadeOut}>
      {text}
    </Reanimated.Text>
  );
};

export default ReactionText;