import {KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/Feather';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import {Input} from 'react-native-elements';
import MaterialsIcon from 'react-native-vector-icons/MaterialIcons';
import {SignUpSubHeader} from '../../res/strings/eng';
const SignUp = () => {
  return (
    <KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
 className="w-screen h-screen flex justify-center items-center px-[8%] py-[10%]">
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
      <View
      className="w-full h-full justify-center flex items-center gap-5">
        <View className="mb-[10%]">
          <Text className="text-[6vw] font-bold text-black text-center">
            Welcome Onboard!
          </Text>
          <Text className="text-[#8E8A8A] text-[4vw] font-bold">
            {SignUpSubHeader}
          </Text>
        </View>
        <View
          style={{
            borderRadius: 10,
            borderColor: '#95a0a9',
            borderWidth: 2,
            width: '100%',
            height: 50,
          }}>
          <Input
            inputContainerStyle={{borderBottomWidth: 0}}
            placeholder="Enter Fullname"
          />
        </View>
        <View
          style={{
            borderRadius: 10,
            borderColor: '#95a0a9',
            borderWidth: 2,
            width: '100%',
            height: 50,
          }}>
          <Input
            inputContainerStyle={{borderBottomWidth: 0}}
            placeholder="Enter Username"
          />
        </View>
        <View
          style={{
            borderRadius: 10,
            borderColor: '#95a0a9',
            borderWidth: 2,
            width: '100%',
            height: 50,
          }}>
          <Input
            inputContainerStyle={{borderBottomWidth: 0}}
            placeholder="Enter Email"
          />
        </View>
        <View
          style={{
            borderRadius: 10,
            borderColor: '#95a0a9',
            borderWidth: 2,
            width: '100%',
            height: 50,
          }}>
          <Input
            placeholder="Password"
            secureTextEntry={true}
            inputContainerStyle={{borderBottomWidth: 0}}
            rightIcon={<Icon name="eye" size={20} />}
          />
        </View>
        <KeyboardAvoidingView 
          style={{
            borderRadius: 10,
            borderColor: '#95a0a9',
            borderWidth: 2,
            width: '100%',
            height: 50,
          }}
          >
          <Input
            inputContainerStyle={{borderBottomWidth: 0}}
            placeholder="Confirm Password"
            secureTextEntry={true}
            rightIcon={<Icon name="eye" size={20} />}
          />
        </KeyboardAvoidingView>
        <BouncyCheckbox
          size={32}
          fillColor="#3EB9F1"
          unFillColor="#FFFFFF"
          text="Custom Checkbox"
          iconStyle={{borderColor: '#3EB9F1',borderRadius:8}}
          innerIconStyle={{borderWidth: 2,borderRadius:8}}
          textStyle={{fontFamily: 'JosefinSans-Regular',}}
          onPress={(isChecked: boolean) => {
            console.log(isChecked);
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  cricle1: {
    top: '-4%',
    left: '-36%',
    position: 'absolute',
    opacity: 0.8,
  },
  circle2: {
    top: '-15%',
    left: '-13%',
    position: 'absolute',
    opacity: 0.8,
  },
  inputStyle: {
    borderBottomWidth: 0,
  },
});
