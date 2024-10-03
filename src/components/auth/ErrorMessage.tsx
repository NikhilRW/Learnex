import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const ErrorMessage = ({error}:{error:string}) => {
  return (
    <View className='w-full px-[2.5%] pt-[2%] justify-center '>
      <Text className='text-[#ff3333] font-bold'>{' '}{error}</Text>
    </View>
  )
}

export default ErrorMessage;