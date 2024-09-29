import { Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import GettingStarted from '../screens/GettingStarted'
import AsyncStorage from '@react-native-async-storage/async-storage'


const Route = () => {
  const Stack = createNativeStackNavigator();
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
        <Stack.Navigator>
          {
            isNewInstalled ? 
            <Stack.Screen component={GettingStarted} 
            options={{ headerShown: false }}
            name='Getting Started'>
            </Stack.Screen> : <Stack.Screen component={GettingStarted} 
            options={{ headerShown: false }}
            name='Getting Started'>
            </Stack.Screen>
          }
        </Stack.Navigator>
    </NavigationContainer>
  )
}

export default Route