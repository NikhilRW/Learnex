import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import FeatherIcon from 'react-native-vector-icons/Feather';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { Image, Input } from 'react-native-elements';
import MaterialsIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { AuthNavigationProps } from '../../routes/AuthStack';
import { Formik } from 'formik';
import { signInData } from '../../types/authTypes';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import useIsKeyboardVisible from '../../hooks/useKeyBoardVisible';
import { signInSchema } from '../../service/yupSchemas';
import ErrorMessage from '../../components/auth/ErrorMessage';
import Snackbar from 'react-native-snackbar';
import { changeIsLoggedIn } from '../../reducers/User';
import { useTypedDispatch } from '../../hooks/useTypedDispatch';
import { welcomeQuoteSignIn } from '../../res/strings/eng';

const SignIn = () => {
  const isKeyboardVisible = useIsKeyboardVisible();
  const navigation = useNavigation<AuthNavigationProps>();
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const dispatch = useTypedDispatch();
  const [isPasswordHidden, setisPasswordHidden] = useState(false);
  const userData: signInData = {
    usernameOrEmail: '',
    password: '',
  };
  const signInUser = async ({ usernameOrEmail, password }: signInData) => {
    const response = await firebase.checkUsernameOrEmailRegistered(usernameOrEmail);
    if(response.success){
      const { success, error } = await firebase.loginWithEmailAndPassword(response.email, password);
      if (success) {
        dispatch(changeIsLoggedIn(true));
      }
      else {
        Snackbar.show({
          text: 'Login Unsuccessful Due To : ' + error,
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#007cb5',
        });
      }
    }
    else{
      Snackbar.show({
        text: "User Doesn't ExistT",
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#007cb5',
      });
    }
  }
  const handleForgotPassword = async (usernameOrEmail: string) => {
    const { success, email, error } = await firebase.checkUsernameOrEmailRegistered(usernameOrEmail);
    if (success) {
      if ((await firebase.sendPasswordResetEmail(email)).success) {
        Snackbar.show({
          text: "Email Sent Successfully",
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#007cb5',
        });
      }
      else {
        Snackbar.show({
          text: "Email Not Sent",
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#007cb5',
        });
      }
    }
    else {
      Snackbar.show({
        text: "Username Or Email Is Not Registered",
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#007cb5',
      });
    }
  }
  return (
    <ScrollView
      contentContainerStyle={styles.scrollView}
      keyboardShouldPersistTaps="handled">
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="w-screen max-h-screen flex bg-transparent justify-center relative items-center">
        <Formik
          initialValues={userData}
          validationSchema={signInSchema}
          onSubmit={(values: signInData) => signInUser(values)}>
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            touched,
            values,
            errors,
          }) => (
            <View className="w-full h-full justify-center gap-y-[10%] flex items-center px-[6%]">
              <View className="w-full gap-y-4 items-center justify-center ">
                <View className="mb-[5%] w-full justify-center items-center">
                  <Text className='font-[Kufam-Bold] text-black text-3xl'>
                    Welcome Back!
                  </Text>
                  <Image
                    source={require('../../res/pngs/signInHero.png')}
                    onPress={async () => {
                      await firebase.googleSignIn();
                    }}
                    style={{
                      width: 200,
                      height: 200,
                      marginTop: 25,
                      marginRight:20,
                    }}
                  />
                </View>
                <View className="rounded-lg border-gray-400 border-2 w-full h-12">
                  <Input
                    inputContainerStyle={{ borderBottomWidth: 0 }}
                    placeholder="Enter Username or Email"
                    onChangeText={handleChange('usernameOrEmail')}
                    value={values.usernameOrEmail}
                  />
                </View>
                {errors.usernameOrEmail && <ErrorMessage error={errors.usernameOrEmail} />}
                <View className="rounded-lg border-gray-400 border-2 w-full h-12">
                  <Input
                    placeholder="Password"
                    secureTextEntry={isPasswordHidden}
                    inputContainerStyle={{ borderBottomWidth: 0 }}
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
                {errors.password && <ErrorMessage error={errors.password} />}
                <View className="flex-row justify-between w-full items-center">
                  <BouncyCheckbox
                    size={28}
                    isChecked={true}
                    fillColor="#3EB9F1"
                    unFillColor="#FFFFFF"
                    textComponent={
                      <Text className="mx-3 text-gray-500">
                        Keep Me Logged In
                      </Text>
                    }
                    iconStyle={{ borderColor: '#3EB9F1', borderRadius: 8 }}
                    innerIconStyle={{ borderWidth: 2, borderRadius: 8 }}
                    textStyle={{
                      fontFamily: 'JosefinSans-Regular',
                      fontSize: 14,
                      fontWeight: 'semibold',
                      textAlign: 'left',
                      textDecorationLine: 'none',
                    }}
                    onPress={(isChecked: boolean) => { }}
                  />
                  <Text
                    onPress={async () => await handleForgotPassword(values.usernameOrEmail)}
                    className="text-[#3EB9F1] font-bold text-[3.5vw]">
                    Forgot Password ?
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.65}
                  onPress={e => handleSubmit()}
                  className="bg-[#3EB9F1] px-[14%] py-[4%] rounded-2xl w-full">
                  <Text className="text-white text-center text-[5vw] font-bold">
                    Sign In
                  </Text>
                </TouchableOpacity>

                <View className="w-full">
                  <Text className="w-full font-thin text-[3.5vw] text-gray-600">
                    Don't Have An Account?{' '}
                    <Text
                      onPress={() => navigation.navigate('SignUp')}
                      className="text-[#3EB9F1] font-bold text-[3.5vw]">
                      Sign Up
                    </Text>
                  </Text>
                </View>
              </View>
              <View className="w-full ">
                <View className="flex flex-row justify-start items-center gap-[4%]">
                  <View className="h-0.5 w-[30%] bg-gray-500"></View>
                  <Text className="font-thin text-[3.5vw] text-gray-600">
                    Or Continue With
                  </Text>
                  <View className="h-0.5 w-[30%] bg-gray-500"></View>
                </View>
                <View className="flex flex-row gap-3 justify-center py-[3%] items-center">
                  <Image
                    source={require('../../res/pngs/google.png')}
                    className="w-50 h-50"
                    style={{ width: 55, height: 55 }}
                    onPress={() => {
                      firebase.googleSignIn();
                    }}
                  />
                  <Image
                    source={require('../../res/jpgs/github.jpg')}
                    style={{ width: 40, height: 40, borderRadius: 30 }}
                    onPress={() => {
                      firebase.githubSignIn();
                    }}
                  />
                </View>
              </View>
            </View>
          )}
        </Formik>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

export default SignIn;

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
    backgroundColor: 'white',
    width: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '3%',
    paddingTop: '20%',
  },
});
