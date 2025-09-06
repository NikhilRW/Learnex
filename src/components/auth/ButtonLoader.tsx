import {ActivityIndicator} from 'react-native';
import React from 'react';
import {styles} from '../../styles/components/auth/ButtonLoader.styles';
const ButtonLoader = () => {
  return (
    <ActivityIndicator
      color={'#fff'}
      size={38}
      animating={true}
      children
      style={styles.activityIndicator}
    />
  );
};

export default ButtonLoader;