import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import MaterialsIcon from 'react-native-vector-icons/MaterialIcons';
import { gettingStartedHeaderQuote } from '../res/strings/eng';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../routes/Route';

const GettingStarted = () => {
  const navigate = useNavigation<NavigationProps>();  
  return (
    <View className="w-screen h-screen bg-white flex justify-center items-center px-[15%] py-[20%] relative ">
      <MaterialsIcon name='circle'  color={"#37B6F0"} size={225} style={StyleSheets.cricle1}  />
      <MaterialsIcon name='circle' color={"#37B6F0"} size={225} style={StyleSheets.circle2} />
      <View className='flex flex-col pt-[20%] justify-between items-center gap-14 w-full'>
        <View className='w-full flex justify-center items-center'>
          <Image         
            source={require('../res/pngs/gettingStarted01.png')}
            resizeMode='contain'
            style={{ width: 400, height: 350,zIndex:-1 }} 
          />
          <View className='font-sans flex flex-col w-[100%] ml-12'>
            <Text className='font-bold text-black text-[9vw]  '>{gettingStartedHeaderQuote}</Text>
            <Text className='text-[#37B6F0] text-[9vw] font-bold'>Learnex</Text>
          </View>
        </View>
      <TouchableOpacity activeOpacity={0.65}
      onPress={()=>navigate.navigate("SignUp")}
      className='bg-[#3EB9F1] px-[15%] py-[8%] rounded-3xl w-full'>
        <Text className='text-white text-center text-2xl font-bold'>Getting Started</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
};
export default GettingStarted;

const StyleSheets = StyleSheet.create(
  {
    cricle1: {
      top: "-4%",
      left: "-36%",
      position: "absolute",
      opacity: 0.8,
    },
    circle2:{
        top: "-15%",
        left: "-13%",
        position: "absolute",
        opacity: 0.8,
    }
  }
)