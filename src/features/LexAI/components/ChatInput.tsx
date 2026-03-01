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
}
export const ChatInput: React.FC<ChatInputProps> = ({
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
    const glowStyle = {
        opacity: !isButtonDisabled ? glowOpacity : 0,
    };
    const sendAnimatedStyle = {
        transform: [
            { scale: sendButtonScale },
            { rotate: sendRotation },
        ],
    };
    const sendButtonShadow = {
        shadowColor: isButtonDisabled
            ? 'transparent'
            : currentMode === LexAIMode.AGENT
                ? '#3E7BFA'
                : '#FF375F',
        shadowOpacity: isDarkMode ? 0.5 : 0.4,
    };
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
            style={styles.inputMarginTop}>
            <View
                style={[
                    styles.inputContainer,
                    isDarkMode
                        ? styles.inputContainerDark
                        : styles.inputContainerLight,
                ]}>
                <View style={styles.inputRow}>
                    <View
                        style={[
                            styles.inputWrapper,
                            isDarkMode
                                ? styles.inputWrapperDark
                                : styles.inputWrapperLight,
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
                    <View style={styles.positionRelative}>
                        <Animated.View
                            style={[
                                styles.sendGlowEffect,
                                currentMode === LexAIMode.AGENT
                                    ? styles.glowAgent
                                    : styles.glowChat,
                                glowStyle,
                            ]}
                        />
                        <Animated.View
                            style={sendAnimatedStyle}>
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
                                        styles.sendButtonShadowBase,
                                        sendButtonShadow,
                                    ]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}>
                                    <Ionicons
                                        name="send"
                                        size={20}
                                        color="#fff"
                                        style={styles.sendIconOffset}
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
