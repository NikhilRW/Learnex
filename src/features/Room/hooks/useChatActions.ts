import {useCallback} from 'react';
import {Alert} from 'react-native';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import {getAuth} from '@react-native-firebase/auth';

export interface UseChatActionsParams {
  meetingId: string;
  userName: string;
  onError: (error: string) => void;
}

export interface UseChatActionsReturn {
  sendMessage: (text: string) => Promise<void>;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
}

export const useChatActions = ({
  meetingId,
  userName,
  onError,
}: UseChatActionsParams): UseChatActionsReturn => {
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !meetingId) return;

      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to send messages');
        return;
      }

      try {
        const messagesRef = collection(
          doc(getFirestore(), 'meetings', meetingId),
          'messages',
        );

        await addDoc(messagesRef, {
          text: text.trim(),
          senderId: userId,
          senderName: userName || 'Anonymous',
          timestamp: serverTimestamp(),
        });
      } catch (err) {
        console.error('Error sending message:', err);
        onError('Failed to send message');
        Alert.alert('Error', 'Failed to send message');
      }
    },
    [meetingId, userName, onError],
  );

  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
      if (!messageId || !newText.trim() || !meetingId) return;

      try {
        const messageRef = doc(
          collection(doc(getFirestore(), 'meetings', meetingId), 'messages'),
          messageId,
        );

        await updateDoc(messageRef, {
          text: newText.trim(),
          edited: true,
          editedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Error editing message:', err);
        onError('Failed to edit message');
        Alert.alert('Error', 'Failed to edit message');
      }
    },
    [meetingId, onError],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!messageId || !meetingId) return;

      try {
        await deleteDoc(
          doc(
            collection(doc(getFirestore(), 'meetings', meetingId), 'messages'),
            messageId,
          ),
        );
      } catch (err) {
        console.error('Error deleting message:', err);
        onError('Failed to delete message');
        Alert.alert('Error', 'Failed to delete message');
      }
    },
    [meetingId, onError],
  );

  return {
    sendMessage,
    editMessage,
    deleteMessage,
  };
};
