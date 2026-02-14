import {useState, useEffect, useCallback} from 'react';
import {Alert} from 'react-native';
import {getAuth} from '@react-native-firebase/auth';
import {
  ExtendedMediaStream,
  ParticipantState,
  UseRoomConnectionParams,
  UseRoomConnectionReturn,
} from '../types';
import {MAX_CONNECTION_ATTEMPTS} from '../constants/common';

export const useRoomConnection = ({
  meeting,
  meetingService,
  webRTCService,
  onMeetingEnded,
}: UseRoomConnectionParams): UseRoomConnectionReturn => {
  const currentUser = getAuth().currentUser;

  const [localStream, setLocalStream] = useState<ExtendedMediaStream | null>(
    null,
  );
  const [remoteStreams, setRemoteStreams] = useState<ExtendedMediaStream[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<
    'connecting' | 'connected' | 'disconnected' | 'failed'
  >('connecting');
  const [participantStates, setParticipantStates] = useState<
    Map<string, ParticipantState>
  >(new Map());
  const [streamsByParticipant, setStreamsByParticipant] = useState<
    Map<string, ExtendedMediaStream>
  >(new Map());

  // Function to detect audio levels and update speaking status
  const setupAudioLevelDetection = useCallback(
    (stream: any, participantId: string) => {
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
                isSpeaking,
              });
            }
          } else {
            // If audio is disabled or muted, definitely not speaking
            const currentState = participantStates.get(participantId);
            if (currentState && currentState.isSpeaking) {
              webRTCService.updateLocalParticipantState(meeting.id, {
                isSpeaking: false,
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
    },
    [meeting.id, participantStates, webRTCService],
  );

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
            'Could not access camera or microphone. Please check permissions.',
          );
        }

        // Subscribe to meeting updates with improved error handling
        meetingService.subscribeMeeting(
          meeting.id,
          (updatedMeeting: any) => {
            console.log('Meeting updated:', updatedMeeting.status);
            console.log('Updated participants:', updatedMeeting.participants);

            // Check for new participants to connect to
            if (
              updatedMeeting.participants &&
              updatedMeeting.participants.length > 0
            ) {
              // Connect to any new participants
              webRTCService
                .connectToParticipants(meeting.id, updatedMeeting.participants)
                .catch(error => {
                  console.error('Error connecting to participants:', error);
                });
            }

            if (updatedMeeting.status === 'completed') {
              onMeetingEnded();
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
            console.log(
              'Before update - StreamsByParticipant map:',
              Array.from(streamsByParticipant.entries()).map(
                ([id, s]) => `${id}: ${s.id || 'unknown'}`,
              ),
            );

            // Update streams by participant
            setStreamsByParticipant(prev => {
              const newMap = new Map(prev);
              newMap.set(participantId, stream);
              return newMap;
            });

            // Update remote streams state
            setRemoteStreams(prev => {
              // Remove any existing stream for this participant
              const filteredStreams = prev.filter(
                s => s.participantId !== participantId,
              );
              // Add the new stream
              return [...filteredStreams, stream];
            });

            // Setup audio level detection for the new stream
            setupAudioLevelDetection(stream, participantId);
            setConnectionState('connected');

            // Initialize participant state if not already present
            setParticipantStates(prev => {
              if (!prev.has(participantId)) {
                const newState = new Map(prev);
                newState.set(participantId, {
                  isAudioEnabled: true,
                  isVideoEnabled: true,
                  isHandRaised: false,
                  isThumbsUp: false,
                  isThumbsDown: false,
                  isClapping: false,
                  isWaving: false,
                  isSpeaking: false,
                  isScreenSharing: false,
                  reactionTimestamp: null,
                  lastUpdated: new Date(),
                  isSmiling: false,
                });
                return newState;
              }
              return prev;
            });
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
              return prev.filter(
                stream => stream.participantId !== participantId,
              );
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
          isAudioEnabled: true,
          isVideoEnabled: true,
          isHandRaised: false,
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
                'Failed to establish connection after multiple attempts',
              );
            }
          }
        });

        // Connect to existing participants
        if (meeting.participants && meeting.participants.length > 0) {
          console.log(
            'Connecting to existing participants:',
            meeting.participants,
          );
          await webRTCService.connectToParticipants(
            meeting.id,
            meeting.participants,
          );
        }

        setIsConnecting(false);
        setConnectionState('connected');
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
          );
        }
      }
    };

    setupMeeting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meeting.id]);

  // Enhanced debug logging for remote streams
  useEffect(() => {
    console.log(`Remote streams updated: ${remoteStreams.length} streams`);
    console.log(`Participant states: ${participantStates.size} participants`);

    remoteStreams.forEach((stream, index) => {
      console.log(
        `Stream ${index}: ID=${stream.id}, ParticipantID=${stream.participantId || 'none'}`,
      );
    });

    // Log the streamsByParticipant map
    console.log(
      `StreamsByParticipant map has ${streamsByParticipant.size} entries`,
    );
    streamsByParticipant.forEach((stream, participantId) => {
      console.log(`Participant ${participantId} has stream ID ${stream.id}`);
    });

    // Log participants with state but no stream
    const participantsWithoutStreams = Array.from(
      participantStates.keys(),
    ).filter(id => !streamsByParticipant.has(id) && id !== currentUser?.uid);

    if (participantsWithoutStreams.length > 0) {
      console.log(
        `${participantsWithoutStreams.length} participants without streams:`,
      );
      participantsWithoutStreams.forEach(id => {
        console.log(`- Participant ${id} (no stream)`);
      });
    }
  }, [
    remoteStreams,
    streamsByParticipant,
    participantStates,
    currentUser?.uid,
  ]);

  return {
    localStream,
    setLocalStream,
    remoteStreams,
    isConnecting,
    connectionState,
    connectionError,
    connectionAttempts,
    participantStates,
    setParticipantStates,
    streamsByParticipant,
    setupAudioLevelDetection,
  };
};
