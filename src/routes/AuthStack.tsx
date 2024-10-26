import { Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack'
import GettingStarted from '../screens/starter/GettingStarted'
import AsyncStorage from '@react-native-async-storage/async-storage'
import SignUp from '../screens/auth/SignUp'
import SignIn from '../screens/auth/SignIn'

export type AuthStackParamList = {
  GettingStarted: undefined;
  SignUp: undefined;
  SignIn: undefined;
};
export type AuthNavigationProps = NativeStackNavigationProp<AuthStackParamList>;
const AuthStack = () => {
  const Stack = createNativeStackNavigator<AuthStackParamList>();
  const [isNewInstalled, setIsNewInstalled] = useState<boolean>(false);
  const checkNewApp = async () => {
    try {
      if (await AsyncStorage.getItem("isNewlyOpenedApp") == null) {
        await AsyncStorage.setItem("isNewlyOpenedApp", "true");
        setIsNewInstalled(true);
      }
      else {
        setIsNewInstalled(false);
      }
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    checkNewApp();
  }, []);
  return (
      <Stack.Navigator initialRouteName={`${isNewInstalled ? 'GettingStarted' : 'GettingStarted'}`}>
        <Stack.Screen component={GettingStarted}
          options={{ headerShown: false }}
          name='GettingStarted'>
        </Stack.Screen>
        <Stack.Screen component={SignUp}
          options={{ headerShown: false }}
          name='SignUp'>
        </Stack.Screen>
        <Stack.Screen component={SignIn}
          options={{ headerShown: false }}
          name='SignIn'>
        </Stack.Screen>
      </Stack.Navigator>
  )
}

export default AuthStack