import {useState, useCallback, useEffect} from 'react';
import {Alert} from 'react-native';
import {getAuth} from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from '@react-native-firebase/firestore';

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

export const useRoomChat = ({
  meetingId,
  currentUserName,
}: UseRoomChatParams): UseRoomChatReturn => {
  const currentUser = getAuth().currentUser;

  const [messages, setMessages] = useState<Message[]>([]);
  const [unsubscribeMessages, setUnsubscribeMessages] = useState<
    (() => void) | null
  >(null);

  const subscribeToMessages = useCallback(() => {
    if (!currentUser) return;

    const messagesRef = collection(
      doc(collection(getFirestore(), 'meetings'), meetingId),
      'messages',
    );

    const unsubscribe = onSnapshot(
      query(messagesRef, orderBy('timestamp', 'asc')),
      snapshot => {
        if (!snapshot) return;

        const newMessages: Message[] = [];
        snapshot.docChanges().forEach((change: any) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            newMessages.push({
              id: change.doc.id,
              senderId: data.senderId,
              senderName: data.senderName,
              text: data.text,
              timestamp: data.timestamp?.toDate() || new Date(),
              isMe: data.senderId === currentUser.uid,
              reactions: data.reactions || {},
            });
          } else if (change.type === 'modified') {
            // Handle message modifications (e.g., reactions)
            const data = change.doc.data();
            const updatedMessage = {
              id: change.doc.id,
              senderId: data.senderId,
              senderName: data.senderName,
              text: data.text,
              timestamp: data.timestamp?.toDate() || new Date(),
              isMe: data.senderId === currentUser.uid,
              reactions: data.reactions || {},
            };

            // Update the message in the state
            setMessages(prevMessages =>
              prevMessages.map(msg =>
                msg.id === updatedMessage.id ? updatedMessage : msg,
              ),
            );

            // Don't add to newMessages since we're updating in place
            return;
          }
        });

        if (newMessages.length > 0) {
          setMessages(prev => [...prev, ...newMessages]);
        }
      },
      error => {
        console.error('Error subscribing to messages:', error);
      },
    );

    setUnsubscribeMessages(() => unsubscribe);
  }, [currentUser, meetingId]);

  // Subscribe to messages on mount
  useEffect(() => {
    subscribeToMessages();

    return () => {
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  const sendMessage = useCallback(
    async (text: string) => {
      try {
        await addDoc(
          collection(
            doc(collection(getFirestore(), 'meetings'), meetingId),
            'messages',
          ),
          {
            senderId: currentUser!.uid,
            senderName:
              currentUserName?.split(' ')[0] ||
              currentUser?.displayName?.split(' ')[0] ||
              currentUser?.email ||
              'Anonymous',
            text: text.trim(),
            timestamp: serverTimestamp(),
            reactions: {}, // Initialize empty reactions object
          },
        );
      } catch (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message');
      }
    },
    [currentUser, currentUserName, meetingId],
  );

  const handleMessageReaction = useCallback(
    async (messageId: string, reactionType: string) => {
      if (!currentUser) return;

      try {
        const messageRef = doc(
          collection(
            doc(collection(getFirestore(), 'meetings'), meetingId),
            'messages',
          ),
          messageId,
        );

        // Get current message data
        const messageDoc = await getDoc(messageRef);
        if (!messageDoc.exists()) return;

        const messageData = messageDoc.data() as any;
        const reactions = messageData?.reactions || {};

        // Toggle reaction: remove if same reaction exists, otherwise add/update
        if (reactions[currentUser.uid] === reactionType) {
          // Remove reaction
          delete reactions[currentUser.uid];
        } else {
          // Add or update reaction
          reactions[currentUser.uid] = reactionType;
        }

        // Update message with new reactions
        await updateDoc(messageRef, {reactions});
      } catch (error) {
        console.error('Error adding reaction to message:', error);
      }
    },
    [currentUser, meetingId],
  );

  return {
    messages,
    sendMessage,
    handleMessageReaction,
    unsubscribeMessages,
  };
};
