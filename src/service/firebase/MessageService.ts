import firestore from '@react-native-firebase/firestore';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import {Conversation, Message} from '../../models/Message';
import {FirebaseErrorHandler} from '../../helpers/FirebaseErrorHandler';
import notificationService from '../../service/NotificationService';
import Config from 'react-native-config';

// Configure backend URL for sending push notifications
const BACKEND_URL = Config.BACKEND_URL || 'https://learnex-backend.vercel.app';

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
        unreadCount: {
          [userId1]: 0,
          [userId2]: 0,
        },
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

      // Trigger a notification through the local NotificationService
      // This works when the app is in foreground or background
      try {
        // Check if the message is sent by the current user
        const isSenderCurrentUser =
          message.senderId === auth().currentUser?.uid;

        if (!isSenderCurrentUser) {
          // Send notification to the recipient via local service
          notificationService.displayMessageNotification(
            message.senderId,
            message.senderName,
            message.text,
            conversationId,
            message.recipientId,
            message.senderPhoto,
            newMessage.id,
          );
        }
      } catch (err) {
        console.error('Error sending local notification:', err);
        // Continue even if notification fails - messaging functionality
        // should work independently of notification delivery
      }

      // Send notification through your backend (optional)
      try {
        const otherUserId = message.recipientId;
        const currentUser = auth().currentUser;

        if (currentUser && otherUserId) {
          // Add notification metadata for backend - match expected structure from backend API
          const notificationPayload = {
            recipientId: otherUserId,
            senderId: currentUser.uid,
            senderName: message.senderName || 'User',
            senderPhoto: message.senderPhoto,
            message: message.text,
            conversationId: conversationId,
          };

          // Check for network connectivity before making the request
          const isConnected = await this.checkNetworkConnectivity();

          if (isConnected) {
            try {
              // Use a timeout to prevent hanging on backend requests
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(
                  () =>
                    reject(new Error('Backend notification request timed out')),
                  5000,
                );
              });

              const fetchPromise = fetch(
                `${BACKEND_URL}/api/notifications/message`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(notificationPayload),
                },
              );

              // Race the fetch against the timeout
              const response = (await Promise.race([
                fetchPromise,
                timeoutPromise,
              ])) as Response;

              if (response.ok) {
                const data = await response.json();
                console.log('Backend notification response:', data);
              } else {
                const errorText = await response.text();
                console.error(
                  `Backend notification failed with status: ${response.status}`,
                );
                console.error(`Error body: ${errorText}`);

                // If we get a 404 specifically with /batch in the error, it's likely
                // the Vercel routing issue with Firebase batch endpoint
                if (response.status === 404 && errorText.includes('/batch')) {
                  console.log(
                    'Detected Firebase batch endpoint issue with Vercel, using local notification only',
                  );
                  // Continue with message sending despite notification failure
                }
              }
            } catch (error) {
              // This catch block will handle network errors and the 404 batch error
              console.error('Error sending backend notification:', error);
              console.log('Using local notification only');
              // Local notification handled above, so we can safely continue
            }
          } else {
            console.log('Device is offline, using local notification only');
          }
        }
      } catch (error) {
        console.error('Error preparing notification:', error);
        // Errors in notification should not prevent message sending
      }

      return newMessage;
    } catch (error) {
      console.error('MessageService :: sendMessage() ::', error);
      throw error;
    }
  }

  // Helper function to check network connectivity
  async checkNetworkConnectivity(): Promise<boolean> {
    try {
      // Create an AbortController with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // Try to fetch the health check endpoint with the correct URL
      const response = await fetch(`${BACKEND_URL}/api/health`, {
        method: 'GET',
        headers: {'Cache-Control': 'no-cache'},
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      // Any error means we're offline
      console.log('Network connectivity check failed:', error);
      return false;
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

  // Update participant details in conversations (e.g., when profile photo changes)
  async updateParticipantDetails(
    userId: string,
    updates: {name?: string; image?: string},
  ): Promise<void> {
    try {
      // Find all conversations this user is part of
      const conversationsQuery = await this.conversationsCollection
        .where('participants', 'array-contains', userId)
        .get();

      if (conversationsQuery.empty) {
        console.log('No conversations found for user', userId);
        return;
      }

      // Create batch to update all conversations at once
      const batch = firestore().batch();

      conversationsQuery.docs.forEach(doc => {
        // Only update fields that are provided in the updates object
        const updateData: Record<string, any> = {};

        if (updates.name !== undefined) {
          updateData[`participantDetails.${userId}.name`] = updates.name;
        }

        if (updates.image !== undefined) {
          updateData[`participantDetails.${userId}.image`] = updates.image;
        }

        // Skip if no updates to apply
        if (Object.keys(updateData).length > 0) {
          batch.update(doc.ref, updateData);
        }
      });

      await batch.commit();
      console.log(
        `Updated participant details for user ${userId} in ${conversationsQuery.size} conversations`,
      );
    } catch (error) {
      throw this.errorHandler.handleError(
        error,
        'Failed to update participant details',
      );
    }
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
