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

export interface TabSelectorProps {
  activeTab: 'create' | 'join';
  onTabChange: (tab: 'create' | 'join') => void;
  isDark: boolean;
  isSmallScreen: boolean;
}

export interface CreateRoomFormProps {
  meetingRoom: {
    title: string;
    description: string;
    duration: number;
    capacity: number;
    taskId: string;
  };
  onMeetingRoomChange: (
    updates: Partial<{
      title: string;
      description: string;
      duration: number;
      capacity: number;
      taskId: string;
    }>,
  ) => void;
  selectedTask: any | null;
  onShowTaskModal: () => void;
  onClearTask: () => void;
  onCreateRoom: () => void;
  loading: boolean;
  isDark: boolean;
}

export interface JoinRoomFormProps {
  roomCode: string;
  onRoomCodeChange: (code: string) => void;
  onJoinRoom: () => void;
  loading: boolean;
  isDark: boolean;
}

export interface TaskSelectionModalProps {
  visible: boolean;
  tasks: any[];
  isLoading: boolean;
  selectedTask: any | null;
  onTaskSelect: (task: any) => void;
  onRefresh: () => void;
  onClose: () => void;
  isDark: boolean;
}

export interface TaskListItemProps {
  item: any;
  onPress: (task: any) => void;
  isDark: boolean;
}

export interface ParticipantGridProps {
  participants: any[];
  currentUserId: string;
  pinnedParticipantId: string | null;
  participantStates: Map<string, any>;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onPinParticipant: (id: string) => void;
}

export interface ParticipantItemProps {
  participant: any;
  isCurrentUser: boolean;
  isPinned?: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onLongPress: (id: string) => void;
}

export interface ChatPanelProps {
  messages: Message[];
  currentUserId: string;
  isDark: boolean;
  showChat: boolean;
  chatPanelOpacity: any;
  onClose: () => void;
  onSendMessage: (text: string) => void;
  onLongPressMessage: (id: string) => void;
  onToggleQuickMessages: () => void;
}

export interface ControlBarProps {
  isControlsVisible: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isHandRaised: boolean;
  showChat: boolean;
  showReactions: boolean;
  showParticipants: boolean;
  showMoreControls: boolean;
  isFrontCamera: boolean;
  meetingTitle: string;
  roomCode: string;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onFlipCamera: () => void;
  onRaiseHand: () => void;
  onToggleChat: () => void;
  onToggleReactions: () => void;
  onToggleParticipants: () => void;
  onToggleMoreControls: (show: boolean) => void;
  onEndCall: () => void;
}

export interface ReactionsMenuProps {
  showReactions: boolean;
  reactionsMenuOpacity: any;
  onReaction: (
    reaction: 'thumbsUp' | 'thumbsDown' | 'clapping' | 'waving' | 'smiling',
  ) => void;
}

export interface ParticipantsPanelProps {
  participants: any[];
  currentUserId: string;
  pinnedParticipantId: string | null;
  participantStates: Map<string, any>;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isDark: boolean;
  showParticipants: boolean;
  participantsPanelOpacity: any;
  onClose: () => void;
  onPinParticipant: (id: string) => void;
}

export interface EmptyStateProps {
  isConnecting: boolean;
  meetingTitle: string;
  roomCode: string;
}

export interface QuickMessagesMenuProps {
  showQuickMessages: boolean;
  quickMessagesMenuOpacity: any;
  onClose: () => void;
  onSendQuickMessage: (text: string) => void;
}

export interface MessageReactionsMenuProps {
  showMessageReactions: boolean;
  onReaction: (type: string) => void;
  onClose: () => void;
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

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  edited?: boolean;
  editedAt?: any;
}
