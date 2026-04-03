import React, {memo, useMemo} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Avatar} from 'react-native-elements';
import CachedImage from 'shared/components/CachedImage';
import {getUsernameForLogo} from 'shared/helpers/common/stringHelpers';
import {format} from 'date-fns';
import {SCREEN_WIDTH} from 'shared/constants/common';
import {styles} from 'conversations/styles/Chat';
import {MessageItemProps} from '../types';

const MessageItem: React.FC<MessageItemProps> = ({
  item,
  isDark,
  currentUserId,
  onLongPress,
}) => {
  const isMyMessage = item.senderId === currentUserId;
  const messageTime = useMemo(
    () => format(new Date(item.timestamp), 'h:mm a'),
    [item.timestamp],
  );
  const avatarSize = Math.min(SCREEN_WIDTH * 0.08, 30);
  const avatarStyle = useMemo(
    () => ({
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
    }),
    [avatarSize],
  );

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={() => onLongPress(item)}
      style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
      ]}>
      {!isMyMessage && (
        <View style={styles.avatarContainer}>
          {item.senderPhoto ? (
            <CachedImage
              source={{uri: item.senderPhoto}}
              style={avatarStyle}
              contentFit="cover"
            />
          ) : (
            <Avatar
              rounded
              title={getUsernameForLogo(item.senderName)}
              size={avatarSize}
              containerStyle={styles.myAvatarBg}
            />
          )}
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          isMyMessage
            ? styles.myMessageBubble
            : isDark
              ? styles.darkTheirMessageBubble
              : styles.lightTheirMessageBubble,
        ]}>
        <Text
          style={[
            styles.messageText,
            isMyMessage
              ? styles.myMessageText
              : isDark
                ? styles.darkTheirMessageText
                : styles.lightTheirMessageText,
          ]}>
          {item.text}
        </Text>

        <Text
          style={[
            styles.timeText,
            isMyMessage
              ? styles.myMessageTime
              : isDark
                ? styles.darkTheirMessageTime
                : styles.lightTheirMessageTime,
          ]}>
          {messageTime}
          {item.edited && <Text> • Edited</Text>}
          {isMyMessage && <Text> {item.read ? ' • Read' : ''}</Text>}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default memo(MessageItem);
