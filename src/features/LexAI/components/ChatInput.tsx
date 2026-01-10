import React from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LexAIMode } from 'lex-ai/types/lexAITypes';
import { styles } from 'lex-ai/styles/LexAI.styles';
import { ThemeColors } from '../types/lexAI.types';

interface ChatInputProps {
    colors: ThemeColors;
    isDarkMode: boolean;
    currentMode: LexAIMode;
    inputMessage: string;
    isButtonDisabled: boolean;
    inputRef: React.RefObject<TextInput | null>;
    sendButtonScale: Animated.Value;
    sendRotation: Animated.AnimatedInterpolation<string>;
    glowOpacity: Animated.AnimatedInterpolation<number>;
    onChangeText: (text: string) => void;
    onSendPress: () => void;
}export const ChatInput: React.FC<ChatInputProps> = ({
    colors,
    isDarkMode,
    currentMode,
    inputMessage,
    isButtonDisabled,
    inputRef,
    sendButtonScale,
    sendRotation,
    glowOpacity,
    onChangeText,
    onSendPress,
}) => {
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
            style={{ marginTop: 10 }}>
            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: isDarkMode
                            ? 'rgba(20, 30, 48, 0.85)'
                            : 'rgba(230, 240, 255, 0.85)',
                        borderTopWidth: 1,
                        borderTopColor: isDarkMode
                            ? 'rgba(26, 39, 64, 0.8)'
                            : 'rgba(218, 234, 255, 0.8)',
                    },
                ]}>
                <View style={styles.inputRow}>
                    <View
                        style={[
                            styles.inputWrapper,
                            {
                                backgroundColor: isDarkMode
                                    ? 'rgba(15, 25, 40, 0.7)'
                                    : 'rgba(255, 255, 255, 0.7)',
                                borderColor: isDarkMode
                                    ? 'rgba(36, 54, 86, 0.7)'
                                    : 'rgba(199, 221, 255, 0.7)',
                            },
                        ]}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Ask me anything..."
                            placeholderTextColor={colors.subtext}
                            value={inputMessage}
                            onChangeText={onChangeText}
                            multiline
                            numberOfLines={1}
                            ref={inputRef}
                        />
                    </View>
                    <View style={{ position: 'relative' }}>
                        <Animated.View
                            style={{
                                position: 'absolute',
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                                backgroundColor:
                                    currentMode === LexAIMode.AGENT ? '#3E7BFA' : '#FF375F',
                                opacity: !isButtonDisabled ? glowOpacity : 0,
                                transform: [{ translateX: -7.5 }, { translateY: -7.5 }],
                                zIndex: -1,
                            }}
                        />
                        <Animated.View
                            style={{
                                transform: [
                                    { scale: sendButtonScale },
                                    { rotate: sendRotation },
                                ],
                            }}>
                            <TouchableOpacity
                                onPress={onSendPress}
                                disabled={isButtonDisabled}
                                activeOpacity={0.8}>
                                <LinearGradient
                                    colors={
                                        isButtonDisabled
                                            ? [
                                                isDarkMode ? '#3A3A3C' : '#D1D1D6',
                                                isDarkMode ? '#2C2C2E' : '#C7C7CC',
                                            ]
                                            : currentMode === LexAIMode.AGENT
                                                ? ['#4E7CF6', '#3E7BFA', '#2563EB']
                                                : ['#FF375F', '#FF2D55', '#E31B60']
                                    }
                                    style={[
                                        styles.sendButton,
                                        {
                                            shadowColor: isButtonDisabled
                                                ? 'transparent'
                                                : currentMode === LexAIMode.AGENT
                                                    ? '#3E7BFA'
                                                    : '#FF375F',
                                            shadowOffset: { width: 0, height: 3 },
                                            shadowOpacity: isDarkMode ? 0.5 : 0.4,
                                            shadowRadius: 8,
                                            elevation: 5,
                                        },
                                    ]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}>
                                    <Ionicons
                                        name="send"
                                        size={20}
                                        color="#fff"
                                        style={{
                                            transform: [{ translateX: -1 }],
                                        }}
                                    />
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};
