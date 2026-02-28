import { LegendList } from '@legendapp/list';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import { MessageService } from 'conversations/services/MessageService';
import { Message } from 'conversations/models/Message';
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
import MessageItem from 'conversations/components/MessageItem';
import MessageContextMenu from 'conversations/components/MessageContextMenu';
import ChatInputBar from 'conversations/components/ChatInputBar';
import EditMessageInput from 'conversations/components/EditMessageInput';
import MessageSuggestions from 'conversations/components/MessageSuggestions';
import LoadingOverlay from 'conversations/components/LoadingOverlay';

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

  // Render message item using sub-component
  const renderMessageItemCallback = useCallback(
    ({ item }: { item: Message }) => (
      <MessageItem
        item={item}
        isDark={isDark}
        currentUserId={currentUser?.uid || ''}
        onLongPress={handleMessageLongPress}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDark, currentUser?.uid],
  );

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
        isDark ? styles.darkChatContainer : styles.lightChatContainer,
      ]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#1a1a1a' : 'white'}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {loading && fromPost && <LoadingOverlay isDark={isDark} />}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2379C2" />
          </View>
        ) : (
          <LegendList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessageItemCallback}
            contentContainerStyle={styles.messagesList}
            estimatedItemSize={100}
            recycleItems={true}
          />
        )}

        {/* Message Suggestions */}
        {showSuggestions && !isEditMode && !isContextMenuVisible && (
          <MessageSuggestions
            isDark={isDark}
            suggestions={suggestions}
            isFetchingSuggestions={isFetchingSuggestions}
            onSuggestionClick={handleSuggestionClick}
          />
        )}

        {isEditMode ? (
          <EditMessageInput
            isDark={isDark}
            editText={editText}
            onChangeText={setEditText}
            onClose={() => setIsEditMode(false)}
            onSave={saveEditedMessage}
          />
        ) : (
          <ChatInputBar
            isDark={isDark}
            newMessage={newMessage}
            onChangeText={setNewMessage}
            onSend={sendMessage}
            sending={sending}
            showSuggestions={showSuggestions}
            onRequestSuggestions={handleRequestSuggestions}
            hasMessages={messages.length > 0}
          />
        )}
      </KeyboardAvoidingView>

      <MessageContextMenu
        visible={isContextMenuVisible}
        isDark={isDark}
        onClose={() => setIsContextMenuVisible(false)}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
      />
    </SafeAreaView>
  );
};

export default ChatScreen;
