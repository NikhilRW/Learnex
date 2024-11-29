import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {Image} from 'react-native';
import { ParamListBase } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useTypedSelector } from '../../hooks/useTypedSelector';

const NavigationDrawerButton = ({tintColor,navigation}: {tintColor: string,navigation:DrawerNavigationProp<ParamListBase, string, undefined>}) => {
  const theme = useTypedSelector((state)=>state.user.theme);
  const isDark = theme === "dark";
  return (
    <View 
    className={`${isDark?"bg-[#1a1a1a]":"bg-white"}`}>
      <TouchableOpacity 
      onPress={()=>navigation.openDrawer()}
      >
      <Image
        source={require('../../res/pngs/menu.png')}
        style={{
          width: 35,
          height: 35,
          marginVertical:"auto",
          marginLeft:"3%",
          marginTop:"2%",
          tintColor:isDark?"white":"black"
        }}
      />
      </TouchableOpacity>
    </View>
  );
};

export default NavigationDrawerButton;
const styles = StyleSheet.create({
  image: {
    height: 20,
    width: 20,
    tintColor: 'black',
  },
});
