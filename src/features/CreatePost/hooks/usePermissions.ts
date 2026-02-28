import {useState, useEffect} from 'react';
import {Platform, PermissionsAndroid, Alert, Linking} from 'react-native';

/**
 * Manages Android storage permissions needed for media uploads.
 * Requests permissions on mount and exposes a manual re-request function.
 */
export const usePermissions = () => {
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  const [hasStoragePermission, setHasStoragePermission] = useState(false);

  const requestStoragePermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS !== 'android') {
        setHasStoragePermission(true);
        return true;
      }

      const androidVersion = parseInt(String(Platform.Version), 10);
      let permissionGranted = false;

      if (androidVersion >= 33) {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        ];
        const results = await Promise.all(
          permissions.map(permission =>
            PermissionsAndroid.request(permission, {
              title: 'Media Access Permission',
              message:
                'Learnex needs access to your photos and videos to create posts.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }),
          ),
        );
        permissionGranted = results.every(
          result => result === PermissionsAndroid.RESULTS.GRANTED,
        );
      } else if (androidVersion >= 30) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message:
              'Learnex needs access to your storage to upload images and videos for posts.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const storagePermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message:
              'Learnex needs access to your storage to upload images and videos for posts.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        const writePermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Write Permission',
            message:
              'Learnex needs write access to your storage to save temporary files.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        permissionGranted =
          storagePermission === PermissionsAndroid.RESULTS.GRANTED &&
          writePermission === PermissionsAndroid.RESULTS.GRANTED;
      }

      setHasStoragePermission(permissionGranted);

      if (!permissionGranted) {
        Alert.alert(
          'Permission Required',
          'Storage access permission is required to upload images and videos to your posts. Please enable it in your device settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => Linking.openSettings()},
          ],
        );
      }

      return permissionGranted;
    } catch (err) {
      console.warn('Error requesting permissions:', err);
      setHasStoragePermission(false);
      return false;
    } finally {
      setPermissionsChecked(true);
    }
  };

  useEffect(() => {
    requestStoragePermissions();
  }, []);

  return {permissionsChecked, hasStoragePermission, requestStoragePermissions};
};
