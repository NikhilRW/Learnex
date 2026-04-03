import {getAuth} from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream as RNMediaStream,
} from 'react-native-webrtc';
import {Platform, Alert, Linking} from 'react-native';
import {logger} from 'shared/utils/logger';
import {ParticipantState} from '../types';

// Extend MediaStream type to include participantId
interface MediaStream extends RNMediaStream {
  participantId?: string;
  participantName?: string;
  participantEmail?: string;
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'candidate' | 'reconnect';
  sender: string;
  receiver: string;
  payload: any;
  timestamp: any;
  retryCount?: number;
}

interface ParticipantInfo {
  displayName?: string;
  email?: string;
  uid: string;
}

export class WebRTCService {
  private meetingsCollection = collection(
    getFirestore(),
    'meetings',
  ) as FirebaseFirestoreTypes.CollectionReference<any>;
  private signalingCollection = collection(
    getFirestore(),
    'signaling',
  ) as FirebaseFirestoreTypes.CollectionReference<SignalingMessage>;
  private unsubscribeSignaling: (() => void) | null = null;
  private unsubscribeParticipantStates: (() => void) | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onRemoteStreamRemovedCallback: ((streamId: string) => void) | null =
    null;
  private onParticipantStateChangedCallback:
    | ((participantId: string, state: ParticipantState) => void)
    | null = null;
  private currentMeetingId: string | null = null;
  private activeRemoteStreams: Set<string> = new Set(); // Track active remote streams by participantId
  private iceServers = [
    {urls: 'stun:stun.l.google.com:19302'},
    {urls: 'stun:stun1.l.google.com:19302'},
    {urls: 'stun:stun2.l.google.com:19302'},
    {
      urls: 'turn:numb.viagenie.ca',
      username: 'webrtc@live.com',
      credential: 'muazkh',
    },
    {
      urls: 'turn:global.turn.twilio.com:3478?transport=udp',
      username:
        'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d',
      credential: 'w1uxM55V9yYoqyVFjt+KhTGz6wVFhehVk1nmtB8L3Fo=',
    },
  ];

  // Add interface for participant state
  private participantStates: Map<string, ParticipantState> = new Map();

  private MAX_SIGNALING_RETRIES = 3;
  private RETRY_DELAY = 2000; // 2 seconds
  private connectionState:
    | 'connecting'
    | 'connected'
    | 'disconnected'
    | 'failed' = 'disconnected';
  private reconnectionTimeout: NodeJS.Timeout | null = null;
  private connectionMonitorInterval: NodeJS.Timeout | null = null;
  // Add ICE connection timing variables
  private ICE_CONNECTION_TIMEOUT = 8000; // 8 seconds timeout for ICE connectivity
  private iceConnectionTimers: Map<string, NodeJS.Timeout> = new Map();

  // Add a buffer for pending ICE candidates
  private pendingIceCandidates: Map<string, RTCIceCandidate[]> = new Map();

  /**
   * Initialize local stream with enhanced video bitrate and audio quality settings
   */
  async initLocalStream(
    videoEnabled = true,
    audioEnabled = true,
  ): Promise<MediaStream> {
    try {
      // Enhanced constraints for better quality while optimizing bandwidth
      const constraints: any = {
        audio: audioEnabled
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
        video: videoEnabled
          ? {
              width: {min: 320, ideal: 640, max: 1280},
              height: {min: 240, ideal: 480, max: 720},
              frameRate: {min: 15, ideal: 24, max: 30},
              facingMode: 'user',
            }
          : false,
      };

      logger.debug(
        'Getting user media with constraints:',
        JSON.stringify(constraints),
        'WebRTCService',
      );
      const stream = await mediaDevices.getUserMedia(constraints);

      logger.debug(
        'Local stream initialized with tracks:',
        stream
          .getTracks()
          .map(t => `${t.kind}:${t.id} (enabled:${t.enabled})`)
          .join(', '),
        'WebRTCService',
      );

      this.localStream = stream;

      // Configure each track for optimal performance
      stream.getTracks().forEach(track => {
        if (track.kind === 'video' && track.getSettings) {
          const settings = track.getSettings();
          logger.debug('Video track settings:', settings, 'WebRTCService');
        }

        // Make sure audio tracks are enabled
        if (track.kind === 'audio') {
          track.enabled = true;
        }
      });

      return stream;
    } catch (error) {
      logger.error(
        'WebRTCService :: initLocalStream() ::',
        error,
        'WebRTCService',
      );
      throw error;
    }
  }

  /**
   * Set callback for remote stream events
   */
  onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback;
  }

  /**
   * Set callback for remote stream removed events
   */
  onRemoteStreamRemoved(callback: (streamId: string) => void): void {
    this.onRemoteStreamRemovedCallback = callback;
  }

  /**
   * Set callback for participant state changes
   */
  onParticipantStateChanged(
    callback: (participantId: string, state: ParticipantState) => void,
  ): void {
    this.onParticipantStateChangedCallback = callback;
  }

  /**
   * Create a peer connection for a specific participant
   */
  createPeerConnection(participantId: string): RTCPeerConnection {
    try {
      // Close any existing connection with this participant
      this.cleanupExistingPeerConnection(participantId);

      // Create new peer connection with improved configuration for media performance
      const peerConnection = new RTCPeerConnection({
        iceServers: this.iceServers,
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        // Add advanced options for better performance
        // @ts-ignore - TypeScript doesn't know about these properties
        sdpSemantics: 'unified-plan',
        // @ts-ignore
        iceCandidatePoolSize: 10,
      });

      // Enable video bandwidth optimization
      this.setMediaBitrates(peerConnection);

      // Add local tracks to the peer connection with proper track handling
      if (this.localStream) {
        const audioTracks = this.localStream.getAudioTracks();
        const videoTracks = this.localStream.getVideoTracks();

        logger.debug(
          `Adding ${audioTracks.length} audio and ${videoTracks.length} video tracks to peer connection`,
          undefined,
          'WebRTCService',
        );

        // First add audio tracks (higher priority than video)
        audioTracks.forEach(track => {
          if (this.localStream) {
            logger.debug(
              `Adding audio track: ${track.id} (enabled: ${track.enabled})`,
              undefined,
              'WebRTCService',
            );
            peerConnection.addTrack(track, this.localStream);
          }
        });

        // Then add video tracks
        videoTracks.forEach(track => {
          if (this.localStream) {
            logger.debug(
              `Adding video track: ${track.id} (enabled: ${track.enabled})`,
              undefined,
              'WebRTCService',
            );
            peerConnection.addTrack(track, this.localStream);
          }
        });
      } else {
        logger.warn(
          'No local stream available when creating peer connection',
          undefined,
          'WebRTCService',
        );
      }

      // Handle ICE candidates with improved error handling
      // @ts-ignore - TypeScript doesn't recognize these event handlers
      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          this.sendIceCandidate(
            event.candidate,
            this.currentMeetingId || '',
            participantId,
          ).catch(error => {
            logger.error(
              'Error sending ICE candidate:',
              error,
              'WebRTCService',
            );
          });
        } else {
          // Null candidate means ICE gathering is complete
          logger.debug(
            'ICE gathering complete for peer:',
            participantId,
            'WebRTCService',
          );
        }
      };

      // Add handler for ICE gathering state changes
      // @ts-ignore
      peerConnection.onicegatheringstatechange = () => {
        logger.debug(
          `ICE gathering state changed to ${peerConnection.iceGatheringState} for ${participantId}`,
          undefined,
          'WebRTCService',
        );
      };

      // Handle remote tracks with improved stream handling
      // @ts-ignore - TypeScript doesn't recognize these event handlers
      peerConnection.ontrack = event => {
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];

          // Ensure stream has proper participant identification
          remoteStream.participantId = participantId;

          // Log track information
          logger.debug(
            `Received remote track: ${event.track.kind} (enabled: ${event.track.enabled})`,
            undefined,
            'WebRTCService',
          );

          // Fix for Safari: explicitly enable audio tracks
          if (event.track.kind === 'audio') {
            event.track.enabled = true;
          }

          // Get participant information
          this.getUserInfo(participantId)
            .then(userInfo => {
              if (userInfo) {
                remoteStream.participantName = userInfo.displayName;
                remoteStream.participantEmail = userInfo.email;
              }
            })
            .catch(error => {
              logger.error('Error getting user info:', error, 'WebRTCService');
            });

          // Track this stream as active
          this.activeRemoteStreams.add(participantId);

          // Notify about new remote stream
          if (this.onRemoteStreamCallback) {
            logger.debug(
              `Sending remote stream to UI, track count: ${
                remoteStream.getTracks().length
              }`,
              undefined,
              'WebRTCService',
            );
            this.onRemoteStreamCallback(remoteStream);
          }
        }
      };

      // Handle connection state changes with improved logging
      // @ts-ignore - TypeScript doesn't recognize these event handlers
      peerConnection.onconnectionstatechange = () => {
        logger.debug(
          `Connection state changed to ${peerConnection.connectionState} for participant ${participantId}`,
          undefined,
          'WebRTCService',
        );

        if (peerConnection.connectionState === 'connected') {
          logger.debug(
            `Successfully connected to ${participantId}`,
            undefined,
            'WebRTCService',
          );
          // Re-check that all tracks are added after connection is established
          this.ensureTracksAreAdded(peerConnection);

          // Clear any ICE connection timeout when successfully connected
          this.clearIceConnectionTimer(participantId);
        }
      };

      // Monitor ICE connection state more closely
      // @ts-ignore
      peerConnection.oniceconnectionstatechange = () => {
        logger.debug(
          `ICE connection state changed to ${peerConnection.iceConnectionState} for ${participantId}`,
          undefined,
          'WebRTCService',
        );

        if (peerConnection.iceConnectionState === 'checking') {
          // Start a timer when ICE connection checking begins
          this.startIceConnectionTimer(peerConnection, participantId);
        } else if (
          peerConnection.iceConnectionState === 'connected' ||
          peerConnection.iceConnectionState === 'completed'
        ) {
          // Clear timer when connection is established
          this.clearIceConnectionTimer(participantId);
        } else if (peerConnection.iceConnectionState === 'disconnected') {
          logger.warn(
            'ICE disconnected, attempting recovery...',
            undefined,
            'WebRTCService',
          );
          // Check if ICE restart is needed
          this.restartIceIfNeeded(peerConnection, participantId);
        } else if (peerConnection.iceConnectionState === 'failed') {
          logger.error(
            `ICE connection failed for ${participantId}, attempting full reconnection`,
            undefined,
            'WebRTCService',
          );
          this.handleIceConnectionFailure(peerConnection, participantId);
        }
      };

      this.peerConnections.set(participantId, peerConnection);
      return peerConnection;
    } catch (error) {
      logger.error(
        'WebRTCService :: createPeerConnection() ::',
        error,
        'WebRTCService',
      );
      throw error;
    }
  }

  /**
   * Start a timer to monitor ICE connection progress
   */
  private startIceConnectionTimer(
    peerConnection: RTCPeerConnection,
    participantId: string,
  ): void {
    // Clear any existing timer first
    this.clearIceConnectionTimer(participantId);

    logger.debug(
      `Starting ICE connection timer for ${participantId}`,
      undefined,
      'WebRTCService',
    );

    // Set a new timer
    const timer = setTimeout(() => {
      // Check if the connection is still in 'checking' state after timeout
      if (peerConnection.iceConnectionState === 'checking') {
        logger.warn(
          `ICE connection timeout for ${participantId}, trying to improve connection`,
          undefined,
          'WebRTCService',
        );

        // Try to improve the connection
        this.handleIceConnectionTimeout(peerConnection, participantId);
      }
    }, this.ICE_CONNECTION_TIMEOUT);

    // Store the timer
    this.iceConnectionTimers.set(participantId, timer);
  }

  /**
   * Clear ICE connection timer
   */
  private clearIceConnectionTimer(participantId: string): void {
    const timer = this.iceConnectionTimers.get(participantId);
    if (timer) {
      clearTimeout(timer);
      this.iceConnectionTimers.delete(participantId);
    }
  }

  /**
   * Handle ICE connection timeout
   */
  private async handleIceConnectionTimeout(
    peerConnection: RTCPeerConnection,
    participantId: string,
  ): Promise<void> {
    if (!this.currentMeetingId) return;

    try {
      // First approach: Try ICE restart
      await this.restartIceIfNeeded(peerConnection, participantId);

      // Set another timer to check if the restart helped
      setTimeout(() => {
        if (
          peerConnection.iceConnectionState !== 'connected' &&
          peerConnection.iceConnectionState !== 'completed'
        ) {
          // ICE restart didn't help, try full connection reset
          logger.warn(
            `ICE restart didn't resolve connection issues with ${participantId}, performing full reset`,
            undefined,
            'WebRTCService',
          );
          this.handleIceConnectionFailure(peerConnection, participantId);
        }
      }, 5000); // Give 5 seconds for the ICE restart to take effect
    } catch (error) {
      logger.error(
        'Error handling ICE connection timeout:',
        error,
        'WebRTCService',
      );
    }
  }

  /**
   * Handle ICE connection failure with more aggressive recovery
   */
  private async handleIceConnectionFailure(
    peerConnection: RTCPeerConnection,
    participantId: string,
  ): Promise<void> {
    if (!this.currentMeetingId) return;

    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) return;

      logger.debug(
        `Recreating connection with ${participantId} due to ICE failure`,
        undefined,
        'WebRTCService',
      );

      // Clean up the existing connection
      this.cleanupExistingPeerConnection(participantId);

      // Create a new peer connection
      const newPeerConnection = this.createPeerConnection(participantId);

      // Only the peer with the lower ID initiates the connection to avoid conflicts
      if (userId < participantId) {
        // Create and send a new offer
        await this.createOffer(
          newPeerConnection,
          this.currentMeetingId,
          participantId,
        );
      } else {
        // For the peer with the higher ID, send a reconnect message to prompt the other peer to create an offer
        await this.sendReconnectMessage(this.currentMeetingId, participantId);
      }
    } catch (error) {
      logger.error(
        'Error handling ICE connection failure:',
        error,
        'WebRTCService',
      );
    }
  }

  /**
   * Clean up existing peer connection if it exists
   */
  private cleanupExistingPeerConnection(participantId: string): void {
    const existingConnection = this.peerConnections.get(participantId);
    if (existingConnection) {
      logger.debug(
        `Cleaning up existing connection for ${participantId}`,
        undefined,
        'WebRTCService',
      );
      try {
        existingConnection.close();
      } catch (e) {
        logger.error(
          'Error closing existing peer connection:',
          e,
          'WebRTCService',
        );
      }
      this.peerConnections.delete(participantId);
      // Clear any pending ICE candidates for this participant
      this.pendingIceCandidates.delete(participantId);
    }
  }

  /**
   * Handle peer disconnection with improved state cleanup
   */
  private async handlePeerDisconnection(participantId: string): Promise<void> {
    try {
      logger.debug(
        `Peer disconnected: ${participantId}`,
        undefined,
        'WebRTCService',
      );

      // Close and remove peer connection
      const peerConnection = this.peerConnections.get(participantId);
      if (peerConnection) {
        peerConnection.close();
        this.peerConnections.delete(participantId);
      }

      // Mark stream as removed
      this.activeRemoteStreams.delete(participantId);

      // Notify about stream removal
      if (this.onRemoteStreamRemovedCallback) {
        this.onRemoteStreamRemovedCallback(participantId);
      }

      // Remove participant state
      this.participantStates.delete(participantId);

      // If we have a meeting ID, clean up the participant state in Firestore
      if (this.currentMeetingId && participantId) {
        try {
          await deleteDoc(
            doc(
              collection(
                doc(this.meetingsCollection, this.currentMeetingId),
                'participantStates',
              ),
              participantId,
            ),
          );
        } catch (error) {
          logger.error(
            'Error removing participant state:',
            error,
            'WebRTCService',
          );
        }
      }
    } catch (error) {
      logger.error(
        'WebRTCService :: handlePeerDisconnection() ::',
        error,
        'WebRTCService',
      );
    }
  }

  /**
   * Connect to multiple participants
   */
  async connectToParticipants(
    meetingId: string,
    participantIds: string[],
  ): Promise<void> {
    try {
      this.currentMeetingId = meetingId;

      // Filter out current user from list of participants to connect to
      const currentUserId = getAuth().currentUser?.uid;
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      // Log connection attempt for debugging
      logger.debug(
        `Connecting to ${participantIds.length} participants in meeting ${meetingId}`,
        undefined,
        'WebRTCService',
      );
      logger.debug('Participant IDs:', participantIds, 'WebRTCService');

      // Filter out current user and already connected peers
      const filteredParticipantIds = participantIds.filter(
        id => id !== currentUserId && !this.peerConnections.has(id),
      );

      logger.debug(
        `After filtering, connecting to ${filteredParticipantIds.length} participants`,
        undefined,
        'WebRTCService',
      );

      // Check if we have participants to connect to
      if (filteredParticipantIds.length === 0) {
        logger.debug(
          'No new participants to connect to',
          undefined,
          'WebRTCService',
        );
        return;
      }

      // Update connection state
      this.updateConnectionState('connecting');

      // Start connection monitoring
      this.startConnectionMonitoring();

      // Create offers for each participant (in parallel)
      const connectionPromises = filteredParticipantIds.map(
        async participantId => {
          try {
            // Create peer connection
            const peerConnection = this.createPeerConnection(participantId);

            // Create and send offer
            await this.createOffer(peerConnection, meetingId, participantId);

            // Add to participant states if not already there
            if (!this.participantStates.has(participantId)) {
              // Initialize with default state
              this.participantStates.set(participantId, {
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
                lastUpdated: new Date(),
              });

              // Notify any listeners about the new participant
              if (this.onParticipantStateChangedCallback) {
                this.onParticipantStateChangedCallback(
                  participantId,
                  this.participantStates.get(participantId)!,
                );
              }
            }

            logger.debug(
              `Successfully initiated connection to ${participantId}`,
              undefined,
              'WebRTCService',
            );
            return true;
          } catch (error) {
            logger.error(
              `Failed to connect to participant ${participantId}:`,
              error,
              'WebRTCService',
            );
            // Don't throw here, allow other connections to proceed
            return false;
          }
        },
      );

      // Wait for all connection attempts to complete
      await Promise.all(connectionPromises);

      // Update state based on connection results
      if (this.peerConnections.size > 0) {
        this.updateConnectionState('connected');
      } else if (filteredParticipantIds.length > 0) {
        logger.warn(
          'Failed to connect to any participants',
          undefined,
          'WebRTCService',
        );
        this.updateConnectionState('failed');
      }
    } catch (error) {
      logger.error(
        'WebRTCService :: connectToParticipants() ::',
        error,
        'WebRTCService',
      );
      this.updateConnectionState('failed');
      throw error;
    }
  }

  /**
   * Start monitoring connections to detect and fix issues
   */
  private startConnectionMonitoring(): void {
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
    }

    this.connectionMonitorInterval = setInterval(() => {
      if (!this.currentMeetingId) return;

      // Check for connections that need to be reestablished
      this.peerConnections.forEach((connection, participantId) => {
        const connectionState = connection.iceConnectionState;
        if (
          connectionState === 'disconnected' ||
          connectionState === 'failed'
        ) {
          logger.warn(
            `Detected problematic connection with ${participantId}, state: ${connectionState}`,
            undefined,
            'WebRTCService',
          );
          this.handlePeerDisconnection(participantId);

          // Attempt to reconnect
          if (this.currentMeetingId) {
            const peerConnection = this.createPeerConnection(participantId);
            const userId = getAuth().currentUser?.uid;
            if (userId && userId > participantId) {
              this.createOffer(
                peerConnection,
                this.currentMeetingId,
                participantId,
              ).catch(e =>
                logger.error(
                  'Error recreating connection:',
                  e,
                  'WebRTCService',
                ),
              );
            }
          }
        }
      });
    }, 10000); // Check every 10 seconds
  }

  /**
   * Create an offer for a peer connection
   */
  async createOffer(
    peerConnection: RTCPeerConnection,
    meetingId: string,
    receiverId: string,
  ): Promise<void> {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Check the signaling state before proceeding
      if (peerConnection.signalingState !== 'stable') {
        logger.warn(
          `Cannot create offer in signaling state: ${peerConnection.signalingState}`,
          undefined,
          'WebRTCService',
        );
        return;
      }

      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      // Check again before setting local description
      if (peerConnection.signalingState !== 'stable') {
        logger.warn(
          `Signaling state changed during offer creation: ${peerConnection.signalingState}`,
          undefined,
          'WebRTCService',
        );
        return;
      }

      await peerConnection.setLocalDescription(offer);

      await this.sendSignalingMessage({
        type: 'offer',
        sender: userId,
        receiver: receiverId,
        payload: offer,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('WebRTCService :: createOffer() ::', error, 'WebRTCService');
      throw error;
    }
  }

  /**
   * Create an answer for a peer connection
   */
  async createAnswer(
    peerConnection: RTCPeerConnection,
    meetingId: string,
    receiverId: string,
  ): Promise<void> {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      await this.sendSignalingMessage({
        type: 'answer',
        sender: userId,
        receiver: receiverId,
        payload: answer,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(
        'WebRTCService :: createAnswer() ::',
        error,
        'WebRTCService',
      );
      throw error;
    }
  }

  /**
   * Add ICE candidate received from remote peer
   */
  async addIceCandidate(
    peerConnection: RTCPeerConnection,
    candidate: RTCIceCandidate,
  ): Promise<void> {
    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      logger.error(
        'WebRTCService :: addIceCandidate() ::',
        error,
        'WebRTCService',
      );
      throw error;
    }
  }

  /**
   * Listen for signaling messages with improved error handling and logging
   */
  listenForSignalingMessages(
    meetingId: string,
    onSignalingMessage: (message: SignalingMessage) => void,
  ): void {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        logger.error(
          'Cannot listen for messages: User not authenticated',
          undefined,
          'WebRTCService',
        );
        return;
      }

      // Store meeting ID
      this.currentMeetingId = meetingId;
      logger.debug(
        `Setting up signaling listener for meeting ${meetingId}, user ${userId}`,
      );

      // Subscribe to participant states if not already
      if (!this.unsubscribeParticipantStates) {
        this.subscribeToParticipantStates(meetingId);
      }

      // Clear any existing subscription
      if (this.unsubscribeSignaling) {
        this.unsubscribeSignaling();
        this.unsubscribeSignaling = null;
      }

      // Create new subscription with error handling
      // TEMPORARY FIX: Remove orderBy to avoid composite index requirement
      this.unsubscribeSignaling = onSnapshot(
        query(
          this.signalingCollection,
          where('meetingId', '==', meetingId),
          where('receiver', '==', userId),
          // Removed: orderBy('timestamp', 'asc')
        ),
        async snapshot => {
          try {
            // Get new messages
            const changes = snapshot.docChanges();
            logger.debug(
              `Received ${changes.length} signaling messages`,
              undefined,
              'WebRTCService',
            );

            // Process new messages
            const processedMessages: SignalingMessage[] = [];
            for (const change of changes) {
              if (change.type === 'added') {
                const message = change.doc.data() as SignalingMessage;
                logger.debug(
                  `Processing signaling message: ${message.type} from ${message.sender}`,
                  undefined,
                  'WebRTCService',
                );

                // Add message to list of processed messages
                processedMessages.push(message);

                // Add sender to participant states if not already present
                const senderId = message.sender;
                if (
                  senderId !== userId &&
                  !this.participantStates.has(senderId)
                ) {
                  // Initialize with default state
                  this.participantStates.set(senderId, {
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
                    lastUpdated: new Date(),
                  });

                  // Notify listeners
                  if (this.onParticipantStateChangedCallback) {
                    this.onParticipantStateChangedCallback(
                      senderId,
                      this.participantStates.get(senderId)!,
                    );
                  }

                  logger.debug(
                    `Added new participant: ${senderId}`,
                    undefined,
                    'WebRTCService',
                  );
                }

                // Delete the message after processing to avoid processing it again
                await deleteDoc(change.doc.ref).catch(error => {
                  logger.error(
                    `Error deleting signaling message: ${error}`,
                    undefined,
                    'WebRTCService',
                  );
                });
              }
            }

            // Process messages - sort manually since we removed orderBy
            if (processedMessages.length > 0) {
              // Sort by timestamp
              processedMessages.sort((a, b) => {
                const aTime =
                  a.timestamp?.toDate?.() ||
                  new Date(a.timestamp) ||
                  new Date(0);
                const bTime =
                  b.timestamp?.toDate?.() ||
                  new Date(b.timestamp) ||
                  new Date(0);
                return aTime.getTime() - bTime.getTime();
              });

              // Process each message
              processedMessages.forEach(message => {
                onSignalingMessage(message);
              });
            }
          } catch (error) {
            logger.error(
              'Error processing signaling messages:',
              error,
              'WebRTCService',
            );
          }
        },
        error => {
          logger.error('Error in signaling listener:', error, 'WebRTCService');
          const err = error as unknown as {code: string};
          // Check if this is a Firestore index error
          if (
            err?.code === 'failed-precondition' &&
            error.message &&
            error.message.includes('index')
          ) {
            // Handle the Firestore index error using our new helper
            this.handleFirebaseIndexError(error);
          } else {
            logger.debug(
              'ERROR DETAILS:',
              JSON.stringify(error),
              'WebRTCService',
            );
          }

          // Attempt to reestablish the listener with a simplified query after a delay
          setTimeout(() => {
            if (this.currentMeetingId === meetingId) {
              logger.warn(
                'Attempting to reestablish signaling listener...',
                undefined,
                'WebRTCService',
              );
              this.listenForSignalingMessages(meetingId, onSignalingMessage);
            }
          }, 5000);
        },
      );
    } catch (error) {
      logger.error(
        'WebRTCService :: listenForSignalingMessages() ::',
        error,
        'WebRTCService',
      );
    }
  }

  /**
   * Process signaling message
   */
  async processSignalingMessage(
    message: SignalingMessage,
    meetingId: string,
  ): Promise<void> {
    try {
      const {sender, type, payload} = message;

      // Get or create peer connection for sender
      let peerConnection = this.peerConnections.get(sender);
      if (!peerConnection) {
        peerConnection = this.createPeerConnection(sender);
      }

      switch (type) {
        case 'offer':
          try {
            // Check if we can accept the offer
            if (peerConnection.signalingState === 'have-local-offer') {
              // If both peers tried to create an offer at the same time,
              // we need to handle this collision.
              // The peer with the lower ID will win and the other will rollback
              const myUserId = getAuth().currentUser?.uid;
              if (myUserId && myUserId < sender) {
                logger.warn(
                  'Signaling collision detected. Rolling back local description.',
                  undefined,
                  'WebRTCService',
                );
                await peerConnection.setLocalDescription({
                  type: 'rollback',
                  sdp: '', // Required by RTCSessionDescriptionInit
                });
              } else {
                logger.warn(
                  'Signaling collision detected. Expecting remote peer to rollback.',
                  undefined,
                  'WebRTCService',
                );
                return; // Wait for the remote peer to rollback and try again
              }
            }

            // Now safe to set remote description
            // Ensure audio and video tracks are properly processed
            if (payload.sdp) {
              let sdp = payload.sdp;

              // Ensure audio tracks are enabled
              sdp = sdp.replace(
                /(m=audio[\s\S]*?)(a=inactive)/g,
                '$1a=sendrecv',
              );
              sdp = sdp.replace(
                /(m=audio[\s\S]*?)(a=recvonly)/g,
                '$1a=sendrecv',
              );

              const enhancedPayload = {...payload, sdp};
              await peerConnection.setRemoteDescription(
                new RTCSessionDescription(enhancedPayload),
              );
            } else {
              await peerConnection.setRemoteDescription(
                new RTCSessionDescription(payload),
              );
            }

            // Process any pending ICE candidates
            await this.processPendingIceCandidates(sender, peerConnection);

            await this.createAnswer(peerConnection, meetingId, sender);
          } catch (error) {
            logger.error('Error handling offer:', error, 'WebRTCService');

            // Attempt recovery by recreating the peer connection
            this.cleanupExistingPeerConnection(sender);
            peerConnection = this.createPeerConnection(sender);

            // Try again with the new connection
            await peerConnection.setRemoteDescription(
              new RTCSessionDescription(payload),
            );
            // Process any pending ICE candidates
            await this.processPendingIceCandidates(sender, peerConnection);

            await this.createAnswer(peerConnection, meetingId, sender);
          }
          break;

        case 'answer':
          try {
            if (peerConnection.signalingState === 'have-local-offer') {
              // Process answer SDP to ensure audio is enabled
              if (payload.sdp) {
                let sdp = payload.sdp;

                // Ensure audio tracks are enabled
                sdp = sdp.replace(
                  /(m=audio[\s\S]*?)(a=inactive)/g,
                  '$1a=sendrecv',
                );
                sdp = sdp.replace(
                  /(m=audio[\s\S]*?)(a=recvonly)/g,
                  '$1a=sendrecv',
                );

                const enhancedPayload = {...payload, sdp};
                await peerConnection.setRemoteDescription(
                  new RTCSessionDescription(enhancedPayload),
                );
              } else {
                await peerConnection.setRemoteDescription(
                  new RTCSessionDescription(payload),
                );
              }

              // Process any pending ICE candidates after setting remote description
              await this.processPendingIceCandidates(sender, peerConnection);
            } else {
              logger.warn(
                `Cannot set remote answer in state: ${peerConnection.signalingState}`,
                undefined,
                'WebRTCService',
              );
            }
          } catch (error) {
            logger.error('Error handling answer:', error, 'WebRTCService');
          }
          break;

        case 'candidate':
          try {
            if (peerConnection.remoteDescription) {
              await this.addIceCandidate(
                peerConnection,
                new RTCIceCandidate(payload),
              );
            } else {
              logger.warn(
                'Received ICE candidate but no remote description set, buffering candidate',
                undefined,
                'WebRTCService',
              );
              // Buffer this candidate for later
              this.bufferIceCandidate(sender, new RTCIceCandidate(payload));
            }
          } catch (error) {
            logger.error(
              'Error handling ICE candidate:',
              error,
              'WebRTCService',
            );
          }
          break;
      }
    } catch (error) {
      logger.error(
        'WebRTCService :: processSignalingMessage() ::',
        error,
        'WebRTCService',
      );
    }
  }

  /**
   * Buffer ICE candidate for later processing
   */
  private bufferIceCandidate(
    participantId: string,
    candidate: RTCIceCandidate,
  ): void {
    if (!this.pendingIceCandidates.has(participantId)) {
      this.pendingIceCandidates.set(participantId, []);
    }

    logger.debug(
      `Buffering ICE candidate for ${participantId}`,
      undefined,
      'WebRTCService',
    );
    this.pendingIceCandidates.get(participantId)?.push(candidate);
  }

  /**
   * Process any pending ICE candidates
   */
  private async processPendingIceCandidates(
    participantId: string,
    peerConnection: RTCPeerConnection,
  ): Promise<void> {
    const candidates = this.pendingIceCandidates.get(participantId);
    if (candidates && candidates.length > 0) {
      logger.debug(
        `Processing ${candidates.length} buffered ICE candidates for ${participantId}`,
        undefined,
        'WebRTCService',
      );

      const promises = candidates.map(candidate =>
        this.addIceCandidate(peerConnection, candidate).catch(err =>
          logger.error(
            'Error adding buffered ICE candidate:',
            err,
            'WebRTCService',
          ),
        ),
      );

      await Promise.all(promises);
      this.pendingIceCandidates.delete(participantId); // Clear buffer after processing
    }
  }

  /**
   * Send ICE candidate to remote peer
   */
  async sendIceCandidate(
    candidate: RTCIceCandidate,
    meetingId: string,
    receiverId: string,
  ): Promise<void> {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      await this.sendSignalingMessage({
        type: 'candidate',
        sender: userId,
        receiver: receiverId,
        payload: candidate,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(
        'WebRTCService :: sendIceCandidate() ::',
        error,
        'WebRTCService',
      );
      throw error;
    }
  }

  /**
   * Update local participant state
   */
  async updateLocalParticipantState(
    meetingId: string,
    state: Partial<ParticipantState>,
  ): Promise<void> {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId || !meetingId) {
        throw new Error('User not authenticated or meeting ID not provided');
      }

      // Store meeting ID for reference
      this.currentMeetingId = meetingId;

      // Get current state or create default
      const currentState = this.participantStates.get(userId) || {
        isAudioEnabled: true,
        isVideoEnabled: true,
        isHandRaised: false,
        isScreenSharing: false,
        // Initialize new gesture states
        isThumbsUp: false,
        isThumbsDown: false,
        isClapping: false,
        isWaving: false,
        isSpeaking: false,
        reactionTimestamp: null,
        lastUpdated: new Date(),
      };

      // Update state with new values
      const newState: ParticipantState = {
        ...currentState,
        ...state,
        lastUpdated: new Date(),
      };

      // Auto-expire reactions after 5 seconds if it's a reaction update
      if (
        state.isThumbsUp ||
        state.isThumbsDown ||
        state.isClapping ||
        state.isWaving
      ) {
        newState.reactionTimestamp = new Date();

        // Schedule auto-expiration of reaction
        setTimeout(async () => {
          // Only clear if this was the last reaction set
          const currentParticipantState = this.participantStates.get(userId);
          if (
            currentParticipantState?.reactionTimestamp ===
            newState.reactionTimestamp
          ) {
            await this.updateLocalParticipantState(meetingId, {
              isThumbsUp: false,
              isThumbsDown: false,
              isClapping: false,
              isWaving: false,
              reactionTimestamp: null,
            });
          }
        }, 5000); // 5 seconds
      }

      // Update local cache
      this.participantStates.set(userId, newState);

      // Update in Firestore
      await setDoc(
        doc(
          collection(
            doc(this.meetingsCollection, meetingId),
            'participantStates',
          ),
          userId,
        ),
        newState,
        {merge: true},
      );
    } catch (error) {
      logger.error(
        'WebRTCService :: updateLocalParticipantState() ::',
        error,
        'WebRTCService',
      );
      throw error;
    }
  }

  /**
   * Subscribe to participant state changes
   */
  subscribeToParticipantStates(meetingId: string): void {
    try {
      if (this.unsubscribeParticipantStates) {
        this.unsubscribeParticipantStates();
      }

      // Store meeting ID for reference
      this.currentMeetingId = meetingId;

      this.unsubscribeParticipantStates = onSnapshot(
        collection(
          doc(this.meetingsCollection, meetingId),
          'participantStates',
        ),
        snapshot => {
          snapshot.docChanges().forEach((change: any) => {
            const participantId = change.doc.id;
            const state = change.doc.data() as ParticipantState;

            if (change.type === 'added' || change.type === 'modified') {
              // Update local cache
              this.participantStates.set(participantId, state);

              // Notify callback
              if (this.onParticipantStateChangedCallback) {
                this.onParticipantStateChangedCallback(participantId, state);
              }
            } else if (change.type === 'removed') {
              // Remove from local cache
              this.participantStates.delete(participantId);
            }
          });
        },
        error => {
          logger.error(
            'WebRTCService :: Error in participant states listener:',
            error,
            'WebRTCService',
          );
        },
      );
    } catch (error) {
      logger.error(
        'WebRTCService :: subscribeToParticipantStates() ::',
        error,
        'WebRTCService',
      );
    }
  }

  /**
   * Get participant state
   */
  getParticipantState(participantId: string): ParticipantState | null {
    return this.participantStates.get(participantId) || null;
  }

  /**
   * Get all participant states
   */
  getAllParticipantStates(): Map<string, ParticipantState> {
    return new Map(this.participantStates);
  }

  /**
   * Stop listening for signaling messages and close all connections
   */
  async cleanup(): Promise<void> {
    logger.debug('WebRTCService :: cleanup()', undefined, 'WebRTCService');

    // Get current user ID and meeting ID for cleanup
    const userId = getAuth().currentUser?.uid;
    const meetingId = this.currentMeetingId;

    // Clear connection monitoring
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
      this.connectionMonitorInterval = null;
    }

    // Clear reconnection timeout
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
      this.reconnectionTimeout = null;
    }

    // Clear all ICE connection timers
    this.iceConnectionTimers.forEach(timer => {
      clearTimeout(timer);
    });
    this.iceConnectionTimers.clear();

    // Close and clean up all peer connections
    this.peerConnections.forEach((connection, participantId) => {
      try {
        logger.debug(
          `Closing connection to ${participantId}`,
          undefined,
          'WebRTCService',
        );
        connection.close();
      } catch (e) {
        logger.error(
          `Error closing connection to ${participantId}:`,
          e,
          'WebRTCService',
        );
      }
    });
    this.peerConnections.clear();
    this.activeRemoteStreams.clear();

    // Clear the pending ICE candidates
    this.pendingIceCandidates.clear();

    // Clean up local stream
    if (this.localStream) {
      try {
        this.localStream.getTracks().forEach(track => {
          track.stop();
        });
      } catch (e) {
        logger.error('Error stopping local tracks:', e, 'WebRTCService');
      }
      this.localStream = null;
    }

    // Unsubscribe from signaling
    if (this.unsubscribeSignaling) {
      this.unsubscribeSignaling();
      this.unsubscribeSignaling = null;
    }

    // Unsubscribe from participant states
    if (this.unsubscribeParticipantStates) {
      this.unsubscribeParticipantStates();
      this.unsubscribeParticipantStates = null;
    }

    // Delete the current user's participant state in Firestore
    if (userId && meetingId) {
      logger.debug(
        `Deleting participant state for ${userId} in meeting ${meetingId}`,
        undefined,
        'WebRTCService',
      );
      try {
        await deleteDoc(
          doc(
            collection(
              doc(this.meetingsCollection, meetingId),
              'participantStates',
            ),
            userId,
          ),
        );
      } catch (error) {
        logger.error(
          'Error deleting participant state:',
          error,
          'WebRTCService',
        );
      }
    }

    // Clear local participant states
    this.participantStates.clear();

    this.currentMeetingId = null;
    this.connectionState = 'disconnected';
  }

  private async sendSignalingMessage(
    message: SignalingMessage,
    retryCount = 0,
  ): Promise<void> {
    try {
      // Ensure timestamp is present (fixes the missing timestamp in reconnect messages)
      if (!message.timestamp) {
        message.timestamp = Date.now();
      }

      logger.debug(
        `Sending signaling message: ${message.type} to ${message.receiver}`,
        undefined,
        'WebRTCService',
      );

      await addDoc(this.signalingCollection, {
        ...message,
        retryCount,
        meetingId: this.currentMeetingId, // Ensure meetingId is always included
        timestamp: serverTimestamp(),
      });

      logger.debug(
        `Successfully sent ${message.type} message to ${message.receiver}`,
        undefined,
        'WebRTCService',
      );
    } catch (error) {
      logger.error(
        `Failed to send signaling message (attempt ${retryCount + 1}):`,
        error,
        'WebRTCService',
      );

      // Log detailed error information
      if (error instanceof Error) {
        logger.error(
          `Error code: ${(error as any).code}, message: ${error.message}`,
          undefined,
          'WebRTCService',
        );
      }

      if (retryCount < this.MAX_SIGNALING_RETRIES) {
        logger.warn(
          `Retrying in ${this.RETRY_DELAY}ms...`,
          undefined,
          'WebRTCService',
        );
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        await this.sendSignalingMessage(message, retryCount + 1);
      } else {
        throw new Error(
          `Failed to send signaling message after ${this.MAX_SIGNALING_RETRIES} attempts`,
        );
      }
    }
  }

  private updateConnectionState(
    newState: 'connecting' | 'connected' | 'disconnected' | 'failed',
  ): void {
    this.connectionState = newState;
    logger.debug(
      `Connection state changed to: ${newState}`,
      undefined,
      'WebRTCService',
    );

    if (newState === 'disconnected' || newState === 'failed') {
      this.handleDisconnection();
    }
  }

  private handleDisconnection(): void {
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
    }

    this.reconnectionTimeout = setTimeout(async () => {
      if (
        this.connectionState === 'disconnected' ||
        this.connectionState === 'failed'
      ) {
        try {
          logger.warn('Attempting to reconnect...', undefined, 'WebRTCService');
          await this.reconnect();
        } catch (error) {
          logger.error('Reconnection failed:', error, 'WebRTCService');
          this.updateConnectionState('failed');
        }
      }
    }, this.RETRY_DELAY);
  }

  private async reconnect(): Promise<void> {
    if (!this.currentMeetingId) return;

    try {
      this.updateConnectionState('connecting');

      // Notify other participants about reconnection attempt
      const userId = getAuth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      logger.debug(
        'Beginning reconnection process...',
        undefined,
        'WebRTCService',
      );

      // Clean up existing connections completely
      this.peerConnections.forEach(connection => {
        connection.close();
      });
      this.peerConnections.clear();

      // Clear all pending ICE candidates
      this.pendingIceCandidates.clear();

      // Clear all ICE connection timers
      this.iceConnectionTimers.forEach(timer => {
        clearTimeout(timer);
      });
      this.iceConnectionTimers.clear();

      // Send reconnect signal
      await this.sendSignalingMessage({
        type: 'reconnect',
        sender: userId,
        receiver: 'all',
        payload: {meetingId: this.currentMeetingId},
        timestamp: Date.now(),
      });

      // Get fresh list of participants
      const meetingDoc = await getDoc(
        doc(this.meetingsCollection, this.currentMeetingId),
      );
      const meetingData = meetingDoc.data() as any;

      if (meetingData?.participants) {
        logger.debug(
          `Reconnecting to ${meetingData.participants.length} participants`,
          undefined,
          'WebRTCService',
        );

        // Ensure local media stream is still valid
        if (
          !this.localStream ||
          this.localStream.getTracks().some(track => !track.enabled)
        ) {
          logger.debug(
            'Reinitializing local stream for reconnection',
            undefined,
            'WebRTCService',
          );
          try {
            await this.initLocalStream();
          } catch (error) {
            logger.error(
              'Failed to reinitialize local stream during reconnection:',
              error,
              'WebRTCService',
            );
          }
        }

        // Reconnect to participants
        await this.connectToParticipants(
          this.currentMeetingId,
          meetingData.participants,
        );
      } else {
        logger.warn(
          'No participants found in meeting for reconnection',
          undefined,
          'WebRTCService',
        );
      }

      this.updateConnectionState('connected');
    } catch (error) {
      logger.error('Reconnection failed:', error, 'WebRTCService');
      this.updateConnectionState('failed');
      throw error;
    }
  }

  /**
   * Set participant information on local stream
   */
  setLocalParticipantInfo(info: ParticipantInfo): void {
    if (this.localStream) {
      // @ts-ignore - Adding custom properties to MediaStream
      this.localStream.participantName = info.displayName || 'Unknown User';
      // @ts-ignore - Adding custom properties to MediaStream
      this.localStream.participantEmail = info.email;
      // @ts-ignore - Adding custom properties to MediaStream
      this.localStream.participantId = info.uid;

      logger.debug(
        `Local stream updated with participant info: ${info.displayName} (${info.email})`,
        undefined,
        'WebRTCService',
      );
    }
  }

  /**
   * Get user information from Firestore
   */
  private async getUserInfo(userId: string): Promise<ParticipantInfo | null> {
    try {
      const userDoc = await getDoc(
        doc(collection(getFirestore(), 'users'), userId),
      );

      if (userDoc.exists()) {
        const userData = userDoc.data() as {
          username: string;
          email: string;
          fullName: string;
        };
        return {
          displayName: userData?.fullName || userData?.username,
          email: userData?.email,
          uid: userId,
        };
      }
      return null;
    } catch (error) {
      logger.error('Error fetching user info:', error, 'WebRTCService');
      return null;
    }
  }

  /**
   * Send reconnect message to remote peer
   */
  async sendReconnectMessage(
    meetingId: string,
    receiverId: string,
  ): Promise<void> {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      await this.sendSignalingMessage({
        type: 'reconnect',
        sender: userId,
        receiver: receiverId,
        payload: {meetingId},
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(
        'WebRTCService :: sendReconnectMessage() ::',
        error,
        'WebRTCService',
      );
      throw error;
    }
  }

  // Create a helper function to check if a URL is a Firebase index creation URL
  private isFirebaseIndexUrl(url: string): boolean {
    return (
      url.includes('console.firebase.google.com') &&
      url.includes('firestore/indexes') &&
      url.includes('create_composite')
    );
  }

  // Extract Firebase index URL from an error message
  private extractFirebaseIndexUrl(errorMessage: string): string | null {
    const matches = errorMessage.match(
      /https:\/\/console\.firebase\.google\.com[^\s"']+/,
    );
    return matches ? matches[0] : null;
  }

  // Handle Firebase index error by displaying a more user-friendly message
  private handleFirebaseIndexError(error: any): void {
    logger.error('Firebase index error:', error, 'WebRTCService');

    // Try to extract the index creation URL if it exists
    const indexUrl = this.extractFirebaseIndexUrl(error.message || '');

    if (indexUrl) {
      logger.warn(
        'Firestore query requires an index. Please create it at:',
        indexUrl,
        'WebRTCService',
      );

      // On Android, we can open the URL
      if (Platform.OS === 'android') {
        Linking.canOpenURL(indexUrl).then(supported => {
          if (supported) {
            Alert.alert(
              'Firestore Index Required',
              'This app needs a database index to be created. Would you like to open the Firebase Console to create it?',
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Open Firebase Console',
                  onPress: () => Linking.openURL(indexUrl),
                },
              ],
            );
          }
        });
      } else {
        // On iOS, we can just show the alert with the URL
        Alert.alert(
          'Firestore Index Required',
          `This app needs a database index to be created. Please go to:\n\n${indexUrl}`,
        );
      }
    }
  }

  /**
   * Apply bandwidth limitations to optimize video quality vs performance
   */
  private setMediaBitrates(peerConnection: RTCPeerConnection): void {
    // @ts-ignore - This is a workaround to modify SDP for bandwidth management
    const oldSetLocalDescription =
      peerConnection.setLocalDescription.bind(peerConnection);

    // @ts-ignore
    peerConnection.setLocalDescription = async function (description) {
      // Modify the SDP to set bandwidth limitations and ensure audio is active
      if (description && description.sdp) {
        let sdp = description.sdp;

        // Set bandwidth limits
        sdp = sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:800\r\n');
        sdp = sdp.replace(/a=mid:audio\r\n/g, 'a=mid:audio\r\nb=AS:64\r\n');

        // Prioritize audio
        sdp = sdp.replace(
          /(m=audio[\s\S]*?)(m=video)/g,
          '$1a=priority:1.0\r\n$2',
        );

        // Ensure audio is not muted or inactive
        sdp = sdp.replace(/(m=audio[\s\S]*?)(a=inactive)/g, '$1a=sendrecv');
        sdp = sdp.replace(/(m=audio[\s\S]*?)(a=recvonly)/g, '$1a=sendrecv');

        // Create new description with modified SDP
        const newDesc = {
          sdp,
          type: description.type ?? (description as any)._type ?? 'offer',
        };
        return oldSetLocalDescription(newDesc);
      }
      return oldSetLocalDescription(description);
    };
  }

  /**
   * Restart ICE if the connection becomes unstable
   */
  private async restartIceIfNeeded(
    peerConnection: RTCPeerConnection,
    participantId: string,
  ): Promise<void> {
    if (
      !this.currentMeetingId ||
      peerConnection.iceConnectionState === 'closed'
    ) {
      return;
    }

    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) return;

      // Only the peer with the lower ID initiates the restart to avoid conflicts
      if (userId < participantId) {
        logger.debug(
          `Initiating ICE restart with ${participantId}`,
          undefined,
          'WebRTCService',
        );

        // Create a new offer with ICE restart flag
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
          // @ts-ignore - Not recognized by TypeScript
          iceRestart: true,
        });

        await peerConnection.setLocalDescription(offer);

        // Send the offer through signaling
        await this.sendSignalingMessage({
          type: 'offer',
          sender: userId,
          receiver: participantId,
          payload: offer,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      logger.error('Error during ICE restart:', error, 'WebRTCService');
    }
  }

  /**
   * Ensure all tracks are properly added to the peer connection
   */
  private ensureTracksAreAdded(peerConnection: RTCPeerConnection): void {
    if (!this.localStream) return;

    // Check each local track
    this.localStream.getTracks().forEach(track => {
      // See if this track is already added to the connection
      const senders = peerConnection.getSenders();
      const isTrackAdded = senders.some(sender => sender.track === track);

      // If not added, add it now
      if (!isTrackAdded) {
        logger.debug(
          `Re-adding track that was missing: ${track.kind}`,
          undefined,
          'WebRTCService',
        );
        peerConnection.addTrack(track, this.localStream!);
      }
    });
  }

  /**
   * Update the local stream and renegotiate all peer connections
   */
  async updateLocalStream(
    newStream: MediaStream,
    meetingId: string,
  ): Promise<void> {
    try {
      if (!newStream) {
        logger.error(
          'WebRTCService :: updateLocalStream() :: No new stream provided',
          undefined,
          'WebRTCService',
        );
        return;
      }

      logger.debug(
        'WebRTCService :: updateLocalStream() :: Updating local stream',
        undefined,
        'WebRTCService',
      );

      // Save the new local stream
      this.localStream = newStream as MediaStream;

      // Get current user ID
      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        logger.error(
          'WebRTCService :: updateLocalStream() :: User not authenticated',
          undefined,
          'WebRTCService',
        );
        return;
      }

      // For each peer connection, replace the tracks
      for (const [
        participantId,
        peerConnection,
      ] of this.peerConnections.entries()) {
        if (peerConnection.connectionState === 'closed') continue;

        try {
          logger.debug(
            `Replacing tracks for peer connection with ${participantId}`,
            undefined,
            'WebRTCService',
          );

          // Get all senders from this peer connection
          const senders = peerConnection.getSenders();

          // For each track in the new stream, find a sender of the same type and replace
          newStream.getTracks().forEach(track => {
            const sender = senders.find(
              s => s.track && s.track.kind === track.kind,
            );

            if (sender) {
              logger.debug(
                `Replacing ${track.kind} track for ${participantId}`,
                undefined,
                'WebRTCService',
              );
              sender
                .replaceTrack(track)
                .then(() =>
                  logger.debug(
                    `Successfully replaced ${track.kind} track`,
                    undefined,
                    'WebRTCService',
                  ),
                )
                .catch(err =>
                  logger.error(
                    `Error replacing track: ${err}`,
                    undefined,
                    'WebRTCService',
                  ),
                );
            } else {
              logger.debug(
                `Adding new ${track.kind} track for ${participantId}`,
                undefined,
                'WebRTCService',
              );
              peerConnection.addTrack(track, newStream);
            }
          });

          // If it's a screen share, we may need to renegotiate
          const isScreenShare = newStream
            .getVideoTracks()
            .some(
              track =>
                track.label && track.label.toLowerCase().includes('screen'),
            );

          if (isScreenShare) {
            logger.debug(
              `Initiating renegotiation for screen share with ${participantId}`,
              undefined,
              'WebRTCService',
            );
            // Create a new offer and send it
            await this.createOffer(peerConnection, meetingId, participantId);
          }
        } catch (err) {
          logger.error(
            `Error updating stream for peer ${participantId}:`,
            err,
            'WebRTCService',
          );
        }
      }

      // Update local participant state to reflect new stream type
      const isScreenShare = newStream
        .getVideoTracks()
        .some(
          track => track.label && track.label.toLowerCase().includes('screen'),
        );

      await this.updateLocalParticipantState(meetingId, {
        isScreenSharing: isScreenShare,
        isVideoEnabled: newStream.getVideoTracks().some(track => track.enabled),
        isAudioEnabled: newStream.getAudioTracks().some(track => track.enabled),
      });

      logger.debug(
        'WebRTCService :: updateLocalStream() :: Successfully updated local stream',
        undefined,
        'WebRTCService',
      );
    } catch (error) {
      logger.error(
        'WebRTCService :: updateLocalStream() ::',
        error,
        'WebRTCService',
      );
      throw error;
    }
  }
}
