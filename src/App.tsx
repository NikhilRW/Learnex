import React, {useEffect, useState} from 'react';
import {Platform, Linking, Alert, PermissionsAndroid} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import Route from './routes/Route';
import {Provider} from 'react-redux';
import {persistor, store} from './store/store';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {PersistGate} from 'redux-persist/integration/react';
import ThemeListener from './components/user/ThemeListener';
import Loader from './components/auth/Loader';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {setDeepLink} from './reducers/DeepLink';
import {fetchHackathons} from './reducers/Hackathon';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import {DeepLinkHandler} from './navigation/DeepLinkHandler';
import {PushNotificationHandler} from './utils/PushNotificationHandler';
import {styles} from './styles/common/App';

// Interface definition for deep link event
interface DeepLinkEvent {
  url: string;
}

// Interface for subscription returned by Linking
interface LinkingSubscription {
  remove: () => void;
}
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

const App = () => {
  const navigationRef = useNavigationContainerRef();
  const [permissionsGranted, setPermissionsGranted] = useState<boolean | null>(
    null,
  );

  // Check and request all required permissions
  useEffect(() => {
    const requestAllPermissions = async () => {
      try {
        // For Android 13+ (API 33+), request notification permissions explicitly
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

          if (notificationPermission !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Notifications Disabled',
              "You won't receive important notifications. You can enable them in app settings later.",
              [{text: 'OK'}],
            );
          }
        }

        // Request other permissions individually to avoid TypeScript errors
        let allPermissionsGranted = true;

        if (Platform.OS === 'android') {
          // Request camera permission if needed
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

          // Request storage permissions if needed
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

          if (PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE) {
            const readStoragePermission = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
              {
                title: 'Storage Permission',
                message: 'This app needs access to read files',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              },
            );

            if (readStoragePermission !== PermissionsAndroid.RESULTS.GRANTED) {
              allPermissionsGranted = false;
              console.warn('Read storage permission not granted');
            }
          }

          if (!allPermissionsGranted) {
            console.warn('Not all permissions were granted');
          }
        }

        // Also use the PushNotificationHandler's permission check for iOS
        const hasNotificationPermission =
          await PushNotificationHandler.checkPermissions();

        // We'll consider permissions granted if either the notification permission is granted
        // or we're on Android and have dealt with the permissions above
        const isGranted =
          hasNotificationPermission || Platform.OS === 'android';
        setPermissionsGranted(isGranted);

        if (!isGranted && Platform.OS === 'ios') {
          Alert.alert(
            'Permissions Required',
            'This app requires notification permissions to function properly. Please grant permissions in your device settings.',
            [{text: 'OK'}],
          );
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);
        // Continue with app initialization even if permission requests fail
        setPermissionsGranted(false);
      }
    };

    requestAllPermissions();
  }, []);

  // Main initialization effect - only runs after permission check
  useEffect(() => {
    // Don't initialize until permission check is complete
    if (permissionsGranted === null) return;

    if (Platform.OS === 'android') {
      SplashScreen.hide();
    }

    // Configure deep links with navigation reference
    DeepLinkHandler.configureDeepLinks(navigationRef);

    // Load hackathon data on app startup - always use 'India' as location
    store.dispatch(fetchHackathons({location: 'India'}));

    // Configure notification channels right away regardless of permission status
    // This doesn't need permissions and won't crash
    PushNotificationHandler.configureChannels();

    // Only initialize services that require permissions if permissions were granted
    if (permissionsGranted) {
      // Set up message handlers for FCM
      PushNotificationHandler.setupMessageHandlers();

      // Initialize notification service during app startup
      const initNotifications = async () => {
        try {
          const notificationService =
            require('./service/NotificationService').default;
          await notificationService.setupNotificationChannels();

          // Set up background notification handlers
          notificationService.setupBackgroundHandler();

          // If user is already logged in, set up the message and task listeners
          const auth = require('@react-native-firebase/auth').default;
          if (auth().currentUser) {
            console.log(
              'User already logged in, setting up notification listeners',
            );
            notificationService.setupMessageListener();
            notificationService.setupTaskNotificationListener();

            // Initialize FCM
            const fcmInitialized = await notificationService.initializeFCM();
            if (fcmInitialized) {
              console.log('Firebase Cloud Messaging initialized successfully');
            } else {
              console.warn(
                'Firebase Cloud Messaging initialization failed or permission denied',
              );
            }
          } else {
            console.log('No user logged in yet, skipping notification setup');
          }
        } catch (error) {
          console.error('Failed to initialize notification service:', error);
        }
      };
      initNotifications();
    }

    // Set up deep link handler
    const handleDeepLink = (event: DeepLinkEvent) => {
      const {url} = event;
      if (url) {
        console.log('Deep link received:', url);
        // Store the URL in Redux for later use
        store.dispatch(setDeepLink(url));
      }
    };

    // Set up listeners for deep links - handle API differences in React Native versions
    let subscription: LinkingSubscription | undefined;
    if (Linking.addEventListener) {
      // Modern React Native (>=0.65)
      subscription = Linking.addEventListener('url', handleDeepLink);
    } else {
      // Older React Native with deprecated API
      // @ts-ignore - We need this for backwards compatibility
      Linking.addEventListener('url', handleDeepLink);
    }

    // Check for initial URL (app opened via deep link)
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('App opened with URL:', url);
        store.dispatch(setDeepLink(url));
      }
    });

    return () => {
      // Clean up the event listener - handle API differences
      if (subscription) {
        // Modern React Native with subscription object
        subscription.remove();
      } else {
        // For older React Native versions
        // @ts-ignore - removeEventListener is not in the type definitions but may exist in older RN versions
        Linking.removeEventListener('url', handleDeepLink);
      }

      // Clean up notification listeners if needed
      if (permissionsGranted) {
        try {
          const notificationService =
            require('./service/NotificationService').default;
          notificationService.removeMessageListener();
          notificationService.removeTaskListener();
        } catch (error) {
          console.error('Failed to clean up notification listeners:', error);
        }
      }
    };
  }, [navigationRef, permissionsGranted]);

  return (
    <>
      <GestureHandlerRootView style={styles.flex1}>
        <SafeAreaProvider>
          <Provider store={store}>
            <PersistGate loading={<Loader />} persistor={persistor}>
              <ThemeListener />
              <NavigationContainer
                ref={navigationRef}
                onReady={() => {
                  console.log('Navigation is ready');
                  // Process any pending navigation from notifications
                  DeepLinkHandler.checkPendingNavigation();
                }}>
                <Route />
              </NavigationContainer>
            </PersistGate>
          </Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </>
  );
};

export default App;
