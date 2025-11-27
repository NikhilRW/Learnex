import React, {PropsWithChildren} from 'react';
import {render} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import rootReducer from 'shared/reducers/rootReducer';
import {NavigationContainer} from '@react-navigation/native';
import {Appearance} from 'react-native';

// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
interface ExtendedRenderOptions {
  preloadedState?: any;
  store?: any;
  [key: string]: any;
}

// Mock Firebase and other dependencies
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    currentUser: {uid: 'test-uid'},
  })),
  getAuth: jest.fn(() => ({
    currentUser: {uid: 'test-uid'},
  })),
  GithubAuthProvider: {credential: jest.fn()},
  GoogleAuthProvider: {credential: jest.fn()},
  OIDCAuthProvider: {credential: jest.fn()},
}));

// Mock Google Signin
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    getTokens: jest.fn(),
    signOut: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

jest.mock('react-native-app-auth', () => ({authorize: jest.fn()}));


jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: jest.fn(() => ({collection: jest.fn(), doc: jest.fn()})),
  getFirestore: jest.fn(() => ({collection: jest.fn(), doc: jest.fn()})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => ({get: jest.fn()})),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(()=> ({})),
  arrayRemove: jest.fn(),
  arrayUnion: jest.fn(),
  writeBatch: jest.fn(),
  increment: jest.fn(),
}));

// Mock Notifee
jest.mock('@notifee/react-native', () => ({
  displayNotification: jest.fn(),
  triggerNotification: jest.fn(),
  requestPermission: jest.fn(),
  onBackgroundEvent: jest.fn(),
  onForegroundEvent: jest.fn(),
  getInitialNotification: jest.fn(),
  createChannel: jest.fn(),
  AndroidImportance: {
    HIGH: 4,
  },
  AndroidVisibility: {
    PUBLIC: 1,
  },
  EventType: {
    PRESS: 1,
  },
}));

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
  };
});


jest.mock('react-native-config', () => ({
  GITHUB_CLIENT_ID: 'test-id',
  GITHUB_CLIENT_SECRET: 'test-secret',
}));

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    // Automatically create a store instance if no store was passed in
    store = configureStore({
      reducer: rootReducer,
      preloadedState,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
          serializableCheck: false,
        }),
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {},
) {
  function Wrapper({children}: PropsWithChildren<{}>): React.ReactElement {
    return (
      <Provider store={store}>
        <NavigationContainer>{children}</NavigationContainer>
      </Provider>
    );
  }

  // Return an object with the store and all of RTL's query functions
  return {store, ...render(ui, {wrapper: Wrapper, ...renderOptions})};
}
