import {Dimensions} from 'react-native';
import {StyleSheet} from 'react-native-unistyles';

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
