import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import {
    RTCPeerConnection,
    RTCView,
    mediaDevices,
    RTCIceCandidate,
    RTCSessionDescription,
} from 'react-native-webrtc';
import Icon from 'react-native-vector-icons/MaterialIcons';
import InCallManager from 'react-native-incall-manager';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTypedSelector } from '../hooks/useTypedSelector';
import { MeetingService } from '../service/firebase/MeetingService';
import { WebRTCService } from '../service/firebase/WebRTCService';
import auth from '@react-native-firebase/auth';
import Chat from './Chat';

const { width, height } = Dimensions.get('window');

interface VideoMeetingProps {
    meetingId: string;
    roomCode: string;
    isHost: boolean;
    onEndMeeting: () => void;
}

const configuration = {
    iceServers: [
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
            ],
        },
    ],
};

const VideoMeeting: React.FC<VideoMeetingProps> = ({
    meetingId,
    roomCode,
    isHost,
    onEndMeeting,
}) => {
    const isDark = useTypedSelector(state => state.user.theme) === 'dark';
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [participants, setParticipants] = useState<string[]>([]);
    const [isChatVisible, setIsChatVisible] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const maxConnectionAttempts = 3;
    const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const connectionTimeoutDuration = 30000; // 30 seconds timeout

    const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({});
    const webRTCService = useRef(new WebRTCService()).current;
    const meetingService = useRef(new MeetingService()).current;
    const currentUserId = auth().currentUser?.uid || '';

    useEffect(() => {
        // Initialize WebRTC
        setupWebRTC();
        // Setup call management
        InCallManager.start({ media: 'video' });
        InCallManager.setKeepScreenOn(true);
        InCallManager.setForceSpeakerphoneOn(true);

        // Listen for signaling messages
        listenForSignalingMessages();

        // Subscribe to meeting updates
        subscribeMeetingUpdates();

        return () => {
            cleanup();
            if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
                connectionTimeoutRef.current = null;
            }
        };
    }, []);

    const cleanup = () => {
        // Cleanup streams
        if (localStream) {
            localStream.getTracks().forEach((track: any) => track.stop());
        }
        if (peerConnections.current) {
            Object.values(peerConnections.current).forEach((peerConnection) => {
                peerConnection.close();
            });
        }

        // Leave meeting
        meetingService.leaveMeeting(meetingId).catch(console.error);

        // Cleanup services
        webRTCService.cleanup();
        meetingService.unsubscribeMeeting();
        InCallManager.stop();
    };

    const subscribeMeetingUpdates = () => {
        meetingService.subscribeMeeting(
            meetingId,
            (meeting) => {
                if (meeting.participants && meeting.participants.length > 0) {
                    setParticipants(meeting.participants);
                    // If we have participants and we're still in connecting state, update to connected
                    if (connectionStatus === 'connecting') {
                        setConnectionStatus('connected');
                        if (connectionTimeoutRef.current) {
                            clearTimeout(connectionTimeoutRef.current);
                            connectionTimeoutRef.current = null;
                        }
                    }
                }

                // If meeting is ended, call onEndMeeting
                if (meeting.status === 'completed' || meeting.status === 'cancelled') {
                    onEndMeeting();
                }
            },
            (error) => {
                console.error('Error subscribing to meeting updates:', error);
                Alert.alert('Error', 'Failed to get meeting updates');
            }
        );
    };

    const listenForSignalingMessages = () => {
        webRTCService.listenForSignalingMessages(meetingId, async (message) => {
            try {
                switch (message.type) {
                    case 'offer':
                        await handleOffer(message.payload);
                        break;
                    case 'answer':
                        await handleAnswer(message.payload);
                        break;
                    case 'candidate':
                        await handleCandidate(message.payload);
                        break;
                }
            } catch (error) {
                console.error('Error handling signaling message:', error);
            }
        });
    };

    const handleOffer = async (offer: RTCSessionDescription) => {
        if (!peerConnections.current[currentUserId]) return;

        try {
            await peerConnections.current[currentUserId].setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnections.current[currentUserId].createAnswer();
            await peerConnections.current[currentUserId].setLocalDescription(answer);

            // Send answer to the peer who sent the offer
            await webRTCService.createAnswer(peerConnections.current[currentUserId], meetingId, offer.sender);
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    };

    const handleAnswer = async (answer: RTCSessionDescription) => {
        if (!peerConnections.current[currentUserId]) return;

        try {
            await peerConnections.current[currentUserId].setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    };

    const handleCandidate = async (candidate: RTCIceCandidate) => {
        if (!peerConnections.current[currentUserId]) return;

        try {
            await peerConnections.current[currentUserId].addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error handling candidate:', error);
        }
    };

    const setupWebRTC = async () => {
        try {
            // Get user media with improved constraints
            const stream = await mediaDevices.getUserMedia({
                audio: true,
                video: {
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    frameRate: { min: 15, ideal: 30, max: 60 },
                    facingMode: 'user',
                },
            });

            setLocalStream(stream);

            // Create peer connection with proper configuration
            const peerConnection = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: [
                            'stun:stun1.l.google.com:19302',
                            'stun:stun2.l.google.com:19302',
                        ],
                    },
                ],
                iceTransportPolicy: 'all',
                bundlePolicy: 'max-bundle',
                rtcpMuxPolicy: 'require',
            });

            peerConnections.current[currentUserId] = peerConnection;

            // Add local stream tracks to peer connection
            stream.getTracks().forEach((track: MediaStreamTrack) => {
                if (peerConnections.current[currentUserId]) {
                    peerConnections.current[currentUserId].addTrack(track, stream);
                }
            });

            // Handle remote stream with improved error handling
            if (peerConnections.current[currentUserId]) {
                peerConnections.current[currentUserId].ontrack = (event: RTCTrackEvent) => {
                    if (event.streams && event.streams[0]) {
                        const remoteStream = event.streams[0];
                        console.log('Received remote stream:', remoteStream.id);

                        // Update remote streams state
                        setRemoteStreams(prev => ({
                            ...prev,
                            [event.streams[0].id]: remoteStream
                        }));
                    }
                };
            }

            // Handle ICE candidates
            if (peerConnections.current[currentUserId]) {
                peerConnections.current[currentUserId].onicecandidate = async (event: RTCPeerConnectionIceEvent) => {
                    if (event.candidate) {
                        try {
                            const otherParticipants = participants.filter(
                                id => id !== currentUserId
                            );

                            for (const participantId of otherParticipants) {
                                await webRTCService.sendIceCandidate(
                                    event.candidate,
                                    meetingId,
                                    participantId
                                );
                            }
                        } catch (error) {
                            console.error('Error sending ICE candidate:', error);
                        }
                    }
                };
            }

            // Handle connection state changes
            if (peerConnections.current[currentUserId]) {
                peerConnections.current[currentUserId].onconnectionstatechange = () => {
                    if (peerConnections.current[currentUserId]) {
                        const state = peerConnections.current[currentUserId].connectionState;
                        console.log('Connection state changed:', state);

                        switch (state) {
                            case 'connected':
                                setConnectionStatus('connected');
                                break;
                            case 'disconnected':
                            case 'failed':
                                setConnectionStatus('failed');
                                break;
                            case 'closed':
                                console.log('Connection closed');
                                break;
                        }
                    }
                };
            }

            // If we're the host and there are other participants, create an offer
            if (isHost && participants.length > 1) {
                const otherParticipants = participants.filter(
                    id => id !== currentUserId
                );

                for (const participantId of otherParticipants) {
                    if (peerConnections.current[currentUserId]) {
                        try {
                            await webRTCService.createOffer(
                                peerConnections.current[currentUserId],
                                meetingId,
                                participantId
                            );
                        } catch (error) {
                            console.error('Error creating offer:', error);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error setting up WebRTC:', error);
            setConnectionStatus('failed');
            Alert.alert(
                'Connection Error',
                'Failed to access camera or microphone. Please check your permissions and try again.',
                [
                    {
                        text: 'OK',
                        onPress: () => onEndMeeting(),
                    },
                ]
            );
        }
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach((track: any) => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach((track: any) => {
                track.enabled = !track.enabled;
            });
            setIsCameraOff(!isCameraOff);
        }
    };

    const toggleScreenShare = async () => {
        try {
            if (isScreenSharing) {
                // Stop screen sharing
                if (localStream) {
                    localStream.getTracks().forEach((track: any) => track.stop());
                }
                // Get back to camera
                const cameraStream = await mediaDevices.getUserMedia({
                    audio: true,
                    video: true,
                });
                setLocalStream(cameraStream);
                setIsScreenSharing(false);
            } else {
                // Start screen sharing (Note: This needs additional setup for Android)
                if (Platform.OS === 'android') {
                    Alert.alert('Info', 'Screen sharing is not supported on Android yet');
                    return;
                }
                // Implementation for screen sharing
                setIsScreenSharing(true);
            }
        } catch (err) {
            console.error('Error toggling screen share:', err);
            Alert.alert('Error', 'Failed to toggle screen sharing');
        }
    };

    const handleEndMeeting = async () => {
        try {
            if (isHost && !connectionStatus === 'connected') {
                await meetingService.endMeeting(meetingId);
            }
            cleanup();
            onEndMeeting();
        } catch (err) {
            console.error('Error ending meeting:', err);
            Alert.alert('Error', 'Failed to end meeting');
        }
    };

    const copyRoomCode = () => {
        Clipboard.setString(roomCode);
        Alert.alert('Success', 'Room code copied to clipboard');
    };

    return (
        <View style={[styles.container, isDark && styles.darkContainer]}>
            {connectionStatus === 'connecting' && (
                <View style={styles.connectionOverlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.connectionText}>
                        Connecting to meeting...
                        {connectionAttempts > 0 && ` (Attempt ${connectionAttempts + 1}/${maxConnectionAttempts})`}
                    </Text>
                </View>
            )}

            {connectionStatus === 'failed' && (
                <View style={styles.connectionOverlay}>
                    <Icon name="error-outline" size={50} color="#FF6B6B" />
                    <Text style={styles.connectionText}>Connection failed</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                            setConnectionAttempts(0);
                            setConnectionStatus('connecting');
                            cleanup();
                            setupWebRTC();
                        }}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onEndMeeting}
                    >
                        <Text style={styles.cancelButtonText}>Leave Meeting</Text>
                    </TouchableOpacity>
                </View>
            )}
            {/* Main video view */}
            <View style={[
                styles.mainVideoContainer,
                isChatVisible && styles.mainVideoWithChat
            ]}>
                {Object.values(remoteStreams).length > 0 ? (
                    <RTCView
                        streamURL={Object.values(remoteStreams)[0].toURL()}
                        style={styles.mainVideo}
                        objectFit="cover"
                    />
                ) : (
                    <View style={[styles.noVideoContainer, isDark && styles.darkNoVideoContainer]}>
                        <Icon name="videocam-off" size={48} color={isDark ? '#ffffff' : '#000000'} />
                        <Text style={[styles.noVideoText, isDark && styles.darkText]}>
                            {participants.length > 1
                                ? 'Connecting to other participants...'
                                : 'Waiting for others to join...'}
                        </Text>
                    </View>
                )}
            </View>

            {/* Participants grid */}
            <View style={styles.participantsGrid}>
                {localStream && (
                    <View style={styles.participantContainer}>
                        <RTCView
                            streamURL={localStream.toURL()}
                            style={styles.participantVideo}
                            objectFit="cover"
                        />
                        <View style={styles.participantInfo}>
                            <Text style={[styles.participantName, isDark && styles.darkText]}>
                                You {isHost ? '(Host)' : ''}
                            </Text>
                            {isMuted && (
                                <Icon name="mic-off" size={16} color={isDark ? '#ffffff' : '#000000'} />
                            )}
                        </View>
                    </View>
                )}
            </View>

            {/* Room info and participants count */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    style={[styles.roomInfo, isDark && styles.darkRoomInfo]}
                    onPress={copyRoomCode}
                >
                    <Text style={[styles.roomCode, isDark && styles.darkText]}>
                        Room Code: {roomCode}
                    </Text>
                    <Icon name="content-copy" size={20} color={isDark ? '#ffffff' : '#000000'} />
                </TouchableOpacity>

                <View style={[styles.participantsInfo, isDark && styles.darkParticipantsInfo]}>
                    <Icon name="people" size={20} color={isDark ? '#ffffff' : '#000000'} />
                    <Text style={[styles.participantsCount, isDark && styles.darkText]}>
                        {participants.length} participant{participants.length !== 1 ? 's' : ''}
                    </Text>
                </View>
            </View>

            {/* Controls */}
            <View style={[styles.controls, isDark && styles.darkControls]}>
                <TouchableOpacity
                    style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                    onPress={toggleMute}
                >
                    <Icon
                        name={isMuted ? 'mic-off' : 'mic'}
                        size={24}
                        color="#ffffff"
                    />
                    <Text style={styles.controlText}>
                        {isMuted ? 'Unmute' : 'Mute'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
                    onPress={toggleCamera}
                >
                    <Icon
                        name={isCameraOff ? 'videocam-off' : 'videocam'}
                        size={24}
                        color="#ffffff"
                    />
                    <Text style={styles.controlText}>
                        {isCameraOff ? 'Start Video' : 'Stop Video'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, isScreenSharing && styles.controlButtonActive]}
                    onPress={toggleScreenShare}
                >
                    <Icon
                        name={isScreenSharing ? 'stop-screen-share' : 'screen-share'}
                        size={24}
                        color="#ffffff"
                    />
                    <Text style={styles.controlText}>
                        {isScreenSharing ? 'Stop Share' : 'Share Screen'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, isChatVisible && styles.controlButtonActive]}
                    onPress={() => setIsChatVisible(!isChatVisible)}
                >
                    <Icon
                        name="chat"
                        size={24}
                        color="#ffffff"
                    />
                    <Text style={styles.controlText}>Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, styles.endCallButton]}
                    onPress={handleEndMeeting}
                >
                    <Icon name="call-end" size={24} color="#ffffff" />
                    <Text style={styles.controlText}>End</Text>
                </TouchableOpacity>
            </View>

            {/* Chat component */}
            <Chat
                meetingId={meetingId}
                isVisible={isChatVisible}
                onClose={() => setIsChatVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    darkContainer: {
        backgroundColor: '#1a1a1a',
    },
    mainVideoContainer: {
        flex: 1,
    },
    mainVideo: {
        flex: 1,
        backgroundColor: '#000000',
    },
    localVideoContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: width * 0.25,
        height: height * 0.2,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#000000',
    },
    localVideo: {
        flex: 1,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 30,
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: [{ translateX: -width * 0.3 }],
    },
    darkControls: {
        backgroundColor: 'rgba(26, 26, 26, 0.8)',
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007cb5',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    controlButtonActive: {
        backgroundColor: '#ff3b30',
    },
    controlText: {
        color: '#ffffff',
        fontSize: 10,
        marginTop: 4,
    },
    endCallButton: {
        backgroundColor: '#ff3b30',
    },
    roomInfo: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 10,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    darkRoomInfo: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    roomCode: {
        marginRight: 10,
        fontSize: 14,
        color: '#000000',
    },
    darkText: {
        color: '#ffffff',
    },
    noVideoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    darkNoVideoContainer: {
        backgroundColor: '#2a2a2a',
    },
    noVideoText: {
        marginTop: 10,
        fontSize: 16,
        color: '#000000',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    darkOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    overlayText: {
        marginTop: 10,
        fontSize: 16,
        color: '#000000',
    },
    participantsInfo: {
        position: 'absolute',
        top: 20,
        right: width * 0.25 + 30,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 10,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    darkParticipantsInfo: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    participantsCount: {
        marginLeft: 5,
        fontSize: 14,
        color: '#000000',
    },
    mainVideoWithChat: {
        marginRight: width * 0.3, // Make space for chat
    },
    topBar: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    participantsGrid: {
        position: 'absolute',
        top: 80,
        right: 20,
        width: width * 0.2,
        maxHeight: height * 0.6,
    },
    participantContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        marginBottom: 10,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#000000',
    },
    participantVideo: {
        flex: 1,
    },
    participantInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    participantName: {
        color: '#ffffff',
        fontSize: 12,
    },
    connectionOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    connectionText: {
        color: '#FFFFFF',
        fontSize: 18,
        marginTop: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#007CB5',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 24,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#FFFFFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    cancelButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
});

export default VideoMeeting; 