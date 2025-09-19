import React from 'react';
import Reanimated, {FadeIn, FadeOut} from 'react-native-reanimated';

const ReactionText = ({text}: {text: string}) => {
  return (
    <Reanimated.Text entering={FadeIn} exiting={FadeOut} style={{fontSize: 26}}>
      {text}
    </Reanimated.Text>
  );
};

export default ReactionText;