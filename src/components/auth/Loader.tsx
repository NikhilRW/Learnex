import { ActivityIndicator, View } from 'react-native'
import React from 'react'
import { Dimensions } from "react-native";
const { height } = Dimensions.get("window");
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Generic loading spinner component
 * Displays a centered activity indicator with custom styling
 * Used throughout the app for loading states
 */
const Loader = () => {
  const insets = useSafeAreaInsets();
  return (
    <ActivityIndicator
      color={'#37B6F0'} // Primary brand color
      size={50}
      animating={true}
      children
      style={{
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: height / 2 - 60, // Center vertically with offset
        left: "44.65%", // Center horizontally
      }}
    />
  )
}

export default Loader;