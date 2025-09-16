import { View } from 'react-native'
import React from 'react'
import { Image } from 'react-native-elements';
import { styles } from '../../../styles/components/user/UserStack/AnnouncementIcon.styles';

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
    focused ? <Image source={require('../shared/res/pngs/megaphone_filled.png')} style={{ width: size, height: size }} /> : <Image source={require('../shared/res/pngs/megaphone_unfilled.png')} style={{ width: size, height: size }} />
  );
};

export default AnnouncementIcon;