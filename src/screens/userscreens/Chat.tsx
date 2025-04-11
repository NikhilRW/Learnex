import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    ActivityIndicator,
    StatusBar,
    Alert,
    Modal,
    Image
} from 'react-native';
import { Avatar } from 'react-native-elements';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { MessageService } from '../../service/firebase/MessageService';
import { Message } from '../../models/Message';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUsernameForLogo } from '../../helpers/stringHelpers';
import Snackbar from 'react-native-snackbar';
import notificationService from '../../service/NotificationService';

type ChatScreenRouteParams = {
    conversationId: string;
    recipientId: string;
    recipientName: string;
    recipientPhoto: string;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ChatScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const route = useRoute<RouteProp<Record<string, ChatScreenRouteParams>, string>>();
    const { conversationId, recipientId, recipientName, recipientPhoto } = route.params;
    const navigation = useNavigation();

    const isDark = useTypedSelector((state) => state.user.theme) === "dark";
    const firebase = useTypedSelector(state => state.firebase.firebase);
    const currentUser = firebase.currentUser();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messageService = new MessageService();
    const flatListRef = useRef<FlatList>(null);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editText, setEditText] = useState('');
    const [isMuted, setIsMuted] = useState<boolean>(false);

    // Set up real-time messages listener
    useEffect(() => {
        if (!currentUser || !conversationId) return;

        // Mark messages as read when entering the chat
        messageService.markMessagesAsRead(conversationId, currentUser.uid);

        const unsubscribe = messageService.getMessages(conversationId)
            .onSnapshot(snapshot => {
                const newMessages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Message)).sort((a, b) => a.timestamp - b.timestamp);

                setMessages(newMessages);
                setLoading(false);

                // Scroll to bottom when messages update
                setTimeout(() => {
                    if (flatListRef.current) {
                        flatListRef.current.scrollToEnd({ animated: true });
                    }
                }, 100);
            }, error => {
                console.error('Error loading messages:', error);
                setLoading(false);
                Snackbar.show({
                    text: 'Error loading messages',
                    duration: Snackbar.LENGTH_LONG,
                    textColor: 'white',
                    backgroundColor: '#ff3b30',
                });
            });

        // Update typing status when entering chat
        messageService.setTypingStatus(conversationId, currentUser.uid, false);

        return () => {
            unsubscribe();
            // Clean up typing status when leaving chat
            messageService.setTypingStatus(conversationId, currentUser.uid, false);
        };
    }, [conversationId, currentUser]);

    // Send message function
    const sendMessage = async () => {
        if (!currentUser || !newMessage.trim()) return;

        try {
            setSending(true);
            const { fullName } = await firebase.user.getNameUsernamestring();
            // Prepare message data with no undefined values
            const messageData = {
                conversationId,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || fullName || 'User',
                senderPhoto: currentUser.photoURL || "https://avatar.iran.liara.run/username?username=" + encodeURIComponent(currentUser.displayName || fullName || 'User'),
                recipientId,
                text: newMessage.trim(),
                timestamp: new Date().getTime(),
                read: false
            };

            await messageService.sendMessage(conversationId, messageData);

            setNewMessage('');
            setSending(false);

            // Scroll to bottom after sending a message
            setTimeout(() => {
                if (flatListRef.current) {
                    flatListRef.current.scrollToEnd({ animated: true });
                }
            }, 100);
        } catch (error) {
            console.error('Error sending message:', error);
            setSending(false);
            Snackbar.show({
                text: 'Failed to send message',
                duration: Snackbar.LENGTH_LONG,
                textColor: 'white',
                backgroundColor: '#ff3b30',
            });
        }
    };

    // Update typing status
    useEffect(() => {
        const typingTimeout = setTimeout(() => {
            if (currentUser && conversationId) {
                messageService.setTypingStatus(conversationId, currentUser.uid, newMessage.length > 0);
            }
        }, 500);

        return () => clearTimeout(typingTimeout);
    }, [newMessage, currentUser, conversationId]);

    // Long press on message to show context menu
    const handleMessageLongPress = (message: Message) => {
        // Only allow actions on user's own messages
        if (message.senderId === currentUser?.uid) {
            setSelectedMessage(message);
            setIsContextMenuVisible(true);
        }
    };

    // Handle message edit
    const handleEditMessage = () => {
        if (selectedMessage) {
            setEditText(selectedMessage.text);
            setIsEditMode(true);
            setIsContextMenuVisible(false);
        }
    };

    // Save edited message
    const saveEditedMessage = async () => {
        if (!selectedMessage || !editText.trim()) return;

        try {
            await messageService.editMessage(selectedMessage.id, editText.trim());
            setIsEditMode(false);
            setSelectedMessage(null);
            Snackbar.show({
                text: 'Message updated',
                duration: Snackbar.LENGTH_SHORT,
                textColor: 'white',
                backgroundColor: '#2379C2',
            });
        } catch (error) {
            console.error('Error editing message:', error);
            Snackbar.show({
                text: 'Failed to edit message',
                duration: Snackbar.LENGTH_LONG,
                textColor: 'white',
                backgroundColor: '#ff3b30',
            });
        }
    };

    // Delete message
    const handleDeleteMessage = () => {
        if (!selectedMessage) return;

        Alert.alert(
            "Delete Message",
            "Are you sure you want to delete this message?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => setIsContextMenuVisible(false)
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await messageService.deleteMessage(selectedMessage.id);
                            setIsContextMenuVisible(false);
                            setSelectedMessage(null);
                            Snackbar.show({
                                text: 'Message deleted',
                                duration: Snackbar.LENGTH_SHORT,
                                textColor: 'white',
                                backgroundColor: '#2379C2',
                            });
                        } catch (error) {
                            console.error('Error deleting message:', error);
                            Snackbar.show({
                                text: 'Failed to delete message',
                                duration: Snackbar.LENGTH_LONG,
                                textColor: 'white',
                                backgroundColor: '#ff3b30',
                            });
                        }
                    }
                }
            ]
        );
    };

    // Render message item
    const renderMessageItem = ({ item }: { item: Message }) => {
        const isMyMessage = item.senderId === currentUser?.uid;
        const messageTime = format(new Date(item.timestamp), 'h:mm a');

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onLongPress={() => handleMessageLongPress(item)}
                style={[
                    styles.messageContainer,
                    isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
                ]}
            >
                {!isMyMessage && (
                    <View style={styles.avatarContainer}>
                        {item.senderPhoto ? (
                            <Avatar
                                rounded
                                source={{ uri: item.senderPhoto }}
                                size={Math.min(SCREEN_WIDTH * 0.08, 30)}
                            />
                        ) : (
                            <Avatar
                                rounded
                                title={getUsernameForLogo(item.senderName)}
                                size={Math.min(SCREEN_WIDTH * 0.08, 30)}
                                containerStyle={{ backgroundColor: '#2379C2' }}
                            />
                        )}
                    </View>
                )}

                <View style={[
                    styles.messageBubble,
                    isMyMessage
                        ? { backgroundColor: '#2379C2' }
                        : { backgroundColor: isDark ? '#333' : '#f0f0f0' }
                ]}>
                    <Text style={[
                        styles.messageText,
                        { color: isMyMessage ? 'white' : isDark ? 'white' : 'black' }
                    ]}>
                        {item.text}
                    </Text>

                    <Text style={[
                        styles.timeText,
                        { color: isMyMessage ? 'rgba(255,255,255,0.7)' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }
                    ]}>
                        {messageTime}
                        {item.edited && <Text> • Edited</Text>}
                        {isMyMessage && (
                            <Text> {item.read ? ' • Read' : ''}</Text>
                        )}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    // Check if recipient is muted
    useEffect(() => {
        const checkMuteStatus = async () => {
            if (recipientId) {
                const muted = await notificationService.isRecipientMuted(recipientId);
                setIsMuted(muted);
            }
        };

        checkMuteStatus();
    }, [recipientId]);

    // Toggle notification mute for this recipient
    const toggleNotifications = async () => {
        try {
            const newMuteStatus = await notificationService.toggleMuteRecipient(recipientId);
            setIsMuted(newMuteStatus);

            Snackbar.show({
                text: newMuteStatus
                    ? `Notifications from ${recipientName} are now muted`
                    : `Notifications from ${recipientName} are now unmuted`,
                duration: Snackbar.LENGTH_SHORT,
                textColor: 'white',
                backgroundColor: '#2379C2',
            });
        } catch (error) {
            console.error('Error toggling notification status:', error);
            Snackbar.show({
                text: 'Failed to update notification settings',
                duration: Snackbar.LENGTH_LONG,
                textColor: 'white',
                backgroundColor: '#ff3b30',
            });
        }
    };

    // Update header settings with recipient information and notification toggle
    useEffect(() => {
        navigation.setOptions({
            title: '',
            headerTitleAlign: 'center',
            headerLeft: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        style={{ marginLeft: 10, marginRight: 8 }}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={isDark ? "white" : "black"} />
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {recipientPhoto ? (
                            <Image
                                source={
                                    typeof recipientPhoto === 'string'
                                        ? { uri: recipientPhoto }
                                        : recipientPhoto
                                }
                                style={{ width: 36, height: 36, borderRadius: 18 }}
                            />
                        ) : (
                            <Avatar
                                rounded
                                title={getUsernameForLogo(recipientName)}
                                size={36}
                                containerStyle={{ backgroundColor: '#2379C2' }}
                            />
                        )}
                        <Text style={{
                            marginLeft: 8,
                            fontSize: 17,
                            fontWeight: '600',
                            color: isDark ? "white" : "black"
                        }}>
                            {recipientName}
                        </Text>
                    </View>
                </View>
            ),
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        style={{ marginRight: 15 }}
                        onPress={toggleNotifications}
                    >
                        <Ionicons
                            name={isMuted ? "notifications-off" : "notifications"}
                            size={24}
                            color={isDark ? "white" : "black"}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ marginRight: 10 }}
                        onPress={() => {
                            Alert.alert(
                                'Delete Conversation',
                                'Are you sure you want to delete this conversation? This action cannot be undone.',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Delete',
                                        style: 'destructive',
                                        onPress: () => {
                                            messageService.deleteConversation(conversationId)
                                                .then(() => {
                                                    navigation.goBack();
                                                })
                                                .catch(error => {
                                                    Snackbar.show({
                                                        text: 'Failed to delete conversation',
                                                        duration: Snackbar.LENGTH_LONG,
                                                        textColor: 'white',
                                                        backgroundColor: '#ff3b30',
                                                    });
                                                });
                                        }
                                    }
                                ]
                            );
                        }}
                    >
                        <MaterialIcons name="delete" size={24} color={isDark ? "white" : "black"} />
                    </TouchableOpacity>
                </View>
            ),
            headerTintColor: isDark ? "white" : "black",
            headerStyle: {
                backgroundColor: isDark ? "#121212" : "white",
                elevation: 0,
                shadowOpacity: 0,
            },
        });
    }, [navigation, recipientName, recipientPhoto, isDark, conversationId, isMuted]);

    return (
        <SafeAreaView style={[
            styles.container,
            { backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9' }
        ]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={isDark ? '#1a1a1a' : 'white'}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardAvoidingView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2379C2" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id}
                        renderItem={renderMessageItem}
                        contentContainerStyle={styles.messagesList}
                    />
                )}

                {isEditMode ? (
                    <View style={[
                        styles.editContainer,
                        isDark && { backgroundColor: '#333' }
                    ]}>
                        <View style={styles.editHeader}>
                            <Text style={[
                                styles.editHeaderText,
                                { color: isDark ? 'white' : 'black' }
                            ]}>
                                Edit Message
                            </Text>
                            <TouchableOpacity
                                onPress={() => setIsEditMode(false)}
                                style={styles.closeEditButton}
                            >
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color={isDark ? 'white' : 'black'}
                                />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[
                                styles.editInput,
                                isDark && {
                                    backgroundColor: '#222',
                                    color: 'white',
                                    borderColor: '#444'
                                }
                            ]}
                            value={editText}
                            onChangeText={setEditText}
                            multiline
                            autoFocus
                        />
                        <View style={styles.editActions}>
                            <TouchableOpacity
                                onPress={() => setIsEditMode(false)}
                                style={[styles.editButton, styles.cancelButton]}
                            >
                                <Text style={styles.editButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={saveEditedMessage}
                                style={[styles.editButton, styles.saveButton]}
                                disabled={!editText.trim()}
                            >
                                <Text style={styles.editButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={[
                        styles.inputContainer,
                        isDark && { backgroundColor: '#333' }
                    ]}>
                        <TextInput
                            style={[
                                styles.input,
                                isDark && {
                                    backgroundColor: '#222',
                                    color: 'white',
                                    borderColor: '#444'
                                }
                            ]}
                            placeholder="Type a message..."
                            placeholderTextColor={isDark ? '#999' : '#777'}
                            value={newMessage}
                            onChangeText={setNewMessage}
                            multiline
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                {
                                    backgroundColor: !newMessage.trim() ?
                                        (isDark ? '#333' : '#e0e0e0') :
                                        '#2379C2'
                                }
                            ]}
                            onPress={sendMessage}
                            disabled={!newMessage.trim() || sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Ionicons
                                    name="send"
                                    size={20}
                                    color={!newMessage.trim() ?
                                        (isDark ? '#777' : '#999') :
                                        'white'
                                    }
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>

            {/* Context Menu Modal */}
            <Modal
                visible={isContextMenuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsContextMenuVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsContextMenuVisible(false)}
                >
                    <View style={[
                        styles.contextMenu,
                        isDark && { backgroundColor: '#333' }
                    ]}>
                        <TouchableOpacity
                            style={styles.contextMenuItem}
                            onPress={handleEditMessage}
                        >
                            <MaterialIcons
                                name="edit"
                                size={20}
                                color={isDark ? '#fff' : '#333'}
                            />
                            <Text style={[
                                styles.contextMenuText,
                                isDark && { color: '#fff' }
                            ]}>
                                Edit Message
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.contextMenuItem, styles.deleteMenuItem]}
                            onPress={handleDeleteMessage}
                        >
                            <MaterialIcons
                                name="delete"
                                size={20}
                                color="#ff3b30"
                            />
                            <Text style={[
                                styles.contextMenuText,
                                { color: '#ff3b30' }
                            ]}>
                                Delete Message
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesList: {
        paddingHorizontal: 12,
        paddingVertical: 16,
        flexGrow: 1,
        justifyContent: 'flex-end',
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        maxWidth: '80%',
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
    },
    theirMessageContainer: {
        alignSelf: 'flex-start',
    },
    avatarContainer: {
        marginRight: 8,
        alignSelf: 'flex-end',
        marginBottom: 6,
    },
    messageBubble: {
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        maxWidth: '100%',
    },
    messageText: {
        fontSize: 16,
        marginBottom: 4,
    },
    timeText: {
        fontSize: 12,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 8,
        maxHeight: 120,
    },
    sendButton: {
        backgroundColor: '#2379C2',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    contextMenu: {
        width: 200,
        backgroundColor: 'white',
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84
    },
    contextMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    deleteMenuItem: {
        borderBottomWidth: 0
    },
    contextMenuText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333'
    },
    editContainer: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0'
    },
    editHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    editHeaderText: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    closeEditButton: {
        padding: 4
    },
    editInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 10,
        minHeight: 60,
        maxHeight: 120,
        backgroundColor: '#f9f9f9'
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12
    },
    editButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 4,
        marginLeft: 8
    },
    cancelButton: {
        backgroundColor: '#e0e0e0'
    },
    saveButton: {
        backgroundColor: '#2379C2'
    },
    editButtonText: {
        color: 'white',
        fontWeight: 'bold'
    }
});

export default ChatScreen; 