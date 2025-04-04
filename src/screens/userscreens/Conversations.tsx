import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Dimensions,
    RefreshControl
} from 'react-native';
import { Avatar, SearchBar } from 'react-native-elements';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { useNavigation } from '@react-navigation/native';
import { MessageService } from '../../service/firebase/MessageService';
import { Conversation } from '../../models/Message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDistanceToNow } from 'date-fns';
import { getUsernameForLogo } from '../../helpers/stringHelpers';
import Snackbar from 'react-native-snackbar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ConversationsScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const isDark = useTypedSelector((state) => state.user.theme) === "dark";
    const firebase = useTypedSelector(state => state.firebase.firebase);
    const currentUser = firebase.currentUser();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const messageService = new MessageService();

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = messageService.listenToConversations(
            currentUser.uid,
            (newConversations) => {
                setConversations(newConversations);
                setFilteredConversations(newConversations);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        if (search.trim() === '') {
            setFilteredConversations(conversations);
        } else {
            const searchLower = search.toLowerCase();
            const filtered = conversations.filter(conversation => {
                const otherParticipantId = conversation.participants.find(id => id !== currentUser?.uid);
                if (!otherParticipantId) return false;

                const otherParticipantDetails = conversation.participantDetails[otherParticipantId];
                return otherParticipantDetails.name.toLowerCase().includes(searchLower);
            });
            setFilteredConversations(filtered);
        }
    }, [search, conversations, currentUser]);

    const onRefresh = async () => {
        setRefreshing(true);
        // The listener will automatically update, but we'll wait briefly for visual feedback
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    };

    const handleNewMessage = () => {
        navigation.navigate('ContactList');
    };

    const handleConversationPress = (conversation: Conversation) => {
        const otherParticipantId = conversation.participants.find(id => id !== currentUser?.uid);
        if (!otherParticipantId) return;

        navigation.navigate('Chat', {
            conversationId: conversation.id,
            recipientId: otherParticipantId,
            recipientName: conversation.participantDetails[otherParticipantId].name
        });
    };

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            {loading ? (
                <ActivityIndicator size="large" color="#2379C2" />
            ) : (
                <>
                    <MaterialIcons name="chat-bubble-outline" size={80} color={isDark ? '#555' : '#ccc'} />
                    <Text style={[styles.emptyText, { color: isDark ? '#aaa' : '#888' }]}>
                        No conversations yet
                    </Text>
                    <Text style={[styles.emptySubText, { color: isDark ? '#888' : '#aaa' }]}>
                        Start messaging with your peers
                    </Text>
                    <TouchableOpacity
                        style={[styles.newMessageButton, { marginTop: 20 }]}
                        onPress={handleNewMessage}
                    >
                        <Text style={styles.newMessageButtonText}>Start New Conversation</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );

    const renderConversationItem = ({ item }: { item: Conversation }) => {
        const otherParticipantId = item.participants.find(id => id !== currentUser?.uid);
        if (!otherParticipantId) return null;

        const otherParticipant = item.participantDetails[otherParticipantId];
        const isUnread = item.unreadCount && item.unreadCount > 0;
        const lastMessageTime = item.lastMessage?.timestamp ?
            formatDistanceToNow(new Date(item.lastMessage.timestamp), { addSuffix: true }) : '';

        return (
            <TouchableOpacity
                style={[
                    styles.conversationItem,
                    { backgroundColor: isDark ? (isUnread ? '#293b59' : '#1a1a1a') : (isUnread ? '#f0f7ff' : 'white') }
                ]}
                onPress={() => handleConversationPress(item)}
            >
                {otherParticipant.photo ? (
                    <Avatar
                        rounded
                        source={{ uri: otherParticipant.photo }}
                        size={Math.min(SCREEN_WIDTH * 0.12, 50)}
                        containerStyle={styles.avatar}
                    />
                ) : (
                    <Avatar
                        rounded
                        title={getUsernameForLogo(otherParticipant.name)}
                        size={Math.min(SCREEN_WIDTH * 0.12, 50)}
                        containerStyle={[styles.avatar, { backgroundColor: '#2379C2' }]}
                    />
                )}

                <View style={styles.conversationDetails}>
                    <View style={styles.conversationHeader}>
                        <Text
                            style={[
                                styles.participantName,
                                {
                                    color: isDark ? 'white' : 'black',
                                    fontWeight: isUnread ? '700' : '400'
                                }
                            ]}
                            numberOfLines={1}
                        >
                            {otherParticipant.name}
                        </Text>
                        <Text style={[styles.timeText, { color: isDark ? '#aaa' : '#777' }]}>
                            {lastMessageTime}
                        </Text>
                    </View>

                    <View style={styles.lastMessageContainer}>
                        {otherParticipant.typing ? (
                            <Text style={[styles.typingText, { color: '#2379C2' }]}>
                                typing...
                            </Text>
                        ) : (
                            <Text
                                style={[
                                    styles.lastMessageText,
                                    {
                                        color: isDark ? (isUnread ? 'white' : '#bbb') : (isUnread ? 'black' : '#777'),
                                        fontWeight: isUnread ? '600' : '400'
                                    }
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {item.lastMessage?.text || 'No messages yet'}
                            </Text>
                        )}

                        {isUnread && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadCount}>
                                    {item.unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[
            styles.container,
            {
                backgroundColor: isDark ? '#1a1a1a' : 'white',
                paddingTop: insets.top > 0 ? 0 : StatusBar.currentHeight ?? 0
            }
        ]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: isDark ? 'white' : 'black' }]}>
                    Messages
                </Text>
                <TouchableOpacity
                    style={styles.newMessageButton}
                    onPress={handleNewMessage}
                >
                    <Ionicons name="create-outline" size={Math.min(SCREEN_WIDTH * 0.06, 24)} color="white" />
                </TouchableOpacity>
            </View>

            <SearchBar
                placeholder="Search conversations..."
                onChangeText={(text) => setSearch(text)}
                value={search}
                containerStyle={[
                    styles.searchContainer,
                    { backgroundColor: isDark ? '#1a1a1a' : 'white' }
                ]}
                inputContainerStyle={[
                    styles.searchInputContainer,
                    { backgroundColor: isDark ? '#333' : '#f5f5f5',  }
                ]}
                inputStyle={{ color: isDark ? 'white' : 'black' }}
                placeholderTextColor={isDark ? '#aaa' : '#999'}
                round
                lightTheme={!isDark}
            />

            <FlatList
                data={filteredConversations}
                renderItem={renderConversationItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={renderEmptyList}
                contentContainerStyle={[
                    styles.listContent,
                    filteredConversations.length === 0 && styles.emptyListContent
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2379C2']}
                        tintColor={isDark ? '#2379C2' : '#2379C2'}
                    />
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    title: {
        fontSize: Math.min(SCREEN_WIDTH * 0.075, 28),
        fontWeight: '700',
    },
    newMessageButton: {
        backgroundColor: '#2379C2',
        width: Math.min(SCREEN_WIDTH * 0.12, 48),
        height: Math.min(SCREEN_WIDTH * 0.12, 48),
        borderRadius: Math.min(SCREEN_WIDTH * 0.06, 24),
        alignItems: 'center',
        justifyContent: 'center',
    },
    newMessageButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
        textAlign: 'center',
    },
    searchContainer: {
        paddingVertical: 0,
        marginHorizontal: 16,
        paddingHorizontal: 16,
        borderTopWidth: 0,
        borderBottomWidth: 0,
    },
    searchInputContainer: {
        borderRadius: 25,
        paddingHorizontal:5,
        paddingVertical:3,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    emptyListContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 12,
    },
    emptySubText: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    conversationItem: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    avatar: {
        marginRight: 12,
    },
    conversationDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    participantName: {
        fontSize: 16,
        flex: 1,
    },
    timeText: {
        fontSize: 12,
        marginLeft: 8,
    },
    lastMessageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessageText: {
        fontSize: 14,
        flex: 1,
    },
    typingText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    unreadBadge: {
        backgroundColor: '#2379C2',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    unreadCount: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 6,
    },
});

export default ConversationsScreen; 