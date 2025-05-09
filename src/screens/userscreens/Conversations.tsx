import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Dimensions,
    RefreshControl,
    Alert,
    Platform
} from 'react-native';
import { Avatar, SearchBar } from 'react-native-elements';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { UserStackParamList } from '../../routes/UserStack';
import { MessageService } from '../../service/firebase/MessageService';
import { Conversation } from '../../models/Message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SwipeListView } from 'react-native-swipe-list-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDistanceToNow } from 'date-fns';
import { getUsernameForLogo } from '../../helpers/stringHelpers';
import Snackbar from 'react-native-snackbar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ConversationsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp<UserStackParamList>>();
    const insets = useSafeAreaInsets();
    const isDark = useTypedSelector((state) => state.user.theme) === "dark";
    const firebase = useTypedSelector(state => state.firebase.firebase);
    const currentUser = firebase.currentUser();
    const reduxUserPhoto = useTypedSelector(state => state.user.userPhoto);
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
            recipientName: conversation.participantDetails[otherParticipantId].name,
            recipientPhoto: conversation.participantDetails[otherParticipantId].image
        });
    };

    // Handle conversation deletion
    const handleDeleteConversation = async (conversationId: string) => {
        try {
            // Show confirmation dialog
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
                Alert.alert(
                    'Delete Conversation',
                    'Are you sure you want to delete this conversation? This action cannot be undone.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                                try {
                                    Snackbar.show({
                                        text: 'Deleting conversation...',
                                        duration: Snackbar.LENGTH_INDEFINITE,
                                    });

                                    await messageService.deleteConversation(conversationId);

                                    Snackbar.dismiss();
                                    Snackbar.show({
                                        text: 'Conversation deleted successfully',
                                        duration: Snackbar.LENGTH_SHORT,
                                        backgroundColor: '#4CAF50',
                                    });
                                } catch (error) {
                                    console.error('Error deleting conversation:', error);
                                    Snackbar.show({
                                        text: 'Failed to delete conversation',
                                        duration: Snackbar.LENGTH_LONG,
                                        backgroundColor: '#F44336',
                                    });
                                }
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
            Snackbar.show({
                text: 'Failed to delete conversation',
                duration: Snackbar.LENGTH_LONG,
                backgroundColor: '#F44336',
            });
        }
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
        const isUnread = item.unreadCount && item.unreadCount[currentUser?.uid || ''] > 0;
        const lastMessageTime = item.lastMessage?.timestamp ?
            formatDistanceToNow(new Date(item.lastMessage.timestamp), { addSuffix: true }) : '';

        return (
            <TouchableOpacity
                style={[
                    styles.conversationItem,
                    { backgroundColor: isDark ? (isUnread ? '#293b59' : '#1a1a1a') : (isUnread ? '#f0f7ff' : 'white') }
                ]}
                onPress={() => {
                    navigation.navigate('Chat', {
                        conversationId: item.id,
                        recipientId: otherParticipantId,
                        recipientName: otherParticipant.name,
                        recipientPhoto: otherParticipant.image,
                        currentUserPhoto: reduxUserPhoto,
                    });
                }}
            >
                {otherParticipant.image ? (
                    <Avatar
                        rounded
                        source={{ uri: otherParticipant.image }}
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
                                    {currentUser && item.unreadCount ?
                                        item.unreadCount[currentUser.uid] || 0 : 0}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Render hidden item with delete action
    const renderHiddenItem = ({ item }: { item: Conversation }) => (
        <View style={[
            styles.rowBack,
            { backgroundColor: isDark ? '#331111' : '#ffebee' }
        ]}>
            <TouchableOpacity
                style={[styles.deleteButton]}
                onPress={() => handleDeleteConversation(item.id)}
            >
                <MaterialIcons name="delete" size={24} color="#ffffff" />
                <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[
            styles.container,
            {
                backgroundColor: isDark ? '#1a1a1a' : 'white',
                paddingTop: 10
            }
        ]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: isDark ? 'white' : 'black' }]}>
                    Messages
                </Text>
                <TouchableOpacity
                    style={styles.newMessageButtonSmall}
                    onPress={handleNewMessage}
                >
                    <Ionicons name="create-outline" size={Math.min(SCREEN_WIDTH * 0.06, 24)} color="white" />
                </TouchableOpacity>
            </View>

            {/* @ts-ignore */}
            <SearchBar
                placeholder="Search conversations..."
                onChangeText={(text: string) => setSearch(text)}
                value={search}
                containerStyle={[
                    styles.searchContainer,
                    { backgroundColor: isDark ? '#1a1a1a' : 'white' }
                ]}
                inputContainerStyle={[
                    styles.searchInputContainer,
                    { backgroundColor: isDark ? '#333' : '#f5f5f5' }
                ]}
                inputStyle={{ color: isDark ? 'white' : 'black' }}
                placeholderTextColor={isDark ? '#aaa' : '#999'}
                round
                lightTheme={!isDark}
            />

            {filteredConversations.length === 0 ? (
                renderEmptyList()
            ) : (
                <SwipeListView
                    data={filteredConversations}
                    renderItem={renderConversationItem}
                    renderHiddenItem={renderHiddenItem}
                    keyExtractor={(item) => item.id}
                    rightOpenValue={-75}
                    disableRightSwipe
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
            )}
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
    newMessageButtonSmall: {
        backgroundColor: '#2379C2',
        width: 40,
        height: 40,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    newMessageButton: {
        backgroundColor: '#2379C2',
        width: 200,
        height: 40,
        padding: 10,
        borderRadius: 100,
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
        paddingTop: 5,
        marginHorizontal: 16,
        paddingHorizontal: 16,
        borderTopWidth: 0,
        borderBottomWidth: 0,
    },
    searchInputContainer: {
        borderRadius: 25,
        paddingHorizontal: 5,
        paddingVertical: 3,
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
    // Add new styles for swipe delete feature
    rowBack: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingRight: 15,
        borderRadius: 12,
        marginTop: 8,
        height: '100%',
    },
    deleteButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 75,
        height: '85%',
        backgroundColor: '#F44336',
        borderRadius: 12,
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 3,
    },
});

export default ConversationsScreen; 