import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream as RNMediaStream,
} from 'react-native-webrtc';

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
  private meetingsCollection = firestore().collection('meetings');
  private signalingCollection = firestore().collection('signaling');
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

  /**
   * Initialize local media stream
   */
  async initLocalStream(
    videoEnabled = true,
    audioEnabled = true,
  ): Promise<MediaStream> {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: audioEnabled,
        video: videoEnabled
          ? {
              width: {min: 640, ideal: 1280, max: 1920},
              height: {min: 480, ideal: 720, max: 1080},
              facingMode: 'user',
            }
          : false,
      });

      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('WebRTCService :: initLocalStream() ::', error);
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

      // Create new peer connection with improved configuration
      const peerConnection = new RTCPeerConnection({
        iceServers: this.iceServers,
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        sdpSemantics: 'unified-plan', // Add this for better compatibility
      });

      // Add local tracks to the peer connection with proper track handling
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          if (this.localStream) {
            // Add track with proper stream association
            peerConnection.addTrack(track, this.localStream);
          }
        });
      }

      // Handle ICE candidates with improved error handling
      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          this.sendIceCandidate(
            event.candidate,
            this.currentMeetingId || '',
            participantId,
          ).catch(error => {
            console.error('Error sending ICE candidate:', error);
          });
        }
      };

      // Handle remote tracks with improved stream handling
      peerConnection.ontrack = event => {
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];

          // Ensure stream has proper participant identification
          remoteStream.participantId = participantId;

          // Get participant information
          this.getUserInfo(participantId)
            .then(userInfo => {
              if (userInfo) {
                remoteStream.participantName = userInfo.displayName;
                remoteStream.participantEmail = userInfo.email;
              }
            })
            .catch(error => {
              console.error('Error getting user info:', error);
            });

          // Track this stream as active
          this.activeRemoteStreams.add(participantId);

          // Notify about new remote stream
          if (this.onRemoteStreamCallback) {
            this.onRemoteStreamCallback(remoteStream);
          }
        }
      };

      // Handle connection state changes with improved logging
      peerConnection.onconnectionstatechange = () => {
        console.log(
          `Connection state changed to ${peerConnection.connectionState} for participant ${participantId}`,
        );

        if (peerConnection.connectionState === 'connected') {
          console.log(`Successfully connected to ${participantId}`);
          // Ensure tracks are properly added after connection
          if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
              if (
                !peerConnection
                  .getSenders()
                  .some(sender => sender.track === track)
              ) {
                peerConnection.addTrack(track, this.localStream!);
              }
            });
          }
        }
      };

      this.peerConnections.set(participantId, peerConnection);
      return peerConnection;
    } catch (error) {
      console.error('WebRTCService :: createPeerConnection() ::', error);
      throw error;
    }
  }

  /**
   * Clean up existing peer connection if it exists
   */
  private cleanupExistingPeerConnection(participantId: string): void {
    const existingConnection = this.peerConnections.get(participantId);
    if (existingConnection) {
      console.log(`Cleaning up existing connection for ${participantId}`);
      try {
        existingConnection.close();
      } catch (e) {
        console.error('Error closing existing peer connection:', e);
      }
      this.peerConnections.delete(participantId);
    }
  }

  /**
   * Handle peer disconnection with improved state cleanup
   */
  private handlePeerDisconnection(participantId: string): void {
    try {
      console.log(`Peer disconnected: ${participantId}`);

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
        this.meetingsCollection
          .doc(this.currentMeetingId)
          .collection('participantStates')
          .doc(participantId)
          .delete()
          .catch(error => {
            console.error('Error removing participant state:', error);
          });
      }
    } catch (error) {
      console.error('WebRTCService :: handlePeerDisconnection() ::', error);
    }
  }

  /**
   * Connect to participants with improved state handling
   */
  async connectToParticipants(
    meetingId: string,
    participantIds: string[],
  ): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Store meeting ID for reference
      this.currentMeetingId = meetingId;

      // Subscribe to participant states if not already subscribed
      if (!this.unsubscribeParticipantStates) {
        this.subscribeToParticipantStates(meetingId);
      }

      // Initialize local participant state if not already done
      await this.updateLocalParticipantState(meetingId, {
        isAudioEnabled: true,
        isVideoEnabled: true,
        isHandRaised: false,
        isScreenSharing: false,
      });

      console.log(`Connecting to ${participantIds.length} participants`);

      // Filter out our own ID and connect to each participant
      const filteredParticipantIds = participantIds.filter(id => id !== userId);

      for (const participantId of filteredParticipantIds) {
        if (!this.peerConnections.has(participantId)) {
          console.log(`Creating new connection to ${participantId}`);
          // Create peer connection
          const peerConnection = this.createPeerConnection(participantId);

          // Create offer if we're supposed to initiate (if our ID is "greater than" theirs)
          if (userId > participantId) {
            await this.createOffer(peerConnection, meetingId, participantId);
          }
        } else {
          console.log(`Connection to ${participantId} already exists`);
        }
      }

      // Start connection monitoring if not already running
      this.startConnectionMonitoring();
    } catch (error) {
      console.error('WebRTCService :: connectToParticipants() ::', error);
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
          console.log(
            `Detected problematic connection with ${participantId}, state: ${connectionState}`,
          );
          this.handlePeerDisconnection(participantId);

          // Attempt to reconnect
          if (this.currentMeetingId) {
            const peerConnection = this.createPeerConnection(participantId);
            const userId = auth().currentUser?.uid;
            if (userId && userId > participantId) {
              this.createOffer(
                peerConnection,
                this.currentMeetingId,
                participantId,
              ).catch(e => console.error('Error recreating connection:', e));
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
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Check the signaling state before proceeding
      if (peerConnection.signalingState !== 'stable') {
        console.log(
          `Cannot create offer in signaling state: ${peerConnection.signalingState}`,
        );
        return;
      }

      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      // Check again before setting local description
      if (peerConnection.signalingState !== 'stable') {
        console.log(
          `Signaling state changed during offer creation: ${peerConnection.signalingState}`,
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
      console.error('WebRTCService :: createOffer() ::', error);
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
      const userId = auth().currentUser?.uid;
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
      console.error('WebRTCService :: createAnswer() ::', error);
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
      console.error('WebRTCService :: addIceCandidate() ::', error);
      throw error;
    }
  }

  /**
   * Listen for signaling messages
   */
  listenForSignalingMessages(
    meetingId: string,
    onSignalingMessage: (message: SignalingMessage) => void,
  ): void {
    const userId = auth().currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    if (this.unsubscribeSignaling) {
      this.unsubscribeSignaling();
    }

    this.unsubscribeSignaling = this.signalingCollection
      .where('receiver', 'in', [userId, 'all'])
      .orderBy('timestamp', 'asc')
      .onSnapshot(
        snapshot => {
          if (!snapshot) {
            console.warn(
              'WebRTCService: Received null snapshot in signaling listener',
            );
            return;
          }

          try {
            snapshot.docChanges().forEach(async change => {
              if (change.type === 'added') {
                const message = change.doc.data() as SignalingMessage;

                if (message.type === 'reconnect' && message.sender !== userId) {
                  // Handle reconnection request from other participant
                  const peerConnection = this.peerConnections.get(
                    message.sender,
                  );
                  if (peerConnection) {
                    peerConnection.close();
                    this.peerConnections.delete(message.sender);
                  }

                  // Create new peer connection
                  const newPeerConnection = this.createPeerConnection(
                    message.sender,
                  );
                  await this.createOffer(
                    newPeerConnection,
                    meetingId,
                    message.sender,
                  );
                } else {
                  onSignalingMessage(message);
                }

                // Delete the message after processing
                await change.doc.ref.delete().catch(error => {
                  console.error(
                    'Error deleting processed signaling message:',
                    error,
                  );
                });
              }
            });
          } catch (error) {
            console.error(
              'WebRTCService: Error processing signaling messages:',
              error,
            );
          }
        },
        error => {
          console.error('WebRTCService: Error in signaling listener:', error);
          this.updateConnectionState('failed');
        },
      );
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
              const myUserId = auth().currentUser?.uid;
              if (myUserId && myUserId < sender) {
                console.log(
                  'Signaling collision detected. Rolling back local description.',
                );
                await peerConnection.setLocalDescription({
                  type: 'rollback',
                  sdp: '', // Required by RTCSessionDescriptionInit
                });
              } else {
                console.log(
                  'Signaling collision detected. Expecting remote peer to rollback.',
                );
                return; // Wait for the remote peer to rollback and try again
              }
            }

            // Now safe to set remote description
            await peerConnection.setRemoteDescription(
              new RTCSessionDescription(payload),
            );
            await this.createAnswer(peerConnection, meetingId, sender);
          } catch (error) {
            console.error('Error handling offer:', error);

            // Attempt recovery by recreating the peer connection
            this.cleanupExistingPeerConnection(sender);
            peerConnection = this.createPeerConnection(sender);

            // Try again with the new connection
            await peerConnection.setRemoteDescription(
              new RTCSessionDescription(payload),
            );
            await this.createAnswer(peerConnection, meetingId, sender);
          }
          break;

        case 'answer':
          try {
            if (peerConnection.signalingState === 'have-local-offer') {
              await peerConnection.setRemoteDescription(
                new RTCSessionDescription(payload),
              );
            } else {
              console.log(
                `Cannot set remote answer in state: ${peerConnection.signalingState}`,
              );
            }
          } catch (error) {
            console.error('Error handling answer:', error);
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
              console.log(
                'Received ICE candidate but no remote description set, caching candidate',
              );
              // In a more complex implementation, you could cache candidates and apply them later
            }
          } catch (error) {
            console.error('Error handling ICE candidate:', error);
          }
          break;
      }
    } catch (error) {
      console.error('WebRTCService :: processSignalingMessage() ::', error);
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
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      await this.sendSignalingMessage({
        type: 'candidate',
        sender: userId,
        receiver: receiverId,
        payload: candidate,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('WebRTCService :: sendIceCandidate() ::', error);
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
      const userId = auth().currentUser?.uid;
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
      await this.meetingsCollection
        .doc(meetingId)
        .collection('participantStates')
        .doc(userId)
        .set(newState, {merge: true});
    } catch (error) {
      console.error('WebRTCService :: updateLocalParticipantState() ::', error);
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

      this.unsubscribeParticipantStates = this.meetingsCollection
        .doc(meetingId)
        .collection('participantStates')
        .onSnapshot(
          snapshot => {
            snapshot.docChanges().forEach(change => {
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
            console.error(
              'WebRTCService :: Error in participant states listener:',
              error,
            );
          },
        );
    } catch (error) {
      console.error(
        'WebRTCService :: subscribeToParticipantStates() ::',
        error,
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
  cleanup(): void {
    console.log('WebRTCService :: cleanup()');

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

    // Close and clean up all peer connections
    this.peerConnections.forEach((connection, participantId) => {
      try {
        console.log(`Closing connection to ${participantId}`);
        connection.close();
      } catch (e) {
        console.error(`Error closing connection to ${participantId}:`, e);
      }
    });
    this.peerConnections.clear();
    this.activeRemoteStreams.clear();

    // Clean up local stream
    if (this.localStream) {
      try {
        this.localStream.getTracks().forEach(track => {
          track.stop();
        });
      } catch (e) {
        console.error('Error stopping local tracks:', e);
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

    this.currentMeetingId = null;
    this.connectionState = 'disconnected';
  }

  private async sendSignalingMessage(
    message: SignalingMessage,
    retryCount = 0,
  ): Promise<void> {
    try {
      await this.signalingCollection.add({
        ...message,
        retryCount,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error(
        `Failed to send signaling message (attempt ${retryCount + 1}):`,
        error,
      );
      if (retryCount < this.MAX_SIGNALING_RETRIES) {
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
    console.log(`Connection state changed to: ${newState}`);

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
          console.log('Attempting to reconnect...');
          await this.reconnect();
        } catch (error) {
          console.error('Reconnection failed:', error);
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
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Clean up existing connections
      this.peerConnections.forEach(connection => {
        connection.close();
      });
      this.peerConnections.clear();

      // Send reconnect signal
      await this.sendSignalingMessage({
        type: 'reconnect',
        sender: userId,
        receiver: 'all',
        payload: {meetingId: this.currentMeetingId},
      });

      // Recreate peer connections
      const meetingDoc = await this.meetingsCollection
        .doc(this.currentMeetingId)
        .get();
      const meetingData = meetingDoc.data();

      if (meetingData?.participants) {
        await this.connectToParticipants(
          this.currentMeetingId,
          meetingData.participants,
        );
      }

      this.updateConnectionState('connected');
    } catch (error) {
      console.error('Reconnection failed:', error);
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

      console.log(
        `Local stream updated with participant info: ${info.displayName} (${info.email})`,
      );
    }
  }

  /**
   * Get user information from Firestore
   */
  private async getUserInfo(userId: string): Promise<ParticipantInfo | null> {
    try {
      const userDoc = await firestore().collection('users').doc(userId).get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        return {
          displayName: userData?.fullName || userData?.username,
          email: userData?.email,
          uid: userId,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user info:', error);
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
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      await this.sendSignalingMessage({
        type: 'reconnect',
        sender: userId,
        receiver: receiverId,
        payload: {meetingId},
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('WebRTCService :: sendReconnectMessage() ::', error);
      throw error;
    }
  }
}

// Add interface for participant state
export interface ParticipantState {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  // Add new gesture states
  isThumbsUp: boolean;
  isThumbsDown: boolean;
  isClapping: boolean;
  isWaving: boolean;
  // Add speaking status
  isSpeaking: boolean;
  // Add reaction timestamp to auto-expire reactions
  reactionTimestamp: Date | null;
  lastUpdated: Date;
}
