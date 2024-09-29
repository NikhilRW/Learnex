import { Text, View } from 'react-native'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import GettingStarted from '../screens/GettingStarted'

const Route = () => {
  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
        <Stack.Navigator>
            <Stack.Screen component={GettingStarted} 
            options={{ headerShown: false }}
            name='Getting Started'>
            </Stack.Screen>
        </Stack.Navigator>
    </NavigationContainer>
  )
}

export default Route