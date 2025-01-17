import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import FeatherIcon from 'react-native-vector-icons/Feather';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { Image, Input } from 'react-native-elements';
import MaterialsIcon from 'react-native-vector-icons/MaterialIcons';
import {
  emailNotAvailErrMsg,
  primaryColor,
  primaryDarkColor,
  privacyTitle,
  SignUpSubHeader,
  usernameNotAvailErrMsg,
  welcomeQuoteSignIn,
} from '../../res/strings/eng';
import useIsKeyboardVisible from '../../hooks/useKeyBoardVisible';
import { useNavigation } from '@react-navigation/native';
import { AuthNavigationProps } from '../../routes/AuthStack';
import { Formik } from 'formik';
import { signUpData } from '../../types/authTypes';
import ErrorMessage from '../../components/auth/ErrorMessage';
import { signUpSchema } from '../../service/yupSchemas';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import Snackbar from 'react-native-snackbar';
import debounce from 'lodash.debounce';
import Loader from '../../components/auth/Loader';

const SignUp = () => {
  const isKeyboardVisible = useIsKeyboardVisible();
  const theme = useTypedSelector(state => state.user.theme);
  const isDark = theme === "dark";
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const navigation = useNavigation<AuthNavigationProps>();
  const [isConfirmPasswordHidden, setisConfirmPasswordHidden] =
    useState<boolean>(false);
  const [isPasswordHidden, setisPasswordHidden] = useState<boolean>(false);
  const [isAgreedTerms, setIsAgreedTerms] = useState<boolean>(false);
  const [isUsernameError, setIsUsernameError] = useState<boolean>(false);
  const [isEmailError, setIsEmailError] = useState<boolean>(false);
  const userData: signUpData = {
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  };
  const submitDataToDB = async (values: signUpData) => {
    if (isUsernameError) {
      Snackbar.show({
        text: 'Username Not Available',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#007cb5',
      });
      return;
    }
    if (!isAgreedTerms) {
      Snackbar.show({
        text: 'User must agree terms and condition',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#007cb5',
      });
      return;
    }
    const { success, error } = await firebase.signUpWithEmailAndPassword(values);
    if (success) {
      Snackbar.show({
        text: 'Sign Up Successfull',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#007cb5',
      });
      navigation.navigate('SignIn');
    } else {
      Snackbar.show({
        text: String(error),
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#007cb5',
      });
    }
  };
  const handleUsernameChange = (username: string) => {
    if (username) {
      debouncedCheckUsername(username);
    } else {
      setIsUsernameError(false);
    }
  };
  const handleEmailChange = (email: string) => {
    if (email) {
      debouncedCheckEmail(email);
    } else {
      setIsEmailError(false);
    }
  };
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => { };
    Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({ url });
    });
    return () => {
      Linking.removeAllListeners('url');
    };
  }, []);
  const checkUsernameAvailability = async (username: string) => {
    const { success } = await firebase.checkUsernameIsAvailable(username);
    if (success) {
      setIsUsernameError(false);
    } else {
      setIsUsernameError(true);
    }
  };
  const debouncedCheckUsername = useCallback(
    debounce(checkUsernameAvailability, 500),
    [],
  );
  const checkEmailAvailability = async (email: string) => {
    const { success } = await firebase.checkEmailIsAvailable(email);
    if (success) {
      setIsEmailError(false);
    } else {
      setIsEmailError(true);
    }
  };
  const debouncedCheckEmail = useCallback(
    debounce(checkEmailAvailability, 500),
    [],
  );
  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        className={`${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}
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
        <Formik
          initialValues={userData}
          validationSchema={signUpSchema}
          onSubmit={values => submitDataToDB(values)}>
          {({ handleChange, handleSubmit, values, errors, isSubmitting }) => (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="w-full h-full justify-center flex items-center gap-y-5">
              {isSubmitting && <Loader />}
              <View className="mb-[10%] w-screen items-center">
                <Text className={`font-[Kufam-Bold] ${isDark ? " text-white" : "text-black"} text-3xl`}>
                  Welcome OnBoard!
                </Text>
                <Text className={`font-[Kufam-SemiBold] ${isDark ? " text-gray-300" : "text-gray-800"} text-xl`}>
                  {welcomeQuoteSignIn}
                </Text>
              </View>
              <View className="rounded-lg border-gray-400 border-2 w-full h-12">
                <Input
                  inputContainerStyle={{ borderBottomWidth: 0 }}
                  placeholderTextColor={`${isDark ? '#b5b5b5' : '#545454'}`}
                  style={{ color: `${isDark ? 'white' : 'black'}` }}
                  placeholder="Enter Fullname"
                  onChangeText={handleChange('fullName')}
                  value={values.fullName}
                />
              </View>
              {errors.fullName && <ErrorMessage error={errors.fullName} />}
              <View className="rounded-lg border-gray-400 border-2 w-full h-12">
                <Input
                  inputContainerStyle={{ borderBottomWidth: 0 }}
                  placeholderTextColor={`${isDark ? '#b5b5b5' : '#545454'}`}
                  style={{ color: `${isDark ? 'white' : 'black'}` }}
                  placeholder="Enter Username"
                  onChangeText={text => {
                    handleChange('username')(text);
                    handleUsernameChange(text);
                  }}
                  value={values.username}
                />
              </View>
              {errors.username && <ErrorMessage error={errors.username} />}
              {isUsernameError && (
                <ErrorMessage error={usernameNotAvailErrMsg} />
              )}
              <View className="rounded-lg border-gray-400 border-2 w-full h-12">
                <Input
                  inputContainerStyle={{ borderBottomWidth: 0 }}
                  placeholderTextColor={`${isDark ? '#b5b5b5' : '#545454'}`}
                  style={{ color: `${isDark ? 'white' : 'black'}` }}
                  placeholder="Enter Email"
                  onChangeText={text => {
                    handleChange('email')(text);
                    handleEmailChange(text);
                  }}
                  value={values.email}
                />
              </View>
              {isEmailError && <ErrorMessage error={emailNotAvailErrMsg} />}
              {errors.email && <ErrorMessage error={errors.email} />}
              <View className="rounded-lg border-gray-400 border-2 w-full h-12">
                <Input
                  placeholder="Password"
                  secureTextEntry={isPasswordHidden}
                  inputContainerStyle={{ borderBottomWidth: 0 }}
                  placeholderTextColor={`${isDark ? '#b5b5b5' : '#545454'}`}
                  style={{ color: `${isDark ? 'white' : 'black'}` }}
                  onChangeText={handleChange('password')}
                  value={values.password}
                  rightIcon={
                    <FeatherIcon
                      color={isDark ? 'white' : 'black'}
                      name={isPasswordHidden ? 'eye-off' : 'eye'}
                      onPress={() => setisPasswordHidden(!isPasswordHidden)}
                      size={20}
                    />
                  }
                />
              </View>
              {errors.password && <ErrorMessage error={errors.password} />}
              <View className="rounded-lg border-gray-400 border-2 w-full h-12">
                <Input
                  placeholder="Confirm Password"
                  placeholderTextColor={`${isDark ? '#b5b5b5' : '#545454'}`}
                  secureTextEntry={isConfirmPasswordHidden}
                  inputContainerStyle={{ borderBottomWidth: 0 }}
                  style={{ color: `${isDark ? 'white' : 'black'}` }}
                  onChangeText={handleChange('confirmPassword')}
                  value={values.confirmPassword}
                  rightIcon={
                    <FeatherIcon
                      color={isDark ? 'white' : 'black'}
                      name={isConfirmPasswordHidden ? 'eye-off' : 'eye'}
                      onPress={() =>
                        setisConfirmPasswordHidden(!isConfirmPasswordHidden)
                      }
                      size={20}
                    />
                  }
                />
              </View>
              {errors.confirmPassword && (
                <ErrorMessage error={errors.confirmPassword} />
              )}
              <BouncyCheckbox
                size={28}
                isChecked={isAgreedTerms}
                fillColor={`${isDark ? primaryColor : primaryDarkColor}`}
                unFillColor={`${isDark ? "#1a1a1a" : "#fff"}`}
                textComponent={
                  <Text className={`mx-3 ${isDark ? "text-white" : "text-gray-400"}`}>{privacyTitle}</Text>
                }
                iconStyle={{ borderColor: primaryColor, borderRadius: 8 }}
                innerIconStyle={{ borderWidth: 2, borderRadius: 8 }}
                textStyle={{
                  fontFamily: 'JosefinSans-Regular',
                  fontSize: 14,
                  fontWeight: 'semibold',
                  textAlign: 'left',
                  textDecorationLine: 'none',
                }}
                onPress={(isChecked: boolean) => {
                  setIsAgreedTerms(isChecked);
                }}
              />
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={e => handleSubmit()}
                className={`${isDark ? "bg-[#1a9cd8]" : "bg-[#3EB9F1]"} px-[14%] py-[4%] rounded-2xl w-full`}>
                <Text className="text-white text-center text-[5vw] font-bold">
                  Create An Account
                </Text>
              </TouchableOpacity>
              <View className="w-full">
                <Text className={`w-full text-[3.5vw] ${isDark ? "text-white" : "text-gray-400"} font-semibold text-left`}>
                  Already Have An Account?{' '}
                  <Text
                    onPress={() => navigation.navigate('SignIn')}
                    className="text-[#3EB9F1] font-bold text-[3.5vw]">
                    Sign In
                  </Text>
                </Text>
              </View>
              <View className="flex flex-row justify-start items-center gap-[4%]">
                <View className="h-0.5 w-[30%] bg-gray-500"></View>
                <Text className={`text-[3.5vw] text-gray-500 font-semibold ${isDark ? "text-white" : "text-gray-400"}`}>
                  Or Continue With
                </Text>
                <View className="h-0.5 w-[30%] bg-gray-500"></View>
              </View>
              <View className="flex flex-row gap-[3%] justify-center items-center">
                <Image
                  source={require('../../res/pngs/google.png')}
                  className="w-50 h-50"
                  onPress={async () => {
                    await firebase.googleSignIn();
                  }}
                  style={{ width: 55, height: 55 }}
                />
                <Image
                  source={require('../../res/jpgs/github.jpg')}
                  onPress={() => {
                    firebase.githubSignIn();
                  }}
                  style={{ width: 40, height: 40, borderRadius: 30 }}
                />
              </View>
            </KeyboardAvoidingView>
          )}
        </Formik>
      </ScrollView>
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
    paddingHorizontal: '5%',
    paddingTop: '28%',
    paddingBottom: '11%',
  },
});
