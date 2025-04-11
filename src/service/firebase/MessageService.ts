import firestore from '@react-native-firebase/firestore';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import {Conversation, Message} from '../../models/Message';
import {FirebaseErrorHandler} from '../../helpers/FirebaseErrorHandler';
import notificationService from '../../service/NotificationService';

/**
 * Helper function to clean objects before storing in Firestore
 * Removes undefined values which Firestore doesn't allow
 */
const sanitizeForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }

  // Handle objects
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
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
          image: user1Data.image || null,
          lastSeen: firebase.firestore.Timestamp.now().toMillis(),
        },
        [userId2]: {
          name: user2Data.fullName || user2Data.username || 'User',
          image: user2Data.image || null,
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
      // Check if conversation exists first
      const conversationDoc = await this.conversationsCollection
        .doc(conversationId)
        .get();
      if (!conversationDoc.exists) {
        throw new Error(
          `Conversation ${conversationId} not found. Cannot send message.`,
        );
      }

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

      // Trigger a notification for the recipienthi
      try {
        // Check if the message is sent by the current user
        const isSenderCurrentUser =
          message.senderId === auth().currentUser?.uid;

        if (!isSenderCurrentUser) {
          // Send notification to the recipient
          notificationService.displayMessageNotification(
            message.senderId,
            message.senderName,
            message.text,
            conversationId,
            message.recipientId,
            message.senderPhoto,
          );
        }
      } catch (err) {
        console.error('Error sending notification:', err);
        // Continue even if notification fails - messaging functionality
        // should work independently of notification delivery
      }

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
      // First check if the conversation exists
      const conversationDoc = await this.conversationsCollection
        .doc(conversationId)
        .get();
      if (!conversationDoc.exists) {
        console.warn(
          `Conversation ${conversationId} not found. Cannot mark messages as read.`,
        );
        return;
      }

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
      // Check if the message exists
      const messageDoc = await this.messagesCollection.doc(messageId).get();
      if (!messageDoc.exists) {
        console.warn(`Message ${messageId} not found. Cannot delete message.`);
        return;
      }

      await this.messagesCollection.doc(messageId).delete();
    } catch (error) {
      throw this.errorHandler.handleError(error, 'Failed to delete message');
    }
  }

  // Edit a message
  async editMessage(messageId: string, newText: string): Promise<void> {
    try {
      // Check if the message exists first
      const messageDocRef = this.messagesCollection.doc(messageId);
      const messageDocSnapshot = await messageDocRef.get();

      if (!messageDocSnapshot.exists) {
        console.warn(`Message ${messageId} not found. Cannot edit message.`);
        return;
      }

      const timestamp = new Date().getTime();
      await messageDocRef.update({
        text: newText,
        edited: true,
        editedAt: timestamp,
      });

      // Get the message data
      const messageData = messageDocSnapshot.data() as Message;

      if (messageData?.conversationId) {
        // Check if the conversation exists
        const conversationDocRef = this.conversationsCollection.doc(
          messageData.conversationId,
        );
        const conversationDocSnapshot = await conversationDocRef.get();

        if (!conversationDocSnapshot.exists) {
          console.warn(
            `Conversation ${messageData.conversationId} not found. Cannot update last message.`,
          );
          return;
        }

        const conversationData = conversationDocSnapshot.data() as Conversation;

        // Update the last message in conversation if this is the last message
        if (
          conversationData?.lastMessage?.senderId === messageData.senderId &&
          conversationData?.lastMessage?.timestamp === messageData.timestamp
        ) {
          await conversationDocRef.update({
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
      // Check if the conversation exists first
      const conversationDoc = await this.conversationsCollection
        .doc(conversationId)
        .get();
      if (!conversationDoc.exists) {
        console.warn(
          `Conversation ${conversationId} not found. Cannot update typing status.`,
        );
        return;
      }

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

  // Delete a conversation and all its messages
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      // Check if the conversation exists
      const conversationDoc = await this.conversationsCollection
        .doc(conversationId)
        .get();
      if (!conversationDoc.exists) {
        console.warn(
          `Conversation ${conversationId} not found. Cannot delete conversation.`,
        );
        return;
      }

      // Get all messages in the conversation
      const messagesSnapshot = await this.messagesCollection
        .where('conversationId', '==', conversationId)
        .get();

      // Create a batch to delete all messages
      const batch = firestore().batch();

      // Add message deletions to batch
      messagesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Add conversation deletion to batch
      batch.delete(this.conversationsCollection.doc(conversationId));

      // Commit the batch
      await batch.commit();
    } catch (error) {
      throw this.errorHandler.handleError(
        error,
        'Failed to delete conversation',
      );
    }
  }
}
