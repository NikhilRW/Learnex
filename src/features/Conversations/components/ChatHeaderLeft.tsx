import {View, Text, TouchableOpacity} from 'react-native';
import React, {memo, useMemo} from 'react';
import {getUsernameForLogo} from 'shared/helpers/common/stringHelpers';
import {Avatar} from 'react-native-elements';
import CachedImage from 'shared/components/CachedImage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {createStyles} from '../styles/ChatHeaderLeft.styles';
import {ChatHeaderLeftProps} from '../types';

const ChatHeaderLeftComponent = ({
  currentRecipientPhoto,
  isDark,
  navigation,
  recipientName,
}: ChatHeaderLeftProps) => {
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  return (
    <View style={styles.backButtonContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Conversations')}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={isDark ? 'white' : 'black'}
        />
      </TouchableOpacity>

      <View style={styles.recipientPhotoContainer}>
        {currentRecipientPhoto ? (
          <CachedImage
            source={
              typeof currentRecipientPhoto === 'string'
                ? {uri: currentRecipientPhoto}
                : currentRecipientPhoto
            }
            style={styles.recipientPhoto}
            contentFit="cover"
          />
        ) : (
          <Avatar
            rounded
            title={getUsernameForLogo(recipientName)}
            size={36}
            containerStyle={styles.avatar}
          />
        )}
        <Text style={styles.recipientName}>{recipientName}</Text>
      </View>
    </View>
  );
};

export default memo(ChatHeaderLeftComponent);
