import {Platform, PermissionsAndroid} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidCategory,
  TriggerType,
  TimestampTrigger,
} from '@notifee/react-native';

/**
 * PushNotificationHandler - Utility for handling push notifications in the app
 */
export class PushNotificationHandler {
  /**
   * Check and request permissions for push notifications
   * This should be called on app startup
   */
  public static async checkPermissions(): Promise<boolean> {
    try {
      console.log('Checking push notification permissions');

      // For iOS, request permission
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('iOS notification permissions granted');
          return true;
        } else {
          console.log('iOS notification permissions denied');
          return false;
        }
      }

      // For Android, check permission (Android 13+ requires runtime permission)
      if (
        Platform.OS === 'android' &&
        parseInt(Platform.Version.toString(), 10) >= 33
      ) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Android notification permissions granted');
          return true;
        } else {
          console.log('Android notification permissions denied');
          return false;
        }
      }

      // For Android below 13 or if permissions check otherwise succeeded
      return true;
    } catch (error) {
      console.error('Error checking push notification permissions:', error);
      return false;
    }
  }

  /**
   * Register for Firebase push notifications
   * This should be called after permissions are granted
   */
  public static async register(): Promise<string | null> {
    try {
      console.log('Registering for push notifications');
      // Get the FCM token
      await messaging().registerDeviceForRemoteMessages();
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('FCM Token:', fcmToken);
        return fcmToken;
      }

      return null;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Set up message handlers for foreground, background, and quit state messages
   */
  public static setupMessageHandlers(): void {
    // Handle foreground messages
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification received:', remoteMessage);

      // Display the message using Notifee for foreground messages
      await PushNotificationHandler.displayForegroundNotification(
        remoteMessage,
      );
    });
    // Handle notification opened when app is in background
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened from background state:', remoteMessage);

      // Get the data from the notification
      const data = remoteMessage.data || {};

      try {
        // Import DeepLinkHandler dynamically to avoid circular dependencies
        const {DeepLinkHandler} = require('../navigation/DeepLinkHandler');

        // Handle direct message notifications
        if (data.type === 'direct_message' || data.conversationId) {
          console.log('Navigating to chat from notification tap:', {
            conversationId: data.conversationId,
            senderId: data.senderId,
          });

          // Navigate to the chat screen
          DeepLinkHandler.navigate('Chat', {
            conversationId: data.conversationId,
            recipientId: data.senderId,
            recipientName: data.senderName,
            recipientPhoto: data.senderPhoto || '',
          });
        }
      } catch (error) {
        console.error('Error navigating from notification:', error);
      }
    });

    // Check if the app was opened from a notification when in quit state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'App opened from quit state by notification:',
            remoteMessage,
          );

          // Get the data from the notification
          const data = remoteMessage.data || {};

          try {
            // Import DeepLinkHandler dynamically to avoid circular dependencies
            const {DeepLinkHandler} = require('../navigation/DeepLinkHandler');

            // Handle direct message notifications
            if (data.type === 'direct_message' || data.conversationId) {
              console.log('Navigating to chat from initial notification:', {
                conversationId: data.conversationId,
                senderId: data.senderId,
              });

              // Navigate to the chat screen
              DeepLinkHandler.navigate('Chat', {
                conversationId: data.conversationId,
                recipientId: data.senderId,
                recipientName: data.senderName,
                recipientPhoto: data.senderPhoto || '',
              });
            }
          } catch (error) {
            console.error('Error navigating from initial notification:', error);
          }
        }
      });
  }

  /**
   * Get any pending navigation from a notification tap
   * Apps should call this when navigation is ready
   */
  public static getPendingNavigation(): {screen: string; params: any} | null {
    const navigation = PushNotificationHandler.pendingNavigation;
    PushNotificationHandler.pendingNavigation = null;
    return navigation;
  }

  // Static property to store navigation info from notifications
  private static pendingNavigation: {screen: string; params: any} | null = null;

  /**
   * Display a foreground notification using Notifee
   * This is needed because FCM notifications don't show in the foreground by default
   */
  public static async displayForegroundNotification(
    message: any,
  ): Promise<void> {
    try {
      // Create a channel for the notification
      const channelId = await notifee.createChannel({
        id: 'fcm_foreground',
        name: 'Foreground Notifications',
        lights: true,
        vibration: true,
        importance: 4, // High importance
      });

      // Extract notification data
      const notification = message.notification || {};
      const data = message.data || {};

      // Display the notification
      await notifee.displayNotification({
        title: notification.title || 'New Notification',
        body: notification.body || '',
        data: data,
        android: {
          channelId,
          pressAction: {
            id: 'default',
          },
          smallIcon: 'ic_notification_logo', // Make sure this exists in your drawable folders
          largeIcon: data.senderPhoto || '',
          importance: 4, // High
          sound: 'default',
          vibrationPattern: [300, 500],
          category: AndroidCategory.ALARM,
        },
        ios: {
          foregroundPresentationOptions: {
            badge: true,
            sound: true,
            banner: true,
            list: true,
          },
        },
      });
    } catch (error) {
      console.error('Error displaying foreground notification:', error);
    }
  }

  /**
   * Configure notification channels (Android only)
   * This should be called during app initialization
   */
  public static configureChannels(): void {
    if (Platform.OS === 'android') {
      notifee.createChannel({
        id: 'fcm_foreground',
        name: 'FCM Notifications',
        description: 'Notifications received from Firebase Cloud Messaging',
        lights: true,
        vibration: true,
        importance: 4, // High
      });

      // Create task reminder channel
      notifee.createChannel({
        id: 'task_reminders',
        name: 'Task Reminders',
        description: 'Notifications for task due dates',
        lights: true,
        vibration: true,
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });

      // Create test notification channel
      notifee.createChannel({
        id: 'test_notification',
        name: 'Test Notifications',
        description: 'For testing notification delivery',
        lights: true,
        vibration: true,
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });
    }
  }

  /**
   * Unregister from Firebase push notifications
   * Call this when logging out
   */
  public static async unregister(): Promise<void> {
    try {
      // We no longer delete the FCM token to ensure notifications can still be delivered
      // when the app is closed. Instead, we rely on FCMTokenManager to manage token validity.
      // Previously: await messaging().deleteToken();

      console.log('FCM token preserved for background notifications');
    } catch (error) {
      console.error('Error handling push notification unregistration:', error);
    }
  }
}
