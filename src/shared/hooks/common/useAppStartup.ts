import {useEffect} from 'react';
import {Linking, Platform} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import {setDeepLink} from 'shared/reducers/DeepLink';
import {fetchHackathons} from 'shared/reducers/Hackathon';
import {store} from 'shared/store/store';
import {DeepLinkHandler} from 'shared/services/DeepLinkHandler';
import {PushNotificationHandler} from 'shared/utils/PushNotificationHandler';
import {changeIsLoggedIn} from 'shared/reducers/User';

interface DeepLinkEvent {
  url: string;
}

interface LinkingSubscription {
  remove: () => void;
}

export const useAppStartup = (
  navigationRef: any,
  permissionsGranted: boolean | null,
): void => {
  useEffect(() => {
    if (permissionsGranted === null) {
      return;
    }

    if (Platform.OS === 'android') {
      SplashScreen.hide();
    }

    DeepLinkHandler.configureDeepLinks(navigationRef);
    store.dispatch(fetchHackathons({location: 'India'}));
    PushNotificationHandler.configureChannels();

    if (permissionsGranted) {
      const initNotifications = async () => {
        try {
          const notificationService =
            require('shared/services/NotificationService').default;

          await notificationService.setupNotificationChannels();
          notificationService.setupBackgroundHandler();
          PushNotificationHandler.setupMessageHandlers();

          const {getAuth} = require('@react-native-firebase/auth');
          if (getAuth().currentUser) {
            console.log(
              'User already logged in, setting up notification listeners',
            );
            notificationService.setupMessageListener();
            notificationService.setupTaskNotificationListener();
            await notificationService.initializeFCM();
          } else {
            changeIsLoggedIn(false);
          }
        } catch (error) {
          console.error('Failed to initialize notification service:', error);
        }
      };

      void initNotifications();
    }

    const handleDeepLink = (event: DeepLinkEvent) => {
      const {url} = event;
      if (url) {
        store.dispatch(setDeepLink(url));
      }
    };

    let subscription: LinkingSubscription | undefined;
    if (Linking.addEventListener) {
      subscription = Linking.addEventListener('url', handleDeepLink);
    } else {
      // @ts-ignore - Backwards compatibility for older React Native versions
      Linking.addEventListener('url', handleDeepLink);
    }

    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('App opened with URL:', url);
        store.dispatch(setDeepLink(url));
      }
    });

    return () => {
      if (subscription) {
        subscription.remove();
      } else {
        // @ts-ignore - Legacy React Native API support
        Linking.removeEventListener('url', handleDeepLink);
      }

      if (permissionsGranted) {
        try {
          const notificationService =
            require('shared/services/NotificationService').default;
          notificationService.removeMessageListener();
          notificationService.removeTaskListener();
        } catch (error) {
          console.error('Failed to clean up notification listeners:', error);
        }
      }
    };
  }, [navigationRef, permissionsGranted]);
};
