import React, {useEffect} from 'react';
import AuthStack from './AuthStack';
import UserStack from './UserStack';
import {useTypedSelector} from '../hooks/useTypedSelector';
import {useTypedDispatch} from '../hooks/useTypedDispatch';
import {changeIsLoggedIn} from '../reducers/User';

/**
 * Root navigation component that handles authentication flow
 * Switches between AuthStack and UserStack based on login state
 */
const Route = () => {
  // Get current authentication state from Redux store
  let isLoggedIn = useTypedSelector(state => state.user.isLoggedIn);
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const dispatch = useTypedDispatch();

  // Check authentication state on mount
  useEffect(() => {
    if (firebase.auth.isUserLoggedIn()) {
      dispatch(changeIsLoggedIn(true));
    } else {
      dispatch(changeIsLoggedIn(false));
    }
  }, [dispatch, firebase.auth]); // Empty dependency array means this runs once on mount

  // Directly render appropriate stack without NavigationContainer
  return isLoggedIn ? <UserStack /> : <AuthStack />;
};

export default Route;