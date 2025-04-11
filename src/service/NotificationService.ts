import notifee, {
  AndroidImportance,
  AndroidVisibility,
  EventType,
} from '@notifee/react-native';
import {ToastAndroid, Platform} from 'react-native';
import {NavigationProp} from '@react-navigation/native';
import {UserStackParamList} from '../routes/UserStack';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {Message} from '../models/Message';

// Channel ID for direct messages
const DM_CHANNEL_ID = 'direct_messages';
// Channel ID for keeping the service alive
const PERSISTENCE_CHANNEL_ID = 'message_service_persistence';

/**
 * NotificationService class handles all notification-related functionality
 * including creating channels, displaying notifications, and handling notification events
 */
export class NotificationService {
  // Store active message listeners to avoid duplicates
  private messageListeners: {[userId: string]: () => void} = {};
  private isServiceRunning: boolean = false;

  /**
   * Create a notification channel for screen capture
   */
  async createAndSendScreenCaptureNotification(): Promise<boolean> {
    try {
      const channelId = await notifee.createChannel({
        id: 'screen_capture',
        name: 'Screen Capture',
        lights: false,
        vibration: false,
        importance: AndroidImportance.DEFAULT,
      });
      await notifee.displayNotification({
        title: 'Screen Capture',
        body: 'Your Screen Is Being Shared On The Meeting....',
        android: {
          channelId,
          asForegroundService: true,
        },
      });
      return true;
    } catch (err) {
      ToastAndroid.show(String(err), ToastAndroid.LONG);
      return false;
    }
  }

  /**
   * Stop the foreground notification service
   */
  async stopForegroundService(): Promise<void> {
    try {
      await notifee.stopForegroundService();
    } catch (err) {
      ToastAndroid.show(String(err), ToastAndroid.LONG);
    }
  }

  /**
   * Create all notification channels
   * This should be called during app initialization
   */
  async setupNotificationChannels(): Promise<void> {
    try {
      console.log('Setting up notification channels...');
      // For Android, create notification channels
      if (Platform.OS === 'android') {
        // Create direct messages channel
        await notifee.createChannel({
          id: DM_CHANNEL_ID,
          name: 'Direct Messages',
          description: 'Notifications for direct messages',
          lights: true,
          vibration: true,
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
        });

        // Create a low importance channel for persistence service
        await notifee.createChannel({
          id: PERSISTENCE_CHANNEL_ID,
          name: 'Message Service',
          description: 'Keeps message service running',
          lights: false,
          vibration: false,
          sound: 'none',
          importance: AndroidImportance.MIN,
          visibility: AndroidVisibility.SECRET,
        });

        console.log('Notification channels created successfully');
      } else {
        console.log('Notification channels not needed on this platform');
      }
    } catch (err) {
      console.error('Failed to create notification channels:', err);
    }
  }

  /**
   * Start a persistent foreground service to keep the app alive
   * This is especially important for Xiaomi, POCO, OPPO, and other Chinese phones
   */
  async startPersistentService(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      console.log('Starting persistent service for notifications...');

      // For Xiaomi/POCO devices, we need to make sure channels are set up first
      await this.setupNotificationChannels();

      // Cancel any existing notifications first
      await notifee.cancelAllNotifications();

      // Create a notification to keep the service running
      await notifee.displayNotification({
        title: 'Message Service',
        body: 'Keeping you connected to receive messages',
        android: {
          channelId: PERSISTENCE_CHANNEL_ID,
          asForegroundService: true,
          ongoing: true,
          autoCancel: false,
          pressAction: {
            id: 'default',
          },
          importance: AndroidImportance.MIN,
          visibility: AndroidVisibility.SECRET,
          // Some devices need a more visible notification to prevent killing the service
          smallIcon: 'ic_notification',
        },
      });

      this.isServiceRunning = true;
      console.log('Persistent service started successfully');
    } catch (err) {
      console.error('Failed to start persistent service:', err);
      throw err; // rethrow to allow caller to handle
    }
  }

  /**
   * Stop the persistent service
   */
  async stopPersistentService(): Promise<void> {
    if (!this.isServiceRunning) return;

    try {
      console.log('Stopping persistent service...');
      await notifee.stopForegroundService();
      this.isServiceRunning = false;
      console.log('Persistent service stopped');
    } catch (err) {
      console.error('Failed to stop persistent service:', err);
    }
  }

  /**
   * Set up real-time listener for new messages to trigger notifications
   * Call this when the user logs in
   */
  setupMessageListener(): void {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      console.warn('Cannot setup message listener: User not logged in');
      return;
    }

    // Clean up any existing listener for this user
    this.removeMessageListener();

    // Set up a new listener
    const userId = currentUser.uid;
    console.log(`Setting up message listener for user ${userId}`);

    // Start the persistent service to help with Xiaomi/POCO devices
    // Place this after we confirm we have a logged-in user
    this.startPersistentService().catch(err => {
      console.error('Failed to start persistent service:', err);
      // Try again with a delay
      setTimeout(() => this.startPersistentService(), 2000);
    });

    // Listen for new messages where the user is the recipient
    try {
      const unsubscribe = firestore()
        .collection('messages')
        .where('recipientId', '==', userId)
        .where('read', '==', false)
        .orderBy('timestamp', 'desc')
        .limit(20) // Limit to the 20 most recent unread messages
        .onSnapshot(
          snapshot => {
            console.log(
              `Message snapshot received. Changes: ${
                snapshot.docChanges().length
              }`,
            );

            snapshot.docChanges().forEach(change => {
              // Only process newly added messages
              if (change.type === 'added') {
                const message = change.doc.data() as Message;

                console.log(
                  `New message detected: ${
                    message.senderName
                  }: ${message.text.substring(0, 20)}...`,
                );

                // Verify this is a new message (within the last minute)
                const messageTime = message.timestamp;
                const now = Date.now();
                const ONE_MINUTE = 60000; // 60 seconds in milliseconds
                const messageAge = now - messageTime;

                console.log(
                  `Message age: ${messageAge}ms (limit: ${ONE_MINUTE}ms)`,
                );

                // For POCO and other Chinese devices, let's be more lenient
                // with the time window to improve notification reliability
                const TIME_WINDOW =
                  Platform.OS === 'android' ? 300000 : ONE_MINUTE; // 5 minutes for Android

                if (messageAge < TIME_WINDOW) {
                  console.log('Message is recent, triggering notification');

                  // Only show notification if the sender is not the current user
                  if (message.senderId !== userId) {
                    console.log(
                      `Sender ${message.senderId} is not current user ${userId}, showing notification`,
                    );
                    this.displayMessageNotification(
                      message.senderId,
                      message.senderName,
                      message.text,
                      message.conversationId,
                      message.recipientId,
                      message.senderPhoto,
                    );
                  } else {
                    console.log(
                      'Message is from current user, not showing notification',
                    );
                  }
                } else {
                  console.log('Message is too old, not showing notification');
                }
              } else {
                console.log(`Ignoring message change of type: ${change.type}`);
              }
            });
          },
          error => {
            console.error('Error listening for new messages:', error);
            // Try to reestablish the listener after a short delay
            setTimeout(() => this.setupMessageListener(), 5000);
          },
        );

      // Store the unsubscribe function
      this.messageListeners[userId] = unsubscribe;
      console.log('Message listener setup complete for user', userId);
    } catch (error) {
      console.error('Failed to set up message listener:', error);
      // Try again with a delay
      setTimeout(() => this.setupMessageListener(), 5000);
    }
  }

  /**
   * Remove message listener when user logs out
   */
  removeMessageListener(): void {
    const currentUser = auth().currentUser;
    if (currentUser && this.messageListeners[currentUser.uid]) {
      this.messageListeners[currentUser.uid]();
      delete this.messageListeners[currentUser.uid];
      console.log(`Removed message listener for user ${currentUser.uid}`);
    }

    // Stop the persistent service when logging out
    this.stopPersistentService();
  }

  /**
   * Display a notification for a new direct message
   *
   * @param senderId ID of the message sender
   * @param senderName Name of the message sender
   * @param message Message content
   * @param conversationId ID of the conversation
   * @param recipientId ID of the message recipient
   * @param senderPhoto Optional URL to the sender's profile image
   * @returns Boolean indicating success
   */
  async displayMessageNotification(
    senderId: string,
    senderName: string,
    message: string,
    conversationId: string,
    recipientId: string,
    senderPhoto?: string,
  ): Promise<boolean> {
    try {
      // Don't show notifications for your own messages
      const currentUserId = auth().currentUser?.uid;
      if (currentUserId === senderId) {
        return false;
      }

      // Check if user is already in the conversation to avoid unnecessary notifications
      // This would require more complex implementation with a service to track active screens

      console.log(`Displaying notification: ${senderName}: ${message}`);

      // Validate the senderPhoto URL
      let largeIcon = undefined;
      console.log('senderPhoto', senderPhoto);
      if (senderPhoto && senderPhoto.startsWith('http')) {
        // Only use the URL if it's a valid http(s) URL
        largeIcon = senderPhoto;
      }
      // Create the notification
      await notifee.displayNotification({
        id: `message_${conversationId}_${Date.now()}`,
        title: senderName,
        body: message,
        data: {
          type: 'direct_message',
          conversationId,
          senderId,
          recipientId,
          senderName,
          senderPhoto: senderPhoto || '',
        },
        android: {
          channelId: DM_CHANNEL_ID,
          pressAction: {
            id: 'open_conversation',
            launchActivity: 'default',
          },
          // Add notification styling
          largeIcon: largeIcon,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [300, 500],
        },
        ios: {
          // iOS configuration
          categoryId: 'direct_message',
          threadId: conversationId,
        },
      });

      return true;
    } catch (err) {
      console.error('Failed to display message notification:', err);
      if (Platform.OS === 'android') {
        ToastAndroid.show(String(err), ToastAndroid.LONG);
      }
      return false;
    }
  }

  /**
   * Set up notification handlers to react to notification events
   * Call this during app initialization
   *
   * @param navigation Navigation object to navigate to the chat screen
   * @returns Unsubscribe function to remove event listener
   */
  setupNotificationHandlers(
    navigation: NavigationProp<UserStackParamList>,
  ): () => void {
    return notifee.onForegroundEvent(({type, detail}) => {
      switch (type) {
        case EventType.PRESS:
          // Handle notification press - navigate to conversation
          if (detail.notification?.data?.type === 'direct_message') {
            const data = detail.notification.data as {
              conversationId: string;
              senderId: string;
              senderName: string;
              senderPhoto: string;
            };

            // Navigate to the chat screen
            navigation.navigate('Chat', {
              conversationId: data.conversationId,
              recipientId: data.senderId,
              recipientName: data.senderName,
              recipientPhoto: data.senderPhoto,
            });
          }
          break;
      }
    });
  }

  /**
   * Set up background notification handler
   * This should be called once at app startup
   */
  setupBackgroundHandler(): void {
    // Register background handler
    notifee.onBackgroundEvent(async ({type, detail}) => {
      if (
        type === EventType.PRESS &&
        detail.notification?.data?.type === 'direct_message'
      ) {
        // The navigation will be handled by the Firebase dynamic links or deep links
        // We just need to ensure notification is cleared after click
        if (detail.notification.id) {
          await notifee.cancelNotification(detail.notification.id);
        }
      }
    });
  }
}

// Create a singleton instance for use throughout the app
const notificationService = new NotificationService();
export default notificationService;
