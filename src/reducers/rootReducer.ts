import {combineReducers} from '@reduxjs/toolkit';
import firebase from './Firebase';
import user from './User';
import deepLink from './DeepLink';

const rootReducer = combineReducers({
  firebase,
  user,
  deepLink,
});
export default rootReducer;
