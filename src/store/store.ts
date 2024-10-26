import {configureStore} from '@reduxjs/toolkit';
import userReducer from '../reducers/User';
import appwriteSlice from '../reducers/Firebase';
import rootReducer from '../reducers/rootReducer';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({
      serializableCheck: false,
  }),
});
export type RootState = ReturnType<typeof rootReducer>;
export type DispatchType = typeof store.dispatch;
export default store;