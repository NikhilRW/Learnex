import {combineReducers} from '@reduxjs/toolkit';
import firebase from './Firebase';
import user from './User';
import deepLink from './DeepLink';
import hackathon from './Hackathon';

const rootReducer = combineReducers({
  firebase,
  user,
  deepLink,
  hackathon,
});
export default rootReducer;
