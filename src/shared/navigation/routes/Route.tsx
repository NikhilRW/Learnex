import React, {useEffect} from 'react';
import AuthStack, {AuthStackParamList} from 'shared/navigation/routes/AuthStack';
import UserStack, {UserStackParamList} from 'shared/navigation/routes/UserStack';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import {useTypedDispatch} from 'hooks/redux/useTypedDispatch';
import {changeIsLoggedIn} from 'shared/reducers/User';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

export type RootStackParamList = {
  UserStack: UserStackParamList;
  AuthStack: AuthStackParamList;
};
export type RootNavigationProps = NativeStackNavigationProp<RootStackParamList>;
/**
 * Root navigation component that handles authentication flow
 * Switches between AuthStack and UserStack based on login state
 */
const Route = () => {
  // Get current authentication state from Redux store
  let isLoggedIn = useTypedSelector(state => state.user.isLoggedIn);
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const dispatch = useTypedDispatch();
  const Stack = createNativeStackNavigator<RootStackParamList>();

  // Check authentication state on mount
  useEffect(() => {
    if (firebase.auth.isUserLoggedIn()) {
      dispatch(changeIsLoggedIn(true));
    } else {
      dispatch(changeIsLoggedIn(false));
    }
  }, [dispatch, firebase.auth]); // Empty dependency array means this runs once on mount

  // Directly render appropriate stack without NavigationContainer

  return (
    <Stack.Navigator
      initialRouteName={isLoggedIn ? 'UserStack' : 'AuthStack'}
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="AuthStack" component={AuthStack} />
      <Stack.Screen name="UserStack" component={UserStack} />
    </Stack.Navigator>
  );
};

export default Route;
