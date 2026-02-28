import React from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from 'conversations/styles/Chat';
import { ChatInputBarProps } from '../types';

const ChatInputBar: React.FC<ChatInputBarProps> = ({
    isDark,
    newMessage,
    onChangeText,
    onSend,
    sending,
    showSuggestions,
    onRequestSuggestions,
    hasMessages,
}) => {
    return (
        <View style={[styles.inputContainer, isDark && styles.darkInputContainer]}>
            <TouchableOpacity
                style={[
                    styles.suggestionToggleButton,
                    showSuggestions && styles.suggestionToggleButtonActive,
                    isDark && styles.darkSuggestionToggleButton,
                    showSuggestions && isDark && styles.darkSuggestionToggleButtonActive,
                ]}
                onPress={onRequestSuggestions}
                disabled={!hasMessages}>
                <MaterialCommunityIcons
                    name="lightbulb-outline"
                    size={22}
                    color={
                        !hasMessages
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
                    isDark && styles.darkInput,
                ]}
                placeholder="Type a message..."
                placeholderTextColor={isDark ? '#999' : '#777'}
                value={newMessage}
                onChangeText={onChangeText}
                multiline
            />

            <TouchableOpacity
                style={[
                    styles.sendButton,
                    !newMessage.trim() && (isDark ? styles.darkInactiveSendButton : styles.lightInactiveSendButton),
                ]}
                onPress={onSend}
                disabled={!newMessage.trim() || sending}>
                {sending ? (
                    <ActivityIndicator size="small" color="white" />
                ) : (
                    <Ionicons
                        name="send"
                        size={20}
                        color={!newMessage.trim() ? (isDark ? '#777' : '#999') : 'white'}
                    />
                )}
            </TouchableOpacity>
        </View>
    );
};

export default ChatInputBar;
