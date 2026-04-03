import React, {useState, useRef, useEffect, useMemo, useCallback} from 'react';
import {View, TouchableOpacity, Text, TextInput, Animated} from 'react-native';
import {LegendList} from '@legendapp/list';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MessageReactionIcon from 'room/components/common/MessageReactionIcon';
import {ChatPanelProps, Message} from '../types';
import {styles} from '../styles/RoomComponent.styles';

// ---------------------------------------------------------------------------
// Memoized row component — lives outside ChatPanel so its reference is stable
// across parent re-renders and React.memo can do a proper shallow comparison.
// ---------------------------------------------------------------------------

type ChatMessageRowProps = {
  item: Message;
  currentUserId: string;
  isDark: boolean;
  onLongPress: (id: string) => void;
  reactionCounts: {[type: string]: number};
  myReaction?: string;
};

const ChatMessageRow = React.memo(
  ({
    item,
    currentUserId,
    isDark,
    onLongPress,
    reactionCounts,
    myReaction,
  }: ChatMessageRowProps) => {
    const isCurrentUserMessage = item.senderId === currentUserId;

    return (
      <TouchableOpacity
        onLongPress={() => onLongPress(item.id)}
        activeOpacity={0.8}>
        <View
          style={[
            styles.messageContainer,
            isCurrentUserMessage && styles.myMessageContainer,
          ]}>
          {!isCurrentUserMessage && (
            <Text
              style={[
                styles.messageSender,
                isDark && styles.messageSenderDark,
              ]}>
              {item.senderName || 'Unknown User'}
            </Text>
          )}
          <View
            style={[
              styles.messageBubble,
              isCurrentUserMessage && styles.myMessageBubble,
              isDark && styles.messageBubbleDark,
              isCurrentUserMessage && isDark && styles.myMessageBubbleDark,
            ]}>
            <Text
              style={[
                styles.messageText,
                isCurrentUserMessage && styles.myMessageText,
                isDark && styles.messageTextDark,
              ]}>
              {item.text}
            </Text>
          </View>
          {Object.keys(reactionCounts).length > 0 && (
            <View style={styles.messageReactionsContainer}>
              {Object.entries(reactionCounts).map(([type, count]) => (
                <View
                  key={type}
                  style={[
                    styles.messageReactionBadge,
                    myReaction === type && styles.myMessageReactionBadge,
                  ]}>
                  {type === 'thumbsUp' && <MessageReactionIcon text={'👍🏻'} />}
                  {type === 'thumbsDown' && <MessageReactionIcon text={'👎🏻'} />}
                  {type === 'heart' && <MessageReactionIcon text={'❤️'} />}
                  {type === 'laugh' && <MessageReactionIcon text={'😀'} />}
                  <Text style={styles.messageReactionCount}>{count}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={[styles.messageTime, isDark && styles.messageTimeDark]}>
            {isCurrentUserMessage ? 'You' : item.senderName} •{' '}
            {item.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
);
ChatMessageRow.displayName = 'ChatMessageRow';

// ---------------------------------------------------------------------------
// ChatPanel
// ---------------------------------------------------------------------------

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUserId,
  isDark: _isDark,
  showChat,
  chatPanelOpacity,
  onClose,
  onSendMessage,
  onLongPressMessage,
  onToggleQuickMessages,
}) => {
  // Always use dark theme for chat panel
  const isDark = true;
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<any>(null);

  const isAtBottomRef = useRef(true);
  const pendingScrollRef = useRef(false);
  const lastMessageIdRef = useRef<string | null>(null);

  const handleScroll = useCallback((event: any) => {
    const {contentOffset, contentSize, layoutMeasurement} = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    isAtBottomRef.current = distanceFromBottom < 80;
  }, []);

  const handleContentSizeChange = useCallback(() => {
    if (pendingScrollRef.current) {
      pendingScrollRef.current = false;
      flatListRef.current?.scrollToEnd({animated: true});
    }
  }, []);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const lastMessageId = lastMessage?.id ?? null;

    if (lastMessageId && lastMessageId !== lastMessageIdRef.current) {
      const shouldAutoScroll =
        isAtBottomRef.current || lastMessage?.senderId === currentUserId;
      if (shouldAutoScroll) {
        pendingScrollRef.current = true;
      }
      lastMessageIdRef.current = lastMessageId;
    }
  }, [messages, currentUserId]);

  const normalizedMessages = useMemo(
    () =>
      messages.map(message => {
        const reactionCounts: {[type: string]: number} = {};
        if (message.reactions) {
          Object.values(message.reactions).forEach(type => {
            reactionCounts[type] = (reactionCounts[type] || 0) + 1;
          });
        }

        return {
          ...message,
          reactionCounts,
          myReaction: message.reactions?.[currentUserId],
        };
      }),
    [messages, currentUserId],
  );

  const handleSendMessage = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText('');
    }
  };

  // Stable render callback — only recreated when the values that affect the
  // row actually change, keeping LegendList's internal diffing efficient.
  const renderItem = useCallback(
    ({
      item,
    }: {
      item: Message & {
        reactionCounts: {[type: string]: number};
        myReaction?: string;
      };
    }) => (
      <ChatMessageRow
        item={item}
        currentUserId={currentUserId}
        isDark={isDark}
        onLongPress={onLongPressMessage}
        reactionCounts={item.reactionCounts}
        myReaction={item.myReaction}
      />
    ),
    [currentUserId, isDark, onLongPressMessage],
  );

  if (!showChat) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.fullScreenChatPanel,
        isDark
          ? styles.fullScreenChatPanelDark
          : styles.fullScreenChatPanelLight,
        {opacity: chatPanelOpacity},
      ]}>
      <View style={[styles.chatHeader, isDark && styles.chatHeaderDark]}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.chatTitle, isDark && styles.chatTitleDark]}>
          In call messages
        </Text>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyMessagesContainer}>
          <Text
            style={[
              styles.emptyMessagesText,
              isDark && styles.emptyMessagesTextDark,
            ]}>
            No messages yet
          </Text>
        </View>
      ) : (
        <LegendList
          ref={flatListRef}
          data={normalizedMessages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          style={[styles.messagesList, isDark && styles.messagesListDark]}
          contentContainerStyle={styles.messagesContent}
          estimatedItemSize={80}
          recycleItems={true}
          onContentSizeChange={handleContentSizeChange}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
      )}

      <View
        style={[
          styles.messageInfoBanner,
          isDark && styles.messageInfoBannerDark,
        ]}>
        <Text
          style={[
            styles.messageInfoText,
            isDark && styles.messageInfoTextDark,
          ]}>
          Messages can be seen only during the call by people in the call
        </Text>
      </View>

      <View
        style={[
          styles.chatInputContainer,
          isDark && styles.chatInputContainerDark,
        ]}>
        <TouchableOpacity
          style={styles.quickMessagesButton}
          onPress={onToggleQuickMessages}>
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={24}
            color={isDark ? '#8ab4f8' : '#1a73e8'}
          />
        </TouchableOpacity>
        <TextInput
          style={[styles.chatInput, isDark && styles.chatInputDark]}
          placeholder="Send message"
          placeholderTextColor={isDark ? '#9aa0a6' : '#5f6368'}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !messageText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}>
          <Icon
            name="send"
            size={24}
            color={
              messageText.trim()
                ? isDark
                  ? '#8ab4f8'
                  : '#1a73e8'
                : isDark
                  ? '#5f6368'
                  : '#9aa0a6'
            }
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default ChatPanel;
