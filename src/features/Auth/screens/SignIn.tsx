import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
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
          <View style={styles.flex1}>
            <Formik
              initialValues={userData}
              validationSchema={signInSchema}
              onSubmit={(values: signInData) => signInUser(values)}>
              {({handleChange, handleSubmit, values, errors, isSubmitting}) => (
                <View style={styles.flex1}>
                  <View style={styles.headerContainer}>
                    <Text style={[styles.title, isDark && styles.titleDark]}>
                      Welcome Back!
                    </Text>
                    <Image
                      source={require('shared/res/pngs/signInHero-removebg.png')}
                      style={styles.heroImage}
                      placeholderStyle={styles.transparentBackground}
                    />
                  </View>

                  <View
                    style={[
                      styles.inputContainer,
                      isDark && styles.inputContainerDark,
                    ]}>
                    <Input
                      inputContainerStyle={styles.inputContainerStyleNoBorder}
                      placeholder="Username or Email"
                      placeholderTextColor={
                        isDark
                          ? styles.inputPlaceholderDark.color
                          : styles.inputPlaceholder.color
                      }
                      style={[
                        styles.inputStyle,
                        isDark && styles.inputStyleDark,
                      ]}
                      onChangeText={handleChange('usernameOrEmail')}
                      value={values.usernameOrEmail}
                      errorStyle={styles.displayNone}
                    />
                  </View>
                  {errors.usernameOrEmail && (
                    <ErrorMessage error={errors.usernameOrEmail} />
                  )}

                  <View
                    style={[
                      styles.inputContainer,
                      isDark && styles.inputContainerDark,
                    ]}>
                    <Input
                      placeholder="Password"
                      secureTextEntry={isPasswordHidden}
                      inputContainerStyle={styles.inputContainerStyleNoBorder}
                      placeholderTextColor={
                        isDark
                          ? styles.inputPlaceholderDark.color
                          : styles.inputPlaceholder.color
                      }
                      style={[
                        styles.inputStyle,
                        isDark && styles.inputStyleDark,
                      ]}
                      onChangeText={handleChange('password')}
                      value={values.password}
                      errorStyle={styles.displayNone}
                      rightIcon={
                        <FeatherIcon
                          color={isDark ? '#888' : '#AAA'}
                          name={isPasswordHidden ? 'eye-off' : 'eye'}
                          onPress={() => setisPasswordHidden(!isPasswordHidden)}
                          size={20}
                        />
                      }
                    />
                  </View>
                  {errors.password && <ErrorMessage error={errors.password} />}

                  <View style={styles.controlsContainer}>
                    <View style={styles.checkboxContainer}>
                      <BouncyCheckbox
                        size={22}
                        isChecked={true}
                        fillColor={isDark ? primaryColor : primaryDarkColor}
                        unFillColor={isDark ? '#1a1a1a' : '#fff'}
                        textComponent={
                          <Text
                            style={[
                              styles.checkboxText,
                              isDark && styles.checkboxTextDark,
                            ]}>
                            Keep Me Logged In
                          </Text>
                        }
                        iconStyle={styles.checkboxIcon}
                        innerIconStyle={styles.checkboxInnerIcon}
                        onPress={() => {}}
                      />
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={async () => {
                        if (!isForgotPasswordLoading) {
                          await handleForgotPassword(values.usernameOrEmail);
                        }
                      }}>
                      <Text style={styles.forgotPasswordLink}>
                        {isForgotPasswordLoading
                          ? 'Sending...'
                          : 'Forgot Password?'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleSubmit()}
                    style={[
                      styles.submitButton,
                      isDark && styles.submitButtonDark,
                    ]}>
                    {isSubmitting ? (
                      <ButtonLoader />
                    ) : (
                      <Text style={styles.submitButtonText}>Sign In</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.footerTextContainer}>
                    <Text
                      style={[
                        styles.footerText,
                        isDark && styles.footerTextDark,
                      ]}>
                      Don't Have An Account?{' '}
                      <Text
                        onPress={() => navigation.navigate('SignUp')}
                        style={styles.signUpLink}>
                        Sign Up
                      </Text>
                    </Text>
                  </View>

                  <View style={styles.dividerContainer}>
                    <View
                      style={[styles.divider, isDark && styles.dividerDark]}
                    />
                    <Text style={styles.dividerText}>Or Continue With</Text>
                    <View
                      style={[styles.divider, isDark && styles.dividerDark]}
                    />
                  </View>

                  <View style={styles.oauthContainer}>
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
              )}
            </Formik>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignIn;
