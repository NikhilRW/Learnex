import {useEffect} from 'react';
import {InteractionManager, Linking, Platform} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import {setDeepLink} from 'shared/reducers/DeepLink';
import {fetchHackathons} from 'shared/reducers/Hackathon';
import {store} from 'shared/store/store';
import {DeepLinkHandler} from 'shared/services/DeepLinkHandler';
import {PushNotificationHandler} from 'shared/utils/PushNotificationHandler';
import {changeIsLoggedIn} from 'shared/reducers/User';
import {logger} from 'shared/utils/logger';

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
    PushNotificationHandler.configureChannels();

    InteractionManager.runAfterInteractions(() => {
      store.dispatch(fetchHackathons({location: 'India'}));

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
              logger.debug(
                'User already logged in, setting up notification listeners',
                undefined,
                'AppStartup',
              );
              notificationService.setupMessageListener();
              notificationService.setupTaskNotificationListener();
              await notificationService.initializeFCM();
            } else {
              store.dispatch(changeIsLoggedIn(false));
            }
          } catch (error) {
            logger.error(
              'Failed to initialize notification service:',
              error,
              'AppStartup',
            );
          }
        };

        void initNotifications();
      }
    });

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
        logger.debug('App opened with URL:', url, 'AppStartup');
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
          logger.error(
            'Failed to clean up notification listeners:',
            error,
            'AppStartup',
          );
        }
      }
    };
  }, [navigationRef, permissionsGranted]);
};
