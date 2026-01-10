import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Linking,
    Image,
    Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { LexAIMessage } from 'lex-ai/types/lexAITypes';
import { styles } from 'lex-ai/styles/LexAI.styles';
import { SearchResult, LexAIMessageWithLinks, ThemeColors } from '../types/lexAI.types';
import { logDebug } from 'lex-ai/utils/common';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MessageBubbleProps {
    item: LexAIMessage | LexAIMessageWithLinks;
    colors: ThemeColors;
    isDarkMode: boolean;
    debugMode?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    item,
    colors,
    isDarkMode,
    debugMode = false,
}) => {
    const isUser = item.role === 'user';

    // Check if message has links (for search results)
    const hasLinks = 'links' in item && item.links && item.links.length > 0;

    return (
        <View
            style={[
                styles.messageBubble,
                isUser ? styles.userMessage : styles.assistantMessage,
            ]}>
            {!isUser && (
                <View style={styles.avatarContainer}>
                    <LinearGradient
                        colors={['#3E7BFA', '#6A5AE0']}
                        style={styles.avatar}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}>
                        <Image
                            source={require('shared/res/pngs/lexai.png')}
                            style={{
                                width: Math.min(SCREEN_WIDTH * 0.045, 18),
                                height: Math.min(SCREEN_WIDTH * 0.045, 18),
                                tintColor: 'white',
                            }}
                        />
                    </LinearGradient>
                </View>
            )}
            <View
                style={[
                    styles.messageContent,
                    isUser
                        ? [
                            styles.userMessageContent,
                            { backgroundColor: colors.userBubble },
                        ]
                        : [
                            styles.assistantMessageContent,
                            {
                                backgroundColor: isDarkMode
                                    ? colors.aiBubble
                                    : 'rgba(255, 255, 255, 0.9)',
                            },
                        ],
                ]}>
                {hasLinks ? (
                    // Render message with clickable links
                    <View>
                        <Text
                            style={[
                                styles.messageText,
                                isUser ? styles.userMessageText : { color: colors.text },
                            ]}>
                            {item.content.split('\n\n')[0]} {/* Show the header text */}
                        </Text>

                        {/* Render each search result as a clickable link */}
                        {(item as LexAIMessageWithLinks).links?.map(
                            (link: SearchResult, index: number) => (
                                <View key={index} style={styles.searchResultItem}>
                                    <Text
                                        style={[
                                            styles.searchResultIndex,
                                            {
                                                color: isUser
                                                    ? 'rgba(255,255,255,0.8)'
                                                    : colors.primary,
                                            },
                                        ]}>
                                        {index + 1}.
                                    </Text>
                                    <View style={styles.searchResultContent}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                logDebug(`Opening URL: ${link.url}`);
                                                Linking.openURL(link.url);
                                            }}>
                                            <Text
                                                style={[
                                                    styles.searchResultTitle,
                                                    { color: colors.primary },
                                                ]}>
                                                {link.title}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.searchResultUrl,
                                                    {
                                                        color: isUser
                                                            ? 'rgba(255,255,255,0.6)'
                                                            : colors.subtext,
                                                    },
                                                ]}>
                                                {link.url}
                                            </Text>
                                            {link.snippet && (
                                                <Text
                                                    style={[
                                                        styles.searchResultSnippet,
                                                        {
                                                            color: isUser
                                                                ? 'rgba(255,255,255,0.8)'
                                                                : colors.text,
                                                        },
                                                    ]}>
                                                    {link.snippet}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ),
                        )}
                    </View>
                ) : (
                    // Render regular message
                    <Text
                        style={[
                            styles.messageText,
                            isUser ? styles.userMessageText : { color: colors.text },
                        ]}>
                        {item.content}
                    </Text>
                )}
                <Text
                    style={[
                        styles.timestamp,
                        { color: isUser ? 'rgba(255,255,255,0.7)' : colors.subtext },
                    ]}>
                    {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                    {debugMode && ` [ID: ${item.id.slice(0, 4)}]`}
                </Text>
            </View>
        </View>
    );
};
