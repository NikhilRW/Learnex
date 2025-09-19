import React from 'react'
import { Image } from 'react-native-elements';

const AnnouncementIcon = ({
  focused,
  size,
}: {
  focused: boolean;
  size: number;
  color: string;
}) => {
  return (
    focused ? <Image source={require('shared/res/pngs/megaphone_filled.png')} style={{ width: size, height: size }} /> : <Image source={require('shared/res/pngs/megaphone_unfilled.png')} style={{ width: size, height: size }} />
  );
};

export default AnnouncementIcon;