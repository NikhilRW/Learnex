import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  increment,
  writeBatch,
  FirebaseFirestoreTypes,
  limit as fs_limit,
} from '@react-native-firebase/firestore';
import {Conversation, Message} from 'conversations/models/Message';
import {FirebaseErrorHandler} from 'shared/helpers/firebase/FirebaseErrorHandler';
import notificationService from 'shared/services/NotificationService';
import {logger} from 'shared/utils/logger';
import {getAuth} from '@react-native-firebase/auth';

// Configure backend URL for sending push notifications
const BACKEND_URL = 'https://learnex-backend.vercel.app';

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
  messagesCollection = collection(
    getFirestore(),
    'messages',
  ) as FirebaseFirestoreTypes.CollectionReference<Message>;
  private conversationsCollection = collection(
    getFirestore(),
    'conversations',
  ) as FirebaseFirestoreTypes.CollectionReference<Conversation>;
  private userCollection = collection(
    getFirestore(),
    'users',
  ) as FirebaseFirestoreTypes.CollectionReference<any>;
  private errorHandler = new FirebaseErrorHandler();

  // Create or get a conversation between two users
  async getOrCreateConversation(
    userId1: string,
    userId2: string,
  ): Promise<Conversation> {
    try {
      // Query for existing conversation
      const conversationsQuery = await getDocs(
        query(
          this.conversationsCollection,
          where('participants', 'array-contains', userId1),
        ),
      );

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
        getDoc(doc(this.userCollection, userId1)),
        getDoc(doc(this.userCollection, userId2)),
      ]);

      const user1Data = user1Doc.data() || {};
      const user2Data = user2Doc.data() || {};

      // Create participant details
      const participantDetails: Conversation['participantDetails'] = {
        [userId1]: {
          name: user1Data.fullName || user1Data.username || 'User',
          image: user1Data.image || null,
          lastSeen: Date.now(),
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

      const conversationRef = await addDoc(
        this.conversationsCollection,
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
    isQrInitiated: boolean = false,
  ): Promise<Message> {
    try {
      // Check if conversation exists first
      const conversationDoc = await getDoc(
        doc(this.conversationsCollection, conversationId),
      );
      if (!conversationDoc.exists()) {
        throw new Error(
          `Conversation ${conversationId} not found. Cannot send message.`,
        );
      }

      const messageRef = doc(this.messagesCollection);
      const newMessage: Message = {
        id: messageRef.id,
        ...message,
      };

      // Sanitize to remove any undefined values
      const sanitizedMessage = sanitizeForFirestore(newMessage);
      await setDoc(messageRef, sanitizedMessage);

      // Update conversation with last message
      await updateDoc(doc(this.conversationsCollection, conversationId), {
        lastMessage: {
          text: message.text,
          timestamp: message.timestamp,
          senderId: message.senderId,
          read: false,
        },
        [`unreadCount.${message.recipientId}`]: increment(1),
      });

      // Trigger a notification through the local NotificationService
      // This works when the app is in foreground or background
      try {
        // Check if the message is sent by the current user and
        // is intended for someone else (not self-messages)
        const currentUserId = getAuth().currentUser?.uid;
        const isSenderCurrentUser = message.senderId === currentUserId;
        const isRecipientDifferent = message.recipientId !== currentUserId;

        // Only send notification if the current user is sending to someone else
        if (isSenderCurrentUser && isRecipientDifferent) {
          // Make sure we have sender information for the notification
          let senderName = message.senderName;
          let senderPhoto = message.senderPhoto;

          // If sender info is missing, try to get it from the current user
          if (!senderName || !senderPhoto) {
            try {
              // Get current user info from Firestore
              const currentUserDoc = await getDoc(
                doc(collection(getFirestore(), 'users'), currentUserId),
              );

              if (currentUserDoc.exists()) {
                const userData = currentUserDoc.data() || {};
                senderName =
                  senderName ||
                  userData.fullName ||
                  userData.username ||
                  currentUserId;
                senderPhoto =
                  senderPhoto ||
                  userData.photoURL ||
                  userData.profilePicture ||
                  userData.image;
              }
            } catch (err) {
              logger.error(
                'Error getting current user data:',
                err,
                'MessageService',
              );
              // Continue with what we have
            }
          }

          logger.debug(
            'Sending notification with sender info:',
            {
              senderName,
              senderPhoto,
              isQrInitiated,
            },
            'MessageService',
          );

          // Send notification to the recipient via local service
          await notificationService.displayMessageNotification(
            message.senderId,
            senderName || 'User',
            message.text,
            conversationId,
            message.recipientId,
            senderPhoto,
            newMessage.id,
            isQrInitiated,
          );
        }
      } catch (err) {
        logger.error(
          'Error sending local notification:',
          err,
          'MessageService',
        );
        // Continue even if notification fails - messaging functionality
        // should work independently of notification delivery
      }

      // Send notification through your backend (optional)
      try {
        const otherUserId = message.recipientId;
        const currentUser = getAuth().currentUser;

        if (currentUser && otherUserId && otherUserId !== currentUser.uid) {
          // Get current user info to ensure we have correct sender details
          let senderName = message.senderName;
          let senderPhoto = message.senderPhoto;

          // If sender info is missing, try to get it
          if (!senderName || !senderPhoto) {
            try {
              const currentUserDoc = await getDoc(
                doc(collection(getFirestore(), 'users'), currentUser.uid),
              );

              if (currentUserDoc.exists()) {
                const userData = currentUserDoc.data() || {};
                senderName =
                  senderName ||
                  userData.fullName ||
                  userData.username ||
                  currentUser.uid;
                senderPhoto =
                  senderPhoto ||
                  userData.photoURL ||
                  userData.profilePicture ||
                  userData.image;
              }
            } catch (err) {
              logger.error(
                'Error getting current user data for backend notification:',
                err,
                'MessageService',
              );
              // Continue with what we have
            }
          }

          // Add notification metadata for backend with proper sender info
          const notificationPayload = {
            recipientId: otherUserId,
            senderId: currentUser.uid,
            senderName: senderName || 'User',
            senderPhoto: senderPhoto || '',
            message: message.text,
            conversationId: conversationId,
            isQrInitiated: isQrInitiated,
          };

          logger.debug(
            'Sending backend notification with payload:',
            notificationPayload,
            'MessageService',
          );

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
                logger.debug(
                  'Backend notification response:',
                  data,
                  'MessageService',
                );
              } else {
                const errorText = await response.text();
                logger.error(
                  `Backend notification failed with status: ${response.status}`,
                  errorText,
                  'MessageService',
                );
                logger.error(
                  'Backend notification error body:',
                  errorText,
                  'MessageService',
                );

                // If we get a 404 specifically with /batch in the error, it's likely
                // the Vercel routing issue with Firebase batch endpoint
                if (response.status === 404 && errorText.includes('/batch')) {
                  logger.warn(
                    'Detected Firebase batch endpoint issue with Vercel, using local notification only',
                    undefined,
                    'MessageService',
                  );
                  // Continue with message sending despite notification failure
                }
              }
            } catch (error) {
              // This catch block will handle network errors and the 404 batch error
              logger.error(
                'Error sending backend notification:',
                error,
                'MessageService',
              );
              logger.warn(
                'Using local notification only',
                undefined,
                'MessageService',
              );
              // Local notification handled above, so we can safely continue
            }
          } else {
            logger.warn(
              'Device is offline, using local notification only',
              undefined,
              'MessageService',
            );
          }
        }
      } catch (error) {
        logger.error('Error preparing notification:', error, 'MessageService');
        // Errors in notification should not prevent message sending
      }

      return newMessage;
    } catch (error) {
      logger.error(
        'MessageService :: sendMessage() ::',
        error,
        'MessageService',
      );
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
      logger.warn(
        'Network connectivity check failed:',
        error,
        'MessageService',
      );
      return false;
    }
  }

  // Get messages for a conversation
  getMessages(conversationId: string, limit = 50) {
    return query(
      this.messagesCollection,
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'desc'),
      fs_limit(limit),
    );
  }

  // Listen to user conversations
  listenToConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void,
  ) {
    return onSnapshot(
      query(
        this.conversationsCollection,
        where('participants', 'array-contains', userId),
        orderBy('lastMessage.timestamp', 'desc'),
      ),
      (snapshot: FirebaseFirestoreTypes.QuerySnapshot<Conversation>) => {
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
        logger.error(
          'Error listening to conversations:',
          error,
          'MessageService',
        );
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
      const conversationsQuery = await getDocs(
        query(
          this.conversationsCollection,
          where('participants', 'array-contains', userId),
        ),
      );

      if (conversationsQuery.empty) {
        logger.debug(
          'No conversations found for user',
          userId,
          'MessageService',
        );
        return;
      }

      // Create batch to update all conversations at once
      const batch = writeBatch(getFirestore());

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
      logger.debug(
        `Updated participant details for user ${userId} in ${conversationsQuery.size} conversations`,
        undefined,
        'MessageService',
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
      const conversationDoc = await getDoc(
        doc(this.conversationsCollection, conversationId),
      );
      if (!conversationDoc.exists()) {
        logger.warn(
          `Conversation ${conversationId} not found. Cannot mark messages as read.`,
          undefined,
          'MessageService',
        );
        return;
      }

      // Update unread count in conversation
      await updateDoc(doc(this.conversationsCollection, conversationId), {
        [`unreadCount.${userId}`]: 0,
      });

      // Get all unread messages
      const unreadMessages = await getDocs(
        query(
          this.messagesCollection,
          where('conversationId', '==', conversationId),
          where('recipientId', '==', userId),
          where('read', '==', false),
        ),
      );

      // Create batch to update all messages at once
      const batch = writeBatch(getFirestore());
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
      const messageDoc = await getDoc(doc(this.messagesCollection, messageId));
      if (!messageDoc.exists()) {
        logger.warn(
          `Message ${messageId} not found. Cannot delete message.`,
          undefined,
          'MessageService',
        );
        return;
      }

      await deleteDoc(doc(this.messagesCollection, messageId));
    } catch (error) {
      throw this.errorHandler.handleError(error, 'Failed to delete message');
    }
  }

  // Edit a message
  async editMessage(messageId: string, newText: string): Promise<void> {
    try {
      // Check if the message exists first
      const messageDocRef = doc(this.messagesCollection, messageId);
      const messageDocSnapshot = await getDoc(messageDocRef);

      if (!messageDocSnapshot.exists()) {
        logger.warn(
          `Message ${messageId} not found. Cannot edit message.`,
          undefined,
          'MessageService',
        );
        return;
      }

      const timestamp = new Date().getTime();
      await updateDoc(messageDocRef, {
        text: newText,
        edited: true,
        editedAt: timestamp,
      });

      // Get the message data
      const messageData = messageDocSnapshot.data() as Message;

      if (messageData?.conversationId) {
        // Check if the conversation exists
        const conversationDocRef = doc(
          this.conversationsCollection,
          messageData.conversationId,
        );
        const conversationDocSnapshot = await getDoc(conversationDocRef);

        if (!conversationDocSnapshot.exists()) {
          logger.warn(
            `Conversation ${messageData.conversationId} not found. Cannot update last message.`,
            undefined,
            'MessageService',
          );
          return;
        }

        const conversationData = conversationDocSnapshot.data() as Conversation;

        // Update the last message in conversation if this is the last message
        if (
          conversationData?.lastMessage?.senderId === messageData.senderId &&
          conversationData?.lastMessage?.timestamp === messageData.timestamp
        ) {
          await updateDoc(conversationDocRef, {
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
      const conversationDoc = await getDoc(
        doc(this.conversationsCollection, conversationId),
      );
      if (!conversationDoc.exists()) {
        logger.warn(
          `Conversation ${conversationId} not found. Cannot update typing status.`,
          undefined,
          'MessageService',
        );
        return;
      }

      await updateDoc(doc(this.conversationsCollection, conversationId), {
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
      const conversationDoc = await getDoc(
        doc(this.conversationsCollection, conversationId),
      );
      if (!conversationDoc.exists()) {
        logger.warn(
          `Conversation ${conversationId} not found. Cannot delete conversation.`,
          undefined,
          'MessageService',
        );
        return;
      }

      // Get all messages in the conversation
      const messagesSnapshot = await getDocs(
        query(
          this.messagesCollection,
          where('conversationId', '==', conversationId),
        ),
      );

      // Create a batch to delete all messages
      const batch = writeBatch(getFirestore());

      // Add message deletions to batch
      messagesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Add conversation deletion to batch
      batch.delete(doc(this.conversationsCollection, conversationId));

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
