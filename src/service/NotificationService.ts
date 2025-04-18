import notifee, {
  AndroidImportance,
  AndroidVisibility,
  EventType,
  TriggerType,
  TimestampTrigger,
  AndroidCategory,
} from '@notifee/react-native';
import {ToastAndroid, Platform} from 'react-native';
import {NavigationProp} from '@react-navigation/native';
import {UserStackParamList} from '../routes/UserStack';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import {Message} from '../models/Message';
import {Task} from '../types/taskTypes';
import {PushNotificationHandler} from '../utils/PushNotificationHandler';
import {FCMTokenManager} from '../utils/FCMTokenManager';

// Channel ID for direct messages
const DM_CHANNEL_ID = 'direct_messages';
// Channel ID for keeping the service alive
const PERSISTENCE_CHANNEL_ID = 'message_service_persistence';
// Channel ID for task notifications
const TASK_CHANNEL_ID = 'task_reminders';
// Channel ID for FCM notifications
const FCM_CHANNEL_ID = 'fcm_notifications';

/**
 * NotificationService class handles all notification-related functionality
 * including creating channels, displaying notifications, and handling notification events
 *
 * For direct messages, we use a device-to-device approach:
 * - Each user's device FCM token is stored in Firestore
 * - When a user sends a message, notifications are sent directly to the recipient's device tokens
 * - This is more appropriate for direct messaging than topic-based messaging
 * - The backend API fetches recipient tokens and sends notifications directly to those tokens
 */
export class NotificationService {
  // Store active message listeners to avoid duplicates
  private messageListeners: {[userId: string]: () => void} = {};
  private isServiceRunning: boolean = false;
  private notificationPreferencesCollection = firestore().collection(
    'notificationPreferences',
  );
  // Store active tasks listeners
  private taskListeners: {[userId: string]: () => void} = {};
  // Store FCM token
  private fcmToken: string | null = null;
  // Store listener for keep-alive notifications
  private keepAliveEventListener: (() => void) | undefined = undefined;
  // Store processed message IDs to avoid duplicate notifications
  private processedMessageIds: Set<string> = new Set();

  /**
   * Initialize FCM and request permissions
   * This should be called during app startup
   */
  async initializeFCM(): Promise<boolean> {
    try {
      // Request permissions
      const hasPermission = await PushNotificationHandler.checkPermissions();
      if (!hasPermission) {
        console.log('Push notification permissions not granted');
        return false;
      }

      // Register with FCM
      this.fcmToken = await PushNotificationHandler.register();
      if (!this.fcmToken) {
        console.log('Failed to get FCM token');
        return false;
      }

      // Save the token to Firestore
      await FCMTokenManager.saveToken(this.fcmToken);

      // Set up message handlers
      PushNotificationHandler.setupMessageHandlers();

      // Listen for token refresh
      this.setupTokenRefreshListener();

      return true;
    } catch (error) {
      console.error('Failed to initialize FCM:', error);
      return false;
    }
  }

  /**
   * Listen for FCM token refresh and update in Firestore
   */
  private setupTokenRefreshListener(): void {
    messaging().onTokenRefresh(async (token: string) => {
      console.log('FCM token refreshed:', token);
      this.fcmToken = token;
      await FCMTokenManager.saveToken(token);
    });
  }

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
          smallIcon: 'ic_notification',
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

        // Create task reminders channel
        await notifee.createChannel({
          id: TASK_CHANNEL_ID,
          name: 'Task Reminders',
          description: 'Notifications for task due dates',
          lights: true,
          vibration: true,
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
        });

        // Create FCM notifications channel
        await notifee.createChannel({
          id: FCM_CHANNEL_ID,
          name: 'Push Notifications',
          description: 'Remote push notifications',
          lights: true,
          vibration: true,
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
        });
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

    // If service is already running, don't start another one
    if (this.isServiceRunning) {
      console.log('Persistent service already running, skipping restart');
      return;
    }

    try {
      // For Xiaomi/POCO devices, we need to make sure channels are set up first
      await this.setupNotificationChannels();

      // Cancel any existing notifications first
      await notifee.cancelAllNotifications();

      // Also cancel any existing trigger notifications, including our keep-alive
      await notifee.cancelTriggerNotification('keep_alive');

      // Create a foreground service notification that will keep the app alive
      // This is necessary for devices that aggressively kill background processes
      await notifee.displayNotification({
        id: 'persistent_service',
        title: 'Learnex',
        body: 'Keeping you connected',
        android: {
          channelId: PERSISTENCE_CHANNEL_ID,
          asForegroundService: true, // This is crucial for keeping the app alive
          ongoing: true, // Make it ongoing so it can't be dismissed
          autoCancel: false, // Don't allow it to be cancelled
          pressAction: {
            id: 'default',
          },
          importance: AndroidImportance.LOW, // Low importance to minimize battery impact
          visibility: AndroidVisibility.PUBLIC, // Show in notification shade
          color: '#3EB9F1',
          smallIcon: 'ic_notification_logo', // Use a valid drawable resource name
          // Remove or update the largeIcon if needed
          largeIcon:
            'https://res.cloudinary.com/dcyysl4h7/image/upload/v1744878330/icon_z9rgbp.png',
        },
      });

      // Also schedule a periodic task that runs every 15 minutes to keep the app alive
      // This provides redundancy in case the foreground service is killed
      const now = Date.now();
      const fifteenMinutes = 15 * 60 * 1000;

      // Schedule a silent notification that will be used to keep the app alive
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: now + fifteenMinutes,
        alarmManager: {
          allowWhileIdle: true,
        },
      };

      // Create a silent notification that will be used to keep the app alive
      await notifee.createTriggerNotification(
        {
          id: 'keep_alive',
          title: 'Learnex',
          body: 'Keeping you connected',
          android: {
            channelId: PERSISTENCE_CHANNEL_ID,
            asForegroundService: false, // Don't show as a foreground service
            ongoing: false, // Don't make it ongoing
            autoCancel: true, // Allow it to be cancelled
            pressAction: {
              id: 'default',
            },
            smallIcon: 'ic_notification_logo', // Add smallIcon reference
            importance: AndroidImportance.MIN,
            visibility: AndroidVisibility.SECRET, // Hide from notification shade
          },
        },
        trigger,
      );

      // Remove any existing event listener to prevent memory leaks
      if (this.keepAliveEventListener) {
        this.keepAliveEventListener();
      }

      // Set up a listener to reschedule the keep-alive task when it's triggered
      this.keepAliveEventListener = notifee.onForegroundEvent(
        ({type, detail}) => {
          if (
            type === EventType.TRIGGER_NOTIFICATION_CREATED &&
            detail.notification?.id === 'keep_alive'
          ) {
            // Reschedule the keep-alive task
            this.startPersistentService();
          }
        },
      );

      this.isServiceRunning = true;
      console.log('Persistent service started with foreground notification');
    } catch (err) {
      console.error('Failed to start persistent service:', err);
      this.isServiceRunning = false;
      throw err; // rethrow to allow caller to handle
    }
  }

  /**
   * Stop the persistent service
   */
  async stopPersistentService(): Promise<void> {
    if (!this.isServiceRunning) return;

    try {
      // Cancel any existing keep-alive notifications
      await notifee.cancelTriggerNotification('keep_alive');

      // Cancel the foreground service notification
      await notifee.cancelNotification('persistent_service');

      // Remove the event listener
      if (this.keepAliveEventListener) {
        this.keepAliveEventListener();
        this.keepAliveEventListener = undefined;
      }

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
            snapshot.docChanges().forEach(change => {
              // Only process newly added messages
              if (change.type === 'added') {
                const message = change.doc.data() as Message;
                const messageId = change.doc.id;

                // Skip if this message has already been processed
                if (this.processedMessageIds.has(messageId)) {
                  console.log(
                    `Skipping already processed message: ${messageId}`,
                  );
                  return;
                }

                // Add to processed messages set
                this.processedMessageIds.add(messageId);

                // Keep the set size manageable by limiting to the last 100 messages
                if (this.processedMessageIds.size > 100) {
                  // Convert to array, remove oldest entries, convert back to set
                  const messagesArray = Array.from(this.processedMessageIds);
                  this.processedMessageIds = new Set(messagesArray.slice(-100));
                }

                // Verify this is a new message (within the last minute)
                const messageTime = message.timestamp;
                const now = Date.now();
                const ONE_MINUTE = 60000; // 60 seconds in milliseconds
                const messageAge = now - messageTime;

                // For POCO and other Chinese devices, let's be more lenient
                // with the time window to improve notification reliability
                const TIME_WINDOW =
                  Platform.OS === 'android' ? 300000 : ONE_MINUTE; // 5 minutes for Android

                if (messageAge < TIME_WINDOW) {
                  // Only show notification if the sender is not the current user
                  if (message.senderId !== userId) {
                    this.displayMessageNotification(
                      message.senderId,
                      message.senderName,
                      message.text,
                      message.conversationId,
                      message.recipientId,
                      message.senderPhoto,
                      messageId,
                    );
                  }
                }
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
   * @param messageId Optional ID of the message (if available)
   * @returns Boolean indicating success
   */
  async displayMessageNotification(
    senderId: string,
    senderName: string,
    message: string,
    conversationId: string,
    recipientId: string,
    senderPhoto?: string,
    messageId?: string,
  ): Promise<boolean> {
    try {
      // Don't show notifications for your own messages
      const currentUserId = auth().currentUser?.uid;
      if (currentUserId === senderId) {
        return false;
      }

      // Check if the sender is muted
      const isMuted = await this.isRecipientMuted(senderId);
      if (isMuted) {
        return false;
      }

      // If messageId is provided and it's already in the processed list, skip
      if (messageId && this.processedMessageIds.has(messageId)) {
        console.log(
          `Skipping already processed notification for message: ${messageId}`,
        );
        return false;
      }

      // Add to processed messages if a messageId is provided
      if (messageId) {
        this.processedMessageIds.add(messageId);
      }

      // Check if user is already in the conversation to avoid unnecessary notifications
      // This would require more complex implementation with a service to track active screens

      // Validate the senderPhoto URL
      let largeIcon = undefined;
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
          messageId: messageId || '', // Include the message ID in the notification data
        },
        android: {
          channelId: DM_CHANNEL_ID,
          pressAction: {
            id: 'open_conversation',
            launchActivity: 'default',
          },
          // Add notification styling
          smallIcon: 'ic_notification_logo',
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
              messageId?: string;
            };

            // Add the message ID to processed list if available
            if (data.messageId && typeof data.messageId === 'string') {
              console.log(
                `Adding clicked message to processed list: ${data.messageId}`,
              );
              this.processedMessageIds.add(data.messageId);
            }

            // Try to use DeepLinkHandler first for consistent navigation
            try {
              const {
                DeepLinkHandler,
              } = require('../navigation/DeepLinkHandler');
              console.log(
                'Navigating to chat from foreground notification via DeepLinkHandler',
              );

              DeepLinkHandler.navigate('Chat', {
                conversationId: data.conversationId,
                recipientId: data.senderId,
                recipientName: data.senderName,
                recipientPhoto: data.senderPhoto || '',
              });
            } catch (error) {
              console.log('Falling back to direct navigation', error);

              // Fallback to direct navigation if DeepLinkHandler fails
              navigation.navigate('Chat', {
                conversationId: data.conversationId,
                recipientId: data.senderId,
                recipientName: data.senderName,
                recipientPhoto: data.senderPhoto || '',
              });
            }
          } else if (detail.notification?.data?.type === 'task_reminder') {
            // Navigate to the tasks screen
            navigation.navigate('Tasks');
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
      if (type === EventType.PRESS) {
        if (detail.notification?.data?.type === 'direct_message') {
          const data = detail.notification.data || {};

          // Extract message ID if available and add to processed messages
          const messageId = data.messageId;
          if (messageId && typeof messageId === 'string') {
            console.log(
              `Adding clicked message to processed list: ${messageId}`,
            );
            this.processedMessageIds.add(messageId);
          }

          // Try to navigate to the conversation using DeepLinkHandler
          try {
            const {DeepLinkHandler} = require('../navigation/DeepLinkHandler');
            console.log('Navigating to chat from Notifee background event:', {
              conversationId: data.conversationId,
              senderId: data.senderId,
            });

            // Use DeepLinkHandler to navigate
            DeepLinkHandler.navigate('Chat', {
              conversationId: data.conversationId,
              recipientId: data.senderId,
              recipientName: data.senderName,
              recipientPhoto: data.senderPhoto || '',
            });
          } catch (error) {
            console.error(
              'Error navigating from Notifee background event:',
              error,
            );
          }

          // Clear the notification
          if (detail.notification.id) {
            await notifee.cancelNotification(detail.notification.id);
          }
        } else if (detail.notification?.data?.type === 'task_reminder') {
          // Handle task reminder press
          // Navigation will be handled separately
          if (detail.notification.id) {
            await notifee.cancelNotification(detail.notification.id);
          }
        }
      }
    });
  }

  /**
   * Check if notifications from a specific user are muted
   *
   * @param recipientId The ID of the user to check
   * @returns Promise<boolean> True if notifications are muted
   */
  async isRecipientMuted(recipientId: string): Promise<boolean> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return false;

      const prefsDoc = await this.notificationPreferencesCollection
        .doc(currentUser.uid)
        .get();

      if (!prefsDoc.exists) return false;

      const prefs = prefsDoc.data();
      return prefs?.mutedRecipients?.includes(recipientId) ?? false;
    } catch (error) {
      console.error('Error checking if recipient is muted:', error);
      return false;
    }
  }

  /**
   * Mute notifications from a specific user
   *
   * @param recipientId The ID of the user to mute
   * @returns Promise<boolean> True if successful
   */
  async muteRecipient(recipientId: string): Promise<boolean> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return false;

      const userId = currentUser.uid;
      const userPrefsRef = this.notificationPreferencesCollection.doc(userId);

      // Get current preferences
      const prefsDoc = await userPrefsRef.get();

      if (prefsDoc.exists) {
        // Update existing preferences
        await userPrefsRef.update({
          mutedRecipients: firestore.FieldValue.arrayUnion(recipientId),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Create new preferences document
        await userPrefsRef.set({
          userId,
          mutedRecipients: [recipientId],
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      return true;
    } catch (error) {
      console.error('Error muting recipient:', error);
      return false;
    }
  }

  /**
   * Unmute notifications from a specific user
   *
   * @param recipientId The ID of the user to unmute
   * @returns Promise<boolean> True if successful
   */
  async unmuteRecipient(recipientId: string): Promise<boolean> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return false;

      const userId = currentUser.uid;
      const userPrefsRef = this.notificationPreferencesCollection.doc(userId);

      // Get current preferences
      const prefsDoc = await userPrefsRef.get();

      if (prefsDoc.exists) {
        // Remove the recipient from the muted list
        await userPrefsRef.update({
          mutedRecipients: firestore.FieldValue.arrayRemove(recipientId),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      return true;
    } catch (error) {
      console.error('Error unmuting recipient:', error);
      return false;
    }
  }

  /**
   * Toggle mute status for a recipient
   *
   * @param recipientId The ID of the user to toggle mute status
   * @returns Promise<boolean> New mute status (true = muted)
   */
  async toggleMuteRecipient(recipientId: string): Promise<boolean> {
    const isMuted = await this.isRecipientMuted(recipientId);

    if (isMuted) {
      await this.unmuteRecipient(recipientId);
      return false; // Now unmuted
    } else {
      await this.muteRecipient(recipientId);
      return true; // Now muted
    }
  }

  /**
   * Schedule a notification for a task
   *
   * @param task The task to schedule a notification for
   * @returns The notification ID if scheduling was successful
   */
  async scheduleTaskNotification(task: Task): Promise<string | null> {
    try {
      console.log(
        'Attempting to schedule notification for task:',
        task.id,
        task.title,
      );

      // If task doesn't have notify enabled or doesn't have a valid date/time, don't schedule
      if (!task.notify || !task.dueDate || !task.dueTime) {
        console.log(
          'Task missing required notification fields:',
          JSON.stringify({
            id: task.id,
            notify: task.notify,
            dueDate: task.dueDate,
            dueTime: task.dueTime,
          }),
        );
        return null;
      }

      // Parse the due date and time manually
      const [year, month, day] = task.dueDate
        .split('-')
        .map(num => parseInt(num, 10));
      const [hours, minutes] = task.dueTime
        .split(':')
        .map(num => parseInt(num, 10));

      console.log('Parsed date/time components:', {
        year,
        month,
        day,
        hours,
        minutes,
      });

      // Create a local Date object solely for displaying logs
      const dateForLogging = new Date(year, month - 1, day, hours, minutes, 0);
      console.log('Due date for logging:', dateForLogging.toString());

      // Calculate the timestamp directly using Indian time (UTC+5:30)
      // Create timestamp using a direct calculation approach
      // We'll create the date in Indian Standard Time directly
      const date = new Date();
      // Set the local date components
      date.setFullYear(year);
      date.setMonth(month - 1); // Month is 0-indexed
      date.setDate(day);
      date.setHours(hours);
      date.setMinutes(minutes);
      date.setSeconds(0);
      date.setMilliseconds(0);

      // Get the Unix timestamp in milliseconds
      const dueTimestamp = date.getTime();
      console.log('Calculated due timestamp:', dueTimestamp);

      // Get current timestamp for comparison
      const nowTimestamp = Date.now();
      console.log('Current timestamp:', nowTimestamp);

      // Validate if the timestamp is in the future
      if (isNaN(dueTimestamp)) {
        console.warn('Invalid timestamp calculated for task:', task.id);
        return null;
      }

      if (dueTimestamp <= nowTimestamp) {
        console.warn(
          'Task due time is in the past:',
          task.id,
          'Due timestamp:',
          dueTimestamp,
          'Current timestamp:',
          nowTimestamp,
          'Difference in minutes:',
          (nowTimestamp - dueTimestamp) / (1000 * 60),
        );
        return null;
      }

      // Create timestamp trigger directly without using Date objects
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: dueTimestamp,
        alarmManager:
          Platform.OS === 'android'
            ? {
                allowWhileIdle: true, // Ensure delivery even in doze mode
              }
            : undefined,
      };

      console.log('Scheduling notification for timestamp:', dueTimestamp);
      console.log(
        'Time until notification:',
        (dueTimestamp - nowTimestamp) / 1000,
        'seconds',
      );

      // Schedule the notification with the trigger
      const notificationId = await notifee.createTriggerNotification(
        {
          id: `task_${task.id}`,
          title: `Task Due: ${task.title}`,
          body: task.description || 'Your task is due now.',
          android: {
            channelId: TASK_CHANNEL_ID,
            pressAction: {
              id: 'open_task',
              launchActivity: 'default',
            },
            smallIcon: 'ic_notification_logo',
            importance: AndroidImportance.HIGH,
            sound: 'default',
            vibrationPattern: [300, 500],
            category: AndroidCategory.ALARM, // Mark as alarm for better delivery
            fullScreenAction: {
              // Show even on lock screen
              id: 'default',
            },
          },
          ios: {
            categoryId: 'task_reminder',
            sound: 'default',
            critical: true, // Mark as critical to boost delivery priority
          },
          data: {
            type: 'task_reminder',
            taskId: task.id,
          },
        },
        trigger,
      );

      console.log('Task notification scheduled with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule task notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled task notification
   *
   * @param notificationId The ID of the notification to cancel
   */
  async cancelTaskNotification(notificationId: string): Promise<void> {
    try {
      if (notificationId) {
        await notifee.cancelNotification(notificationId);
      }
    } catch (error) {
      console.error('Failed to cancel task notification:', error);
    }
  }

  /**
   * Setup task notification listener for changed or new tasks
   */
  setupTaskNotificationListener(): void {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      console.warn(
        'Cannot setup task notification listener: User not logged in',
      );
      return;
    }

    // Clear any existing listener
    this.removeTaskListener();

    const userId = currentUser.uid;
    console.log('Setting up task notification listener for user:', userId);

    try {
      // Listen for tasks that have notifications enabled and are not completed
      const unsubscribe = firestore()
        .collection('tasks')
        .where('userId', '==', userId)
        .where('notify', '==', true)
        .where('completed', '==', false)
        .onSnapshot(
          async snapshot => {
            console.log(
              `Task snapshot received with ${
                snapshot.docChanges().length
              } changes`,
            );

            snapshot.docChanges().forEach(async change => {
              const task = {id: change.doc.id, ...change.doc.data()} as Task;
              console.log(
                `Task change detected: ${change.type} - Task: ${task.id}, ${task.title}`,
              );

              if (change.type === 'added' || change.type === 'modified') {
                // If task already has a notification, cancel it first
                if (task.notificationId) {
                  console.log(
                    `Cancelling existing notification for task: ${task.id}`,
                  );
                  await this.cancelTaskNotification(task.notificationId);
                }

                // Schedule a new notification if task is not completed
                if (!task.completed) {
                  console.log(
                    `Scheduling notification for task: ${task.id}, ${task.title}`,
                  );
                  const notificationId = await this.scheduleTaskNotification(
                    task,
                  );

                  // Update the task with the new notification ID
                  if (notificationId) {
                    console.log(
                      `Updating task with new notification ID: ${notificationId}`,
                    );
                    await firestore().collection('tasks').doc(task.id).update({
                      notificationId: notificationId,
                    });
                  } else {
                    console.warn(
                      `Failed to schedule notification for task: ${task.id}`,
                    );
                  }
                }
              } else if (change.type === 'removed') {
                // If task is deleted, cancel its notification
                if (task.notificationId) {
                  console.log(
                    `Cancelling notification for deleted task: ${task.id}`,
                  );
                  await this.cancelTaskNotification(task.notificationId);
                }
              }
            });
          },
          error => {
            console.error('Error listening for task notifications:', error);
            // Try to reestablish the listener after a delay
            setTimeout(() => this.setupTaskNotificationListener(), 5000);
          },
        );

      // Store the unsubscribe function
      this.taskListeners[userId] = unsubscribe;
      console.log('Task notification listener setup complete');
    } catch (error) {
      console.error('Failed to set up task notification listener:', error);
      // Try again with a delay
      setTimeout(() => this.setupTaskNotificationListener(), 5000);
    }
  }

  /**
   * Remove task notification listener
   */
  removeTaskListener(): void {
    const currentUser = auth().currentUser;
    if (currentUser && this.taskListeners[currentUser.uid]) {
      this.taskListeners[currentUser.uid]();
      delete this.taskListeners[currentUser.uid];
    }
  }

  /**
   * Clean up FCM related listeners and tokens
   * Call this when user logs out
   */
  async cleanupFCM(): Promise<void> {
    try {
      if (this.fcmToken) {
        // We don't remove the token from Firestore anymore to ensure
        // notifications can still be received when the app is closed
        // Previously: await FCMTokenManager.removeToken(this.fcmToken);
        console.log(
          'FCM token preserved in Firestore for background notifications',
        );

        // Don't unregister or delete the token
        // Previously: await PushNotificationHandler.unregister();

        // Only clear the local reference to the token
        this.fcmToken = null;
      }
    } catch (error) {
      console.error('Error cleaning up FCM:', error);
    }
  }

}

// Create a singleton instance for use throughout the app
const notificationService = new NotificationService();
export default notificationService;
