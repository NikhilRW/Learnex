import {combineReducers} from '@reduxjs/toolkit';
import firebase from './Firebase';
import user from './User';

const rootReducer = combineReducers({
  firebase,
  user,
});
export default rootReducer;
