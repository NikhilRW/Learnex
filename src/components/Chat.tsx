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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useTypedSelector } from '../hooks/useTypedSelector';

const { width } = Dimensions.get('window');

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: firestore.Timestamp;
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

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;
        const userId = auth().currentUser?.uid;

        const initializeChat = async () => {
            if (!userId || !meetingId) {
                setError('User not authenticated or invalid meeting');
                setIsLoading(false);
                return;
            }

            try {
                // Get user's display name
                const userDoc = await firestore()
                    .collection('users')
                    .doc(userId)
                    .get();

                if (userDoc.exists) {
                    setUserName(userDoc.data()?.displayName || 'Anonymous');
                }

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
                            <View
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
                                    </Text>
                                )}
                            </View>
                        );
                    }}
                />
            )}

            <View style={[styles.inputContainer, isDark && styles.darkInputContainer]}>
                <TextInput
                    style={[styles.input, isDark && styles.darkInput]}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type a message..."
                    placeholderTextColor={isDark ? '#888888' : '#666666'}
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
                        color={newMessage.trim() ? '#ffffff' : '#888888'}
                    />
                </TouchableOpacity>
            </View>
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
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        alignItems: 'flex-end',
    },
    darkInputContainer: {
        borderTopColor: '#333333',
    },
    input: {
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
    darkInput: {
        borderColor: '#333333',
        backgroundColor: '#2a2a2a',
        color: '#ffffff',
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
});
