import React from 'react';
import { renderWithProviders } from '../../../../__tests__/test-utils';
import Route from 'shared/navigation/routes/Route';
import { waitFor } from '@testing-library/react-native';

// Mock child stacks
jest.mock('../../../../src/shared/navigation/routes/AuthStack', () => {
  const { Text } = require('react-native');
  return () => <Text>Auth Stack</Text>;
});
jest.mock('../../../../src/shared/navigation/routes/UserStack', () => {
  const { Text } = require('react-native');
  return () => <Text>User Stack</Text>;
});

// Mock Firebase and other dependencies
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    currentUser: { uid: 'test-uid' },
  })),
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'test-uid' },
  })),
  GithubAuthProvider: { credential: jest.fn() },
  GoogleAuthProvider: { credential: jest.fn() },
  OIDCAuthProvider: { credential: jest.fn() },
}));

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: jest.fn(() => ({ collection: jest.fn(), doc: jest.fn() })),
  getFirestore: jest.fn(() => ({ collection: jest.fn(), doc: jest.fn() })),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => ({ get: jest.fn() })),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(() => ({})),
  arrayRemove: jest.fn(),
  increment: jest.fn(() => 1),
  arrayUnion: jest.fn(),
  writeBatch: jest.fn(),
}));

jest.mock('@react-native-firebase/messaging', () => {
  return () => ({
    getToken: jest.fn(),
    onTokenRefresh: jest.fn(),
    onMessage: jest.fn(),
    setBackgroundMessageHandler: jest.fn(),
    requestPermission: jest.fn(),
    getInitialNotification: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
  });
});

jest.mock('react-native', () => {
  return {
    Platform: {
      OS: 'android',
    },
    ToastAndroid: {
      show: jest.fn(),
      SHORT: 0,
    },
    Appearance: {
      getColorScheme: jest.fn(() => 'light'),
    },
    Dimensions: {
      get: jest.fn((_: string) => ({ width: 360, height: 640 })),
    },
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { configure: jest.fn() },
  statusCodes: {},
}));

jest.mock('react-native-app-auth', () => ({ authorize: jest.fn() }));

jest.mock('react-native-config', () => ({
  GITHUB_CLIENT_ID: 'test-id',
  GITHUB_CLIENT_SECRET: 'test-secret',
}));

jest.mock('@notifee/react-native', () => ({
  displayNotification: jest.fn(),
  triggerNotification: jest.fn(),
  requestPermission: jest.fn(),
  onBackgroundEvent: jest.fn(),
  onForegroundEvent: jest.fn(),
  getInitialNotification: jest.fn(),
  createChannel: jest.fn(),
  AndroidImportance: { HIGH: 4 },
  AndroidVisibility: { PUBLIC: 1 },
  EventType: { PRESS: 1 },
}));

jest.mock('react-native-snackbar', () => ({
  show: jest.fn(),
  LENGTH_LONG: 0,
}));

describe('AppNavigator (Route)', () => {
  it('renders AuthStack when not logged in', async () => {
    const preloadedState = {
      user: { isLoggedIn: false },
      firebase: {
        firebase: { auth: { isUserLoggedIn: jest.fn().mockReturnValue(false) } },
      },
    };
    const { getByText } = renderWithProviders(<Route />, { preloadedState });

    await waitFor(() => {
      expect(getByText('Auth Stack')).toBeTruthy();
    });
  });

  it('renders UserStack when logged in', async () => {
    const preloadedState = {
      user: { isLoggedIn: true },
      firebase: {
        firebase: { auth: { isUserLoggedIn: jest.fn().mockReturnValue(true) } },
      },
    };
    const { getByText } = renderWithProviders(<Route />, { preloadedState });

    await waitFor(() => {
      expect(getByText('User Stack')).toBeTruthy();
    });
  });

  it('updates store to logged in when firebase user is logged in', async () => {
    const isUserLoggedInMock = jest.fn().mockReturnValue(true);
    const preloadedState = {
      user: { isLoggedIn: false },
      firebase: { firebase: { auth: { isUserLoggedIn: isUserLoggedInMock } } },
    };
    const { store } = renderWithProviders(<Route />, { preloadedState });

    await waitFor(() => {
      expect(store.getState().user.isLoggedIn).toBe(true);
    });
  });

  it('updates store to logged out when firebase user is logged out', async () => {
    const isUserLoggedInMock = jest.fn().mockReturnValue(false);
    const preloadedState = {
      user: { isLoggedIn: true },
      firebase: { firebase: { auth: { isUserLoggedIn: isUserLoggedInMock } } },
    };
    const { store } = renderWithProviders(<Route />, { preloadedState });

    await waitFor(() => {
      expect(store.getState().user.isLoggedIn).toBe(false);
    });
  });
});
