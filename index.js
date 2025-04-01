/**
 * @format
 */
import 'react-native-url-polyfill/auto';
import notifee from "@notifee/react-native";
import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
notifee.registerForegroundService(notification => {
	return new Promise( () => {
	} );
} );