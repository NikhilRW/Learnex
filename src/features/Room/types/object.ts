export type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed';

export interface RoomParams {
  meetingData?: {
    id: string;
    title: string;
    description: string;

    duration: number;
    maxParticipants: number;
    isPrivate: boolean;
    taskId?: string;
    host: string;
    status: string;
    participants: string[];
    roomCode: string;
    settings: {
      muteOnEntry: boolean;
      allowChat: boolean;
      allowScreenShare: boolean;
      recordingEnabled: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
  };
  joinMode?: boolean;
  roomCode?: string;
}

export interface MeetingRoom {
  title: string;
  description: string;
  duration: number;
  capacity: number;
  isPrivate: boolean;
  host: string;
  taskId: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface MeetingConstraints {
  minCapacity: number;
  maxCapacity: number;
  minDuration: number;
}

export interface ParticipantInfo {
  id: string;
  name: string;
  email?: string | null;
  isLocal: boolean;
  stream?: any;
  state?: any;
}

export interface UserInfoCache {
  email: string | null;
  fullName: string | null;
  username: string | null;
}

export interface LayoutConfig {
  numColumns: number;
  itemHeight: number;
}

export interface AvatarInfo {
  initials: string;
  backgroundColor: string;
  textColor: string;
}

// Meeting related types
export interface Meeting {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  host: string;
  participants: string[];
  roomCode: string;
  isPrivate: boolean;
  maxParticipants: number;
  taskId?: string; // Associated task ID for the meeting
  settings: {
    muteOnEntry: boolean;
    allowChat: boolean;
    allowScreenShare: boolean;
    recordingEnabled: boolean;
  };
  createdAt: any; // FirebaseFirestoreTypes.Timestamp
  updatedAt: any; // FirebaseFirestoreTypes.Timestamp
}

export interface MeetingError extends Error {
  code?: string;
  details?: any;
}

// WebRTC related types
export interface ParticipantState {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  isThumbsUp: boolean;
  isThumbsDown: boolean;
  isClapping: boolean;
  isWaving: boolean;
  isSpeaking: boolean;
  isSmiling: boolean;
  reactionTimestamp: Date | null;
  lastUpdated: Date;
}
