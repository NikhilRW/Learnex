import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  card: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  darkCard: {
    backgroundColor: '#2a2a2a',
  },
  lightCard: {
    backgroundColor: 'white',
  },
  text: {
    marginTop: 10,
  },
  darkText: {
    color: '#fff',
  },
  lightText: {
    color: '#000',
  },
});
