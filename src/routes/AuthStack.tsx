import React, {useEffect} from 'react';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import GettingStarted from '../screens/starter/GettingStarted';
import SignUp from '../screens/auth/SignUp';
import SignIn from '../screens/auth/SignIn';
import {useTypedSelector} from '../hooks/useTypedSelector';
import {useTypedDispatch} from '../hooks/useTypedDispatch';
import {changeUserNewlyOpenedApp} from '../reducers/User';

export type AuthStackParamList = {
  GettingStarted: undefined;
  SignUp: undefined;
  SignIn: undefined;
};
export type AuthNavigationProps = NativeStackNavigationProp<AuthStackParamList>;
const AuthStack = () => {
  const Stack = createNativeStackNavigator<AuthStackParamList>();
  const isNewInstalled = useTypedSelector(
    state => state.user.userNewlyOpenedApp,
  );
  const dispatch = useTypedDispatch();
  useEffect(() => {
    dispatch(changeUserNewlyOpenedApp(false));
  }, []);
  return (
    <Stack.Navigator
      initialRouteName={`${
        isNewInstalled == null ? 'GettingStarted' : 'SignIn'
      }`}>
      <Stack.Screen
        component={GettingStarted}
        options={{headerShown: false}}
        name="GettingStarted"></Stack.Screen>
      <Stack.Screen
        component={SignUp}
        options={{headerShown: false}}
        name="SignUp"></Stack.Screen>
      <Stack.Screen
        component={SignIn}
        options={{headerShown: false}}
        name="SignIn"></Stack.Screen>
    </Stack.Navigator>
  );
};

export default AuthStack;
