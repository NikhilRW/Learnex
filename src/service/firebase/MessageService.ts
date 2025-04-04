import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import {Conversation, Message} from '../../models/Message';
import {FirebaseErrorHandler} from '../../helpers/FirebaseErrorHandler';
/**
 * Helper function to clean objects before storing in Firestore
 * Replaces undefined values with null, which Firestore supports
 */
const sanitizeForFirestore = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip undefined values entirely
    if (value !== undefined) {
      sanitized[key] = sanitizeForFirestore(value);
    }
  }
  return sanitized;
};

export class MessageService {
  messagesCollection = firestore().collection('messages');
  private conversationsCollection = firestore().collection('conversations');
  private userCollection = firestore().collection('users');
  private errorHandler = new FirebaseErrorHandler();

  // Create or get a conversation between two users
  async getOrCreateConversation(
    userId1: string,
    userId2: string,
  ): Promise<Conversation> {
    try {
      // Query for existing conversation
      const conversationsQuery = await this.conversationsCollection
        .where('participants', 'array-contains', userId1)
        .get();

      // Find conversation with both participants
      const existingConversation = conversationsQuery.docs.find(doc => {
        const data = doc.data() as Conversation;
        return data.participants.includes(userId2);
      });

      if (existingConversation) {
        const conversationData = existingConversation.data() as Omit<
          Conversation,
          'id'
        >;
        return {
          id: existingConversation.id,
          ...conversationData,
        };
      }

      // If no existing conversation, create a new one
      // First get user details for both participants
      const [user1Doc, user2Doc] = await Promise.all([
        this.userCollection.doc(userId1).get(),
        this.userCollection.doc(userId2).get(),
      ]);

      const user1Data = user1Doc.data() || {};
      const user2Data = user2Doc.data() || {};

      // Create participant details
      const participantDetails: Conversation['participantDetails'] = {
        [userId1]: {
          name: user1Data.fullName || user1Data.username || 'User',
          photo: user1Data.photoURL || null,
          lastSeen: firebase.firestore.Timestamp.now().toMillis(),
        },
        [userId2]: {
          name: user2Data.fullName || user2Data.username || 'User',
          photo: user2Data.photoURL || null,
          lastSeen: user2Data.lastSeen || null,
        },
      };

      // Create new conversation
      const newConversation: Omit<Conversation, 'id'> = {
        participants: [userId1, userId2],
        participantDetails,
        unreadCount: 0,
      };

      // Sanitize to remove any undefined values
      const sanitizedConversation = sanitizeForFirestore(newConversation);

      const conversationRef = await this.conversationsCollection.add(
        sanitizedConversation,
      );
      return {id: conversationRef.id, ...newConversation};
    } catch (error) {
      throw this.errorHandler.handleError(
        error,
        'Failed to create conversation',
      );
    }
  }

  // Send a new message
  async sendMessage(
    conversationId: string,
    message: Omit<Message, 'id'>,
  ): Promise<Message> {
    try {
      const messageRef = this.messagesCollection.doc();
      const newMessage: Message = {
        id: messageRef.id,
        ...message,
      };

      // Sanitize to remove any undefined values
      const sanitizedMessage = sanitizeForFirestore(newMessage);
      await messageRef.set(sanitizedMessage);

      // Update conversation with last message
      await this.conversationsCollection.doc(conversationId).update({
        lastMessage: {
          text: message.text,
          timestamp: message.timestamp,
          senderId: message.senderId,
          read: false,
        },
        [`unreadCount.${message.recipientId}`]:
          firestore.FieldValue.increment(1),
      });

      return newMessage;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'Failed to send message');
    }
  }

  // Get messages for a conversation
  getMessages(conversationId: string, limit = 50) {
    return this.messagesCollection
      .where('conversationId', '==', conversationId)
      .orderBy('timestamp', 'desc')
      .limit(limit);
  }

  // Listen to user conversations
  listenToConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void,
  ) {
    return this.conversationsCollection
      .where('participants', 'array-contains', userId)
      .orderBy('lastMessage.timestamp', 'desc')
      .onSnapshot(
        snapshot => {
          const conversations = snapshot.docs.map(doc => {
            const data = doc.data() as Omit<Conversation, 'id'>;
            return {
              id: doc.id,
              ...data,
            } as Conversation;
          });
          callback(conversations);
        },
        error => {
          console.error('Error listening to conversations:', error);
        },
      );
  }

  // Mark messages as read
  async markMessagesAsRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    try {
      // Update unread count in conversation
      await this.conversationsCollection.doc(conversationId).update({
        [`unreadCount.${userId}`]: 0,
      });

      // Get all unread messages
      const unreadMessages = await this.messagesCollection
        .where('conversationId', '==', conversationId)
        .where('recipientId', '==', userId)
        .where('read', '==', false)
        .get();

      // Create batch to update all messages at once
      const batch = firestore().batch();
      unreadMessages.docs.forEach(doc => {
        batch.update(doc.ref, {read: true});
      });

      await batch.commit();
    } catch (error) {
      throw this.errorHandler.handleError(
        error,
        'Failed to mark messages as read',
      );
    }
  }

  // Delete a message
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.messagesCollection.doc(messageId).delete();
    } catch (error) {
      throw this.errorHandler.handleError(error, 'Failed to delete message');
    }
  }

  // Edit a message
  async editMessage(messageId: string, newText: string): Promise<void> {
    try {
      const timestamp = new Date().getTime();
      await this.messagesCollection.doc(messageId).update({
        text: newText,
        edited: true,
        editedAt: timestamp,
      });

      // Check if this message is the last message in the conversation
      const messageDoc = await this.messagesCollection.doc(messageId).get();
      const messageData = messageDoc.data() as Message;

      if (messageData) {
        // Update the last message in conversation if this is the last message
        const conversationDoc = await this.conversationsCollection
          .doc(messageData.conversationId)
          .get();
        const conversationData = conversationDoc.data() as Conversation;

        if (
          conversationData?.lastMessage?.senderId === messageData.senderId &&
          conversationData?.lastMessage?.timestamp === messageData.timestamp
        ) {
          await this.conversationsCollection
            .doc(messageData.conversationId)
            .update({
              'lastMessage.text': newText,
            });
        }
      }
    } catch (error) {
      throw this.errorHandler.handleError(error, 'Failed to edit message');
    }
  }

  // Set typing status
  async setTypingStatus(
    conversationId: string,
    userId: string,
    isTyping: boolean,
  ): Promise<void> {
    try {
      await this.conversationsCollection.doc(conversationId).update({
        [`participantDetails.${userId}.typing`]: isTyping,
      });
    } catch (error) {
      throw this.errorHandler.handleError(
        error,
        'Failed to update typing status',
      );
    }
  }
}
