import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Dimensions } from "react-native";
const { height } = Dimensions.get("window");
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const Loader = () => {
  const insets = useSafeAreaInsets();
  return (
    <ActivityIndicator 
        color={'#37B6F0'}
        size={50} 
        animating={true}
        children
        style={{
          justifyContent:"center",
          alignItems:"center",
          position:"absolute",
          top:height/2-60,
          left:"44.65%",
      }} 
    />
  )
}

export default Loader;