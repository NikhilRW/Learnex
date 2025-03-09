import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { MeetingService, Meeting } from '../../service/firebase/MeetingService';
import { WebRTCService } from '../../service/firebase/WebRTCService';
import Room from '../../components/Room/Room';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { UserStackParamList } from '../../routes/UserStack';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

type RoomScreenRouteProp = RouteProp<UserStackParamList, 'RoomScreen'>;
type RoomScreenNavigationProp = DrawerNavigationProp<UserStackParamList>;

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: Date;
    isMe: boolean;
}

const meetingService = new MeetingService();
const webRTCService = new WebRTCService();

const RoomScreen: React.FC = () => {
    const navigation = useNavigation<RoomScreenNavigationProp>();
    const route = useRoute<RoomScreenRouteProp>();
    const { meeting, isHost } = route.params;
    const userTheme = useTypedSelector(state => state.user);
    const isDark = userTheme.theme === 'dark';
    const currentUser = auth().currentUser;

    const [localStream, setLocalStream] = useState<any>(null);
    const [remoteStreams, setRemoteStreams] = useState<any[]>([]);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isConnecting, setIsConnecting] = useState(true);
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [unsubscribeMessages, setUnsubscribeMessages] = useState<(() => void) | null>(null);
    const MAX_CONNECTION_ATTEMPTS = 3;

    useEffect(() => {
        // Handle hardware back button
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            handleEndCall();
            return true;
        });

        return () => backHandler.remove();
    }, []);

    useEffect(() => {
        const setupMeeting = async () => {
            try {
                setIsConnecting(true);
                setConnectionError(null);
                setConnectionAttempts(prev => prev + 1);

                console.log('Setting up meeting:', meeting.id);

                // Join the meeting
                await meetingService.joinMeeting(meeting.id);

                // Initialize WebRTC
                try {
                    const stream = await webRTCService.initLocalStream();
                    console.log('Local stream initialized:', stream);
                    setLocalStream(stream);
                } catch (streamError) {
                    console.error('Failed to initialize local stream:', streamError);
                    // Continue without video if we can't get media permissions
                    Alert.alert(
                        'Camera/Microphone Access',
                        'Could not access camera or microphone. Please check permissions.'
                    );
                }

                // Subscribe to meeting updates
                meetingService.subscribeMeeting(
                    meeting.id,
                    updatedMeeting => {
                        console.log('Meeting updated:', updatedMeeting.status);
                        if (updatedMeeting.status === 'completed') {
                            handleMeetingEnded();
                        }
                    },
                    error => {
                        console.error('Meeting subscription error:', error);
                        Alert.alert('Error', 'Failed to connect to meeting');
                    },
                );

                // Subscribe to remote streams
                webRTCService.onRemoteStream(stream => {
                    console.log('Remote stream received');
                    setRemoteStreams(prev => [...prev, stream]);
                });

                webRTCService.onRemoteStreamRemoved(streamId => {
                    console.log('Remote stream removed:', streamId);
                    setRemoteStreams(prev => prev.filter(s => s.id !== streamId));
                });

                // Listen for signaling messages
                webRTCService.listenForSignalingMessages(meeting.id, message => {
                    webRTCService.processSignalingMessage(message, meeting.id);
                });

                // Connect to existing participants
                if (meeting.participants && meeting.participants.length > 0) {
                    await webRTCService.connectToParticipants(meeting.id, meeting.participants);
                }

                // Subscribe to chat messages
                subscribeToMessages();

                setIsConnecting(false);
            } catch (error) {
                console.error('Failed to setup meeting:', error);
                setConnectionError((error as Error).message || 'Connection failed');

                if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
                    // Retry connection
                    setTimeout(() => {
                        setupMeeting();
                    }, 2000);
                } else {
                    Alert.alert(
                        'Connection Error',
                        'Failed to join meeting after multiple attempts. Please try again later.',
                        [{ text: 'OK', onPress: () => navigation.goBack() }]
                    );
                }
            }
        };

        setupMeeting();

        return () => {
            cleanup();
        };
    }, [meeting.id]);

    const subscribeToMessages = () => {
        if (!currentUser) return;

        const messagesRef = firestore()
            .collection('meetings')
            .doc(meeting.id)
            .collection('messages')
            .orderBy('timestamp', 'asc');

        const unsubscribe = messagesRef.onSnapshot(
            snapshot => {
                if (!snapshot) return;

                const newMessages: Message[] = [];
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const data = change.doc.data();
                        newMessages.push({
                            id: change.doc.id,
                            senderId: data.senderId,
                            senderName: data.senderName,
                            text: data.text,
                            timestamp: data.timestamp?.toDate() || new Date(),
                            isMe: data.senderId === currentUser.uid,
                        });
                    }
                });

                if (newMessages.length > 0) {
                    setMessages(prev => [...prev, ...newMessages]);
                }
            },
            error => {
                console.error('Error subscribing to messages:', error);
            }
        );

        setUnsubscribeMessages(() => unsubscribe);
    };

    const sendMessage = async (text: string) => {
        if (!currentUser || !text.trim()) return;

        try {
            await firestore()
                .collection('meetings')
                .doc(meeting.id)
                .collection('messages')
                .add({
                    senderId: currentUser.uid,
                    senderName: currentUser.displayName || 'Anonymous',
                    text: text.trim(),
                    timestamp: firestore.FieldValue.serverTimestamp(),
                });
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Error', 'Failed to send message');
        }
    };

    const cleanup = async () => {
        try {
            console.log('Cleaning up resources');

            // Unsubscribe from messages
            if (unsubscribeMessages) {
                unsubscribeMessages();
            }

            // Leave the meeting
            await meetingService.leaveMeeting(meeting.id);

            // Cleanup services
            meetingService.cleanup();
            webRTCService.cleanup();
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    };

    const handleMeetingEnded = () => {
        Alert.alert('Meeting Ended', 'The meeting has been ended by the host');
        cleanup();
        navigation.goBack();
    };

    const handleToggleAudio = () => {
        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                const audioTrack = audioTracks[0];
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    };

    const handleToggleVideo = () => {
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            if (videoTracks.length > 0) {
                const videoTrack = videoTracks[0];
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    };

    const handleEndCall = async () => {
        if (isHost) {
            try {
                await meetingService.endMeeting(meeting.id);
            } catch (error) {
                console.error('Failed to end meeting:', error);
            }
        } else {
            try {
                await meetingService.leaveMeeting(meeting.id);
            } catch (error) {
                console.error('Failed to leave meeting:', error);
            }
        }

        cleanup();
        navigation.goBack();
    };

    if (isConnecting) {
        return (
            <View style={[styles.loadingContainer, isDark && styles.darkContainer]}>
                <ActivityIndicator size="large" color="#8ab4f8" />
                <Text style={styles.loadingText}>
                    {connectionError ? `Retrying... (${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})` : 'Connecting to meeting...'}
                </Text>
                {connectionError && (
                    <Text style={styles.errorText}>{connectionError}</Text>
                )}
            </View>
        );
    }

    return (
        <View style={[styles.container, isDark && styles.darkContainer]}>
            <Room
                meeting={meeting}
                localStream={localStream}
                remoteStreams={remoteStreams}
                onToggleAudio={handleToggleAudio}
                onToggleVideo={handleToggleVideo}
                onEndCall={handleEndCall}
                onSendMessage={sendMessage}
                messages={messages}
                isAudioEnabled={isAudioEnabled}
                isVideoEnabled={isVideoEnabled}
                isDark={isDark}
                currentUserId={currentUser?.uid || ''}
                currentUserName={currentUser?.displayName || 'Anonymous'}
            />
        </View>
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
    loadingContainer: {
        flex: 1,
        backgroundColor: '#202124',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        color: 'white',
        fontSize: 16,
        marginTop: 16,
    },
    errorText: {
        color: '#ea4335',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
});

export default RoomScreen; 