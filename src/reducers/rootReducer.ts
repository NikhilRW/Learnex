import {combineReducers} from '@reduxjs/toolkit';
import firebase from './Firebase';
import user from './User';
import deepLink from './DeepLink';
import hackathon from './Hackathon';
import lexAI from './LexAI';

const rootReducer = combineReducers({
  firebase,
  user,
  deepLink,
  hackathon,
  lexAI,
});
export default rootReducer;
