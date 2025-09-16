import {View, Text, TouchableOpacity} from 'react-native';
import React from 'react';
import {getUsernameForLogo} from 'shared/helpers/common/stringHelpers';
import {Avatar} from 'react-native-elements';
import {Image} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {ChatNavigationObjectType} from 'conversations/types/main';

const ChatHeaderLeft = ({
  currentRecipientPhoto,
  isDark,
  navigation,
  recipientName,
}: {
  isDark: boolean;
  currentRecipientPhoto: string;
  recipientName: string;
  navigation: ChatNavigationObjectType;
}) => {
  return (
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <TouchableOpacity
        style={{marginLeft: 10, marginRight: 8}}
        onPress={() => navigation.navigate('Conversations')}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={isDark ? 'white' : 'black'}
        />
      </TouchableOpacity>

      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        {currentRecipientPhoto ? (
          <Image
            source={
              typeof currentRecipientPhoto === 'string'
                ? {uri: currentRecipientPhoto}
                : currentRecipientPhoto
            }
            style={{width: 36, height: 36, borderRadius: 18}}
          />
        ) : (
          <Avatar
            rounded
            title={getUsernameForLogo(recipientName)}
            size={36}
            containerStyle={{backgroundColor: '#2379C2'}}
          />
        )}
        <Text
          style={{
            marginLeft: 8,
            fontSize: 17,
            fontWeight: '600',
            color: isDark ? 'white' : 'black',
          }}>
          {recipientName}
        </Text>
      </View>
    </View>
  );
};

export default ChatHeaderLeft;
