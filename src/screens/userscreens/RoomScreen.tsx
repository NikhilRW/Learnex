import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { MeetingService, Meeting } from '../../service/firebase/MeetingService';
import { WebRTCService, ParticipantState } from '../../service/firebase/WebRTCService';
import { MediaStream } from 'react-native-webrtc';
import Room from '../../components/Room/Room';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { UserStackParamList } from '../../routes/UserStack';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';

type RoomScreenRouteProp = RouteProp<UserStackParamList, 'RoomScreen'>;
type RoomScreenNavigationProp = DrawerNavigationProp<UserStackParamList>;

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: Date;
    isMe: boolean;
    reactions?: {
        [userId: string]: string; // userId: reactionType
    };
}

interface ExtendedMediaStream extends MediaStream {
    participantId?: string;
}

const meetingService = new MeetingService();
const webRTCService = new WebRTCService();

const RoomScreen: React.FC = () => {
    const navigation = useNavigation<RoomScreenNavigationProp>();
    const route = useRoute<RoomScreenRouteProp>();
    const { meeting, isHost } = route.params;
    const userTheme = useTypedSelector(state => state.user);
    const isDark = userTheme.theme === 'dark';
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const currentUser = auth().currentUser;
    const firebase = useTypedSelector(state => state.firebase);
    const [localStream, setLocalStream] = useState<ExtendedMediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<ExtendedMediaStream[]>([]);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isConnecting, setIsConnecting] = useState(true);
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [unsubscribeMessages, setUnsubscribeMessages] = useState<(() => void) | null>(null);
    const [participantStates, setParticipantStates] = useState<Map<string, ParticipantState>>(new Map());
    const MAX_CONNECTION_ATTEMPTS = 3;
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'failed'>('connecting');
    // Track camera facing mode for persistence across component re-renders
    const [isFrontCamera, setIsFrontCamera] = useState(true);

    // Add stream tracking map to help with duplicate detection
    const [streamsByParticipant, setStreamsByParticipant] = useState<Map<string, ExtendedMediaStream>>(new Map());

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
                console.log('Participants in meeting:', meeting.participants);

                // Join the meeting
                await meetingService.joinMeeting(meeting.id);

                // Initialize WebRTC
                try {
                    const stream = await webRTCService.initLocalStream();
                    console.log('Local stream initialized:', stream.id);
                    stream.participantId = currentUser?.uid; // Ensure local stream has participantId
                    setLocalStream(stream);

                    // Set up audio level detection for local stream
                    setupAudioLevelDetection(stream, currentUser?.uid || '');
                } catch (streamError) {
                    console.error('Failed to initialize local stream:', streamError);
                    Alert.alert(
                        'Camera/Microphone Access',
                        'Could not access camera or microphone. Please check permissions.'
                    );
                }

                // Subscribe to meeting updates with improved error handling
                const unsubscribeMeeting = meetingService.subscribeMeeting(
                    meeting.id,
                    updatedMeeting => {
                        console.log('Meeting updated:', updatedMeeting.status);
                        console.log('Updated participants:', updatedMeeting.participants);

                        // Check for new participants to connect to
                        if (updatedMeeting.participants && updatedMeeting.participants.length > 0) {
                            // Connect to any new participants
                            webRTCService.connectToParticipants(meeting.id, updatedMeeting.participants)
                                .catch(error => {
                                    console.error('Error connecting to participants:', error);
                                });
                        }

                        if (updatedMeeting.status === 'completed') {
                            handleMeetingEnded();
                        }
                    },
                    error => {
                        console.error('Meeting subscription error:', error);
                        setConnectionState('failed');
                        Alert.alert('Error', 'Failed to connect to meeting');
                    },
                );

                // Subscribe to remote streams with improved error handling and stream management
                webRTCService.onRemoteStream(stream => {
                    console.log('Remote stream received with ID:', stream.id);
                    try {
                        const participantId = stream.participantId;
                        if (!participantId) {
                            console.error('Received stream without participant ID');
                            return;
                        }

                        // Log before updating participant tracking
                        console.log('Before update - StreamsByParticipant map:',
                            Array.from(streamsByParticipant.entries()).map(([id, s]) =>
                                `${id}: ${s.id || 'unknown'}`));

                        // Update streams by participant
                        setStreamsByParticipant(prev => {
                            const newMap = new Map(prev);
                            newMap.set(participantId, stream);
                            return newMap;
                        });

                        // Update remote streams state
                        setRemoteStreams(prev => {
                            // Remove any existing stream for this participant
                            const filteredStreams = prev.filter(s => s.participantId !== participantId);
                            // Add the new stream
                            return [...filteredStreams, stream];
                        });

                        // Setup audio level detection for the new stream
                        setupAudioLevelDetection(stream, participantId);
                        setConnectionState('connected');

                        // Initialize participant state if not already present
                        if (!participantStates.has(participantId)) {
                            const newState = new Map(participantStates);
                            newState.set(participantId, {
                                isAudioEnabled: true,
                                isVideoEnabled: true,
                                isHandRaised: false,
                                isScreenSharing: false,
                                isThumbsUp: false,
                                isThumbsDown: false,
                                isClapping: false,
                                isWaving: false,
                                isSpeaking: false,
                                reactionTimestamp: null,
                                lastUpdated: new Date()
                            });
                            setParticipantStates(newState);
                        }
                    } catch (error) {
                        console.error('Error handling remote stream:', error);
                    }
                });

                // Improved stream removal that properly removes by participantId
                webRTCService.onRemoteStreamRemoved(participantId => {
                    console.log('Remote stream removed for participant:', participantId);
                    try {
                        // Update our participant tracking map
                        setStreamsByParticipant(prev => {
                            const newMap = new Map(prev);
                            newMap.delete(participantId);
                            return newMap;
                        });

                        // Remove the stream from state
                        setRemoteStreams(prev => {
                            return prev.filter(stream => stream.participantId !== participantId);
                        });

                        // Don't remove from participantStates yet, 
                        // as the participant might rejoin with a new stream
                    } catch (error) {
                        console.error('Error removing remote stream:', error);
                    }
                });

                // Subscribe to participant states
                webRTCService.subscribeToParticipantStates(meeting.id);

                // Initialize local participant state
                await webRTCService.updateLocalParticipantState(meeting.id, {
                    isAudioEnabled,
                    isVideoEnabled,
                    isHandRaised: false,
                    isScreenSharing: false
                });

                // Listen for participant state changes
                webRTCService.onParticipantStateChanged((participantId, state) => {
                    console.log(`Participant state changed: ${participantId}`, state);
                    setParticipantStates(prev => {
                        const newMap = new Map(prev);
                        newMap.set(participantId, state);
                        return newMap;
                    });
                });

                // Listen for signaling messages with improved error handling
                webRTCService.listenForSignalingMessages(meeting.id, async message => {
                    try {
                        await webRTCService.processSignalingMessage(message, meeting.id);
                    } catch (error) {
                        console.error('Error processing signaling message:', error);
                        if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
                            console.log('Retrying connection...');
                            setConnectionAttempts(prev => prev + 1);
                            await setupMeeting();
                        } else {
                            setConnectionState('failed');
                            Alert.alert(
                                'Connection Error',
                                'Failed to establish connection after multiple attempts'
                            );
                        }
                    }
                });

                // Connect to existing participants
                if (meeting.participants && meeting.participants.length > 0) {
                    console.log('Connecting to existing participants:', meeting.participants);
                    await webRTCService.connectToParticipants(meeting.id, meeting.participants);
                }

                setIsConnecting(false);
                setConnectionState('connected');

                // Subscribe to chat messages
                subscribeToMessages();

            } catch (error) {
                console.error('Failed to setup meeting:', error);
                setConnectionError((error as Error).message || 'Connection failed');
                setConnectionState('failed');

                if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
                    console.log(`Retrying setup (attempt ${connectionAttempts + 1})`);
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

    // Enhanced debug logging for remote streams
    useEffect(() => {
        console.log(`Remote streams updated: ${remoteStreams.length} streams`);
        console.log(`Participant states: ${participantStates.size} participants`);

        remoteStreams.forEach((stream, index) => {
            console.log(`Stream ${index}: ID=${stream.id}, ParticipantID=${stream.participantId || 'none'}`);
        });

        // Log the streamsByParticipant map
        console.log(`StreamsByParticipant map has ${streamsByParticipant.size} entries`);
        streamsByParticipant.forEach((stream, participantId) => {
            console.log(`Participant ${participantId} has stream ID ${stream.id}`);
        });

        // Log participants with state but no stream
        const participantsWithoutStreams = Array.from(participantStates.keys())
            .filter(id => !streamsByParticipant.has(id) && id !== currentUser?.uid);

        if (participantsWithoutStreams.length > 0) {
            console.log(`${participantsWithoutStreams.length} participants without streams:`);
            participantsWithoutStreams.forEach(id => {
                console.log(`- Participant ${id} (no stream)`);
            });
        }
    }, [remoteStreams, streamsByParticipant, participantStates]);

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
                            reactions: data.reactions || {},
                        });
                    } else if (change.type === 'modified') {
                        // Handle message modifications (e.g., reactions)
                        const data = change.doc.data();
                        const updatedMessage = {
                            id: change.doc.id,
                            senderId: data.senderId,
                            senderName: data.senderName,
                            text: data.text,
                            timestamp: data.timestamp?.toDate() || new Date(),
                            isMe: data.senderId === currentUser.uid,
                            reactions: data.reactions || {},
                        };

                        // Update the message in the state
                        setMessages(prevMessages =>
                            prevMessages.map(msg =>
                                msg.id === updatedMessage.id ? updatedMessage : msg
                            )
                        );

                        // Don't add to newMessages since we're updating in place
                        return;
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
        let name = "";
        try {
            await firestore()
                .collection('meetings')
                .doc(meeting.id)
                .collection('messages')
                .add({
                    senderId: currentUser!.uid,
                    senderName: currentUser?.displayName || 'Anonymous',
                    text: text.trim(),
                    timestamp: firestore.FieldValue.serverTimestamp(),
                    reactions: {}, // Initialize empty reactions object
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
        Alert.alert('Meeting Ended', 'The meeting has been ended by the host', [
            {
                text: 'OK',
                onPress: () => {
                    cleanup();
                    navigation.navigate('Home');
                }
            }
        ]);
    };

    const handleToggleAudio = async () => {
        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                const audioTrack = audioTracks[0];
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);

                // Update participant state in Firestore
                await webRTCService.updateLocalParticipantState(meeting.id, {
                    isAudioEnabled: audioTrack.enabled
                });
            }
        }
    };

    const handleToggleVideo = async () => {
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            if (videoTracks.length > 0) {
                const videoTrack = videoTracks[0];
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);

                // Update participant state in Firestore
                await webRTCService.updateLocalParticipantState(meeting.id, {
                    isVideoEnabled: videoTrack.enabled
                });
            }
        }
    };

    // Handle camera flip between front and back
    const handleFlipCamera = async () => {
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            if (videoTracks.length > 0) {
                try {
                    console.log(`Flipping camera from ${isFrontCamera ? 'front' : 'back'} to ${isFrontCamera ? 'back' : 'front'}`);

                    // Use the native _switchCamera method available in react-native-webrtc
                    videoTracks.forEach(track => {
                        if (typeof track._switchCamera === 'function') {
                            track._switchCamera();
                            // Update camera facing mode state
                            setIsFrontCamera(!isFrontCamera);
                            console.log(`Camera flipped successfully to ${!isFrontCamera ? 'front' : 'back'}`);
                        } else {
                            console.warn("_switchCamera method not available on this track");

                            // Fallback approach for browsers or platforms without _switchCamera
                            // This would require reinitializing the camera with opposite facing mode
                            // but is not implemented in this example as it requires renegotiation
                        }
                    });
                } catch (error) {
                    console.error('Error flipping camera:', error);
                }
            } else {
                console.warn("No video tracks available to flip camera");
                Alert.alert('Camera Error', 'No video available to switch cameras');
            }
        } else {
            console.warn("No local stream available to flip camera");
            Alert.alert('Camera Error', 'Camera not initialized');
        }
    };

    const handleRaiseHand = async (raised: boolean) => {
        // Update participant state in Firestore
        await webRTCService.updateLocalParticipantState(meeting.id, {
            isHandRaised: raised
        });
    };

    const handleReaction = async (reaction: 'thumbsUp' | 'thumbsDown' | 'clapping' | 'waving') => {
        // Create update object with all reactions set to false
        const update: Partial<ParticipantState> = {
            isThumbsUp: false,
            isThumbsDown: false,
            isClapping: false,
            isWaving: false,
        };

        // Set the selected reaction to true
        switch (reaction) {
            case 'thumbsUp':
                update.isThumbsUp = true;
                break;
            case 'thumbsDown':
                update.isThumbsDown = true;
                break;
            case 'clapping':
                update.isClapping = true;
                break;
            case 'waving':
                update.isWaving = true;
                break;
        }

        // Update participant state in Firestore
        await webRTCService.updateLocalParticipantState(meeting.id, update);
    };

    // Add a function to handle local stream updates and renegotiate connections as needed
    const handleLocalStreamUpdate = (stream: ExtendedMediaStream | null) => {
        if (!stream) return;

        try {
            // Add participant ID if not already set
            if (!stream.participantId) {
                stream.participantId = currentUser?.uid;
            }

            console.log('Updating local stream:', stream.id);
            console.log('Stream tracks:', stream.getTracks().map(t => `${t.kind}:${t.enabled}`).join(', '));

            // Update the local stream in WebRTCService - this will trigger renegotiation
            webRTCService.updateLocalStream(stream, meeting.id)
                .then(() => {
                    console.log('Local stream updated successfully and connections renegotiated');
                })
                .catch((error: Error) => {
                    console.error('Error updating local stream:', error);
                });

            // Update local state
            setLocalStream(stream);
        } catch (error) {
            console.error('Error in handleLocalStreamUpdate:', error);
        }
    };

    // Handle screen sharing state
    const handleScreenShare = async (isSharing: boolean) => {
        // Update participant state in Firestore
        await webRTCService.updateLocalParticipantState(meeting.id, {
            isScreenSharing: isSharing
        });
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { fullName, username } = await firebase.firebase.user.getNameUsernamestring();
                console.log(fullName, username);
                setUsername(username);
                setFullName(fullName);
            } catch (err) {
                console.error('Error fetching user data:', err);
                setUsername('Anonymous');
                setFullName('Anonymous');
            }
        };
        fetchUserData();
    }, [currentUser]);
    const handleMessageReaction = async (messageId: string, reactionType: string) => {
        if (!currentUser) return;

        try {
            const messageRef = firestore()
                .collection('meetings')
                .doc(meeting.id)
                .collection('messages')
                .doc(messageId);

            // Get current message data
            const messageDoc = await messageRef.get();
            if (!messageDoc.exists) return;

            const messageData = messageDoc.data();
            const reactions = messageData?.reactions || {};

            // Toggle reaction: remove if same reaction exists, otherwise add/update
            if (reactions[currentUser.uid] === reactionType) {
                // Remove reaction
                delete reactions[currentUser.uid];
            } else {
                // Add or update reaction
                reactions[currentUser.uid] = reactionType;
            }

            // Update message with new reactions
            await messageRef.update({ reactions });
        } catch (error) {
            console.error('Error adding reaction to message:', error);
        }
    };

    const handleEndCall = async () => {
        try {
            if (isHost) {
                await meetingService.endMeeting(meeting.id);
            } else {
                await meetingService.leaveMeeting(meeting.id);
            }

            cleanup();
            // Use the correct screen name 'Home'
            navigation.navigate('Home');
        } catch (error) {
            console.error('Failed to end/leave meeting:', error);
            // Even if there's an error, try to navigate away
            navigation.navigate('Home');
        }
    };

    // Function to detect audio levels and update speaking status
    const setupAudioLevelDetection = (stream: any, participantId: string) => {
        if (!stream) return;

        try {
            // For React Native, we'll use a simpler approach
            // Set up interval to check if audio track is enabled and has audio level
            const checkInterval = setInterval(() => {
                if (!stream.active) {
                    clearInterval(checkInterval);
                    return;
                }

                const audioTracks = stream.getAudioTracks();
                if (audioTracks.length === 0) return;

                const audioTrack = audioTracks[0];

                // In React Native, we can't directly measure audio levels
                // So we'll use a simpler approach: if audio is enabled and not muted, 
                // we'll simulate speaking detection with random intervals
                if (audioTrack.enabled && !audioTrack.muted) {
                    // Simulate speaking detection with random intervals
                    // This is just a placeholder - in a real app, you'd use native modules
                    // to detect actual audio levels
                    const isSpeaking = Math.random() > 0.7; // 30% chance of "speaking"

                    // Get current state
                    const currentState = participantStates.get(participantId);
                    if (currentState && currentState.isSpeaking !== isSpeaking) {
                        // Only update if speaking state has changed
                        webRTCService.updateLocalParticipantState(meeting.id, {
                            isSpeaking
                        });
                    }
                } else {
                    // If audio is disabled or muted, definitely not speaking
                    const currentState = participantStates.get(participantId);
                    if (currentState && currentState.isSpeaking) {
                        webRTCService.updateLocalParticipantState(meeting.id, {
                            isSpeaking: false
                        });
                    }
                }
            }, 1000); // Check every second

            // Clean up on component unmount
            return () => {
                clearInterval(checkInterval);
            };
        } catch (error) {
            console.error('Error setting up audio level detection:', error);
        }
    };

    if (isConnecting) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4285F4" />
                <Text style={styles.loadingText}>
                    {connectionState === 'connecting' ? 'Connecting to meeting...' :
                        connectionState === 'failed' ? 'Connection failed' :
                            'Setting up connection...'}
                </Text>
                {connectionError && (
                    <Text style={styles.errorText}>
                        Error: {connectionError}. {connectionAttempts < MAX_CONNECTION_ATTEMPTS ?
                            `Retrying (${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})...` :
                            'Max retries reached.'}
                    </Text>
                )}
                <TouchableOpacity
                    style={styles.exitButton}
                    onPress={() => {
                        cleanup();
                        navigation.navigate('Home');
                    }}
                >
                    <Text style={styles.exitButtonText}>Exit Meeting</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            {connectionState === 'failed' ? (
                <View style={styles.errorContainer}>
                    <Icon name="error" size={64} color="#EA4335" />
                    <Text style={styles.errorTitle}>Connection Failed</Text>
                    <Text style={styles.errorMessage}>
                        {connectionError || 'Could not connect to the meeting. Please try again.'}
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.retryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Room
                    meeting={meeting}
                    localStream={localStream}
                    updateLocalStream={handleLocalStreamUpdate}
                    remoteStreams={remoteStreams}
                    onToggleAudio={handleToggleAudio}
                    onToggleVideo={handleToggleVideo}
                    onEndCall={handleEndCall}
                    onSendMessage={sendMessage}
                    onMessageReaction={handleMessageReaction}
                    messages={messages}
                    isAudioEnabled={isAudioEnabled}
                    isVideoEnabled={isVideoEnabled}
                    isDark={isDark}
                    currentUserId={currentUser?.uid || ''}
                    currentUserName={fullName || username || currentUser?.email || 'You'}
                    onRaiseHand={handleRaiseHand}
                    onReaction={handleReaction}
                    participantStates={participantStates}
                    isConnecting={isConnecting}
                    onFlipCamera={handleFlipCamera}
                    isFrontCamera={isFrontCamera}
                    onScreenShare={handleScreenShare}
                />
            )}
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
    exitButton: {
        backgroundColor: '#ea4335',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 20,
    },
    exitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorContainer: {
        flex: 1,
        backgroundColor: '#202124',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    errorMessage: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#ea4335',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default RoomScreen; 