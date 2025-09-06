import {View,TouchableOpacity, Alert} from 'react-native';
import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Snackbar from 'react-native-snackbar';
import {ChatNavigationObjectType} from '../../../types/navigationTypes';
import {MessageService} from '../../../service/firebase/MessageService';

const ChatHeaderRight = ({
  isMuted,
  isDark,
  toggleNotifications,
  navigation,
  messageService,
  conversationId,
}: {
  isMuted: boolean;
  isDark: boolean;
  toggleNotifications: () => void;
  navigation: ChatNavigationObjectType;
  messageService: MessageService;
  conversationId: string;
}) => {
  return (
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <TouchableOpacity style={{marginRight: 15}} onPress={toggleNotifications}>
        <Ionicons
          name={isMuted ? 'notifications-off' : 'notifications'}
          size={24}
          color={isDark ? 'white' : 'black'}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={{marginRight: 10}}
        onPress={() => {
          Alert.alert(
            'Delete Conversation',
            'Are you sure you want to delete this conversation? This action cannot be undone.',
            [
              {text: 'Cancel', style: 'cancel'},
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  messageService
                    .deleteConversation(conversationId)
                    .then(() => {
                      navigation.navigate("Conversations");
                    })
                    .catch(_ => {
                      Snackbar.show({
                        text: 'Failed to delete conversation',
                        duration: Snackbar.LENGTH_LONG,
                        textColor: 'white',
                        backgroundColor: '#ff3b30',
                      });
                    });
                },
              },
            ],
          );
        }}>
        <MaterialIcons
          name="delete"
          size={24}
          color={isDark ? 'white' : 'black'}
        />
      </TouchableOpacity>
    </View>
  );
};

export default ChatHeaderRight;