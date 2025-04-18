export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  recipientId: string;
  conversationId: string;
  text: string;
  timestamp: number;
  read: boolean;
  edited?: boolean;
  editedAt?: number;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails: {
    [userId: string]: {
      name: string;
      image: string;
      lastSeen?: number;
      typing?: boolean;
    };
  };
  lastMessage?: {
    text: string;
    timestamp: number;
    senderId: string;
    read: boolean;
  };
  unreadCount?: {
    [userId: string]: number;
  };
}
