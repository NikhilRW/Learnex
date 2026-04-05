import React, {memo} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {Avatar} from 'react-native-elements';
import {getUsernameForLogo} from 'shared/helpers/common/stringHelpers';
import CachedImage from 'shared/components/CachedImage';
import {PostHeaderProps} from '../../types';

const PostHeaderComponent: React.FC<PostHeaderProps> = ({
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
          <CachedImage
            source={
              typeof userProfileImage === 'string'
                ? {uri: userProfileImage}
                : userProfileImage
            }
            style={styles.avatar}
            containerStyle={styles.avatarContainer}
            contentFit="cover"
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

export const PostHeader = memo(PostHeaderComponent);
// is it deprecated?
PostHeader.displayName = 'PostHeader';
