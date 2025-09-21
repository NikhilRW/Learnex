import { ActivityIndicator } from 'react-native';
import React from 'react';
import { styles } from '../styles/ButtonLoader.styles';
const ButtonLoader = () => {
  return (
    <ActivityIndicator
      color={'white'}
      size={38}
      animating={true}
      children
      style={styles.activityIndicator}
    />
  );
};

export default ButtonLoader;