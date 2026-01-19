import {ConnectionState} from './object';
import {Meeting} from 'room/services/MeetingService';
import {ParticipantState} from 'room/services/WebRTCService';
import {MediaStream} from 'react-native-webrtc';

export interface RoomLoadingIndicatorProps {
  connectionState: ConnectionState;
  connectionError: string | null;
  connectionAttempts: number;
  confirmLeaveRoom: () => void;
}

export interface Message {
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

export interface ExtendedMediaStream extends MediaStream {
  participantId?: string;
}

export interface RoomProps {
  meeting: Meeting;
  localStream?: any;
  remoteStreams: any[];
  updateLocalStream: (stream: ExtendedMediaStream | null) => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onSendMessage: (text: string) => void;
  onMessageReaction: (messageId: string, reactionType: string) => void;
  messages: Message[];
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isDark?: boolean;
  currentUserId: string;
  currentUserName: string;
  onRaiseHand: (raised: boolean) => void;
  onReaction: (
    reaction: 'thumbsUp' | 'thumbsDown' | 'clapping' | 'waving' | 'smiling',
  ) => void;
  participantStates: Map<string, ParticipantState>;
  isConnecting: boolean;
  onFlipCamera?: () => void;
  isFrontCamera?: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: any;
  edited?: boolean;
  editedAt?: any;
}

export interface ChatProps {
  meetingId: string;
  isVisible: boolean;
  onClose: () => void;
}
