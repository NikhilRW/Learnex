import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'candidate';
  sender: string;
  receiver: string;
  payload: any;
  timestamp: any; // Using any for Firebase timestamp
}

export class WebRTCService {
  private meetingsCollection = firestore().collection('meetings');
  private signalingCollection = firestore().collection('signaling');
  private unsubscribeSignaling: (() => void) | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onRemoteStreamRemovedCallback: ((streamId: string) => void) | null =
    null;
  private iceServers = [
    {urls: 'stun:stun.l.google.com:19302'},
    {urls: 'stun:stun1.l.google.com:19302'},
    {urls: 'stun:stun2.l.google.com:19302'},
  ];

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
   * Create a peer connection for a specific participant
   */
  createPeerConnection(participantId: string): RTCPeerConnection {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: this.iceServers,
      });

      // Add local tracks to the peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          if (this.localStream) {
            peerConnection.addTrack(track, this.localStream);
          }
        });
      }

      // Handle ICE candidates
      // @ts-ignore - TypeScript definitions for react-native-webrtc are incomplete
      peerConnection.onicecandidate = (event: any) => {
        if (event.candidate) {
          this.sendIceCandidate(
            event.candidate,
            '', // meetingId will be set when calling the method
            participantId,
          );
        }
      };

      // Handle connection state changes
      // @ts-ignore - TypeScript definitions for react-native-webrtc are incomplete
      peerConnection.onconnectionstatechange = () => {
        console.log(
          `Connection state changed: ${peerConnection.connectionState} for participant ${participantId}`,
        );
      };

      // Handle ICE connection state changes
      // @ts-ignore - TypeScript definitions for react-native-webrtc are incomplete
      peerConnection.oniceconnectionstatechange = () => {
        console.log(
          `ICE connection state changed: ${peerConnection.iceConnectionState} for participant ${participantId}`,
        );

        if (
          peerConnection.iceConnectionState === 'disconnected' ||
          peerConnection.iceConnectionState === 'failed' ||
          peerConnection.iceConnectionState === 'closed'
        ) {
          this.handlePeerDisconnection(participantId);
        }
      };

      // Handle remote tracks
      // @ts-ignore - TypeScript definitions for react-native-webrtc are incomplete
      peerConnection.ontrack = (event: any) => {
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          console.log(`Remote stream received from ${participantId}`);

          if (this.onRemoteStreamCallback) {
            this.onRemoteStreamCallback(remoteStream);
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
   * Handle peer disconnection
   */
  private handlePeerDisconnection(participantId: string): void {
    const peerConnection = this.peerConnections.get(participantId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(participantId);

      if (this.onRemoteStreamRemovedCallback) {
        this.onRemoteStreamRemovedCallback(participantId);
      }
    }
  }

  /**
   * Connect to all participants in a meeting
   */
  async connectToParticipants(
    meetingId: string,
    participants: string[],
  ): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Connect to each participant
      for (const participantId of participants) {
        // Skip self
        if (participantId === userId) continue;

        // Create peer connection if not exists
        if (!this.peerConnections.has(participantId)) {
          const peerConnection = this.createPeerConnection(participantId);

          // Create and send offer
          await this.createOffer(peerConnection, meetingId, participantId);
        }
      }
    } catch (error) {
      console.error('WebRTCService :: connectToParticipants() ::', error);
      throw error;
    }
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
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Create offer
      // @ts-ignore - TypeScript definitions for react-native-webrtc are incomplete
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peerConnection.setLocalDescription(offer);

      // Send offer to remote peer through Firebase
      const signalingMessage: SignalingMessage = {
        type: 'offer',
        sender: userId,
        receiver: receiverId,
        payload: offer,
        timestamp: firestore.FieldValue.serverTimestamp(),
      };

      await this.signalingCollection.add(signalingMessage);
    } catch (error) {
      console.error('WebRTCService :: createOffer() ::', error);
      throw error;
    }
  }

  /**
   * Create an answer for a received offer
   */
  async createAnswer(
    peerConnection: RTCPeerConnection,
    meetingId: string,
    receiverId: string,
  ): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Create answer
      // @ts-ignore - TypeScript definitions for react-native-webrtc are incomplete
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Send answer to remote peer through Firebase
      const signalingMessage: SignalingMessage = {
        type: 'answer',
        sender: userId,
        receiver: receiverId,
        payload: answer,
        timestamp: firestore.FieldValue.serverTimestamp(),
      };

      await this.signalingCollection.add(signalingMessage);
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
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Unsubscribe from previous listener if exists
    if (this.unsubscribeSignaling) {
      this.unsubscribeSignaling();
    }

    // Subscribe to signaling messages
    this.unsubscribeSignaling = this.signalingCollection
      .where('receiver', '==', userId)
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
            snapshot.docChanges().forEach(change => {
              if (change.type === 'added') {
                const message = change.doc.data() as SignalingMessage;
                onSignalingMessage(message);
                // Delete the message after processing
                change.doc.ref.delete();
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
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(payload),
          );
          await this.createAnswer(peerConnection, meetingId, sender);
          break;

        case 'answer':
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(payload),
          );
          break;

        case 'candidate':
          await this.addIceCandidate(
            peerConnection,
            new RTCIceCandidate(payload),
          );
          break;
      }
    } catch (error) {
      console.error('WebRTCService :: processSignalingMessage() ::', error);
      throw error;
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
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const signalingMessage: SignalingMessage = {
        type: 'candidate',
        sender: userId,
        receiver: receiverId,
        payload: candidate,
        timestamp: firestore.FieldValue.serverTimestamp(),
      };

      await this.signalingCollection.add(signalingMessage);
    } catch (error) {
      console.error('WebRTCService :: sendIceCandidate() ::', error);
      throw error;
    }
  }

  /**
   * Stop listening for signaling messages and close all connections
   */
  cleanup(): void {
    // Close all peer connections
    this.peerConnections.forEach(connection => {
      connection.close();
    });
    this.peerConnections.clear();

    // Stop all local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Unsubscribe from signaling
    if (this.unsubscribeSignaling) {
      this.unsubscribeSignaling();
      this.unsubscribeSignaling = null;
    }

    // Clear callbacks
    this.onRemoteStreamCallback = null;
    this.onRemoteStreamRemovedCallback = null;
  }
}
