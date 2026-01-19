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
