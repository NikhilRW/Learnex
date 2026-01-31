import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from '../styles/Chat.styles';

export interface ChatInputProps {
    value: string;
    isDark: boolean;
    onChangeText: (text: string) => void;
    onSend: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    value,
    isDark,
    onChangeText,
    onSend,
}) => {
    return (
        <View style={styles.inputArea}>
            <TextInput
                style={[styles.textInput, isDark && styles.darkTextInput]}
                placeholder="Type a message..."
                placeholderTextColor={isDark ? '#9e9e9e' : '#9e9e9e'}
                value={value}
                onChangeText={onChangeText}
                multiline
            />
            <TouchableOpacity
                style={[styles.sendButton, !value.trim() && styles.disabledSendButton]}
                onPress={onSend}
                disabled={!value.trim()}>
                <Icon
                    name="send"
                    size={24}
                    color={value.trim() ? (isDark ? '#ffffff' : '#ffffff') : '#9e9e9e'}
                />
            </TouchableOpacity>
        </View>
    );
};
