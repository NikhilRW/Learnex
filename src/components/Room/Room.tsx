import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Text,
    Platform,
    Share,
    Clipboard,
    ToastAndroid,
    Alert,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Keyboard,
    Animated,
} from 'react-native';
import { RTCView } from 'react-native-webrtc';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Meeting } from '../../service/firebase/MeetingService';

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: Date;
    isMe: boolean;
}

interface RoomProps {
    meeting: Meeting;
    localStream?: any;
    remoteStreams: any[];
    onToggleAudio: () => void;
    onToggleVideo: () => void;
    onEndCall: () => void;
    onSendMessage: (text: string) => void;
    messages: Message[];
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isDark?: boolean;
    currentUserId: string;
    currentUserName: string;
}

const Room: React.FC<RoomProps> = ({
    meeting,
    localStream,
    remoteStreams,
    onToggleAudio,
    onToggleVideo,
    onEndCall,
    onSendMessage,
    messages,
    isAudioEnabled,
    isVideoEnabled,
    isDark = false,
    currentUserId,
    currentUserName,
}) => {
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const chatPanelWidth = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (isControlsVisible && remoteStreams.length > 0 && !showChat) {
            timeout = setTimeout(() => setIsControlsVisible(false), 3000);
        }
        return () => clearTimeout(timeout);
    }, [isControlsVisible, remoteStreams.length, showChat]);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardVisible(false);
            }
        );

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        if (messages.length > 0 && flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]);

    useEffect(() => {
        // Animate chat panel
        Animated.timing(chatPanelWidth, {
            toValue: showChat ? 300 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [showChat, chatPanelWidth]);

    const handleShareInvite = async () => {
        try {
            await Share.share({
                message: `Join my meeting with code: ${meeting.roomCode}`,
                title: meeting.title,
            });
        } catch (error) {
            console.error('Error sharing invite:', error);
        }
    };

    const copyToClipboard = () => {
        try {
            Clipboard.setString(meeting.roomCode);
            if (Platform.OS === 'android') {
                ToastAndroid.show('Room code copied to clipboard!', ToastAndroid.SHORT);
            } else {
                Alert.alert('Copied', 'Room code copied to clipboard!');
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    const handleSendMessage = () => {
        if (messageText.trim()) {
            onSendMessage(messageText.trim());
            setMessageText('');
        }
    };

    const toggleChat = () => {
        setShowChat(!showChat);
        setIsControlsVisible(true);
    };

    const renderParticipantGrid = () => {
        const streams = [localStream, ...remoteStreams].filter(Boolean);
        const gridStyle = getGridStyle(streams.length);

        return streams.map((stream, index) => (
            <View key={index} style={[styles.participantContainer, gridStyle]}>
                {stream && (
                    <RTCView
                        streamURL={stream.toURL()}
                        style={styles.participantVideo}
                        objectFit="cover"
                        mirror={index === 0}
                    />
                )}
                {index === 0 && (
                    <View style={styles.nameTag}>
                        <Text style={styles.nameText}>You</Text>
                    </View>
                )}
            </View>
        ));
    };

    const getGridStyle = (count: number) => {
        switch (count) {
            case 1:
                return { width: '100%', height: '100%' };
            case 2:
                return { width: '100%', height: '50%' };
            case 3:
            case 4:
                return { width: '50%', height: '50%' };
            default:
                return { width: '33.33%', height: '33.33%' };
        }
    };

    const renderMessageItem = ({ item }: { item: Message }) => (
        <View style={[styles.messageContainer, item.isMe && styles.myMessageContainer]}>
            {!item.isMe && (
                <Text style={styles.messageSender}>{item.senderName}</Text>
            )}
            <View style={[styles.messageBubble, item.isMe && styles.myMessageBubble]}>
                <Text style={[styles.messageText, item.isMe && styles.myMessageText]}>
                    {item.text}
                </Text>
            </View>
            <Text style={styles.messageTime}>
                {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardAvoidingView}
            >
                <View style={styles.mainContainer}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.touchableContainer, showChat && styles.shrunkVideoContainer]}
                        onPress={() => setIsControlsVisible(true)}
                    >
                        <View style={styles.participantsGrid}>
                            {localStream && renderParticipantGrid()}

                            {remoteStreams.length === 0 && (
                                <View style={styles.emptyStateContainer}>
                                    <Text style={styles.emptyStateTitle}>You're the only one here</Text>
                                    <Text style={styles.emptyStateSubtitle}>
                                        Share this meeting link with others you want in the meeting
                                    </Text>
                                    <View style={styles.meetingLinkContainer}>
                                        <Text style={styles.meetingLink}>{meeting.roomCode}</Text>
                                        <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
                                            <Icon name="content-copy" size={24} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.shareInviteButton}
                                        onPress={handleShareInvite}
                                    >
                                        <Icon name="share" size={20} color="#fff" style={styles.shareIcon} />
                                        <Text style={styles.shareButtonText}>Share invite</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <View style={styles.controlsContainer}>
                            <View style={styles.meetingInfo}>
                                <Text style={styles.meetingTitle}>{meeting.title || 'Meeting'}</Text>
                                <Text style={styles.roomCode}>{meeting.roomCode}</Text>
                            </View>

                            <View style={styles.controls}>
                                <TouchableOpacity
                                    style={[
                                        styles.controlButton,
                                        !isAudioEnabled && styles.controlButtonDisabled,
                                    ]}
                                    onPress={onToggleAudio}
                                >
                                    <Icon
                                        name={isAudioEnabled ? 'mic' : 'mic-off'}
                                        size={24}
                                        color="white"
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.controlButton,
                                        !isVideoEnabled && styles.controlButtonDisabled,
                                    ]}
                                    onPress={onToggleVideo}
                                >
                                    <Icon
                                        name={isVideoEnabled ? 'videocam' : 'videocam-off'}
                                        size={24}
                                        color="white"
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.controlButton,
                                        isHandRaised && styles.controlButtonActive,
                                    ]}
                                    onPress={() => setIsHandRaised(!isHandRaised)}
                                >
                                    <MaterialCommunityIcons
                                        name="hand-wave"
                                        size={24}
                                        color="white"
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.controlButton,
                                        showChat && styles.controlButtonActive,
                                    ]}
                                    onPress={toggleChat}
                                >
                                    <Icon
                                        name="chat"
                                        size={24}
                                        color="white"
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.controlButton,
                                        showMoreOptions && styles.controlButtonActive,
                                    ]}
                                    onPress={() => setShowMoreOptions(!showMoreOptions)}
                                >
                                    <Icon name="more-vert" size={24} color="white" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.controlButton, styles.endCallButton]}
                                    onPress={onEndCall}
                                >
                                    <Icon name="call-end" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Chat Panel */}
                    <Animated.View style={[styles.chatPanel, { width: chatPanelWidth }]}>
                        <View style={styles.chatHeader}>
                            <Text style={styles.chatTitle}>In-call messages</Text>
                            <TouchableOpacity onPress={toggleChat} style={styles.closeButton}>
                                <Icon name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessageItem}
                            keyExtractor={(item) => item.id}
                            style={styles.messagesList}
                            contentContainerStyle={styles.messagesContent}
                        />

                        <View style={styles.chatInputContainer}>
                            <TextInput
                                style={styles.chatInput}
                                placeholder="Send a message to everyone..."
                                placeholderTextColor="#9aa0a6"
                                value={messageText}
                                onChangeText={setMessageText}
                                multiline
                                maxLength={500}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    !messageText.trim() && styles.sendButtonDisabled
                                ]}
                                onPress={handleSendMessage}
                                disabled={!messageText.trim()}
                            >
                                <Icon name="send" size={24} color={messageText.trim() ? "#8ab4f8" : "#5f6368"} />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#202124',
    },
    darkContainer: {
        backgroundColor: '#202124',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    mainContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    touchableContainer: {
        flex: 1,
        position: 'relative',
    },
    shrunkVideoContainer: {
        flex: 0.7, // Shrink video area when chat is open
    },
    participantsGrid: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    participantContainer: {
        overflow: 'hidden',
        margin: 2,
    },
    participantVideo: {
        flex: 1,
    },
    nameTag: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    nameText: {
        color: 'white',
        fontSize: 12,
    },
    emptyStateContainer: {
        position: 'absolute',
        top: '30%',
        left: 0,
        right: 0,
        alignItems: 'center',
        padding: 20,
    },
    emptyStateTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: '500',
        marginBottom: 8,
    },
    emptyStateSubtitle: {
        color: '#9aa0a6',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    meetingLinkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3c4043',
        borderRadius: 4,
        marginBottom: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        width: '80%',
    },
    meetingLink: {
        color: 'white',
        fontSize: 16,
        flex: 1,
    },
    copyButton: {
        padding: 8,
    },
    shareInviteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#8ab4f8',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    shareIcon: {
        marginRight: 8,
    },
    shareButtonText: {
        color: '#202124',
        fontSize: 16,
        fontWeight: '500',
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(32, 33, 36, 0.9)',
        paddingVertical: 16,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    },
    meetingInfo: {
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    meetingTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    roomCode: {
        color: '#9aa0a6',
        fontSize: 14,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    controlButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3c4043',
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlButtonDisabled: {
        backgroundColor: '#ea4335',
    },
    controlButtonActive: {
        backgroundColor: '#8ab4f8',
    },
    endCallButton: {
        backgroundColor: '#ea4335',
    },
    chatPanel: {
        backgroundColor: '#282a2d',
        height: '100%',
        overflow: 'hidden',
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#3c4043',
    },
    chatTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '500',
    },
    closeButton: {
        padding: 4,
    },
    messagesList: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 8,
    },
    messageContainer: {
        marginBottom: 16,
        maxWidth: '85%',
        alignSelf: 'flex-start',
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
    },
    messageSender: {
        color: '#9aa0a6',
        fontSize: 12,
        marginBottom: 4,
    },
    messageBubble: {
        backgroundColor: '#3c4043',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    myMessageBubble: {
        backgroundColor: '#174ea6',
    },
    messageText: {
        color: 'white',
        fontSize: 14,
    },
    myMessageText: {
        color: 'white',
    },
    messageTime: {
        color: '#9aa0a6',
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    chatInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#3c4043',
    },
    chatInput: {
        flex: 1,
        backgroundColor: '#3c4043',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        color: 'white',
        fontSize: 14,
        maxHeight: 100,
    },
    sendButton: {
        marginLeft: 8,
        padding: 8,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});

export default Room; 