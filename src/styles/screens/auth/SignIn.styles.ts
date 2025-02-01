import {StyleSheet, Platform} from 'react-native';

export const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
    width: 'auto',
    justifyContent: 'center',
    paddingTop: '12%',
    position: 'relative',
    minHeight: Platform.OS === 'ios' ? '100%' : 'auto',
  },
  cricle1: {
    top: '-4%',
    left: '-34%',
    position: 'absolute',
    opacity: 0.8,
    // zIndex: 1,
  },
  circle2: {
    top: '-15%',
    left: '-12%',
    position: 'absolute',
    opacity: 0.8,
    // zIndex: 1,
  },
});