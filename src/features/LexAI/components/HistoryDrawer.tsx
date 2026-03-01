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
                        isDarkMode
                            ? styles.historyBackdropDark
                            : styles.historyBackdropLight,
                    ]}
                    activeOpacity={1}
                    onPress={onHideHistory}
                />
                <Animated.View
                    style={[
                        styles.historyDrawer,
                        isDarkMode
                            ? styles.historyDrawerDark
                            : styles.historyDrawerLight,
                        {
                            transform: [{ translateX: historyTranslateX }],
                            opacity: historyOpacity,
                        },
                    ]}>
                    <LinearGradient
                        colors={
                            isDarkMode ? ['#1A2740', '#15213A'] : ['#E9F2FF', '#DAEAFF']
                        }
                        style={[
                            styles.historyHeader,
                            styles.historyHeaderCustom,
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}>
                        <View style={styles.historyHeaderRow}>
                            <LinearGradient
                                colors={
                                    isDarkMode ? ['#4E7CF6', '#6A5AE0'] : ['#3E7BFA', '#6A5AE0']
                                }
                                style={styles.historyHeaderIcon}>
                                <Ionicons name="time-outline" size={18} color="#FFFFFF" />
                            </LinearGradient>
                            <Text
                                style={[
                                    styles.historyTitle,
                                    styles.historyTitleCustom,
                                    isDarkMode
                                        ? styles.historyTitleDark
                                        : styles.historyTitleLight,
                                ]}>
                                Chat History
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.historyCloseButton,
                                isDarkMode
                                    ? styles.historyCloseButtonDark
                                    : styles.historyCloseButtonLight,
                            ]}
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
                                        styles.historyItemSpacing,
                                        isDarkMode && styles.historyItemBorderDark,
                                        {
                                            transform: [
                                                { scale: animation.scale },
                                                { translateX: animation.translateX },
                                            ],
                                        },
                                    ]}>
                                    <TouchableOpacity
                                        style={[
                                            styles.historyItem,
                                            isActive
                                                ? isDarkMode
                                                    ? styles.historyItemActiveDark
                                                    : styles.historyItemActiveLight
                                                : isDarkMode
                                                    ? styles.historyItemInactiveDark
                                                    : styles.historyItemInactiveLight,
                                            isActive
                                                ? styles.historyItemActiveBorder
                                                : styles.historyItemInactiveBorder,
                                            isActive && (item.mode === LexAIMode.AGENT
                                                ? styles.historyItemBorderAgent
                                                : styles.historyItemBorderChat),
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
                                                        isDarkMode
                                                            ? styles.historyItemDateDark
                                                            : styles.historyItemDateLight,
                                                        isActive && styles.historyItemDateActive,
                                                    ]}>
                                                    {formatDate(item.updatedAt)}
                                                </Text>
                                                <LinearGradient
                                                    colors={
                                                        item.mode === LexAIMode.AGENT
                                                            ? ['#4E7CF6', '#3E7BFA']
                                                            : ['#FF375F', '#FF2D55']
                                                    }
                                                    style={styles.modeBadge}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}>
                                                    <Text
                                                        style={styles.modeBadgeText}>
                                                        {item.mode === LexAIMode.AGENT ? 'Agent' : 'Chat'}
                                                    </Text>
                                                </LinearGradient>
                                            </View>
                                            <Text
                                                style={[
                                                    styles.historyItemPreview,
                                                    styles.historyItemPreviewCustom,
                                                    isDarkMode
                                                        ? styles.historyPreviewDark
                                                        : styles.historyPreviewLight,
                                                    isActive
                                                        ? styles.historyPreviewActive
                                                        : styles.historyPreviewInactive,
                                                ]}
                                                numberOfLines={2}>
                                                {getConversationPreview(item)}
                                            </Text>
                                            <View
                                                style={styles.historyMetaRow}>
                                                <Ionicons
                                                    name="chatbubble-outline"
                                                    size={12}
                                                    color={
                                                        isDarkMode
                                                            ? 'rgba(255,255,255,0.6)'
                                                            : 'rgba(0,0,0,0.5)'
                                                    }
                                                    style={styles.historyIconMargin}
                                                />
                                                <Text
                                                    style={[
                                                        styles.historyItemCount,
                                                        isDarkMode
                                                            ? styles.historyItemCountDark
                                                            : styles.historyItemCountLight,
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
                                        style={[
                                            styles.deleteButton,
                                            isDarkMode
                                                ? styles.deleteButtonDark
                                                : styles.deleteButtonLight,
                                        ]}
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
                            styles.historyListPadding,
                        ]}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View
                                style={[
                                    styles.emptyHistoryContainer,
                                    styles.emptyHistoryCustom,
                                ]}>
                                <LinearGradient
                                    colors={
                                        isDarkMode
                                            ? ['rgba(62, 123, 250, 0.15)', 'rgba(62, 123, 250, 0.05)']
                                            : ['rgba(62, 123, 250, 0.1)', 'rgba(62, 123, 250, 0.03)']
                                    }
                                    style={styles.emptyHistoryIconContainer}>
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
                                        isDarkMode
                                            ? styles.emptyHistoryTitleDark
                                            : styles.emptyHistoryTitleLight,
                                    ]}>
                                    No conversations yet
                                </Text>
                                <Text
                                    style={
                                        isDarkMode
                                            ? styles.emptyHistorySubtextDark
                                            : styles.emptyHistorySubtextLight
                                    }>
                                    Start a new conversation with LexAI to see your chat history
                                    here
                                </Text>
                            </View>
                        )}
                    />

                    <LinearGradient
                        colors={['#3E7BFA', '#6A5AE0']}
                        style={[
                            styles.newConversationGradient,
                            isDarkMode
                                ? styles.newConversationShadowDark
                                : styles.newConversationShadowLight,
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}>
                        <TouchableOpacity
                            style={styles.newConversationButton}
                            onPress={onNewConversation}
                            activeOpacity={0.8}>
                            <View
                                style={styles.newConversationIcon}>
                                <Ionicons name="add" size={20} color="#FFFFFF" />
                            </View>
                            <Text
                                style={styles.newConversationText}>
                                New Conversation
                            </Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>
            </View>
        </Modal>
    );
};
