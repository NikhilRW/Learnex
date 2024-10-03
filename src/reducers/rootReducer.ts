import { combineReducers } from '@reduxjs/toolkit';
import appwrite from './Appwrite';
import user from './User';

const rootReducer = combineReducers({
  appwrite,
  user,
});
export default rootReducer;
