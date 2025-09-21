import {StyleSheet,Dimensions} from 'react-native';

const {height} = Dimensions.get('window');
export const styles = StyleSheet.create({
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: height / 2 - 60, // Center vertically with offset
    left: '44.65%', // Center horizontally
  },
});
