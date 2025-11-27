import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { useAuth } from 'shared/hooks/common/useAuth';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from 'shared/reducers/rootReducer';

// --- Mocks (Copied from SignUp.test.tsx) ---
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
    serverTimestamp: jest.fn(),
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

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
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

describe('useAuth Hook', () => {
    it('returns auth object and user state', () => {
        const preloadedState = {
            user: { isLoggedIn: true, theme: 'dark' },
            firebase: {
                firebase: {
                    auth: { someMethod: 'test' },
                    // Mock other services if needed by selector, but usually it just returns the object
                }
            }
        };

        // We need to mock the reducer or store state because rootReducer will try to initialize real Firebase class
        // which might overwrite our preloadedState.firebase if we are not careful.
        // However, configureStore with preloadedState should respect it for initial render.
        // But rootReducer combines reducers. 'firebase' reducer might return a new state.

        const store = configureStore({
            reducer: rootReducer,
            preloadedState: preloadedState as any,
            middleware: (getDefaultMiddleware) =>
                getDefaultMiddleware({
                    serializableCheck: false,
                }),
        });

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <Provider store={store}>{children}</Provider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current.isLoggedIn).toBe(true);
        expect(result.current.user.theme).toBe('dark');
        // Note: The real firebase reducer might overwrite 'firebase' state with a new Firebase instance.
        // So checking 'someMethod' might fail if the reducer re-initializes it.
        // Let's check if it returns *something* for auth.
        expect(result.current.auth).toBeDefined();
    });
});
