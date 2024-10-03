import { Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack'
import GettingStarted from '../screens/GettingStarted'
import AsyncStorage from '@react-native-async-storage/async-storage'
import SignUp from '../screens/auth/SignUp'

export type StackParamList = {
  GettingStarted: undefined;
  SignUp: undefined;
  Login:undefined;
};
export type NavigationProps = NativeStackNavigationProp<StackParamList>;
const Route = () => {
  const Stack = createNativeStackNavigator<StackParamList>();
  const [isNewInstalled, setIsNewInstalled] = useState<boolean>(false);
  const checkNewApp = async ()=>{
    try {
      if(await AsyncStorage.getItem("isNewlyOpenedApp")==null){
        await AsyncStorage.setItem("isNewlyOpenedApp","true");
        setIsNewInstalled(true);
      }
      else{
        setIsNewInstalled(false);
      }
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(()=>{
    checkNewApp();
  },[]);
  return (
    <NavigationContainer>
        <Stack.Navigator initialRouteName={`${isNewInstalled ? 'GettingStarted' :'SignUp'}`}>
            <Stack.Screen component={GettingStarted} 
            options={{ headerShown: false }}
            name='GettingStarted'>
            </Stack.Screen> 
            <Stack.Screen component={SignUp} 
            options={{ headerShown: false }}
            name='SignUp'>
            </Stack.Screen>
        </Stack.Navigator>
    </NavigationContainer>
  )
}

export default Route