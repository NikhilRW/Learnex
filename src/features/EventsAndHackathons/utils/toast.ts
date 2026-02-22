import {Platform, ToastAndroid} from 'react-native';

/**
 * Show a toast message on Android
 * @param message Message to display
 * @param duration 'short' or 'long'
 */
export const showToast = (
  message: string,
  duration: 'short' | 'long' = 'short',
): void => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(
      message,
      duration === 'short' ? ToastAndroid.SHORT : ToastAndroid.LONG,
    );
  }
};
