import { Button, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useTypedSelector } from '../../hooks/useTypedSelector'
import { useTypedDispatch } from '../../hooks/useTypedDispatch';
import { changeIsLoggedIn } from '../../reducers/User';

const Home = () => {
  const firebase  = useTypedSelector((state)=>state.firebase.firebase);
  const dispatch = useTypedDispatch();
  const handlePress = async () =>{
    await firebase.signOut();
    dispatch(changeIsLoggedIn(false));
  }
  return (
    <View className='justify-center items-center w-screen h-screen'>
      <Text className='text-black'>Home</Text>
      <Button title='SignOut' onPress={handlePress} />
    </View>
  )
}

export default Home

const styles = StyleSheet.create({})