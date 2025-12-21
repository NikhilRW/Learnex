import {Text, View} from 'react-native';
import React from 'react';
import {styles} from '../styles/ErrorMessage.style';
const ErrorMessage = ({error}: {error: string}) => {
  return (
    <View
      className="w-full px-[2.5%] justify-center"
      style={styles.errorMessageContainer}>
      <Text className="text-[#ff3333] font-bold"> {error}</Text>
    </View>
  );
};

export default ErrorMessage;