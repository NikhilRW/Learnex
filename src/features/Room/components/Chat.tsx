import { LegendList } from '@legendapp/list';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import { UserService } from 'shared/services/UserService';
import { styles } from '../styles/Chat.styles';
import { ChatMessage, ChatProps, Message } from '../types/props';

const Chat: React.FC<ChatProps> = ({ meetingId, isVisible, onClose }) => {
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<any>(null);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    const initializeChat = async () => {
      const userId = getAuth().currentUser?.uid;
      const { username } = await UserService.getNameUsernamestring();
      const fullName = getAuth().currentUser?.displayName;
      setUserName(username || fullName!);
      if (!userId || !meetingId) {
        setError('User not authenticated or invalid meeting');
        setIsLoading(false);
        return;
      }

      try {
        // Ensure messages subcollection exists
        const meetingRef = doc(getFirestore(), 'meetings', meetingId);
        const messagesRef = collection(meetingRef, 'messages');

        // Create initial message if collection is empty
        const messagesSnapshot = await getDocs(messagesRef);
        if (messagesSnapshot.empty) {
          await setDoc(doc(messagesRef), {
            text: 'Chat started',
            senderId: 'system',
            senderName: 'System',
            timestamp: serverTimestamp(),
          });
        }

        // Subscribe to messages
        unsubscribe = query(
          messagesRef,
          orderBy('timestamp', 'asc'),
        ).onSnapshot(
          snapshot => {
            if (!snapshot) {
              console.warn('Received null snapshot');
              return;
            }

            try {
              const newMessages: ChatMessage[] = [];
              snapshot.docChanges().forEach(change => {
                if (change.type === 'added' || change.type === 'modified') {
                  const data = change.doc.data();
                  if (data) {
                    newMessages.push({
                      id: change.doc.id,
                      text: data.text || '',
                      senderId: data.senderId || '',
                      senderName: data.senderName || 'Anonymous',
                      timestamp: data.timestamp || Timestamp.now(),
                    });
                  }
                }
              });

              if (newMessages.length > 0) {
                setMessages(prevMessages => {
                  const uniqueMessages = [...prevMessages];
                  newMessages.forEach(newMsg => {
                    if (!uniqueMessages.find(msg => msg.id === newMsg.id)) {
                      uniqueMessages.push(newMsg);
                    }
                  });
                  return uniqueMessages.sort(
                    (a, b) => a.timestamp.seconds - b.timestamp.seconds,
                  );
                });
              }
            } catch (err) {
              console.error('Error processing messages:', err);
              setError('Error processing messages');
            }

            setIsLoading(false);
            // Scroll to bottom on new messages
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          },
          error => {
            console.error('Error listening to messages:', error);
            setError('Failed to load messages');
            setIsLoading(false);
          },
        );
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError('Failed to initialize chat');
        setIsLoading(false);
      }
    };

    initializeChat();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [meetingId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !meetingId) return;

    const userId = getAuth().currentUser?.uid;
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to send messages');
      return;
    }

    setError(null);
    try {
      const messagesRef = collection(
        doc(getFirestore(), 'meetings', meetingId),
        'messages',
      );

      await messagesRef.add({
        text: newMessage.trim(),
        senderId: userId,
        senderName: userName || 'Anonymous',
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleMessageLongPress = (message: Message) => {
    // Only allow actions on user's own messages
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

  const saveEditedMessage = async () => {
    if (!selectedMessage || !editText.trim() || !meetingId) return;

    try {
      const messageRef = doc(
        collection(doc(getFirestore(), 'meetings', meetingId), 'messages'),
        selectedMessage.id,
      );

      await messageRef.update({
        text: editText.trim(),
        edited: true,
        editedAt: serverTimestamp(),
      });

      setIsEditMode(false);
      setSelectedMessage(null);
      setEditText('');
    } catch (err) {
      console.error('Error editing message:', err);
      setError('Failed to edit message');
      Alert.alert('Error', 'Failed to edit message');
    }
  };

  const handleDeleteMessage = () => {
    if (!selectedMessage || !meetingId) return;

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
            try {
              await deleteDoc(
                doc(
                  collection(
                    doc(getFirestore(), 'meetings', meetingId),
                    'messages',
                  ),
                  selectedMessage.id,
                ),
              );
              setIsContextMenuVisible(false);
              setSelectedMessage(null);
            } catch (err) {
              console.error('Error deleting message:', err);
              setError('Failed to delete message');
              Alert.alert('Error', 'Failed to delete message');
            }
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
          renderItem={({ item }) => {
            const isOwnMessage = item.senderId === getAuth().currentUser?.uid;
            const isSystemMessage = item.senderId === 'system';
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onLongPress={() => handleMessageLongPress(item)}
                disabled={isSystemMessage}
                style={[
                  styles.messageContainer,
                  isSystemMessage
                    ? styles.systemMessage
                    : isOwnMessage
                      ? styles.ownMessage
                      : styles.otherMessage,
                  isDark &&
                  (isSystemMessage
                    ? styles.darkSystemMessage
                    : isOwnMessage
                      ? styles.darkOwnMessage
                      : styles.darkOtherMessage),
                ]}>
                {!isOwnMessage && !isSystemMessage && (
                  <Text style={[styles.senderName, isDark && styles.darkText]}>
                    {item.senderName || 'Unknown User'}
                  </Text>
                )}
                <Text
                  style={[
                    styles.messageText,
                    isDark && styles.darkText,
                    isOwnMessage && styles.ownMessageText,
                    isSystemMessage && styles.systemMessageText,
                  ]}>
                  {item.text}
                </Text>
                {!isSystemMessage && (
                  <Text
                    style={[styles.timestamp, isDark && styles.darkTimestamp]}>
                    {isOwnMessage ? 'You' : ''} •{' '}
                    {item.timestamp?.toDate().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {item.edited && ' • Edited'}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {isEditMode ? (
        <View
          style={[styles.editContainer, isDark && styles.darkEditContainer]}>
          <View style={styles.editHeader}>
            <Text style={[styles.editHeaderText, isDark && styles.darkText]}>
              Edit Message
            </Text>
            <TouchableOpacity
              onPress={() => setIsEditMode(false)}
              style={styles.closeEditButton}>
              <Icon
                name="close"
                size={24}
                color={isDark ? '#ffffff' : '#000000'}
              />
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.editInput, isDark && styles.darkEditInput]}
            value={editText}
            onChangeText={setEditText}
            multiline
            autoFocus
          />
          <View style={styles.editActions}>
            <TouchableOpacity
              onPress={() => setIsEditMode(false)}
              style={[styles.editButton, styles.cancelButton]}>
              <Text style={styles.editButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={saveEditedMessage}
              style={[styles.editButton, styles.saveButton]}
              disabled={!editText.trim()}>
              <Text style={styles.editButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.inputArea}>
          <TextInput
            style={[styles.textInput, isDark && styles.darkTextInput]}
            placeholder="Type a message..."
            placeholderTextColor={isDark ? '#9e9e9e' : '#9e9e9e'}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !newMessage.trim() && styles.disabledSendButton,
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}>
            <Icon
              name="send"
              size={24}
              color={
                newMessage.trim() ? (isDark ? '#ffffff' : '#ffffff') : '#9e9e9e'
              }
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Context Menu Modal */}
      <Modal
        visible={isContextMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsContextMenuVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsContextMenuVisible(false)}>
          <View style={[styles.contextMenu, isDark && styles.darkContextMenu]}>
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={handleEditMessage}>
              <MaterialIcons
                name="edit"
                size={20}
                color={isDark ? '#ffffff' : '#333333'}
              />
              <Text style={[styles.contextMenuText, isDark && styles.darkText]}>
                Edit Message
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contextMenuItem, styles.deleteMenuItem]}
              onPress={handleDeleteMessage}>
              <MaterialIcons name="delete" size={20} color="#ff3b30" />
              <Text style={styles.deleteText}>Delete Message</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default Chat;
