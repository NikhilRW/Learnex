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
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {Formik} from 'formik';
import {signInData} from 'shared/types/authTypes';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import {signInSchema} from 'auth/schema/yupSchemas';
import ErrorMessage from 'auth/components/ErrorMessage';
import Snackbar from 'react-native-snackbar';
import {changeIsLoggedIn, changeProfileColor} from 'shared/reducers/User';
import {useTypedDispatch} from 'hooks/redux/useTypedDispatch';
import {getRandomColors} from 'shared/helpers/common/stringHelpers';
import ButtonLoader from 'auth/components/ButtonLoader';
import {primaryColor, primaryDarkColor} from 'shared/res/strings/eng';
import {getStyles} from 'auth/styles/SignIn';
import OAuthButton from 'auth/components/OAuthButton';
import {AuthStackParamList} from '@/shared/navigation/routes/AuthStack';

const SignIn = () => {
  const theme = useTypedSelector(state => state.user.theme);
  const isDark = theme === 'dark';
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
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
      console.log('response', response);
      if (response.success) {
        dispatch(changeProfileColor(getRandomColors()));
        dispatch(changeIsLoggedIn(true));
        navigation.getParent()?.navigate('UserStack');
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

  // After Firebase Spark Plan
  // const handleLinkedInSignIn = async () => {
  //   try {
  //     setIsLinkedInLoading(true);
  //     navigation.navigate('LinkedInAuth', undefined);
  //   } catch (error) {
  //     console.error('LinkedIn sign in error:', error);
  //     Snackbar.show({
  //       text: 'Failed to sign in with LinkedIn',
  //       duration: Snackbar.LENGTH_LONG,
  //       textColor: 'white',
  //       backgroundColor: '#ff3b30',
  //     });
  //   } finally {
  //     setIsLinkedInLoading(false);
  //   }
  // };

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
        navigation.getParent()?.navigate('UserStack');
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

  const styles = getStyles(isDark);

  return (
    <View
      style={styles.flex1}
      className={`${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        enabled>
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
              {({handleChange, handleSubmit, values, errors, isSubmitting}) => (
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
                          source={require('shared/res/pngs/signInHero-removebg.png')}
                          style={styles.heroImage}
                        />
                      </View>
                      <View className="rounded-lg border-gray-400 border-2 w-full h-12">
                        <Input
                          inputContainerStyle={
                            styles.usernameOrEmailInputContainerStyle
                          }
                          placeholder="Enter Username or Email"
                          placeholderTextColor={`${isDark ? '#b5b5b5' : '#545454'}`}
                          style={styles.usernameOrEmailInput}
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
                          inputContainerStyle={
                            styles.usernameOrEmailInputContainerStyle
                          }
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
                          iconStyle={styles.checkBoxIconStyle}
                          innerIconStyle={styles.checkBoxInnerIconStyle}
                          textStyle={styles.agreeCheckboxTextStyle}
                        />
                        <Text
                          onPress={async () => {
                            if (!isForgotPasswordLoading) {
                              await handleForgotPassword(
                                values.usernameOrEmail,
                              );
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
                        onPress={() => handleSubmit()}
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
                      <View className="w-full ml-2">
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
                    <View className="w-full justify-center items-center">
                      <View className="flex flex-row w-full justify-start items-center gap-[4%]">
                        <View className="h-0.5 flex-1 bg-gray-500" />
                        <Text
                          className={`font-semibold text-[3.5vw] ${
                            isDark ? 'text-white' : 'text-gray-600'
                          } `}>
                          Or Continue With
                        </Text>
                        <View className="h-0.5 flex-1 bg-gray-500" />
                      </View>
                      <View className="flex gap-4 mt-[1px] flex-row w-full justify-center py-[3%] items-center">
                        <OAuthButton
                          isOAuthLoading={isGoogleLoading}
                          isSubmitting={isSubmitting}
                          oauthImage={require('shared/res/pngs/google.png')}
                          handleOAuthSignIn={handleGoogleSignIn}
                          isGitHub={false}
                        />
                        <OAuthButton
                          isOAuthLoading={isGithubLoading}
                          isSubmitting={isSubmitting}
                          oauthImage={require('shared/res/jpgs/github.jpg')}
                          handleOAuthSignIn={handleGithubSignIn}
                          isGitHub={true}
                        />
                      </View>
                    </View>
                  </View>
                </>
              )}
            </Formik>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignIn;
