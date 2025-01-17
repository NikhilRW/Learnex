import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Image } from 'react-native-elements';
import { primaryColor, primaryDarkColor, primaryFocusedColor } from '../../../res/strings/eng';
import AntDesign from 'react-native-vector-icons/AntDesign';

const AnnouncementIcon = ({
  focused,
  size,
  color,
}: {
  focused: boolean;
  size: number;
  color: string;
}) => {
  return (
    <AntDesign name="notification" size={size} color={color} style={{transform: [{rotateY: '180deg'}]}} />
  );
};

export default AnnouncementIcon

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',

  }
});