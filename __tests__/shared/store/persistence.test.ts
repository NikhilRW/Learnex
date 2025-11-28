import AsyncStorage from '@react-native-async-storage/async-storage';
import {persistStore, persistReducer} from 'redux-persist';
import {configureStore} from '@reduxjs/toolkit';
import rootReducer from '../../../src/shared/reducers/rootReducer';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock Firebase modules
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    currentUser: null,
  })),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}));

// Mock Firebase service to avoid initialization issues
jest.mock('../../../src/shared/services/firebase', () => {
  return jest.fn().mockImplementation(() => ({
    auth: {
      isUserLoggedIn: jest.fn().mockReturnValue(false),
    },
    user: {},
  }));
});

// Mock LexAI services
jest.mock('../../../src/shared/services/LexAIService', () => ({
  __esModule: true,
  default: {
    initConversation: jest.fn(),
    saveConversation: jest.fn(),
    loadConversations: jest.fn(),
    processMessage: jest.fn(),
    deleteConversation: jest.fn(),
    setPersonality: jest.fn(),
    setMode: jest.fn(),
  },
}));

jest.mock('../../../src/features/LexAI/services/LexAIFirestoreService', () => ({
  __esModule: true,
  default: {
    setActiveConversationId: jest.fn(),
    getActiveConversationId: jest.fn(),
  },
}));

describe('Redux Persistence Integration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('should persist user state across sessions', async () => {
    // Setup persist config
    const persistConfig = {
      key: 'test-root',
      storage: AsyncStorage,
      whitelist: ['user'],
      blacklist: ['firebase'],
    };

    const persistedReducer = persistReducer(persistConfig, rootReducer);

    // Create first store instance
    const store1 = configureStore({
      reducer: persistedReducer,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
          serializableCheck: false,
        }),
    });

    const persistor1 = persistStore(store1);

    // Wait for rehydration to complete
    await new Promise(resolve => {
      const unsubscribe = persistor1.subscribe(() => {
        const {bootstrapped} = persistor1.getState();
        if (bootstrapped) {
          unsubscribe();
          resolve(true);
        }
      });
    });

    // Dispatch an action to change user state
    store1.dispatch({type: 'user/changeThemeColor', payload: 'dark'});

    // Wait for persistence
    await persistor1.flush();

    // Verify data was written to AsyncStorage
    const persistedData = await AsyncStorage.getItem('persist:test-root');
    expect(persistedData).toBeTruthy();

    const parsedData = JSON.parse(persistedData!);
    expect(parsedData).toHaveProperty('user');

    const userData = JSON.parse(parsedData.user);
    expect(userData.theme).toBe('dark');

    // Cleanup
    persistor1.pause();
  });

  it('should persist hackathon state', async () => {
    const persistConfig = {
      key: 'test-hackathon',
      storage: AsyncStorage,
      whitelist: ['hackathon'],
    };

    const persistedReducer = persistReducer(persistConfig, rootReducer);
    const store1 = configureStore({
      reducer: persistedReducer,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({serializableCheck: false}),
    });

    const persistor1 = persistStore(store1);

    // Wait for rehydration
    await new Promise(resolve => {
      const unsubscribe = persistor1.subscribe(() => {
        const {bootstrapped} = persistor1.getState();
        if (bootstrapped) {
          unsubscribe();
          resolve(true);
        }
      });
    });

    // Set filter type
    store1.dispatch({type: 'hackathon/setFilterType', payload: 'online'});

    await persistor1.flush();

    // Verify data in AsyncStorage
    const persistedData = await AsyncStorage.getItem('persist:test-hackathon');
    expect(persistedData).toBeTruthy();

    const parsedData = JSON.parse(persistedData!);
    const hackathonData = JSON.parse(parsedData.hackathon);
    expect(hackathonData.filterType).toBe('online');

    // Cleanup
    persistor1.pause();
  });

  it('should NOT persist firebase state (blacklist)', async () => {
    const persistConfig = {
      key: 'test-blacklist',
      storage: AsyncStorage,
      whitelist: ['user'],
      blacklist: ['firebase'],
    };

    const persistedReducer = persistReducer(persistConfig, rootReducer);
    const store = configureStore({
      reducer: persistedReducer,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({serializableCheck: false}),
    });

    const persistor = persistStore(store);

    // Wait for bootstrap
    await new Promise(resolve => {
      const unsubscribe = persistor.subscribe(() => {
        const {bootstrapped} = persistor.getState();
        if (bootstrapped) {
          unsubscribe();
          resolve(true);
        }
      });
    });

    await persistor.flush();

    const persistedData = await AsyncStorage.getItem('persist:test-blacklist');

    if (persistedData) {
      const parsedData = JSON.parse(persistedData);
      // Firebase should not be in persisted data
      // eslint-disable-next-line jest/no-conditional-expect
      expect(parsedData).not.toHaveProperty('firebase');
      // eslint-disable-next-line jest/no-conditional-expect
      expect(parsedData).toHaveProperty('user');
    }

    // Cleanup
    persistor.pause();
  });

  it('should handle corrupted storage gracefully', async () => {
    // Write corrupted data
    await AsyncStorage.setItem('persist:test-corrupt', 'invalid-json-{{{');

    const persistConfig = {
      key: 'test-corrupt',
      storage: AsyncStorage,
      whitelist: ['user'],
    };

    const persistedReducer = persistReducer(persistConfig, rootReducer);
    const store = configureStore({
      reducer: persistedReducer,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({serializableCheck: false}),
    });

    persistStore(store);

    // Should not crash, should fall back to initial state
    await new Promise(resolve => setTimeout(resolve, 100));

    const state = store.getState();
    expect(state.user).toBeDefined();
    expect(state.firebase).toBeDefined();
  });

  it('should purge persisted state when requested', async () => {
    const persistConfig = {
      key: 'test-purge',
      storage: AsyncStorage,
      whitelist: ['user'],
    };

    const persistedReducer = persistReducer(persistConfig, rootReducer);
    const store = configureStore({
      reducer: persistedReducer,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({serializableCheck: false}),
    });

    const persistor = persistStore(store);

    // Wait for bootstrap
    await new Promise(resolve => {
      const unsubscribe = persistor.subscribe(() => {
        const {bootstrapped} = persistor.getState();
        if (bootstrapped) {
          unsubscribe();
          resolve(true);
        }
      });
    });

    // Persist some data
    store.dispatch({type: 'user/changeThemeColor', payload: 'dark'});
    await persistor.flush();

    // Verify data exists
    let data = await AsyncStorage.getItem('persist:test-purge');
    expect(data).toBeTruthy();

    // Purge
    await persistor.purge();

    // Verify data is removed
    data = await AsyncStorage.getItem('persist:test-purge');
    expect(data).toBeNull();

    // Cleanup
    persistor.pause();
  });

  it('should handle rapid state changes during persistence', async () => {
    const persistConfig = {
      key: 'test-rapid',
      storage: AsyncStorage,
      whitelist: ['user'],
    };

    const persistedReducer = persistReducer(persistConfig, rootReducer);
    const store = configureStore({
      reducer: persistedReducer,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({serializableCheck: false}),
    });

    const persistor = persistStore(store);

    await new Promise(resolve => {
      const unsubscribe = persistor.subscribe(() => {
        const {bootstrapped} = persistor.getState();
        if (bootstrapped) {
          unsubscribe();
          resolve(true);
        }
      });
    });

    // Rapidly dispatch multiple actions
    store.dispatch({type: 'user/changeThemeColor', payload: 'dark'});
    store.dispatch({type: 'user/changeIsLoggedIn', payload: true});
    store.dispatch({type: 'user/changeProfileColor', payload: '#FF5733'});

    await persistor.flush();

    const persistedData = await AsyncStorage.getItem('persist:test-rapid');
    expect(persistedData).toBeTruthy();

    const userData = JSON.parse(JSON.parse(persistedData!).user);
    expect(userData.theme).toBe('dark');
    expect(userData.isLoggedIn).toBe(true);
    expect(userData.userProfileColor).toBe('#FF5733');

    persistor.pause();
  });

  it('should handle persistence with multiple reducers', async () => {
    const persistConfig = {
      key: 'test-multiple',
      storage: AsyncStorage,
      whitelist: ['user', 'hackathon'],
    };

    const persistedReducer = persistReducer(persistConfig, rootReducer);
    const store = configureStore({
      reducer: persistedReducer,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({serializableCheck: false}),
    });

    const persistor = persistStore(store);

    await new Promise(resolve => {
      const unsubscribe = persistor.subscribe(() => {
        const {bootstrapped} = persistor.getState();
        if (bootstrapped) {
          unsubscribe();
          resolve(true);
        }
      });
    });

    store.dispatch({type: 'user/changeThemeColor', payload: 'dark'});
    store.dispatch({type: 'hackathon/setFilterType', payload: 'online'});

    await persistor.flush();

    const persistedData = await AsyncStorage.getItem('persist:test-multiple');
    const parsedData = JSON.parse(persistedData!);

    expect(parsedData).toHaveProperty('user');
    expect(parsedData).toHaveProperty('hackathon');

    const userData = JSON.parse(parsedData.user);
    const hackathonData = JSON.parse(parsedData.hackathon);

    expect(userData.theme).toBe('dark');
    expect(hackathonData.filterType).toBe('online');

    persistor.pause();
  });

  it('should maintain data integrity after pause and persist', async () => {
    const persistConfig = {
      key: 'test-pause-persist',
      storage: AsyncStorage,
      whitelist: ['user'],
    };

    const persistedReducer = persistReducer(persistConfig, rootReducer);
    const store = configureStore({
      reducer: persistedReducer,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({serializableCheck: false}),
    });

    const persistor = persistStore(store);

    await new Promise(resolve => {
      const unsubscribe = persistor.subscribe(() => {
        const {bootstrapped} = persistor.getState();
        if (bootstrapped) {
          unsubscribe();
          resolve(true);
        }
      });
    });

    store.dispatch({type: 'user/changeThemeColor', payload: 'dark'});
    await persistor.flush();

    // Pause persistence
    persistor.pause();

    // Make changes while paused - these should NOT be persisted immediately
    store.dispatch({type: 'user/changeThemeColor', payload: 'light'});
    await persistor.flush();

    // Verify it's NOT 'light' yet (still 'dark')
    const pausedData = await AsyncStorage.getItem('persist:test-pause-persist');
    const pausedUserData = JSON.parse(JSON.parse(pausedData!).user);
    expect(pausedUserData.theme).toBe('dark');

    // Resume and persist
    persistor.persist();

    // Trigger another change to ensure persistence resumes
    store.dispatch({type: 'user/changeThemeColor', payload: 'blue'});
    await persistor.flush();

    const persistedData = await AsyncStorage.getItem(
      'persist:test-pause-persist',
    );
    const userData = JSON.parse(JSON.parse(persistedData!).user);

    // Last change should be persisted
    expect(userData.theme).toBe('blue');

    persistor.pause();
  });

  it('should handle rehydration with partial data', async () => {
    // Pre-populate AsyncStorage with incomplete data
    const partialData = JSON.stringify({
      user: JSON.stringify({theme: 'dark', isLoggedIn: true}),
      // Missing other fields
    });
    await AsyncStorage.setItem('persist:test-partial', partialData);

    const persistConfig = {
      key: 'test-partial',
      storage: AsyncStorage,
      whitelist: ['user', 'hackathon'],
    };

    const persistedReducer = persistReducer(persistConfig, rootReducer);
    const store = configureStore({
      reducer: persistedReducer,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({serializableCheck: false}),
    });

    const persistor = persistStore(store);

    await new Promise(resolve => {
      const unsubscribe = persistor.subscribe(() => {
        const {bootstrapped} = persistor.getState();
        if (bootstrapped) {
          unsubscribe();
          resolve(true);
        }
      });
    });

    const state = store.getState();

    // User data should be rehydrated
    expect(state.user.theme).toBe('dark');
    expect(state.user.isLoggedIn).toBe(true);

    // Hackathon should use initial state (not in persisted data)
    expect(state.hackathon.filterType).toBe('all');

    persistor.pause();
  });

  it('should handle version migration gracefully', async () => {
    // Simulate old version data structure
    const oldVersionData = JSON.stringify({
      user: JSON.stringify({theme: 'light'}),
      _persist: JSON.stringify({version: 1, rehydrated: true}),
    });
    await AsyncStorage.setItem('persist:test-version', oldVersionData);

    const persistConfig = {
      key: 'test-version',
      storage: AsyncStorage,
      whitelist: ['user'],
      version: 2, // New version
    };

    const persistedReducer = persistReducer(persistConfig, rootReducer);
    const store = configureStore({
      reducer: persistedReducer,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({serializableCheck: false}),
    });

    const persistor = persistStore(store);

    await new Promise(resolve => {
      const unsubscribe = persistor.subscribe(() => {
        const {bootstrapped} = persistor.getState();
        if (bootstrapped) {
          unsubscribe();
          resolve(true);
        }
      });
    });

    // Should not crash and should initialize with some state
    const state = store.getState();
    expect(state.user).toBeDefined();

    persistor.pause();
  });

  it('should handle concurrent read/write operations', async () => {
    const persistConfig = {
      key: 'test-concurrent',
      storage: AsyncStorage,
      whitelist: ['user', 'hackathon'],
    };

    const persistedReducer = persistReducer(persistConfig, rootReducer);
    const store = configureStore({
      reducer: persistedReducer,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({serializableCheck: false}),
    });

    const persistor = persistStore(store);

    await new Promise(resolve => {
      const unsubscribe = persistor.subscribe(() => {
        const {bootstrapped} = persistor.getState();
        if (bootstrapped) {
          unsubscribe();
          resolve(true);
        }
      });
    });

    // Dispatch multiple actions concurrently
    const promises = [
      new Promise(resolve => {
        store.dispatch({type: 'user/changeThemeColor', payload: 'dark'});
        resolve(true);
      }),
      new Promise(resolve => {
        store.dispatch({type: 'hackathon/setFilterType', payload: 'online'});
        resolve(true);
      }),
      new Promise(resolve => {
        store.dispatch({type: 'user/changeIsLoggedIn', payload: true});
        resolve(true);
      }),
    ];

    await Promise.all(promises);
    await persistor.flush();

    const state = store.getState();
    expect(state.user.theme).toBe('dark');
    expect(state.user.isLoggedIn).toBe(true);
    expect(state.hackathon.filterType).toBe('online');

    persistor.pause();
  });
});
