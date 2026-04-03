import {LegendList} from '@legendapp/list';
import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import {
  selectFirebase,
  selectIsDark,
  selectUserPhoto,
} from 'shared/store/selectors';
import {MessageService} from 'conversations/services/MessageService';
import {Message} from 'conversations/models/Message';
import Snackbar from 'react-native-snackbar';
import debounce from 'lodash.debounce';
import notificationService from 'shared/services/NotificationService';
import {logger} from 'shared/utils/logger';
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  writeBatch,
  getDocs,
} from '@react-native-firebase/firestore';
import LexAIService from 'shared/services/LexAIService';
import {SafeAreaView} from 'react-native-safe-area-context';
import ChatHeaderLeft from 'conversations/components/ChatHeaderLeft';
import {
  ChatNavigationObjectType,
  ChatScreenRouteParams,
} from 'conversations/types/main';
import ChatHeaderRight from 'conversations/components/ChatHeaderRight';
import {styles} from 'conversations/styles/Chat';
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

  const isDark = useTypedSelector(selectIsDark);
  const firebase = useTypedSelector(selectFirebase);
  const currentUser = firebase.currentUser();
  const reduxUserPhoto = useTypedSelector(selectUserPhoto);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState<boolean>(isLoading || true);
  const [sending, setSending] = useState(false);
  const [currentRecipientPhoto, setCurrentRecipientPhoto] = useState<
    string | null
  >(recipientPhoto || null);
  const currentRecipientPhotoRef = useRef(currentRecipientPhoto);
  const messageServiceRef = useRef(new MessageService());
  const messageService = messageServiceRef.current;
  const flatListRef = useRef<any>(null);
  const isAtBottomRef = useRef(true);
  const pendingScrollRef = useRef(false);
  const lastMessageIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const initialScrollRef = useRef(true);
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
  const typingStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const scrollToEnd = useCallback((animated: boolean) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({animated});
    }
  }, []);

  const handleScroll = useCallback((event: any) => {
    const {contentOffset, contentSize, layoutMeasurement} = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    isAtBottomRef.current = distanceFromBottom < 80;
  }, []);

  const handleContentSizeChange = useCallback(() => {
    if (pendingScrollRef.current) {
      pendingScrollRef.current = false;
      scrollToEnd(true);
      return;
    }

    if (initialScrollRef.current) {
      initialScrollRef.current = false;
      scrollToEnd(false);
    }
  }, [scrollToEnd]);

  // Keep the ref in sync so the listener can compare without being a dependency
  useEffect(() => {
    currentRecipientPhotoRef.current = currentRecipientPhoto;
  }, [currentRecipientPhoto]);

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
            if (updatedPhoto !== currentRecipientPhotoRef.current) {
              setCurrentRecipientPhoto(updatedPhoto);
            }
          }
        }
      },
    );

    return () => unsubscribe();
  }, [conversationId, recipientId]);

  // Function to mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    try {
      const batch = writeBatch(getFirestore());
      const snapshot = await getDocs(
        messageService.getMessages(conversationId),
      );

      if (!snapshot.empty) {
        snapshot.docs.forEach((docSnapshot: any) => {
          batch.update(docSnapshot.ref, {read: true});
        });

        // Update the lastReadTimestamp to the current time
        lastReadTimestamp.current = Date.now();

        // Also reset unread count in the conversation
        const conversationRef = doc(
          collection(getFirestore(), 'conversations'),
          conversationId,
        );

        batch.update(conversationRef, {
          [`unreadCount.${currentUser?.uid}`]: 0,
        });

        await batch.commit();
      }
    } catch (error) {
      logger.error('Error marking messages as read:', error, 'Chat');
    }
  }, [conversationId, currentUser?.uid, messageService]);

  const markMessagesAsReadDebounced = useMemo(
    () =>
      debounce(() => {
        markMessagesAsRead();
      }, 300),
    [markMessagesAsRead],
  );

  useEffect(() => {
    return () => {
      markMessagesAsReadDebounced.cancel();
    };
  }, [markMessagesAsReadDebounced]);
  // Set up real-time messages listener
  useEffect(() => {
    const currentUserId = currentUser?.uid;
    if (!currentUserId || !conversationId) return;

    hasLoadedRef.current = false;
    lastMessageIdRef.current = null;
    pendingScrollRef.current = false;
    initialScrollRef.current = true;

    // Mark messages as read when chat is opened
    markMessagesAsReadDebounced();

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
          markMessagesAsReadDebounced();
        }

        // Sort messages chronologically (oldest to newest)
        const sortedMessages = newMessages.sort(
          (a, b) => a.timestamp - b.timestamp,
        );

        const lastMessage = sortedMessages[sortedMessages.length - 1];
        const lastMessageId = lastMessage?.id ?? null;
        const isNewLastMessage =
          lastMessageId && lastMessageId !== lastMessageIdRef.current;

        if (!hasLoadedRef.current) {
          hasLoadedRef.current = true;
          setLoading(false);
          if (sortedMessages.length > 0) {
            pendingScrollRef.current = true;
          }
        }

        if (isNewLastMessage) {
          const shouldAutoScroll =
            isAtBottomRef.current || lastMessage?.senderId === currentUserId;
          if (shouldAutoScroll) {
            pendingScrollRef.current = true;
          }
          lastMessageIdRef.current = lastMessageId;
        }

        setMessages(sortedMessages);
      },
      error => {
        logger.error('Error loading messages:', error, 'Chat');
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
    messageService.setTypingStatus(conversationId, currentUserId, false);

    return () => {
      unsubscribe();
      // Clean up typing status when leaving chat
      messageService.setTypingStatus(conversationId, currentUserId, false);
    };
  }, [
    conversationId,
    currentUser?.uid,
    markMessagesAsReadDebounced,
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
      pendingScrollRef.current = true;
    } catch (error) {
      logger.error('Error sending message:', error, 'Chat');
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
  const handleMessageLongPress = useCallback(
    (message: Message) => {
      // Only allow actions on user's own messages
      if (message.senderId === currentUser?.uid) {
        setSelectedMessage(message);
        setIsContextMenuVisible(true);
      }
    },
    [currentUser?.uid],
  );

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
      logger.error('Error editing message:', error, 'Chat');
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
              logger.error('Error deleting message:', error, 'Chat');
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
    ({item}: {item: Message}) => (
      <MessageItem
        item={item}
        isDark={isDark}
        currentUserId={currentUser?.uid || ''}
        onLongPress={handleMessageLongPress}
      />
    ),
    [currentUser?.uid, handleMessageLongPress, isDark],
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

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
      logger.error('Error toggling notification status:', error, 'Chat');
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
    [
      conversationId,
      isDark,
      isMuted,
      messageService,
      navigation,
      toggleNotifications,
    ],
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
      logger.error('Error fetching suggestions:', error, 'Chat');
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

  const handleNewMessageChange = useCallback(
    (text: string) => {
      setNewMessage(text);
      if (text.trim().length > 0) {
        setShowSuggestions(false);
      }

      if (typingStatusTimeoutRef.current) {
        clearTimeout(typingStatusTimeoutRef.current);
      }

      if (currentUser && conversationId) {
        typingStatusTimeoutRef.current = setTimeout(() => {
          messageService.setTypingStatus(
            conversationId,
            currentUser.uid,
            text.length > 0,
          );
        }, 500);
      }
    },
    [conversationId, currentUser, messageService],
  );

  useEffect(() => {
    return () => {
      if (typingStatusTimeoutRef.current) {
        clearTimeout(typingStatusTimeoutRef.current);
      }

      if (currentUser && conversationId) {
        messageService.setTypingStatus(conversationId, currentUser.uid, false);
      }
    };
  }, [conversationId, currentUser, messageService]);

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
            keyExtractor={keyExtractor}
            renderItem={renderMessageItemCallback}
            contentContainerStyle={styles.messagesList}
            estimatedItemSize={100}
            recycleItems={true}
            onContentSizeChange={handleContentSizeChange}
            onScroll={handleScroll}
            scrollEventThrottle={16}
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
            onChangeText={handleNewMessageChange}
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
