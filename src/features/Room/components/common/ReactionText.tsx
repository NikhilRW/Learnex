import React from 'react';
import { StyleSheet } from 'react-native';
import Reanimated, { FadeIn, FadeOut } from 'react-native-reanimated';

const ReactionText = ({ text }: { text: string }) => {
  return (
    <Reanimated.Text entering={FadeIn} exiting={FadeOut} style={styles.reactionText}>
      {text}
    </Reanimated.Text>
  );
};

const styles = StyleSheet.create({
  reactionText: {
    fontSize: 26,
  },
});

export default ReactionText;