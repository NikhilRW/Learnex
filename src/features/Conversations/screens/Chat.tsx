import { LegendList } from '@legendapp/list';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { Avatar } from 'react-native-elements';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import { MessageService } from 'conversations/services/MessageService';
import { Message } from 'conversations/models/Message';
import { format } from 'date-fns';
import { getUsernameForLogo } from 'shared/helpers/common/stringHelpers';
import Snackbar from 'react-native-snackbar';
import notificationService from 'shared/services/NotificationService';
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  writeBatch,
  getDocs,
} from '@react-native-firebase/firestore';
import LexAIService from 'shared/services/LexAIService';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatHeaderLeft from 'conversations/components/ChatHeaderLeft';
import { ChatNavigationObjectType, ChatScreenRouteParams } from 'conversations/types/main';
import ChatHeaderRight from 'conversations/components/ChatHeaderRight';
import { styles } from 'conversations/styles/Chat';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ChatScreen: React.FC = () => {
  const route =
    useRoute<RouteProp<Record<string, ChatScreenRouteParams>, string>>();
  const {
    conversationId,
    recipientId,
    recipientName,
    recipientPhoto,
    isLoading,
    fromPost,
    isQrInitiated,
  } = route.params;
  const navigation = useNavigation<ChatNavigationObjectType>();

  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const currentUser = firebase.currentUser();
  const reduxUserPhoto = useTypedSelector(state => state.user.userPhoto);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState<boolean>(isLoading || true);
  const [sending, setSending] = useState(false);
  const [currentRecipientPhoto, setCurrentRecipientPhoto] = useState<
    string | null
  >(recipientPhoto || null);
  const messageService = useMemo(() => new MessageService(), []);
  const flatListRef = useRef<any>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editText, setEditText] = useState('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const lastReadTimestamp = useRef<number>(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] =
    useState<boolean>(false);

  // Function to fetch initial messages
  const fetchMessages = useCallback(async () => {
    try {
      if (!currentUser || !conversationId) return;

      const snapshot = await getDocs(messageService.getMessages(conversationId));
      const messagesData: Message[] = [];

      snapshot.docs.forEach((docSnapshot: any) => {
        const messageData = docSnapshot.data() as Message;
        messagesData.push({
          ...messageData,
          id: docSnapshot.id,
        });
      });

      // Sort messages chronologically (oldest to newest)
      const sortedMessages = messagesData.sort(
        (a, b) => a.timestamp - b.timestamp,
      );

      setMessages(sortedMessages);
      setLoading(false);

      // Scroll to bottom after fetching messages
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: false });
        }
      }, 200);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
      Snackbar.show({
        text: 'Error loading messages',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    }
  }, [conversationId, currentUser, messageService]);

  // Listen for conversation updates to get the latest participant details
  useEffect(() => {
    if (!recipientId || !conversationId) return;

    const unsubscribe = onSnapshot(
      doc(collection(getFirestore(), 'conversations'), conversationId),
      snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (
            data?.participantDetails &&
            data.participantDetails[recipientId]
          ) {
            const updatedPhoto = data.participantDetails[recipientId].image;
            if (updatedPhoto !== currentRecipientPhoto) {
              setCurrentRecipientPhoto(updatedPhoto);
            }
          }
        }
      });

    return () => unsubscribe();
  }, [conversationId, recipientId, currentRecipientPhoto]);

  // Display loading overlay when coming from a post
  const renderLoadingOverlay = () => {
    if (loading && fromPost) {
      return (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            },
          ]}>
          <View
            style={{
              backgroundColor: isDark ? '#2a2a2a' : 'white',
              padding: 20,
              borderRadius: 10,
              alignItems: 'center',
            }}>
            <ActivityIndicator size="large" color="#2379C2" />
            <Text
              style={{
                marginTop: 10,
                color: isDark ? '#fff' : '#000',
              }}>
              Loading conversation...
            </Text>
          </View>
        </View>
      );
    }
    return null;
  };

  // Function to mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    try {
      const batch = writeBatch(getFirestore());
      const snapshot = await getDocs(messageService.getMessages(conversationId));

      if (!snapshot.empty) {
        snapshot.docs.forEach((docSnapshot: any) => {
          batch.update(docSnapshot.ref, { read: true });
        });

        // Update the lastReadTimestamp to the current time
        lastReadTimestamp.current = Date.now();

        // Also reset unread count in the conversation
        const conversationRef = doc(collection(getFirestore(), 'conversations'), conversationId);

        batch.update(conversationRef, {
          [`unreadCount.${currentUser?.uid}`]: 0,
        });

        await batch.commit();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [conversationId, currentUser?.uid, messageService]);
  // Set up real-time messages listener
  useEffect(() => {
    if (!currentUser || !conversationId) return;

    // Fetch initial messages when conversation is loaded
    fetchMessages();

    // Mark messages as read when chat is opened
    markMessagesAsRead();

    // Set up listener for new messages
    const unsubscribe = onSnapshot(
      messageService.getMessages(conversationId),
      snapshot => {
        const newMessages: Message[] = [];
        let hasNewMessages = false;

        snapshot.forEach((docSnapshot: any) => {
          const messageData = docSnapshot.data() as Message;
          newMessages.push({
            ...messageData,
            id: docSnapshot.id,
          });

          // Check if this is a new message from the other person
          if (
            messageData.senderId === recipientId &&
            !messageData.read &&
            messageData.timestamp > lastReadTimestamp.current
          ) {
            hasNewMessages = true;
          }
        });

        if (hasNewMessages) {
          // Mark new messages as read since the chat is open
          markMessagesAsRead();
        }

        // Sort messages chronologically (oldest to newest)
        const sortedMessages = newMessages.sort(
          (a, b) => a.timestamp - b.timestamp,
        );

        setMessages(sortedMessages);
        setLoading(false);

        // Scroll to bottom when messages update
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      },
      error => {
        console.error('Error loading messages:', error);
        setLoading(false);
        Snackbar.show({
          text: 'Error loading messages',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
      },
    );

    // Update typing status when entering chat
    messageService.setTypingStatus(conversationId, currentUser.uid, false);

    // Add a small delay before removing loading overlay when coming from a post
    if (fromPost) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000); // 1 second delay for better user experience
      return () => {
        clearTimeout(timer);
        unsubscribe();
        // Clean up typing status when leaving chat
        messageService.setTypingStatus(conversationId, currentUser.uid, false);
      };
    }

    return () => {
      unsubscribe();
      // Clean up typing status when leaving chat
      messageService.setTypingStatus(conversationId, currentUser.uid, false);
    };
  }, [
    conversationId,
    currentUser,
    fetchMessages,
    fromPost,
    markMessagesAsRead,
    messageService,
    recipientId,
  ]);

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      setShowSuggestions(false);

      if (!currentUser) {
        Snackbar.show({
          text: 'You must be logged in to send messages',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
        return;
      }

      // Create message object
      const messageData = {
        conversationId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'You',
        senderPhoto: reduxUserPhoto || currentUser.photoURL || undefined,
        recipientId,
        text: newMessage.trim(),
        timestamp: new Date().getTime(),
        read: false,
      };

      // Send the message with QR flag if this is a QR-initiated conversation
      await messageService.sendMessage(
        conversationId,
        messageData,
        isQrInitiated,
      );

      // Clear the message input
      setNewMessage('');

      // Scroll to the bottom
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Snackbar.show({
        text: 'Failed to send message',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    } finally {
      setSending(false);
    }
  };

  // Update typing status
  useEffect(() => {
    const typingTimeout = setTimeout(() => {
      if (currentUser && conversationId) {
        messageService.setTypingStatus(
          conversationId,
          currentUser.uid,
          newMessage.length > 0,
        );
      }
    }, 500);

    return () => clearTimeout(typingTimeout);
  }, [newMessage, currentUser, conversationId, messageService]);

  // Long press on message to show context menu
  const handleMessageLongPress = (message: Message) => {
    // Only allow actions on user's own messages
    if (message.senderId === currentUser?.uid) {
      setSelectedMessage(message);
      setIsContextMenuVisible(true);
    }
  };

  // Handle message edit
  const handleEditMessage = () => {
    if (selectedMessage) {
      setEditText(selectedMessage.text);
      setIsEditMode(true);
      setIsContextMenuVisible(false);
    }
  };

  // Save edited message
  const saveEditedMessage = async () => {
    if (!selectedMessage || !editText.trim()) return;

    try {
      await messageService.editMessage(selectedMessage.id, editText.trim());
      setIsEditMode(false);
      setSelectedMessage(null);
      Snackbar.show({
        text: 'Message updated',
        duration: Snackbar.LENGTH_SHORT,
        textColor: 'white',
        backgroundColor: '#2379C2',
      });
    } catch (error) {
      console.error('Error editing message:', error);
      Snackbar.show({
        text: 'Failed to edit message',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    }
  };

  // Delete message
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
            try {
              await messageService.deleteMessage(selectedMessage.id);
              setIsContextMenuVisible(false);
              setSelectedMessage(null);
              Snackbar.show({
                text: 'Message deleted',
                duration: Snackbar.LENGTH_SHORT,
                textColor: 'white',
                backgroundColor: '#2379C2',
              });
            } catch (error) {
              console.error('Error deleting message:', error);
              Snackbar.show({
                text: 'Failed to delete message',
                duration: Snackbar.LENGTH_LONG,
                textColor: 'white',
                backgroundColor: '#ff3b30',
              });
            }
          },
        },
      ],
    );
  };

  // Render message item
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === currentUser?.uid;
    const messageTime = format(new Date(item.timestamp), 'h:mm a');

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={() => handleMessageLongPress(item)}
        style={[
          styles.messageContainer,
          isMyMessage
            ? styles.myMessageContainer
            : styles.theirMessageContainer,
        ]}>
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            {item.senderPhoto ? (
              <Avatar
                rounded
                source={{ uri: item.senderPhoto }}
                size={Math.min(SCREEN_WIDTH * 0.08, 30)}
              />
            ) : (
              <Avatar
                rounded
                title={getUsernameForLogo(item.senderName)}
                size={Math.min(SCREEN_WIDTH * 0.08, 30)}
                containerStyle={{ backgroundColor: '#2379C2' }}
              />
            )}
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isMyMessage
              ? { backgroundColor: '#2379C2' }
              : { backgroundColor: isDark ? '#333' : '#f0f0f0' },
          ]}>
          <Text
            style={[
              styles.messageText,
              { color: isMyMessage ? 'white' : isDark ? 'white' : 'black' },
            ]}>
            {item.text}
          </Text>

          <Text
            style={[
              styles.timeText,
              {
                color: isMyMessage
                  ? 'rgba(255,255,255,0.7)'
                  : isDark
                    ? 'rgba(255,255,255,0.5)'
                    : 'rgba(0,0,0,0.5)',
              },
            ]}>
            {messageTime}
            {item.edited && <Text> • Edited</Text>}
            {isMyMessage && <Text> {item.read ? ' • Read' : ''}</Text>}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const headerLeft = useCallback(
    () => (
      <ChatHeaderLeft
        currentRecipientPhoto={currentRecipientPhoto!}
        isDark={isDark}
        navigation={navigation}
        recipientName={recipientName}
      />
    ),
    [currentRecipientPhoto, isDark, navigation, recipientName],
  );
  const toggleNotifications = useCallback(async () => {
    try {
      const newMuteStatus =
        await notificationService.toggleMuteRecipient(recipientId);
      setIsMuted(newMuteStatus);

      Snackbar.show({
        text: newMuteStatus
          ? `Notifications from ${recipientName} are now muted`
          : `Notifications from ${recipientName} are now unmuted`,
        duration: Snackbar.LENGTH_SHORT,
        textColor: 'white',
        backgroundColor: '#2379C2',
      });
    } catch (error) {
      console.error('Error toggling notification status:', error);
      Snackbar.show({
        text: 'Failed to update notification settings',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    }
  }, [recipientId, recipientName]);

  const headerRight = useCallback(
    () => (
      <ChatHeaderRight
        isDark={isDark}
        navigation={navigation}
        conversationId={conversationId}
        isMuted={isMuted}
        messageService={messageService}
        toggleNotifications={toggleNotifications}
      />
    ),
    [conversationId, isDark, isMuted, messageService, navigation, toggleNotifications],
  );

  // Check if recipient is muted
  useEffect(() => {
    const checkMuteStatus = async () => {
      if (recipientId) {
        const muted = await notificationService.isRecipientMuted(recipientId);
        setIsMuted(muted);
      }
    };

    checkMuteStatus();
  }, [recipientId]);

  // Toggle notification mute for this recipient


  // Update header settings with recipient information and notification toggle
  useEffect(() => {
    navigation.setOptions({
      title: '',
      headerTitleAlign: 'center',
      headerLeft: headerLeft,
      headerRight: headerRight,
      headerTintColor: isDark ? 'white' : 'black',
      headerStyle: {
        backgroundColor: isDark ? '#121212' : 'white',
        elevation: 0,
        shadowOpacity: 0,
      },
    });
  }, [
    navigation,
    recipientName,
    recipientPhoto,
    isDark,
    conversationId,
    isMuted,
    currentRecipientPhoto,
    toggleNotifications,
    messageService,
    headerLeft,
    headerRight,
  ]);

  // Fetch message suggestions
  const fetchSuggestions = useCallback(async () => {
    if (isFetchingSuggestions || !currentUser || messages.length === 0) return;

    try {
      setIsFetchingSuggestions(true);
      const messageSuggestions = await LexAIService.generateMessageSuggestions(
        messages,
        recipientName,
      );
      setSuggestions(messageSuggestions);
      setShowSuggestions(true);
      setIsFetchingSuggestions(false);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setIsFetchingSuggestions(false);
    }
  }, [currentUser, messages, recipientName, isFetchingSuggestions]);

  // Replace the automatic suggestion loading with a manual trigger function
  const handleRequestSuggestions = () => {
    if (!isFetchingSuggestions && !showSuggestions) {
      setShowSuggestions(true);
      fetchSuggestions();
    } else {
      // If suggestions are already showing, hide them
      setShowSuggestions(false);
    }
  };

  // Keep the effect that hides suggestions when typing
  useEffect(() => {
    if (newMessage.trim().length > 0) {
      setShowSuggestions(false);
    }
  }, [newMessage]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setNewMessage(suggestion);
    setShowSuggestions(false);
    // Optional: auto-send the suggestion
    // setTimeout(() => sendMessage(), 100);
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9' },
      ]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#1a1a1a' : 'white'}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {renderLoadingOverlay()}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2379C2" />
          </View>
        ) : (
          <LegendList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesList}
            estimatedItemSize={100}
            recycleItems={true}
          />
        )}

        {/* Message Suggestions */}
        {showSuggestions && !isEditMode && !isContextMenuVisible && (
          <View
            style={[
              styles.suggestionsContainer,
              isDark && styles.darkSuggestionsContainer,
            ]}>
            {isFetchingSuggestions ? (
              <View style={styles.suggestionsLoading}>
                <ActivityIndicator
                  size="small"
                  color={isDark ? '#8ab4f8' : '#2379C2'}
                />
                <Text
                  style={[
                    styles.suggestionsLoadingText,
                    isDark && { color: '#8ab4f8' },
                  ]}>
                  Thinking...
                </Text>
              </View>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestionButton,
                    isDark && styles.darkSuggestionButton,
                  ]}
                  onPress={() => handleSuggestionClick(suggestion)}>
                  <Text
                    style={[
                      styles.suggestionText,
                      isDark && styles.darkSuggestionText,
                    ]}
                    numberOfLines={1}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))
            ) : null}
          </View>
        )}

        {isEditMode ? (
          <View
            style={[styles.editContainer, isDark && { backgroundColor: '#333' }]}>
            <View style={styles.editHeader}>
              <Text
                style={[
                  styles.editHeaderText,
                  { color: isDark ? 'white' : 'black' },
                ]}>
                Edit Message
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditMode(false)}
                style={styles.closeEditButton}>
                <Ionicons
                  name="close"
                  size={24}
                  color={isDark ? 'white' : 'black'}
                />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.editInput,
                isDark && {
                  backgroundColor: '#222',
                  color: 'white',
                  borderColor: '#444',
                },
              ]}
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
          <View
            style={[
              styles.inputContainer,
              isDark && { backgroundColor: '#333' },
            ]}>
            <TouchableOpacity
              style={[
                styles.suggestionToggleButton,
                showSuggestions && styles.suggestionToggleButtonActive,
                isDark && styles.darkSuggestionToggleButton,
                showSuggestions &&
                isDark &&
                styles.darkSuggestionToggleButtonActive,
              ]}
              onPress={handleRequestSuggestions}
              disabled={messages.length === 0}>
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={22}
                color={
                  messages.length === 0
                    ? isDark
                      ? '#555'
                      : '#ccc'
                    : showSuggestions
                      ? isDark
                        ? '#8ab4f8'
                        : '#2379C2'
                      : isDark
                        ? '#aaa'
                        : '#777'
                }
              />
            </TouchableOpacity>
            <TextInput
              style={[
                styles.input,
                isDark && {
                  backgroundColor: '#222',
                  color: 'white',
                  borderColor: '#444',
                },
              ]}
              placeholder="Type a message..."
              placeholderTextColor={isDark ? '#999' : '#777'}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: !newMessage.trim()
                    ? isDark
                      ? '#333'
                      : '#e0e0e0'
                    : '#2379C2',
                },
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}>
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={
                    !newMessage.trim() ? (isDark ? '#777' : '#999') : 'white'
                  }
                />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

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
          <View
            style={[styles.contextMenu, isDark && { backgroundColor: '#333' }]}>
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={handleEditMessage}>
              <MaterialIcons
                name="edit"
                size={20}
                color={isDark ? '#fff' : '#333'}
              />
              <Text style={[styles.contextMenuText, isDark && { color: '#fff' }]}>
                Edit Message
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contextMenuItem, styles.deleteMenuItem]}
              onPress={handleDeleteMessage}>
              <MaterialIcons name="delete" size={20} color="#ff3b30" />
              <Text style={[styles.contextMenuText, { color: '#ff3b30' }]}>
                Delete Message
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};



export default ChatScreen;
