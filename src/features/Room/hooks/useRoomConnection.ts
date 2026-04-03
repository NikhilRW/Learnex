import {useState, useEffect, useCallback} from 'react';
import {Alert} from 'react-native';
import {getAuth} from '@react-native-firebase/auth';
import {logger} from 'shared/utils/logger';
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
        logger.error(
          'Error setting up audio level detection:',
          error,
          'RoomConnection',
        );
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

        logger.debug('Setting up meeting:', meeting.id, 'RoomConnection');
        logger.debug(
          'Participants in meeting:',
          meeting.participants,
          'RoomConnection',
        );

        // Join the meeting
        await meetingService.joinMeeting(meeting.id);

        // Initialize WebRTC
        try {
          const stream = await webRTCService.initLocalStream();
          logger.debug(
            'Local stream initialized:',
            stream.id,
            'RoomConnection',
          );
          stream.participantId = currentUser?.uid; // Ensure local stream has participantId
          setLocalStream(stream);

          // Set up audio level detection for local stream
          setupAudioLevelDetection(stream, currentUser?.uid || '');
        } catch (streamError) {
          logger.error(
            'Failed to initialize local stream:',
            streamError,
            'RoomConnection',
          );
          Alert.alert(
            'Camera/Microphone Access',
            'Could not access camera or microphone. Please check permissions.',
          );
        }

        // Subscribe to meeting updates with improved error handling
        meetingService.subscribeMeeting(
          meeting.id,
          (updatedMeeting: any) => {
            const {logger} = require('shared/utils/logger');
            logger.debug(
              'Meeting updated:',
              updatedMeeting.status,
              'RoomConnection',
            );
            logger.debug(
              'Updated participants:',
              updatedMeeting.participants,
              'RoomConnection',
            );

            // Check for new participants to connect to
            if (
              updatedMeeting.participants &&
              updatedMeeting.participants.length > 0
            ) {
              // Connect to any new participants
              webRTCService
                .connectToParticipants(meeting.id, updatedMeeting.participants)
                .catch(error => {
                  logger.error(
                    'Error connecting to participants:',
                    error,
                    'RoomConnection',
                  );
                });
            }

            if (updatedMeeting.status === 'completed') {
              onMeetingEnded();
            }
          },
          error => {
            logger.error(
              'Meeting subscription error:',
              error,
              'RoomConnection',
            );
            setConnectionState('failed');
            Alert.alert('Error', 'Failed to connect to meeting');
          },
        );

        // Subscribe to remote streams with improved error handling and stream management
        webRTCService.onRemoteStream(stream => {
          logger.debug(
            'Remote stream received with ID:',
            stream.id,
            'RoomConnection',
          );
          try {
            const participantId = stream.participantId;
            if (!participantId) {
              logger.error(
                'Received stream without participant ID',
                undefined,
                'RoomConnection',
              );
              return;
            }

            // Log before updating participant tracking
            logger.debug(
              'Before update - StreamsByParticipant map:',
              Array.from(streamsByParticipant.entries()).map(
                ([id, s]) => `${id}: ${s.id || 'unknown'}`,
              ),
              'RoomConnection',
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
            logger.error(
              'Error handling remote stream:',
              error,
              'RoomConnection',
            );
          }
        });

        // Improved stream removal that properly removes by participantId
        webRTCService.onRemoteStreamRemoved(participantId => {
          logger.debug(
            'Remote stream removed for participant:',
            participantId,
            'RoomConnection',
          );
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
            logger.error(
              'Error removing remote stream:',
              error,
              'RoomConnection',
            );
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
          logger.debug(
            `Participant state changed: ${participantId}`,
            state,
            'RoomConnection',
          );
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
            logger.error(
              'Error processing signaling message:',
              error,
              'RoomConnection',
            );
            if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
              logger.warn(
                'Retrying connection...',
                undefined,
                'RoomConnection',
              );
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
          logger.debug(
            'Connecting to existing participants:',
            meeting.participants,
            'RoomConnection',
          );
          await webRTCService.connectToParticipants(
            meeting.id,
            meeting.participants,
          );
        }

        setIsConnecting(false);
        setConnectionState('connected');
      } catch (error) {
        logger.error('Failed to setup meeting:', error, 'RoomConnection');
        setConnectionError((error as Error).message || 'Connection failed');
        setConnectionState('failed');

        if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
          logger.warn(
            `Retrying setup (attempt ${connectionAttempts + 1})`,
            undefined,
            'RoomConnection',
          );
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
    logger.debug(
      `Remote streams updated: ${remoteStreams.length} streams`,
      undefined,
      'RoomConnection',
    );
    logger.debug(
      `Participant states: ${participantStates.size} participants`,
      undefined,
      'RoomConnection',
    );

    remoteStreams.forEach((stream, index) => {
      logger.debug(
        `Stream ${index}: ID=${stream.id}, ParticipantID=${stream.participantId || 'none'}`,
        undefined,
        'RoomConnection',
      );
    });

    // Log the streamsByParticipant map
    logger.debug(
      `StreamsByParticipant map has ${streamsByParticipant.size} entries`,
      undefined,
      'RoomConnection',
    );
    streamsByParticipant.forEach((stream, participantId) => {
      logger.debug(
        `Participant ${participantId} has stream ID ${stream.id}`,
        undefined,
        'RoomConnection',
      );
    });

    // Log participants with state but no stream
    const participantsWithoutStreams = Array.from(
      participantStates.keys(),
    ).filter(id => !streamsByParticipant.has(id) && id !== currentUser?.uid);

    if (participantsWithoutStreams.length > 0) {
      logger.debug(
        `${participantsWithoutStreams.length} participants without streams:`,
        undefined,
        'RoomConnection',
      );
      participantsWithoutStreams.forEach(id => {
        logger.debug(
          `- Participant ${id} (no stream)`,
          undefined,
          'RoomConnection',
        );
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
