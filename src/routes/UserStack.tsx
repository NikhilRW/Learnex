import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack'
import GettingStarted from '../screens/starter/GettingStarted'
import AsyncStorage from '@react-native-async-storage/async-storage'
import SignUp from '../screens/auth/SignUp'
import SignIn from '../screens/auth/SignIn'
import Home from '../screens/userscreens/Home'
export type UserStackParamList = {
    Home:undefined;
};
export type UserNavigationProps = NativeStackNavigationProp<UserStackParamList>;
const Stack = createNativeStackNavigator<UserStackParamList>();
const UserStack = () => {
  return (
    <Stack.Navigator initialRouteName={"Home"}>
    <Stack.Screen component={Home}
      options={{ headerShown: false }}
      name='Home'>
    </Stack.Screen>
  </Stack.Navigator>
  )
}

export default UserStack;
const styles = StyleSheet.create({})