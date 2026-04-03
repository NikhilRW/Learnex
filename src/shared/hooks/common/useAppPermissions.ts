import {useEffect, useState} from 'react';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import {PushNotificationHandler} from 'shared/utils/PushNotificationHandler';
import {logger} from 'shared/utils/logger';

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
              logger.warn(
                'Camera permission not granted',
                undefined,
                'useAppPermissions',
              );
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
              logger.warn(
                'Write storage permission not granted',
                undefined,
                'useAppPermissions',
              );
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
              logger.warn(
                'Microphone permission not granted',
                undefined,
                'useAppPermissions',
              );
            }
          }

          if (!allPermissionsGranted) {
            logger.warn(
              'Not all permissions were granted',
              undefined,
              'useAppPermissions',
            );
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
        logger.error(
          'Error requesting permissions',
          error,
          'useAppPermissions',
        );

        if (isActive) {
          setPermissionsGranted(false);
        }
      }
    };

    void requestAllPermissions();

    return () => {
      isActive = false;
    };
  }, []);

  return permissionsGranted;
};
