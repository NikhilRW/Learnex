import {ActivityIndicator} from 'react-native';
import React from 'react';
import {styles} from 'auth/styles/ButtonLoader.styles';

/**
 * Generic loading spinner component
 * Displays a centered activity indicator with custom styling
 * Used throughout the app for loading states
 */

const Loader = () => {
  return (
    <ActivityIndicator
      color={'#37B6F0'} // Primary brand color
      size={50}
      animating={true}
      children
      style={styles.activityIndicator}
    />
  );
};

export default Loader;
