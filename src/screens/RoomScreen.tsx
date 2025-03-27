import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MeetingService, Meeting } from '../service/firebase/MeetingService';
import Room from '../components/Room/Room';
import { WebRTCService } from '../service/firebase/WebRTCService';

interface RouteParams {
    meeting: Meeting;
    isHost: boolean;
}

const meetingService = new MeetingService();
const webRTCService = new WebRTCService();

export const RoomScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { meeting, isHost } = route.params as RouteParams;

    const [localStream, setLocalStream] = useState<any>(null);
    const [remoteStreams, setRemoteStreams] = useState<any[]>([]);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);

    useEffect(() => {
        const setupMeeting = async () => {
            try {
                // Join the meeting
                await meetingService.joinMeeting(meeting.id);

                // Initialize WebRTC
                const stream = await webRTCService.initLocalStream();
                setLocalStream(stream);

                // Subscribe to meeting updates
                meetingService.subscribeMeeting(
                    meeting.id,
                    updatedMeeting => {
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
                    setRemoteStreams(prev => [...prev, stream]);
                });

                webRTCService.onRemoteStreamRemoved(streamId => {
                    setRemoteStreams(prev => prev.filter(s => s.id !== streamId));
                });

            } catch (error) {
                console.error('Failed to setup meeting:', error);
                Alert.alert('Error', 'Failed to join meeting');
                navigation.goBack();
            }
        };

        setupMeeting();

        return () => {
            cleanup();
        };
    }, [meeting.id, navigation]);

    const cleanup = async () => {
        try {
            // Leave the meeting
            await meetingService.leaveMeeting(meeting.id);

            // Cleanup services
            meetingService.cleanup();
            webRTCService.cleanup();

            // Cleanup streams
            if (localStream) {
                localStream.getTracks().forEach((track: any) => track.stop());
            }
            setLocalStream(null);
            setRemoteStreams([]);
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
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    };

    const handleToggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
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
        }
        cleanup();
        navigation.goBack();
    };

    return (
        <Room
            meeting={meeting}
            localStream={localStream}
            remoteStreams={remoteStreams}
            onToggleAudio={handleToggleAudio}
            onToggleVideo={handleToggleVideo}
            onEndCall={handleEndCall}
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
        />
    );
};

export default RoomScreen; 