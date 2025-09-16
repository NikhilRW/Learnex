import {Platform, ToastAndroid, Alert} from 'react-native';

export const showErrorToast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // For iOS, use Alert since it doesn't have a native Toast
    Alert.alert('Error', message);
  }
};

export const showSuccessToast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // For iOS, use Alert since it doesn't have a native Toast
    Alert.alert('Success', message);
  }
};
