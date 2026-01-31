import { LegendList } from '@legendapp/list';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getAuth } from '@react-native-firebase/auth';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import { UserService } from 'shared/services/UserService';
import { styles } from '../styles/Chat.styles';
import { ChatProps } from '../types/props';
import { useChatMessages } from '../hooks/useChatMessages';
import { useChatActions } from '../hooks/useChatActions';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInput } from './ChatInput';
import { EditMessageModal } from './EditMessageModal';
import { MessageContextMenu } from './MessageContextMenu';

const Chat: React.FC<ChatProps> = ({ meetingId, isVisible, onClose }) => {
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  const [userName, setUserName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editText, setEditText] = useState('');
  const flatListRef = useRef<any>(null);

  // Initialize user name
  useEffect(() => {
    const initUserName = async () => {
      const userService = new UserService();
      const { username } = await userService.getNameUsernamestring();
      const fullName = getAuth().currentUser?.displayName;
      setUserName(username || fullName || '');
    };
    initUserName();
  }, []);

  // Hooks for chat functionality
  const { messages, isLoading, error, setError } = useChatMessages({
    meetingId,
    userName,
  });

  const { sendMessage: sendMessageAction, editMessage, deleteMessage } = useChatActions({
    meetingId,
    userName,
    onError: setError,
  });

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Handlers
  const handleSendMessage = async () => {
    await sendMessageAction(newMessage);
    setNewMessage('');
  };

  const handleMessageLongPress = (message: any) => {
    if (message.senderId === getAuth().currentUser?.uid) {
      setSelectedMessage(message);
      setIsContextMenuVisible(true);
    }
  };

  const handleEditMessage = () => {
    if (selectedMessage) {
      setEditText(selectedMessage.text);
      setIsEditMode(true);
      setIsContextMenuVisible(false);
    }
  };

  const handleSaveEdit = async () => {
    if (selectedMessage && editText.trim()) {
      await editMessage(selectedMessage.id, editText);
      setIsEditMode(false);
      setSelectedMessage(null);
      setEditText('');
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedMessage(null);
    setEditText('');
  };

  const handleDeleteMessage = () => {
    if (!selectedMessage) return;

    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setIsContextMenuVisible(false),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMessage(selectedMessage.id);
            setIsContextMenuVisible(false);
            setSelectedMessage(null);
          },
        },
      ],
    );
  };

  if (!isVisible) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>
          Chat
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={isDark ? '#ffffff' : '#000000'}
          />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>
            Loading messages...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon
            name="error-outline"
            size={24}
            color={isDark ? '#ff6b6b' : '#ff0000'}
          />
          <Text style={[styles.errorText, isDark && styles.darkErrorText]}>
            {error}
          </Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, isDark && styles.darkText]}>
            No messages yet. Start the conversation!
          </Text>
        </View>
      ) : (
        <LegendList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          style={styles.messageList}
          estimatedItemSize={100}
          recycleItems={true}
          renderItem={({ item }) => (
            <ChatMessageItem
              message={item}
              isDark={isDark}
              onLongPress={handleMessageLongPress}
            />
          )}
        />
      )}

      {isEditMode ? (
        <EditMessageModal
          editText={editText}
          isDark={isDark}
          onChangeText={setEditText}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      ) : (
        <ChatInput
          value={newMessage}
          isDark={isDark}
          onChangeText={setNewMessage}
          onSend={handleSendMessage}
        />
      )}

      <MessageContextMenu
        visible={isContextMenuVisible}
        isDark={isDark}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
        onClose={() => setIsContextMenuVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

export default Chat;
