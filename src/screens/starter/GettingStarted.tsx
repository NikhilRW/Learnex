import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import MaterialsIcon from 'react-native-vector-icons/MaterialIcons';
import {gettingStartedHeaderQuote} from '../../res/strings/eng';
import {useNavigation} from '@react-navigation/native';
import {AuthNavigationProps} from '../../routes/AuthStack';
import { styles } from '../../styles/screens/starter/GettingStarted';

const GettingStarted = () => {
  const navigate = useNavigation<AuthNavigationProps>();
  return (
    <View className="w-screen h-screen bg-white flex justify-center items-center px-[15%] py-[20%] relative ">
      <MaterialsIcon
        name="circle"
        color={'#37B6F0'}
        size={225}
        style={styles.cricle1}
      />
      <MaterialsIcon
        name="circle"
        color={'#37B6F0'}
        size={225}
        style={styles.circle2}
      />
      <View className="flex flex-col justify-between items-center gap-14 w-full">
        <View className="w-full flex justify-center items-center">
          <Image
            source={require('../../res/pngs/gettingStarted01.png')}
            resizeMode="contain"
            style={{width: 400, height: 350, zIndex: -1}}
          />
          <View className="flex flex-col items-start ">
            <Text className="font-[Kufam-Bold] text-black text-4xl mr-10">
              {gettingStartedHeaderQuote}{'\n'}
              <Text className="text-[#37B6F0] text-4xl font-[Kufam-Bold]">
                Learnex
              </Text>
            </Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.65}
          onPress={() => navigate.navigate('SignUp')}
          className="bg-[#3EB9F1] px-[15%] py-[8%] rounded-3xl w-full">
          <Text className="text-white text-center text-2xl font-bold">
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
export default GettingStarted;

