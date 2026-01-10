import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Animated,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LexAIConversation, LexAIMode } from 'lex-ai/types/lexAITypes';
import { styles } from 'lex-ai/styles/LexAI.styles';
import { ThemeColors } from '../types/lexAI.types';
import { formatDate, getConversationPreview } from '../utils/lexAI.utils';

interface HistoryDrawerProps {
    showHistory: boolean;
    isDarkMode: boolean;
    colors: ThemeColors;
    historyTranslateX: Animated.Value;
    historyOpacity: Animated.Value;
    allConversations: LexAIConversation[];
    currentConversationId: string | undefined;
    historyItemAnimations: {
        getAnimation: (id: string) => {
            scale: Animated.Value;
            opacity: Animated.Value;
            translateX: Animated.Value;
        };
        animateItem: (id: string) => void;
    };
    onHideHistory: () => void;
    onSelectConversation: (conversation: LexAIConversation) => void;
    onDeleteConversation: (conversation: LexAIConversation) => void;
    onNewConversation: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
    showHistory,
    isDarkMode,
    colors,
    historyTranslateX,
    historyOpacity,
    allConversations,
    currentConversationId,
    historyItemAnimations,
    onHideHistory,
    onSelectConversation,
    onDeleteConversation,
    onNewConversation,
}) => {
    return (
        <Modal
            visible={showHistory}
            transparent={true}
            animationType="none"
            onRequestClose={onHideHistory}>
            <View style={styles.historyModalContainer}>
                <TouchableOpacity
                    style={[
                        styles.historyBackdrop,
                        {
                            backgroundColor: isDarkMode
                                ? 'rgba(10, 20, 35, 0.7)'
                                : 'rgba(0, 0, 0, 0.5)',
                        },
                    ]}
                    activeOpacity={1}
                    onPress={onHideHistory}
                />
                <Animated.View
                    style={[
                        styles.historyDrawer,
                        {
                            backgroundColor: isDarkMode ? '#121C2E' : '#F5F9FF',
                            transform: [{ translateX: historyTranslateX }],
                            opacity: historyOpacity,
                            borderTopLeftRadius: 16,
                            borderBottomLeftRadius: 16,
                        },
                    ]}>
                    <LinearGradient
                        colors={
                            isDarkMode ? ['#1A2740', '#15213A'] : ['#E9F2FF', '#DAEAFF']
                        }
                        style={[
                            styles.historyHeader,
                            {
                                borderBottomWidth: 0,
                                paddingVertical: 18,
                                borderTopLeftRadius: 16,
                            },
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <LinearGradient
                                colors={
                                    isDarkMode ? ['#4E7CF6', '#6A5AE0'] : ['#3E7BFA', '#6A5AE0']
                                }
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 12,
                                }}>
                                <Ionicons name="time-outline" size={18} color="#FFFFFF" />
                            </LinearGradient>
                            <Text
                                style={[
                                    styles.historyTitle,
                                    {
                                        color: isDarkMode ? '#FFFFFF' : '#16213E',
                                        fontSize: 20,
                                        fontWeight: '600',
                                    },
                                ]}>
                                Chat History
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: isDarkMode
                                    ? 'rgba(255,255,255,0.1)'
                                    : 'rgba(0,0,0,0.05)',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                            onPress={onHideHistory}>
                            <Ionicons
                                name="close"
                                size={20}
                                color={isDarkMode ? '#FFFFFF' : '#16213E'}
                            />
                        </TouchableOpacity>
                    </LinearGradient>

                    <LegendList
                        data={allConversations}
                        keyExtractor={item => item.id}
                        estimatedItemSize={80}
                        recycleItems={true}
                        renderItem={({ item }) => {
                            const animation = historyItemAnimations.getAnimation(item.id);
                            const isActive = item.id === currentConversationId;
                            return (
                                <Animated.View
                                    style={[
                                        styles.historyItemContainer,
                                        {
                                            transform: [
                                                { scale: animation.scale },
                                                { translateX: animation.translateX },
                                            ],
                                            borderBottomWidth: isDarkMode ? 1 : 0,
                                            borderBottomColor: isDarkMode
                                                ? 'rgba(255,255,255,0.07)'
                                                : 'transparent',
                                            marginHorizontal: 8,
                                            marginVertical: 4,
                                        },
                                    ]}>
                                    <TouchableOpacity
                                        style={[
                                            styles.historyItem,
                                            {
                                                backgroundColor: isActive
                                                    ? isDarkMode
                                                        ? 'rgba(62, 123, 250, 0.2)'
                                                        : 'rgba(62, 123, 250, 0.1)'
                                                    : isDarkMode
                                                        ? 'rgba(255, 255, 255, 0.03)'
                                                        : 'rgba(255, 255, 255, 0.7)',
                                                borderRadius: 12,
                                                padding: 14,
                                                borderLeftWidth: isActive ? 3 : 0,
                                                borderLeftColor:
                                                    item.mode === LexAIMode.AGENT ? '#3E7BFA' : '#FF375F',
                                                shadowColor: isActive ? '#3E7BFA' : 'transparent',
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: isActive ? 0.2 : 0,
                                                shadowRadius: 4,
                                            },
                                        ]}
                                        onPress={() => {
                                            historyItemAnimations.animateItem(item.id);
                                            onSelectConversation(item);
                                        }}
                                        activeOpacity={0.7}>
                                        <View style={styles.historyItemContent}>
                                            <View style={styles.historyItemHeader}>
                                                <Text
                                                    style={[
                                                        styles.historyItemDate,
                                                        {
                                                            color: isDarkMode
                                                                ? 'rgba(255,255,255,0.7)'
                                                                : 'rgba(0,0,0,0.6)',
                                                            fontSize: 12,
                                                            fontWeight: isActive ? '500' : 'normal',
                                                        },
                                                    ]}>
                                                    {formatDate(item.updatedAt)}
                                                </Text>
                                                <LinearGradient
                                                    colors={
                                                        item.mode === LexAIMode.AGENT
                                                            ? ['#4E7CF6', '#3E7BFA']
                                                            : ['#FF375F', '#FF2D55']
                                                    }
                                                    style={{
                                                        paddingHorizontal: 8,
                                                        paddingVertical: 4,
                                                        borderRadius: 12,
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                    }}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}>
                                                    <Text
                                                        style={{
                                                            color: '#FFFFFF',
                                                            fontSize: 11,
                                                            fontWeight: '600',
                                                        }}>
                                                        {item.mode === LexAIMode.AGENT ? 'Agent' : 'Chat'}
                                                    </Text>
                                                </LinearGradient>
                                            </View>
                                            <Text
                                                style={[
                                                    styles.historyItemPreview,
                                                    {
                                                        color: isDarkMode ? colors.text : '#16213E',
                                                        fontWeight: isActive ? '500' : 'normal',
                                                        fontSize: 14,
                                                        marginTop: 6,
                                                        opacity: isActive ? 1 : 0.85,
                                                    },
                                                ]}
                                                numberOfLines={2}>
                                                {getConversationPreview(item)}
                                            </Text>
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    marginTop: 6,
                                                }}>
                                                <Ionicons
                                                    name="chatbubble-outline"
                                                    size={12}
                                                    color={
                                                        isDarkMode
                                                            ? 'rgba(255,255,255,0.6)'
                                                            : 'rgba(0,0,0,0.5)'
                                                    }
                                                    style={{ marginRight: 4 }}
                                                />
                                                <Text
                                                    style={[
                                                        styles.historyItemCount,
                                                        {
                                                            color: isDarkMode
                                                                ? 'rgba(255,255,255,0.6)'
                                                                : 'rgba(0,0,0,0.5)',
                                                            fontSize: 12,
                                                        },
                                                    ]}>
                                                    {
                                                        item.messages.filter(m => m.role !== 'system')
                                                            .length
                                                    }{' '}
                                                    messages
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: isDarkMode
                                                ? 'rgba(28, 39, 57, 0.8)'
                                                : 'rgba(243, 244, 246, 0.8)',
                                            borderRadius: 22,
                                            width: 38,
                                            height: 38,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            margin: 8,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 2,
                                        }}
                                        onPress={() => onDeleteConversation(item)}
                                        activeOpacity={0.7}>
                                        <Ionicons
                                            name="trash-outline"
                                            size={18}
                                            color={isDarkMode ? '#FF375F' : '#FF3B30'}
                                        />
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        }}
                        contentContainerStyle={[
                            styles.historyList,
                            {
                                padding: 12,
                                paddingTop: 16,
                            },
                        ]}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View
                                style={[
                                    styles.emptyHistoryContainer,
                                    {
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        padding: 30,
                                        marginTop: 30,
                                    },
                                ]}>
                                <LinearGradient
                                    colors={
                                        isDarkMode
                                            ? ['rgba(62, 123, 250, 0.15)', 'rgba(62, 123, 250, 0.05)']
                                            : ['rgba(62, 123, 250, 0.1)', 'rgba(62, 123, 250, 0.03)']
                                    }
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 40,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginBottom: 20,
                                    }}>
                                    <Ionicons
                                        name="chatbubbles-outline"
                                        size={40}
                                        color={
                                            isDarkMode
                                                ? 'rgba(255,255,255,0.3)'
                                                : 'rgba(62,123,250,0.5)'
                                        }
                                    />
                                </LinearGradient>
                                <Text
                                    style={[
                                        styles.emptyHistoryText,
                                        {
                                            color: isDarkMode ? 'rgba(255,255,255,0.8)' : '#16213E',
                                            fontSize: 18,
                                            fontWeight: '600',
                                            marginBottom: 8,
                                        },
                                    ]}>
                                    No conversations yet
                                </Text>
                                <Text
                                    style={{
                                        color: isDarkMode
                                            ? 'rgba(255,255,255,0.5)'
                                            : 'rgba(0,0,0,0.5)',
                                        fontSize: 14,
                                        textAlign: 'center',
                                        lineHeight: 20,
                                        maxWidth: '80%',
                                    }}>
                                    Start a new conversation with LexAI to see your chat history
                                    here
                                </Text>
                            </View>
                        )}
                    />

                    <LinearGradient
                        colors={['#3E7BFA', '#6A5AE0']}
                        style={{
                            margin: 16,
                            borderRadius: 14,
                            shadowColor: '#3E7BFA',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: isDarkMode ? 0.4 : 0.3,
                            shadowRadius: 8,
                            elevation: 5,
                        }}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}>
                        <TouchableOpacity
                            style={{
                                width: '100%',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: 16,
                            }}
                            onPress={onNewConversation}
                            activeOpacity={0.8}>
                            <View
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: 'rgba(255,255,255,0.25)',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 12,
                                }}>
                                <Ionicons name="add" size={20} color="#FFFFFF" />
                            </View>
                            <Text
                                style={{
                                    color: '#FFFFFF',
                                    fontSize: 16,
                                    fontWeight: '600',
                                }}>
                                New Conversation
                            </Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>
            </View>
        </Modal>
    );
};
