import {Text, View} from 'react-native';
import React, { useEffect } from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AuthStack from './AuthStack';
import UserStack from './UserStack';
import { useTypedSelector } from '../hooks/useTypedSelector';
import { useTypedDispatch } from '../hooks/useTypedDispatch';
import { changeIsLoggedIn } from '../reducers/User';

const Route = () => {
  const isLoggedIn = useTypedSelector((state)=>state.user.isLoggedIn);
  const firebase = useTypedSelector((state)=>state.firebase.firebase);
  const dispatch = useTypedDispatch();
  useEffect(() => {
    if(firebase.isUserLoggedIn()){
      dispatch(changeIsLoggedIn(true))
    }
    else{
      dispatch(changeIsLoggedIn(false));
    }
  }, []);
  return (
    <NavigationContainer>
      {isLoggedIn ? <UserStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default Route;