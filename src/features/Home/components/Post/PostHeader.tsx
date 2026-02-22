import React from 'react';
import { View, Image, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Avatar } from 'react-native-elements';
import { getUsernameForLogo } from 'shared/helpers/common/stringHelpers';
import { PostHeaderProps } from '../../types';

export const PostHeader: React.FC<PostHeaderProps> = ({
  username,
  userProfileImage,
  isDark,
  onOptionsPress,
  styles,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.userInfo}>
        {userProfileImage ? (
          <Image
            source={
              typeof userProfileImage === 'string'
                ? { uri: userProfileImage }
                : userProfileImage
            }
            style={styles.avatar}
            onError={e =>
              console.log('Avatar loading error:', e.nativeEvent.error)
            }
          />
        ) : (
          <Avatar
            titleStyle={styles.titleStyle}
            title={getUsernameForLogo(username || 'Anonymous')}
            activeOpacity={0.7}
          />
        )}
        <Text style={[styles.username]}>{username}</Text>
      </View>
      <TouchableOpacity onPress={onOptionsPress}>
        <Icon
          name="more-horizontal"
          size={24}
          color={isDark ? 'white' : 'black'}
        />
      </TouchableOpacity>
    </View>
  );
};
