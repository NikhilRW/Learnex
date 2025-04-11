import React, { useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import Route from './routes/Route';
import { Provider } from 'react-redux';
import { persistor, store } from './store/store';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PersistGate } from 'redux-persist/integration/react';
import ThemeListener from './components/user/ThemeListener';
import Loader from './components/auth/Loader';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setDeepLink } from './reducers/DeepLink';
import { fetchHackathons } from './reducers/Hackathon';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { DeepLinkHandler } from './navigation/DeepLinkHandler';
import { PushNotificationHandler } from './utils/PushNotificationHandler';

const App = () => {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (Platform.OS === 'android') {
      SplashScreen.hide();
    }

    // Configure deep links
    DeepLinkHandler.configureDeepLinks(navigationRef);

    // Load hackathon data on app startup - always use 'India' as location
    store.dispatch(fetchHackathons({ location: 'India' }));

    // Check for push notifications permission on startup
    PushNotificationHandler.checkPermissions();

    // Initialize notification service during app startup
    const initNotifications = async () => {
      try {
        const notificationService = require('./service/NotificationService').default;
        await notificationService.setupNotificationChannels();

        // If user is already logged in, set up the message listener
        const auth = require('@react-native-firebase/auth').default;
        if (auth().currentUser) {
          console.log('User already logged in, setting up message listener');
          notificationService.setupMessageListener();
        } else {
          console.log('No user logged in yet, skipping message listener setup');
        }
      } catch (error) {
        console.error('Failed to initialize notification service:', error);
      }
    };
    initNotifications();

    // Set up deep link handler
    const handleDeepLink = (event) => {
      const { url } = event;
      if (url) {
        console.log('Deep link received:', url);
        // Store the URL in Redux for later use
        store.dispatch(setDeepLink(url));
      }
    };

    // Set up listeners for deep links - handle API differences in React Native versions
    let subscription;
    if (Linking.addEventListener) {
      // Modern React Native (>=0.65)
      subscription = Linking.addEventListener('url', handleDeepLink);
    } else {
      // Older React Native with deprecated API
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
      } else if (Linking.removeEventListener) {
        // Older React Native with deprecated API
        Linking.removeEventListener('url', handleDeepLink);
      }
    };
  }, []);

  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Provider store={store}>
            <PersistGate loading={<Loader />} persistor={persistor}>
              <ThemeListener />
              <Route />
            </PersistGate>
          </Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </>
  );
};

export default App;
