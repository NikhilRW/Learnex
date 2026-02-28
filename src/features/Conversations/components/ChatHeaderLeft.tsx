import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { getUsernameForLogo } from 'shared/helpers/common/stringHelpers';
import { Avatar } from 'react-native-elements';
import { Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createStyles } from '../styles/ChatHeaderLeft.styles';
import { ChatHeaderLeftProps } from '../types';

const ChatHeaderLeft = ({
  currentRecipientPhoto,
  isDark,
  navigation,
  recipientName,
}: ChatHeaderLeftProps) => {
  const styles = createStyles(isDark);
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
          <Image
            source={
              typeof currentRecipientPhoto === 'string'
                ? { uri: currentRecipientPhoto }
                : currentRecipientPhoto
            }
            style={styles.recipientPhoto}
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

export default ChatHeaderLeft;
