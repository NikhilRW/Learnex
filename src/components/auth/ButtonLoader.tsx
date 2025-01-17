import { ActivityIndicator, Dimensions, StyleSheet } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const { height } = Dimensions.get("window");
const ButtonLoader = () => {
  const insets = useSafeAreaInsets();
  return (
    <ActivityIndicator 
        color={'#fff'}
        size={38} 
        animating={true}
        children
        style={{
          justifyContent:"center",
          alignItems:"center",
  
      }} 
    />
  )
}

export default ButtonLoader

const styles = StyleSheet.create({})