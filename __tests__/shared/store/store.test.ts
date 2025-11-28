import {store, persistor} from '../../../src/shared/store/store';
import type {RootState, DispatchType} from '../../../src/shared/store/store';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock Firebase services
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

// Mock Firebase service
jest.mock('../../../src/shared/services/firebase', () => {
  return jest.fn().mockImplementation(() => ({
    auth: {
      isUserLoggedIn: jest.fn().mockReturnValue(false),
      signOut: jest.fn(),
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

describe('Store Configuration', () => {
  it('should have correct initial state structure', () => {
    const state = store.getState();

    expect(state).toHaveProperty('firebase');
    expect(state).toHaveProperty('user');
    expect(state).toHaveProperty('deepLink');
    expect(state).toHaveProperty('hackathon');
    expect(state).toHaveProperty('lexAI');
  });

  it('should handle user actions', () => {
    const initialTheme = store.getState().user.theme;

    store.dispatch({type: 'user/changeThemeColor', payload: 'dark'});

    const newTheme = store.getState().user.theme;
    expect(newTheme).toBe('dark');
    expect(newTheme).not.toBe(initialTheme);
  });

  it('should handle hackathon actions', () => {
    store.dispatch({type: 'hackathon/setFilterType', payload: 'online'});

    const state = store.getState();
    expect(state.hackathon.filterType).toBe('online');
  });

  it('should have proper TypeScript types', () => {
    // This is a compile-time check, but we can verify runtime behavior
    const state: RootState = store.getState();
    const dispatch: DispatchType = store.dispatch;

    expect(state).toBeDefined();
    expect(typeof dispatch).toBe('function');
  });

  it('should have persistor configured', () => {
    expect(persistor).toBeDefined();
    expect(typeof persistor.flush).toBe('function');
    expect(typeof persistor.purge).toBe('function');
    expect(typeof persistor.pause).toBe('function');
    expect(typeof persistor.persist).toBe('function');
  });

  it('should disable serializable check for Firebase', () => {
    // Verify we can dispatch actions with non-serializable data (Firebase instance)
    // This shouldn't throw an error
    expect(() => {
      store.dispatch({
        type: 'test/action',
        payload: {firebase: store.getState().firebase.firebase},
      });
    }).not.toThrow();
  });

  it('should support multiple reducers', () => {
    const state = store.getState();

    // Verify all reducers are properly combined
    const reducerKeys = Object.keys(state);
    expect(reducerKeys).toContain('firebase');
    expect(reducerKeys).toContain('user');
    expect(reducerKeys).toContain('deepLink');
    expect(reducerKeys).toContain('hackathon');
    expect(reducerKeys).toContain('lexAI');
  });

  it('should handle async thunks', async () => {
    // Dispatch a mock async action
    const asyncAction = {
      type: 'hackathon/fetchHackathons/pending',
    };

    store.dispatch(asyncAction);
    const state = store.getState();

    expect(state.hackathon.loading).toBe(true);
  });

  it('should preserve state immutability', () => {
    const stateBefore = store.getState();
    const hackathonBefore = stateBefore.hackathon;

    // Modify user state
    store.dispatch({type: 'user/changeThemeColor', payload: 'dark'});

    const stateAfter = store.getState();
    const hackathonAfter = stateAfter.hackathon;

    // User state should have changed
    expect(stateAfter.user.theme).toBe('dark');
    // Hackathon state should be unchanged (same reference)
    expect(hackathonBefore).toBe(hackathonAfter);
  });
});

describe('Store Integration - Cross-Reducer Scenarios', () => {
  beforeEach(() => {
    // Reset to known state before each test
    store.dispatch({type: 'user/changeThemeColor', payload: 'light'});
    store.dispatch({type: 'user/changeIsLoggedIn', payload: false});
    store.dispatch({type: 'hackathon/setFilterType', payload: 'all'});
    store.dispatch({type: 'deepLink/setDeepLink', payload: ''});
  });

  it('should handle multiple reducer state updates independently', () => {
    store.dispatch({type: 'user/changeThemeColor', payload: 'dark'});
    store.dispatch({type: 'hackathon/setFilterType', payload: 'online'});
    store.dispatch({type: 'deepLink/setDeepLink', payload: 'test-link'});

    const state = store.getState();
    expect(state.user.theme).toBe('dark');
    expect(state.hackathon.filterType).toBe('online');
    expect(state.deepLink.url).toBe('test-link');
  });

  it('should maintain state isolation between reducers', () => {
    store.dispatch({type: 'user/changeThemeColor', payload: 'dark'});

    const stateBefore = store.getState();
    const userStateBefore = stateBefore.user;
    const hackathonStateBefore = stateBefore.hackathon;

    store.dispatch({type: 'hackathon/setFilterType', payload: 'offline'});

    const stateAfter = store.getState();

    // User state should remain unchanged
    expect(stateAfter.user).toEqual(userStateBefore);
    // Hackathon state should be updated
    expect(stateAfter.hackathon.filterType).toBe('offline');
    expect(stateAfter.hackathon).not.toEqual(hackathonStateBefore);
  });

  it('should handle rapid sequential dispatches across reducers', () => {
    const actions = [
      {type: 'user/changeThemeColor', payload: 'dark'},
      {type: 'hackathon/setFilterType', payload: 'online'},
      {type: 'user/changeIsLoggedIn', payload: true},
      {type: 'deepLink/setDeepLink', payload: 'hackathon/123'},
      {type: 'user/changeProfileColor', payload: '#FF5733'},
    ];

    actions.forEach(action => store.dispatch(action));

    const state = store.getState();
    expect(state.user.theme).toBe('dark');
    expect(state.user.isLoggedIn).toBe(true);
    expect(state.user.userProfileColor).toBe('#FF5733');
    expect(state.hackathon.filterType).toBe('online');
    expect(state.deepLink.url).toBe('hackathon/123');
  });

  it('should support state rollback scenarios', () => {
    const initialTheme = store.getState().user.theme;
    const initialFilterType = store.getState().hackathon.filterType;

    store.dispatch({type: 'user/changeThemeColor', payload: 'dark'});
    store.dispatch({type: 'hackathon/setFilterType', payload: 'online'});

    const modifiedState = store.getState();
    expect(modifiedState.user.theme).toBe('dark');
    expect(modifiedState.hackathon.filterType).toBe('online');

    // Simulate rollback by dispatching reset actions
    store.dispatch({type: 'user/changeThemeColor', payload: initialTheme});
    store.dispatch({
      type: 'hackathon/setFilterType',
      payload: initialFilterType,
    });

    const rolledBackState = store.getState();
    expect(rolledBackState.user.theme).toBe(initialTheme);
    expect(rolledBackState.hackathon.filterType).toBe(initialFilterType);
  });

  it('should maintain consistency during complex multi-reducer operations', () => {
    // Simulate a complex user flow: login -> set preferences -> set filter
    store.dispatch({type: 'user/changeIsLoggedIn', payload: true});
    store.dispatch({type: 'user/changeThemeColor', payload: 'dark'});
    store.dispatch({type: 'user/changeProfileColor', payload: '#123456'});
    store.dispatch({type: 'hackathon/setFilterType', payload: 'online'});

    const state = store.getState();

    // All state updates should be reflected
    expect(state.user.isLoggedIn).toBe(true);
    expect(state.user.theme).toBe('dark');
    expect(state.user.userProfileColor).toBe('#123456');
    expect(state.hackathon.filterType).toBe('online');
  });

  it('should handle state shape validation across reducers', () => {
    const state = store.getState();

    // Validate expected state shape for each reducer
    expect(state.user).toHaveProperty('theme');
    expect(state.user).toHaveProperty('isLoggedIn');
    expect(state.user).toHaveProperty('userProfileColor');

    expect(state.hackathon).toHaveProperty('filterType');
    expect(state.hackathon).toHaveProperty('events');

    expect(state.firebase).toHaveProperty('firebase');

    expect(state.deepLink).toHaveProperty('url');
  });

  it('should handle empty/reset actions across multiple reducers', () => {
    // Set some state
    store.dispatch({type: 'user/changeThemeColor', payload: 'dark'});
    store.dispatch({type: 'deepLink/setDeepLink', payload: 'some-link'});

    // Reset to defaults
    store.dispatch({type: 'deepLink/clearDeepLink'});

    const state = store.getState();
    expect(state.deepLink.url).toBeNull();
    expect(state.user.theme).toBe('dark'); // Should remain unchanged
  });

  it('should handle reducer state updates with complex payload types', () => {
    // Test with different payload types
    store.dispatch({type: 'user/changeThemeColor', payload: 'dark'}); // string
    store.dispatch({type: 'user/changeIsLoggedIn', payload: true}); // boolean
    store.dispatch({type: 'hackathon/setFilterType', payload: 'online'}); // string

    const state = store.getState();
    expect(typeof state.user.theme).toBe('string');
    expect(typeof state.user.isLoggedIn).toBe('boolean');
    expect(typeof state.hackathon.filterType).toBe('string');
  });

  it('should handle action type validation', () => {
    // Valid action types should work
    expect(() => {
      store.dispatch({type: 'user/changeThemeColor', payload: 'dark'});
    }).not.toThrow();

    // Unknown action types should not crash (Redux handles them gracefully)
    expect(() => {
      store.dispatch({type: 'unknown/action', payload: 'test'});
    }).not.toThrow();
  });

  it('should handle concurrent state reads during updates', () => {
    const states: RootState[] = [];

    // Read state multiple times during rapid updates
    store.dispatch({type: 'user/changeThemeColor', payload: 'dark'});
    states.push(store.getState());

    store.dispatch({type: 'hackathon/setFilterType', payload: 'online'});
    states.push(store.getState());

    store.dispatch({type: 'user/changeIsLoggedIn', payload: true});
    states.push(store.getState());

    // Each state snapshot should reflect its point in time
    expect(states[0].user.theme).toBe('dark');
    expect(states[0].hackathon.filterType).not.toBe('online');

    expect(states[1].user.theme).toBe('dark');
    expect(states[1].hackathon.filterType).toBe('online');

    expect(states[2].user.theme).toBe('dark');
    expect(states[2].hackathon.filterType).toBe('online');
    expect(states[2].user.isLoggedIn).toBe(true);
  });

  it('should handle nested state updates without mutation', () => {
    const initialState = store.getState();

    store.dispatch({type: 'user/changeThemeColor', payload: 'dark'});
    store.dispatch({type: 'user/changeProfileColor', payload: '#FF5733'});

    const updatedState = store.getState();

    // Original state should not be mutated
    expect(initialState.user.theme).not.toBe('dark');
    // New state should have updates
    expect(updatedState.user.theme).toBe('dark');
    expect(updatedState.user.userProfileColor).toBe('#FF5733');
  });

  it('should support middleware error handling', () => {
    // Dispatch an action that might trigger middleware
    expect(() => {
      store.dispatch({
        type: 'user/changeThemeColor',
        payload: 'dark',
        error: new Error('Test error'),
      });
    }).not.toThrow();

    const state = store.getState();
    expect(state.user.theme).toBe('dark');
  });
});
