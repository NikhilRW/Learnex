import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Keyboard,
} from 'react-native';
import React, {useState} from 'react';
import FeatherIcon from 'react-native-vector-icons/Feather';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import {Image, Input} from 'react-native-elements';
import MaterialsIcon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {AuthNavigationProps} from '../../routes/AuthStack';
import {Formik} from 'formik';
import {signInData} from '../../types/authTypes';
import {useTypedSelector} from '../../hooks/useTypedSelector';
import useIsKeyboardVisible from '../../hooks/useKeyBoardVisible';
import {signInSchema} from '../../service/yupSchemas';
import ErrorMessage from '../../components/auth/ErrorMessage';
import Snackbar from 'react-native-snackbar';
import {changeIsLoggedIn, changeProfileColor} from '../../reducers/User';
import {useTypedDispatch} from '../../hooks/useTypedDispatch';
import {getRandomColors} from '../../helpers/stringHelpers';
import Loader from '../../components/auth/Loader';
import ButtonLoader from '../../components/auth/ButtonLoader';
import {primaryColor, primaryDarkColor} from '../../res/strings/eng';
import {styles} from '../../styles/screens/auth/SignIn.styles';

const SignIn = () => {
  const theme = useTypedSelector(state => state.user.theme);
  const isDark = theme === 'dark';
  const isKeyboardVisible = useIsKeyboardVisible();
  const navigation = useNavigation<AuthNavigationProps>();
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const dispatch = useTypedDispatch();
  const [isPasswordHidden, setisPasswordHidden] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);
  const userData: signInData = {
    usernameOrEmail: '',
    password: '',
  };
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const response = await firebase.auth.googleSignIn();
      console.log(response);
      if (response.success) {
        dispatch(changeProfileColor(getRandomColors()));
        dispatch(changeIsLoggedIn(true));
      } else {
        Snackbar.show({
          text: 'Login Unsuccessful Due To : ' + response.error,
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#007cb5',
        });
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      Snackbar.show({
        text: 'Failed to sign in with Google',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };
  const handleGithubSignIn = async () => {
    try {
      setIsGithubLoading(true);
      const response = await firebase.auth.githubSignIn();
      if (response.success) {
        dispatch(changeProfileColor(getRandomColors()));
        dispatch(changeIsLoggedIn(true));
      } else {
        Snackbar.show({
          text: 'Login Unsuccessful Due To : ' + response.error,
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#007cb5',
        });
      }
    } catch (error) {
      console.error('GitHub sign in error:', error);
      Snackbar.show({
        text: 'Failed to sign in with GitHub',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    } finally {
      setIsGithubLoading(false);
    }
  };
  const signInUser = async ({usernameOrEmail, password}: signInData) => {
    const response =
      await firebase.user.checkUsernameOrEmailRegistered(usernameOrEmail);
    if (response.success) {
      const {success, error} = await firebase.auth.loginWithEmailAndPassword(
        response.email!,
        password,
      );
      if (success) {
        dispatch(changeProfileColor(getRandomColors()));
        dispatch(changeIsLoggedIn(true));
      } else {
        Snackbar.show({
          text: 'Login Unsuccessful Due To : ' + error,
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#007cb5',
        });
      }
    } else {
      Snackbar.show({
        text: "User Doesn't Exist",
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#007cb5',
      });
    }
  };
  const handleForgotPassword = async (usernameOrEmail: string) => {
    if (!usernameOrEmail.trim()) {
      Snackbar.show({
        text: 'Please enter a username or email',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
      return;
    }

    try {
      setIsForgotPasswordLoading(true);
      const {email, success} =
        await firebase.user.checkUsernameOrEmailRegistered(usernameOrEmail);
      if (success) {
        await firebase.auth.sendPasswordResetEmail(email!);
      }
      Snackbar.show({
        text: 'Password reset sended link sended to email if it is registered ',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#007cb5',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      Snackbar.show({
        text: 'Failed to process password reset',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1}}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      enabled
      className={`${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
      <ScrollView
        className={`${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}
        contentContainerStyle={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive">
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
        <TouchableOpacity
          activeOpacity={1}
          onPress={Keyboard.dismiss}
          className="w-screen max-h-screen flex bg-transparent justify-center relative items-center">
          <Formik
            initialValues={userData}
            validationSchema={signInSchema}
            onSubmit={(values: signInData) => signInUser(values)}>
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              isSubmitting,
            }) => (
              <>
                {/* 
                feature : Loading Effect Center
                {false && <Loader />} 
                */}
                <View className="w-full h-full justify-center gap-y-[10%] flex items-center px-[6%]">
                  <View className="w-full gap-y-4 items-center justify-center ">
                    <View className="mb-[5%] w-full justify-center items-center">
                      <Text
                        className={`font-[Kufam-Bold] text-black text-[9vw] ${
                          isDark ? ' text-white' : 'text-black'
                        }`}>
                        Welcome Back!
                      </Text>
                      <Image
                        source={require('../../res/pngs/signInHero-removebg.png')}
                        style={{
                          width: 220,
                          height: 220,
                          marginTop: 25,
                          marginRight: 20,
                        }}
                      />
                    </View>
                    <View className="rounded-lg border-gray-400 border-2 w-full h-12">
                      <Input
                        inputContainerStyle={{borderBottomWidth: 0}}
                        placeholder="Enter Username or Email"
                        placeholderTextColor={`${isDark ? '#b5b5b5' : '#545454'}`}
                        style={{color: isDark ? 'white' : '#1a1a1a'}}
                        onChangeText={handleChange('usernameOrEmail')}
                        value={values.usernameOrEmail}
                      />
                    </View>
                    {errors.usernameOrEmail && (
                      <ErrorMessage error={errors.usernameOrEmail} />
                    )}
                    <View className="rounded-lg border-gray-400 border-2 w-full h-12">
                      <Input
                        placeholder="Password"
                        secureTextEntry={isPasswordHidden}
                        inputContainerStyle={{borderBottomWidth: 0}}
                        placeholderTextColor={`${isDark ? '#b5b5b5' : '#545454'}`}
                        style={{color: `${isDark ? 'white' : 'black'}`}}
                        onChangeText={handleChange('password')}
                        value={values.password}
                        rightIcon={
                          <FeatherIcon
                            color={isDark ? 'white' : 'black'}
                            name={isPasswordHidden ? 'eye-off' : 'eye'}
                            onPress={() =>
                              setisPasswordHidden(!isPasswordHidden)
                            }
                            size={20}
                          />
                        }
                      />
                    </View>
                    {errors.password && (
                      <ErrorMessage error={errors.password} />
                    )}
                    <View className="flex-row justify-between w-full items-center">
                      <BouncyCheckbox
                        size={28}
                        isChecked={true}
                        fillColor={`${isDark ? primaryColor : primaryDarkColor}`}
                        unFillColor={`${isDark ? '#1a1a1a' : '#fff'}`}
                        textComponent={
                          <Text
                            className={`mx-3 ${
                              isDark ? 'text-white' : 'text-gray-600'
                            } `}>
                            Keep Me Logged In
                          </Text>
                        }
                        iconStyle={{borderColor: primaryColor, borderRadius: 8}}
                        innerIconStyle={{borderWidth: 2, borderRadius: 8}}
                        textStyle={{
                          fontFamily: 'JosefinSans-Regular',
                          fontSize: 14,
                          fontWeight: 'semibold',
                          textAlign: 'left',
                          textDecorationLine: 'none',
                        }}
                      />
                      <Text
                        onPress={async () => {
                          if (!isForgotPasswordLoading) {
                            await handleForgotPassword(values.usernameOrEmail);
                          }
                        }}
                        className="text-[#3EB9F1] font-bold text-[3.5vw]">
                        {isForgotPasswordLoading
                          ? 'Sending...'
                          : 'Forgot Password ?'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.65}
                      onPress={e => handleSubmit()}
                      className={`${
                        isDark ? 'bg-[#1a9cd8]' : 'bg-[#3EB9F1]'
                      }  px-[14%] py-[4%] rounded-2xl w-full`}>
                      {isSubmitting ? (
                        <ButtonLoader />
                      ) : (
                        <Text className="text-white text-center text-[5vw] font-bold">
                          Sign In
                        </Text>
                      )}
                    </TouchableOpacity>
                    <View className="w-full">
                      <Text
                        className={`w-full font-normal text-[3.5vw]  ${
                          isDark ? 'text-white' : 'text-gray-600'
                        }`}>
                        Don't Have An Account?{' '}
                        <Text
                          onPress={() => navigation.navigate('SignUp')}
                          className={`${
                            isDark ? 'text-[#3EB9F1]' : 'text-[#1a9cd8]'
                          } font-medium text-[3.5vw]`}>
                          Sign Up
                        </Text>
                      </Text>
                    </View>
                  </View>
                  <View className="w-full ">
                    <View className="flex flex-row justify-start items-center gap-[4%]">
                      <View className="h-0.5 w-[25%] bg-gray-500"></View>
                      <Text
                        className={`font-semibold text-[3.5vw] ${
                          isDark ? 'text-white' : 'text-gray-600'
                        } `}>
                        Or Continue With
                      </Text>
                      <View className="h-0.5 w-[25%] bg-gray-500"></View>
                    </View>
                    <View className="flex flex-row mx-auto w-full gap-3 justify-center py-[3%] items-center">
                      <TouchableOpacity
                        disabled={isGoogleLoading || isSubmitting}
                        onPress={handleGoogleSignIn}
                        style={{
                          width: 55,
                          height: 55,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                        {isGoogleLoading ? (
                          <ButtonLoader
                            size="small"
                            color={isDark ? '#ffffff' : '#1a9cd8'}
                          />
                        ) : (
                          <Image
                            source={require('../../res/pngs/google.png')}
                            className="w-50 h-50"
                            style={{width: 55, height: 55}}
                          />
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled={isGithubLoading || isSubmitting}
                        onPress={handleGithubSignIn}
                        style={{
                          width: 40,
                          height: 40,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderRadius: 30,
                        }}>
                        {isGithubLoading ? (
                          <ButtonLoader
                            size="small"
                            color={isDark ? '#ffffff' : '#000000'}
                          />
                        ) : (
                          <Image
                            source={require('../../res/jpgs/github.jpg')}
                            style={{width: 40, height: 40, borderRadius: 30}}
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </>
            )}
          </Formik>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignIn;
