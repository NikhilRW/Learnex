import notifee, { AndroidImportance } from '@notifee/react-native';
import { ToastAndroid } from 'react-native';

const createAndSendNotification = async () =>{
    try {
        const channelId = await notifee.createChannel( {
            id: 'screen_capture',
            name: 'Screen Capture',
            lights: false,
            vibration: false,
            importance: AndroidImportance.DEFAULT
        } );
        await notifee.displayNotification( {
            title: 'Screen Capture',
            body: 'Your Screen Is Being Shared On The Meeting....',
            android: {
                channelId,
                asForegroundService: true
            }
        } );
        return true
    } catch( err ) {
        ToastAndroid.show(String(err),ToastAndroid.LONG);
        return false
    };
    
}

const stopNotification = async () =>{
    try {
        await notifee.stopForegroundService();
    } catch( err ) {
        ToastAndroid.show(String(err),ToastAndroid.LONG);
    };
};


export {createAndSendNotification,stopNotification};