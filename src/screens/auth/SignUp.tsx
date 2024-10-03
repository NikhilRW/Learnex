import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import FeatherIcon from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import {Image, Input} from 'react-native-elements';
import MaterialsIcon from 'react-native-vector-icons/MaterialIcons';
import {privacyTitle, SignUpSubHeader} from '../../res/strings/eng';
import useIsKeyboardVisible from '../../hooks/useKeyBoardVisible';
import {useNavigation} from '@react-navigation/native';
import {NavigationProps} from '../../routes/Route';
import {Formik} from 'formik';
import { signUpData } from '../../types/authTypes';
import ErrorMessage from '../../components/auth/ErrorMessage';
import { signUpSchema } from '../../service/yupSchemas';
import { useSelector } from 'react-redux';
import { useTypedSelector } from '../../hooks/useTypedSelector';

const SignUp = () => {
  const isKeyboardVisible = useIsKeyboardVisible();
  const navigation = useNavigation<NavigationProps>();
  const [isConfirmPasswordHidden, setisConfirmPasswordHidden] = useState(false);
  const [isPasswordHidden, setisPasswordHidden] = useState(false);
  const userData : signUpData = {
    fullName:'',
    username:'',
    email:'',
    password:'',
    confirmPassword:'',
  };
  const submitDataToDB = (values:signUpData) =>{
  }
  const appwrite = useTypedSelector((state)=>state.appwrite.appwrite);
  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="w-screen h-screen flex justify-center relative items-center px-[8%] py-[10%]">
        {!isKeyboardVisible && (
          <>
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
          </>
        )}
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled">
          <Formik initialValues={userData} validationSchema={signUpSchema} onSubmit={(values)=>{appwrite.registerUser(values)}}>
          {({ handleChange, handleBlur, handleSubmit,touched, values ,errors}) => (
            <View className="w-full h-full justify-center flex items-center gap-5">
              <View className="mb-[10%]">
                <Text className="text-[6vw] font-bold text-black text-center">
                  Welcome Onboard!
                </Text>
                <Text className="text-[#8E8A8A] text-[4vw] font-bold">
                  {SignUpSubHeader}
                </Text>
              </View>
              <View className="rounded-lg border-gray-400 border-2 w-full h-12">
                <Input
                  inputContainerStyle={{borderBottomWidth: 0}}
                  placeholder="Enter Fullname"
                  onChangeText={handleChange('fullName')}
                  value={values.fullName}
                />
              </View>
              {
                errors.fullName && (
                  <ErrorMessage error={errors.fullName} />
                )
              }
              <View className="rounded-lg border-gray-400 border-2 w-full h-12">
                <Input
                  inputContainerStyle={{borderBottomWidth: 0}}
                  placeholder="Enter Username"
                  onChangeText={handleChange('username')}
                  value={values.username}
                />
              </View>
              {
                errors.username && (
                  <ErrorMessage error={errors.username} />
                )
              }
              <View className="rounded-lg border-gray-400 border-2 w-full h-12">
                <Input
                  inputContainerStyle={{borderBottomWidth: 0}}
                  placeholder="Enter Email"
                  onChangeText={handleChange('email')}
                  value={values.email}
                />
              </View>
              {
                errors.email && (
                  <ErrorMessage error={errors.email} />
                )
              }
              <View className="rounded-lg border-gray-400 border-2 w-full h-12">
                <Input
                  placeholder="Password"
                  secureTextEntry={isPasswordHidden}
                  inputContainerStyle={{borderBottomWidth: 0}}
                  onChangeText={handleChange('password')}
                  value={values.password}
                  rightIcon={
                    <FeatherIcon
                      color={'black'}
                      name={isPasswordHidden ? 'eye-off' : 'eye'}
                      onPress={() => setisPasswordHidden(!isPasswordHidden)}
                      size={20}
                    />
                  }
                />
              </View>
              {
                errors.password && (
                  <ErrorMessage error={errors.password} />
                )
              }
              <View className="rounded-lg border-gray-400 border-2 w-full h-12">
                <Input
                  placeholder="Confirm Password"
                  secureTextEntry={isConfirmPasswordHidden}
                  inputContainerStyle={{borderBottomWidth: 0}}
                  onChangeText={handleChange('confirmPassword')}
                  value={values.confirmPassword}
                  rightIcon={
                    <FeatherIcon
                      color={'black'}
                      name={isConfirmPasswordHidden ? 'eye-off' : 'eye'}
                      onPress={() =>
                        setisConfirmPasswordHidden(!isConfirmPasswordHidden)
                      }
                      size={20}
                    />
                  }
                />
              </View>
              {
                errors.confirmPassword && (
                  <ErrorMessage error={errors.confirmPassword} />
                )
              }
              <BouncyCheckbox
                size={28}
                className="mb-4"
                fillColor="#3EB9F1"
                unFillColor="#FFFFFF"
                text={privacyTitle}
                iconStyle={{borderColor: '#3EB9F1', borderRadius: 8}}
                innerIconStyle={{borderWidth: 2, borderRadius: 8}}
                textStyle={{
                  fontFamily: 'JosefinSans-Regular',
                  fontSize: 14,
                  fontWeight: 'semibold',
                  textAlign: 'left',
                  textDecorationLine: 'none',
                }}
                onPress={(isChecked: boolean) => {
                  console.log(isChecked);
                }}
              />
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={(e)=>handleSubmit()}
                className="bg-[#3EB9F1] px-[14%] py-[4%] rounded-2xl w-full">
                <Text className="text-white text-center text-[5vw] font-bold">
                  Create An Account
                </Text>
              </TouchableOpacity>
              <View className="w-full">
                <Text className="w-full font-thin text-[3.5vw]">
                  Already Have An Account?{' '}
                  <Text
                    onPress={() => navigation.navigate('Login')}
                    className="text-[#3EB9F1] font-bold text-[3.5vw]">
                    Log In
                  </Text>
                </Text>
              </View>
              <View className="flex flex-row justify-start items-center gap-[4%]">
                <View className="h-0.5 w-[30%] bg-gray-500"></View>
                <Text className="font-thin text-[3.5vw]">Or Continue With</Text>
                <View className="h-0.5 w-[30%] bg-gray-500"></View>
              </View>
              <View className="flex flex-row gap-3 justify-center items-center">
                <Image
                  source={require('../../res/pngs/google.png')}
                  className="w-50 h-50"
                  style={{width: 55, height: 55}}
                />
                <Image
                  source={require('../../res/jpgs/github.jpg')}
                  style={{width: 40, height: 40, borderRadius: 30}}
                />
              </View>
            </View>
          )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  cricle1: {
    top: '-4%',
    left: '-34%',
    position: 'absolute',
    opacity: 0.8,
  },
  circle2: {
    top: '-15%',
    left: '-12%',
    position: 'absolute',
    opacity: 0.8,
  },
  scrollView: {
    flexGrow: 1,
    width: 'auto',
    justifyContent: 'center',
    paddingHorizontal: '3%',
    paddingTop: '20%',
  },
});
