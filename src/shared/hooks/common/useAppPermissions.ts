import {useEffect, useState} from 'react';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import {PushNotificationHandler} from 'shared/utils/PushNotificationHandler';

const STARTUP_PERMISSION_DELAY_MS = 1000;

export const useAppPermissions = (): boolean | null => {
  const [permissionsGranted, setPermissionsGranted] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    let isActive = true;

    const requestAllPermissions = async () => {
      try {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const notificationPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message:
                'This app needs notification permission to send you updates',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );

          if (
            notificationPermission !== PermissionsAndroid.RESULTS.GRANTED &&
            isActive
          ) {
            Alert.alert(
              'Notifications Disabled',
              "You won't receive important notifications. You can enable them in app settings later.",
              [{text: 'OK'}],
            );
          }
        }

        let allPermissionsGranted = true;

        if (Platform.OS === 'android') {
          if (PermissionsAndroid.PERMISSIONS.CAMERA) {
            const cameraPermission = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.CAMERA,
              {
                title: 'Camera Permission',
                message: 'This app needs camera access',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              },
            );

            if (cameraPermission !== PermissionsAndroid.RESULTS.GRANTED) {
              allPermissionsGranted = false;
              console.warn('Camera permission not granted');
            }
          }

          if (PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE) {
            const writeStoragePermission = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
              {
                title: 'Storage Permission',
                message: 'This app needs access to save files',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              },
            );

            if (writeStoragePermission !== PermissionsAndroid.RESULTS.GRANTED) {
              allPermissionsGranted = false;
              console.warn('Write storage permission not granted');
            }
          }

          if (PermissionsAndroid.PERMISSIONS.RECORD_AUDIO) {
            const micPermission = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
              {
                title: 'Microphone Permission',
                message: 'This app needs microphone access',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              },
            );

            if (micPermission !== PermissionsAndroid.RESULTS.GRANTED) {
              allPermissionsGranted = false;
              console.warn('Microphone permission not granted');
            }
          }

          if (!allPermissionsGranted) {
            console.warn('Not all permissions were granted');
          }
        }

        const hasNotificationPermission =
          await PushNotificationHandler.checkPermissions();

        const isGranted =
          hasNotificationPermission || Platform.OS === 'android';

        if (isActive) {
          setPermissionsGranted(isGranted);
        }

        if (!isGranted && Platform.OS === 'ios' && isActive) {
          Alert.alert(
            'Permissions Required',
            'This app requires notification permissions to function properly. Please grant permissions in your device settings.',
            [{text: 'OK'}],
          );
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);

        if (isActive) {
          setPermissionsGranted(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      void requestAllPermissions();
    }, STARTUP_PERMISSION_DELAY_MS);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return permissionsGranted;
};
