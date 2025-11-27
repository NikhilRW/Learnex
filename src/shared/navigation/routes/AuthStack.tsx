import React, {useEffect} from 'react';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import GettingStarted from 'getting-started/screens/GettingStarted';
import SignUp from 'auth/screens/SignUp';
import SignIn from 'auth/screens/SignIn';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import {useTypedDispatch} from 'hooks/redux/useTypedDispatch';
import {changeUserNewlyOpenedApp} from 'shared/reducers/User';
import LinkedInAuth from 'auth/screens/LinkedInAuth';

export type AuthStackParamList = {
  GettingStarted: undefined;
  SignUp: undefined;
  SignIn: undefined;
  LinkedInAuth: undefined;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Stack.Navigator
      initialRouteName={`${
        isNewInstalled == null ? 'GettingStarted' : 'SignIn'
      }`}>
      <Stack.Screen
        component={GettingStarted}
        options={{headerShown: false}}
        name="GettingStarted"
      />
      <Stack.Screen
        component={SignUp}
        options={{headerShown: false}}
        name="SignUp"
      />
      <Stack.Screen
        component={SignIn}
        options={{headerShown: false}}
        name="SignIn"
      />
      <Stack.Screen
        component={LinkedInAuth}
        options={{headerShown: false}}
        name="LinkedInAuth"
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
