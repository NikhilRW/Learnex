import {useState, useEffect, useCallback} from 'react';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from '@react-native-firebase/firestore';
import {getAuth} from '@react-native-firebase/auth';
import {ChatMessage} from '../types';

export interface UseChatMessagesParams {
  meetingId: string;
  userName: string;
}

export interface UseChatMessagesReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useChatMessages = ({
  meetingId,
  userName: _userName,
}: UseChatMessagesParams): UseChatMessagesReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeChat = useCallback(async () => {
    const userId = getAuth().currentUser?.uid;

    if (!userId || !meetingId) {
      setError('User not authenticated or invalid meeting');
      setIsLoading(false);
      return null;
    }

    try {
      const meetingRef = doc(getFirestore(), 'meetings', meetingId);
      const messagesRef = collection(meetingRef, 'messages');

      // Create initial message if collection is empty
      const messagesSnapshot = await getDocs(messagesRef);
      if (messagesSnapshot.empty) {
        await setDoc(doc(messagesRef), {
          text: 'Chat started',
          senderId: 'system',
          senderName: 'System',
          timestamp: serverTimestamp(),
        });
      }

      // Subscribe to messages
      const unsubscribe = query(
        messagesRef,
        orderBy('timestamp', 'asc'),
      ).onSnapshot(
        snapshot => {
          if (!snapshot) {
            console.warn('Received null snapshot');
            return;
          }

          try {
            const newMessages: ChatMessage[] = [];
            snapshot.docChanges().forEach(change => {
              if (change.type === 'added' || change.type === 'modified') {
                // TODO: try to give correct typings.
                const data = change.doc.data() as any;
                if (data) {
                  newMessages.push({
                    id: change.doc.id,
                    text: data.text || '',
                    senderId: data.senderId || '',
                    senderName: data.senderName || 'Anonymous',
                    timestamp: data.timestamp || Timestamp.now(),
                    edited: data.edited,
                    editedAt: data.editedAt,
                  });
                }
              }
            });

            if (newMessages.length > 0) {
              setMessages(prevMessages => {
                const uniqueMessages = [...prevMessages];
                newMessages.forEach(newMsg => {
                  const existingIndex = uniqueMessages.findIndex(
                    msg => msg.id === newMsg.id,
                  );
                  if (existingIndex >= 0) {
                    uniqueMessages[existingIndex] = newMsg;
                  } else {
                    uniqueMessages.push(newMsg);
                  }
                });
                return uniqueMessages.sort(
                  (a, b) => a.timestamp.seconds - b.timestamp.seconds,
                );
              });
            }
          } catch (err) {
            console.error('Error processing messages:', err);
            setError('Error processing messages');
          }

          setIsLoading(false);
        },
        err => {
          console.error('Error listening to messages:', err);
          setError('Failed to load messages');
          setIsLoading(false);
        },
      );

      return unsubscribe;
    } catch (err) {
      console.error('Error initializing chat:', err);
      setError('Failed to initialize chat');
      setIsLoading(false);
      return null;
    }
  }, [meetingId]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupChat = async () => {
      unsubscribe = await initializeChat();
    };

    setupChat();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initializeChat]);

  return {
    messages,
    isLoading,
    error,
    setError,
  };
};
