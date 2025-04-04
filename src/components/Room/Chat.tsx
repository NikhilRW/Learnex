import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useTypedSelector } from '../../hooks/useTypedSelector';

const { width } = Dimensions.get('window');

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: any; // Using any instead of firestore.Timestamp to avoid namespace error
    edited?: boolean;
    editedAt?: any;
}

interface ChatProps {
    meetingId: string;
    isVisible: boolean;
    onClose: () => void;
}

const Chat: React.FC<ChatProps> = ({ meetingId, isVisible, onClose }) => {
    const isDark = useTypedSelector(state => state.user.theme) === 'dark';
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const [userName, setUserName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editText, setEditText] = useState('');

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;
        const initializeChat = async () => {
            const userId = auth().currentUser?.uid;
            const firebase = useTypedSelector(state => state.firebase.firebase);
            const { username } = await firebase.user.getNameUsernamestring()
            const fullName = firebase.auth.currentUser()?.displayName;
            setUserName(username || fullName!);
            if (!userId || !meetingId) {
                setError('User not authenticated or invalid meeting');
                setIsLoading(false);
                return;
            }

            try {
                // Ensure messages subcollection exists
                const meetingRef = firestore().collection('meetings').doc(meetingId);
                const messagesRef = meetingRef.collection('messages');

                // Create initial message if collection is empty
                const messagesSnapshot = await messagesRef.get();
                if (messagesSnapshot.empty) {
                    await messagesRef.add({
                        text: 'Chat started',
                        senderId: 'system',
                        senderName: 'System',
                        timestamp: firestore.FieldValue.serverTimestamp(),
                    });
                }

                // Subscribe to messages
                unsubscribe = messagesRef
                    .orderBy('timestamp', 'asc')
                    .onSnapshot(
                        snapshot => {
                            if (!snapshot) {
                                console.warn('Received null snapshot');
                                return;
                            }

                            try {
                                const newMessages: Message[] = [];
                                snapshot.docChanges().forEach(change => {
                                    if (change.type === 'added' || change.type === 'modified') {
                                        const data = change.doc.data();
                                        if (data) {
                                            newMessages.push({
                                                id: change.doc.id,
                                                text: data.text || '',
                                                senderId: data.senderId || '',
                                                senderName: data.senderName || 'Anonymous',
                                                timestamp: data.timestamp || firestore.Timestamp.now(),
                                            });
                                        }
                                    }
                                });

                                if (newMessages.length > 0) {
                                    setMessages(prevMessages => {
                                        const uniqueMessages = [...prevMessages];
                                        newMessages.forEach(newMsg => {
                                            if (!uniqueMessages.find(msg => msg.id === newMsg.id)) {
                                                uniqueMessages.push(newMsg);
                                            }
                                        });
                                        return uniqueMessages.sort((a, b) =>
                                            a.timestamp.seconds - b.timestamp.seconds
                                        );
                                    });
                                }
                            } catch (err) {
                                console.error('Error processing messages:', err);
                                setError('Error processing messages');
                            }

                            setIsLoading(false);
                            // Scroll to bottom on new messages
                            setTimeout(() => {
                                flatListRef.current?.scrollToEnd({ animated: true });
                            }, 100);
                        },
                        error => {
                            console.error('Error listening to messages:', error);
                            setError('Failed to load messages');
                            setIsLoading(false);
                        }
                    );
            } catch (err) {
                console.error('Error initializing chat:', err);
                setError('Failed to initialize chat');
                setIsLoading(false);
            }
        };

        initializeChat();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [meetingId]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !meetingId) return;

        const userId = auth().currentUser?.uid;
        if (!userId) {
            Alert.alert('Error', 'You must be logged in to send messages');
            return;
        }

        setError(null);
        try {
            const messagesRef = firestore()
                .collection('meetings')
                .doc(meetingId)
                .collection('messages');

            await messagesRef.add({
                text: newMessage.trim(),
                senderId: userId,
                senderName: userName || 'Anonymous',
                timestamp: firestore.FieldValue.serverTimestamp(),
            });
            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Failed to send message');
            Alert.alert('Error', 'Failed to send message');
        }
    };

    const handleMessageLongPress = (message: Message) => {
        // Only allow actions on user's own messages
        if (message.senderId === auth().currentUser?.uid) {
            setSelectedMessage(message);
            setIsContextMenuVisible(true);
        }
    };

    const handleEditMessage = () => {
        if (selectedMessage) {
            setEditText(selectedMessage.text);
            setIsEditMode(true);
            setIsContextMenuVisible(false);
        }
    };

    const saveEditedMessage = async () => {
        if (!selectedMessage || !editText.trim() || !meetingId) return;

        try {
            const messageRef = firestore()
                .collection('meetings')
                .doc(meetingId)
                .collection('messages')
                .doc(selectedMessage.id);

            await messageRef.update({
                text: editText.trim(),
                edited: true,
                editedAt: firestore.FieldValue.serverTimestamp(),
            });

            setIsEditMode(false);
            setSelectedMessage(null);
            setEditText('');
        } catch (err) {
            console.error('Error editing message:', err);
            setError('Failed to edit message');
            Alert.alert('Error', 'Failed to edit message');
        }
    };

    const handleDeleteMessage = () => {
        if (!selectedMessage || !meetingId) return;

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
                            await firestore()
                                .collection('meetings')
                                .doc(meetingId)
                                .collection('messages')
                                .doc(selectedMessage.id)
                                .delete();

                            setIsContextMenuVisible(false);
                            setSelectedMessage(null);
                        } catch (err) {
                            console.error('Error deleting message:', err);
                            setError('Failed to delete message');
                            Alert.alert('Error', 'Failed to delete message');
                        }
                    }
                }
            ]
        );
    };

    if (!isVisible) return null;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.container, isDark && styles.darkContainer]}
        >
            <View style={styles.header}>
                <Text style={[styles.headerTitle, isDark && styles.darkText]}>
                    Chat
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Icon name="close" size={24} color={isDark ? '#ffffff' : '#000000'} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#000000'} />
                    <Text style={[styles.loadingText, isDark && styles.darkText]}>
                        Loading messages...
                    </Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Icon name="error-outline" size={24} color={isDark ? '#ff6b6b' : '#ff0000'} />
                    <Text style={[styles.errorText, isDark && styles.darkErrorText]}>
                        {error}
                    </Text>
                </View>
            ) : messages.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, isDark && styles.darkText]}>
                        No messages yet. Start the conversation!
                    </Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    style={styles.messageList}
                    renderItem={({ item }) => {
                        const isOwnMessage = item.senderId === auth().currentUser?.uid;
                        const isSystemMessage = item.senderId === 'system';
                        return (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onLongPress={() => handleMessageLongPress(item)}
                                disabled={isSystemMessage}
                                style={[
                                    styles.messageContainer,
                                    isSystemMessage ? styles.systemMessage :
                                        isOwnMessage ? styles.ownMessage : styles.otherMessage,
                                    isDark && (
                                        isSystemMessage ? styles.darkSystemMessage :
                                            isOwnMessage ? styles.darkOwnMessage : styles.darkOtherMessage
                                    ),
                                ]}
                            >
                                {!isOwnMessage && !isSystemMessage && (
                                    <Text style={[styles.senderName, isDark && styles.darkText]}>
                                        {item.senderName}
                                    </Text>
                                )}
                                <Text style={[
                                    styles.messageText,
                                    isDark && styles.darkText,
                                    isOwnMessage && styles.ownMessageText,
                                    isSystemMessage && styles.systemMessageText
                                ]}>
                                    {item.text}
                                </Text>
                                {!isSystemMessage && (
                                    <Text style={[styles.timestamp, isDark && styles.darkTimestamp]}>
                                        {item.timestamp?.toDate().toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                        {item.edited && ' • Edited'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            )}

            {isEditMode ? (
                <View style={[styles.editContainer, isDark && styles.darkEditContainer]}>
                    <View style={styles.editHeader}>
                        <Text style={[styles.editHeaderText, isDark && styles.darkText]}>
                            Edit Message
                        </Text>
                        <TouchableOpacity
                            onPress={() => setIsEditMode(false)}
                            style={styles.closeEditButton}
                        >
                            <Icon name="close" size={24} color={isDark ? '#ffffff' : '#000000'} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={[
                            styles.editInput,
                            isDark && styles.darkEditInput
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
                <View style={styles.inputArea}>
                    <TextInput
                        style={[styles.textInput, isDark && styles.darkTextInput]}
                        placeholder="Type a message..."
                        placeholderTextColor={isDark ? '#9e9e9e' : '#9e9e9e'}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !newMessage.trim() && styles.disabledSendButton]}
                        onPress={sendMessage}
                        disabled={!newMessage.trim()}
                    >
                        <Icon
                            name="send"
                            size={24}
                            color={newMessage.trim() ? (isDark ? '#ffffff' : '#ffffff') : '#9e9e9e'}
                        />
                    </TouchableOpacity>
                </View>
            )}

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
                        isDark && styles.darkContextMenu
                    ]}>
                        <TouchableOpacity
                            style={styles.contextMenuItem}
                            onPress={handleEditMessage}
                        >
                            <MaterialIcons
                                name="edit"
                                size={20}
                                color={isDark ? '#ffffff' : '#333333'}
                            />
                            <Text style={[
                                styles.contextMenuText,
                                isDark && styles.darkText
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
                            <Text style={styles.deleteText}>
                                Delete Message
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: width * 0.3,
        backgroundColor: '#ffffff',
        borderLeftWidth: 1,
        borderLeftColor: '#e0e0e0',
    },
    darkContainer: {
        backgroundColor: '#1a1a1a',
        borderLeftColor: '#333333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
    },
    darkText: {
        color: '#ffffff',
    },
    closeButton: {
        padding: 4,
    },
    messageList: {
        flex: 1,
        padding: 16,
    },
    messageContainer: {
        marginBottom: 12,
        maxWidth: '80%',
        padding: 12,
        borderRadius: 12,
    },
    ownMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#007cb5',
    },
    otherMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#f0f0f0',
    },
    systemMessage: {
        alignSelf: 'center',
        backgroundColor: '#f0f0f0',
        maxWidth: '60%',
        opacity: 0.8,
    },
    darkSystemMessage: {
        backgroundColor: '#2a2a2a',
    },
    darkOwnMessage: {
        backgroundColor: '#0099e5',
    },
    darkOtherMessage: {
        backgroundColor: '#2a2a2a',
    },
    senderName: {
        fontSize: 12,
        color: '#666666',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 14,
        color: '#000000',
    },
    systemMessageText: {
        fontSize: 12,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    ownMessageText: {
        color: '#ffffff',
    },
    timestamp: {
        fontSize: 10,
        color: '#666666',
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    darkTimestamp: {
        color: '#888888',
    },
    inputArea: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        alignItems: 'flex-end',
    },
    darkTextInput: {
        borderColor: '#333333',
        backgroundColor: '#2a2a2a',
        color: '#ffffff',
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        maxHeight: 100,
        backgroundColor: '#ffffff',
        color: '#000000',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007cb5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledSendButton: {
        backgroundColor: '#cccccc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#000000',
        marginTop: 8,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#ff0000',
        marginTop: 8,
        textAlign: 'center',
    },
    darkErrorText: {
        color: '#ff6b6b',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    contextMenu: {
        width: 200,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84
    },
    darkContextMenu: {
        backgroundColor: '#333333',
    },
    contextMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee'
    },
    deleteMenuItem: {
        borderBottomWidth: 0
    },
    contextMenuText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333333'
    },
    deleteText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#ff3b30'
    },
    editContainer: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0'
    },
    darkEditContainer: {
        backgroundColor: '#333333',
        borderTopColor: '#444444'
    },
    editHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    editHeaderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000'
    },
    closeEditButton: {
        padding: 4
    },
    editInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        color: '#000000',
        minHeight: 60,
        maxHeight: 120,
        backgroundColor: '#f9f9f9'
    },
    darkEditInput: {
        backgroundColor: '#222222',
        color: '#ffffff',
        borderColor: '#444444'
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
        backgroundColor: '#007cb5'
    },
    editButtonText: {
        color: '#ffffff',
        fontWeight: 'bold'
    },
});

export default Chat;