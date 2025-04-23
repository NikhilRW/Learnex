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
    sound:'notification',
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