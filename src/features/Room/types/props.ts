import {ConnectionState, Meeting, ParticipantState} from './object';
import {MediaStream} from 'react-native-webrtc';

export interface ExtendedMediaStream extends MediaStream {
  participantId?: string;
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

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: any;
  edited?: boolean;
  editedAt?: any;
}

// Hook parameter and return types
export interface UseRoomMediaParams {
  meetingId: string;
  localStream: ExtendedMediaStream | null;
  setLocalStream: React.Dispatch<
    React.SetStateAction<ExtendedMediaStream | null>
  >;
  webRTCService: any; // WebRTCService
}

export interface UseRoomMediaReturn {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isFrontCamera: boolean;
  handleToggleAudio: () => Promise<void>;
  handleToggleVideo: () => Promise<void>;
  handleFlipCamera: () => Promise<void>;
  handleLocalStreamUpdate: (stream: ExtendedMediaStream | null) => void;
}

export interface UseRoomChatParams {
  meetingId: string;
  currentUserName?: string;
}

export interface UseRoomChatReturn {
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
  handleMessageReaction: (
    messageId: string,
    reactionType: string,
  ) => Promise<void>;
  unsubscribeMessages: (() => void) | null;
}

export interface UseRoomActionsParams {
  meeting: Meeting;
  isHost: boolean;
  isConnecting: boolean;
  meetingService: any; // MeetingService
  webRTCService: any; // WebRTCService
  taskService: any; // TaskService
  cleanup: () => Promise<void>;
  unsubscribeMessages: (() => void) | null;
}

export interface UseRoomActionsReturn {
  handleRaiseHand: (raised: boolean) => Promise<void>;
  handleReaction: (
    reaction: 'thumbsUp' | 'thumbsDown' | 'clapping' | 'waving' | 'smiling',
  ) => Promise<void>;
  handleEndCall: () => Promise<void>;
  confirmLeaveRoom: () => void;
  handleMeetingEnded: () => void;
}

export interface UseRoomConnectionParams {
  meeting: Meeting;
  meetingService: any; // MeetingService
  webRTCService: any; // WebRTCService
  onMeetingEnded: () => void;
}

export interface UseRoomConnectionReturn {
  localStream: ExtendedMediaStream | null;
  remoteStreams: ExtendedMediaStream[];
  isConnecting: boolean;
  connectionAttempts: number;
  connectionError: string | null;
  connectionState: ConnectionState;
  participantStates: Map<string, ParticipantState>;
  streamsByParticipant: Map<string, ExtendedMediaStream>;
  cleanup: () => Promise<void>;
}

// Component props
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

export interface ChatProps {
  meetingId: string;
  isVisible: boolean;
  onClose: () => void;
}

// Component-specific prop types
export interface ChatMessageItemProps {
  message: ChatMessage;
  isDark: boolean;
  onLongPress: (message: ChatMessage) => void;
}

export interface MessageContextMenuProps {
  visible: boolean;
  isDark: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export interface EditMessageModalProps {
  editText: string;
  isDark: boolean;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export interface ChatInputProps {
  value: string;
  isDark: boolean;
  onChangeText: (text: string) => void;
  onSend: () => void;
}
