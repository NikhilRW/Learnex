import {ActivityIndicator} from 'react-native';
import React from 'react';
const ButtonLoader = () => {
  return (
    <ActivityIndicator
      color={'#fff'}
      size={38}
      animating={true}
      children
      style={{
        justifyContent: 'center',
        alignItems: 'center',
      }}
    />
  );
};

export default ButtonLoader;