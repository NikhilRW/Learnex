/**
 * @format
 */
import 'react-native-url-polyfill/auto';
import notifee, {
  AndroidImportance,
  AndroidVisibility,
} from '@notifee/react-native';
import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';

// Register main component
AppRegistry.registerComponent(appName, () => App);

// Create notification channels at app startup
async function createChannels() {
  await notifee.createChannel({
    id: 'direct_messages',
    name: 'Direct Messages',
    description: 'Notifications for direct messages',
    lights: true,
    vibration: true,
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
  });
}
createChannels().catch(console.error);

// Register foreground service
notifee.registerForegroundService(notification => {
  return new Promise(() => {});
});

// Handle background messages when app is closed or in background
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message received:', remoteMessage);

  // Extract notification details (works for both notification and data messages)
  const {title, body} = remoteMessage.notification || {};
  const {data} = remoteMessage;

  console.log('Background message details:', {
    title,
    body,
    data,
  });
	console.log("sender photo : "+data.senderPhoto);
	
  // For data-only messages or to customize notification appearance
  await notifee.displayNotification({
    title: title || data?.title || 'New Message',
    body: body || data?.body || 'You have a new message',
    data: {
      ...data,
	type: data?.type || 'direct_message',
	  title: title || data?.title,
      body: body || data?.body,
      conversationId: data?.conversationId || '',
      senderId: data?.senderId || '',
      senderName: data?.senderName || 'User',
      senderPhoto: data?.senderPhoto || 'https://cdn.worldvectorlogo.com/logos/react-native-1.svg',
      messageId: data?.messageId || '',
    },
    android: {
      channelId: 'direct_messages',
      importance: AndroidImportance.HIGH,
      priority: 'high',
      smallIcon: 'ic_notification_logo',
	  largeIcon: data.senderPhoto,
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      sound: 'default',
      vibrationPattern: [300, 500],
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

  return Promise.resolve();
});
