import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import rootReducer from '../reducers/rootReducer';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Configuration for Redux Persist
 * Persists user data across app restarts while keeping firebase state transient
 */
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['user'], // Only persist user reducer
  blacklist: ['firebase'], // Don't persist firebase state
};

// Create a persisted reducer with the persist config
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Configure and create the Redux store with middleware
 * Disables serializable check since Firebase instances aren't serializable
 */
export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false, // Disabled for Firebase instance
    }),
});

// Create the persisted store for storage
export const persistor = persistStore(store);

// TypeScript type definitions
export type RootState = ReturnType<typeof rootReducer>;
export type DispatchType = typeof store.dispatch;

export default store;
