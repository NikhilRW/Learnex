import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import { styles } from '../styles/Chat.styles';
import { ChatMessageItemProps } from '../types';

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
    message,
    isDark,
    onLongPress,
}) => {
    const isOwnMessage = message.senderId === getAuth().currentUser?.uid;
    const isSystemMessage = message.senderId === 'system';

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => onLongPress(message)}
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
                    {message.senderName || 'Unknown User'}
                </Text>
            )}
            <Text
                style={[
                    styles.messageText,
                    isDark && styles.darkText,
                    isOwnMessage && styles.ownMessageText,
                    isSystemMessage && styles.systemMessageText,
                ]}>
                {message.text}
            </Text>
            {!isSystemMessage && (
                <Text style={[styles.timestamp, isDark && styles.darkTimestamp]}>
                    {isOwnMessage ? 'You' : ''} •{' '}
                    {message.timestamp?.toDate().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                    {message.edited && ' • Edited'}
                </Text>
            )}
        </TouchableOpacity>
    );
};
