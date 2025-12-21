import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {styles} from 'auth/styles/SignUp';
import React, {useCallback, useEffect, useState} from 'react';
import FeatherIcon from 'react-native-vector-icons/Feather';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import {Input} from 'react-native-elements';
import MaterialsIcon from 'react-native-vector-icons/MaterialIcons';
import {
  emailNotAvailErrMsg,
  primaryColor,
  primaryDarkColor,
  privacyTitle,
  usernameNotAvailErrMsg,
  welcomeQuoteSignIn,
} from 'shared/res/strings/eng';
import useIsKeyboardVisible from 'hooks/common/useKeyBoardVisible';
import {useNavigation} from '@react-navigation/native';
import {AuthNavigationProps} from 'shared/navigation/routes/AuthStack';
import {Formik} from 'formik';
import {signUpData} from 'shared/types/authTypes';
import ErrorMessage from 'auth/components/ErrorMessage';
import {signUpSchema} from 'auth/schema/yupSchemas';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import Snackbar from 'react-native-snackbar';
import debounce from 'lodash.debounce';
import OAuthButton from '../components/OAuthButton';

const SignUp = () => {
  const isKeyboardVisible = useIsKeyboardVisible();
  const theme = useTypedSelector(state => state.user.theme);
  const isDark = theme === 'dark';
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

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
    const {success, error} =
      await firebase.auth.signUpWithEmailAndPassword(values);
    if (success) {
      Snackbar.show({
        text: 'Sign Up Successful',
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
    const handleDeepLink = (_event: {url: string}) => {};

    // Set up listeners for deep links - handle API differences in React Native versions
    let subscription: any;
    if (Linking.addEventListener) {
      // Modern React Native (>=0.65)
      subscription = Linking.addEventListener('url', handleDeepLink);
    } else {
      // Older React Native with deprecated API
      Linking.addEventListener('url', handleDeepLink);
    }

    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({url});
    });

    return () => {
      // Clean up the event listener - handle API differences
      if (subscription) {
        // Modern React Native with subscription object
        subscription.remove();
      } else if ((Linking as any).removeEventListener) {
        // Fallback for older React Native versions if needed
        (Linking as any).removeEventListener('url', handleDeepLink);
      }
    };
  }, []);

  const checkUsernameAvailability = useCallback(
    async (username: string) => {
      const {success} = await firebase.user.checkUsernameIsAvailable(username);
      setIsUsernameError(!success);
    },
    [firebase.user],
  );

  const debouncedCheckUsername = useCallback(
    (username: string) => debounce(checkUsernameAvailability, 500)(username),
    [checkUsernameAvailability],
  );

  const checkEmailAvailability = useCallback(
    async (email: string) => {
      const {success} = await firebase.user.checkEmailIsAvailable(email);
      setIsEmailError(!success);
    },
    [firebase.user],
  );

  const debouncedCheckEmail = useCallback(
    (email: string) => debounce(checkEmailAvailability, 500)(email),
    [checkEmailAvailability],
  );

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const {success, error} = await firebase.auth.googleSignIn();
    if (success) {
      navigation.getParent()?.navigate('UserStack');
    } else {
      console.log('Google Sign-In Failed :: ', error);
      Snackbar.show({
        text: 'Google Sign-In Failed',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#007cb5',
      });
    }
    setIsGoogleLoading(false);
  };

  const handleGitHubSignIn = async () => {
    setIsGithubLoading(true);
    const {success, error} = await firebase.auth.githubSignIn();
    if (success) {
      navigation.getParent()?.navigate('UserStack');
    } else {
      console.log('GitHub Sign-In Failed :: ', error);
      Snackbar.show({
        text: 'GitHub Sign-In Failed',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#007cb5',
      });
    }
    setIsGithubLoading(false);
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className={`flex-1 ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive">
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
            {({handleChange, handleSubmit, values, errors, isSubmitting}) => (
              <View className="w-full justify-center flex items-center">
                <View style={styles.headerContainer}>
                  <Text style={[styles.title, isDark && styles.titleDark]}>
                    Welcome OnBoard!
                  </Text>
                  <Text
                    style={[styles.subtitle, isDark && styles.subtitleDark]}>
                    {welcomeQuoteSignIn}
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    isDark && styles.inputContainerDark,
                  ]}>
                  <Input
                    inputContainerStyle={styles.inputContainerStyleNoBorder}
                    placeholderTextColor={isDark ? '#888' : '#AAA'}
                    style={[styles.inputStyle, isDark && styles.inputStyleDark]}
                    placeholder="Full Name"
                    onChangeText={handleChange('fullName')}
                    value={values.fullName}
                    errorStyle={styles.displayNone}
                  />
                </View>
                {errors.fullName && <ErrorMessage error={errors.fullName} />}

                <View
                  style={[
                    styles.inputContainer,
                    isDark && styles.inputContainerDark,
                  ]}>
                  <Input
                    inputContainerStyle={styles.inputContainerStyleNoBorder}
                    placeholderTextColor={isDark ? '#888' : '#AAA'}
                    style={[styles.inputStyle, isDark && styles.inputStyleDark]}
                    placeholder="Username"
                    onChangeText={text => {
                      handleChange('username')(text);
                      handleUsernameChange(text);
                    }}
                    value={values.username}
                    errorStyle={styles.displayNone}
                  />
                </View>
                {errors.username && <ErrorMessage error={errors.username} />}
                {isUsernameError && (
                  <ErrorMessage error={usernameNotAvailErrMsg} />
                )}

                <View
                  style={[
                    styles.inputContainer,
                    isDark && styles.inputContainerDark,
                  ]}>
                  <Input
                    inputContainerStyle={styles.inputContainerStyleNoBorder}
                    placeholderTextColor={isDark ? '#888' : '#AAA'}
                    style={[styles.inputStyle, isDark && styles.inputStyleDark]}
                    placeholder="Email Address"
                    onChangeText={text => {
                      handleChange('email')(text);
                      handleEmailChange(text);
                    }}
                    value={values.email}
                    errorStyle={styles.displayNone}
                  />
                </View>
                {isEmailError && <ErrorMessage error={emailNotAvailErrMsg} />}
                {errors.email && <ErrorMessage error={errors.email} />}

                <View
                  style={[
                    styles.inputContainer,
                    isDark && styles.inputContainerDark,
                  ]}>
                  <Input
                    placeholder="Password"
                    secureTextEntry={isPasswordHidden}
                    inputContainerStyle={styles.inputContainerStyleNoBorder}
                    placeholderTextColor={isDark ? '#888' : '#AAA'}
                    style={[styles.inputStyle, isDark && styles.inputStyleDark]}
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

                <View
                  style={[
                    styles.inputContainer,
                    isDark && styles.inputContainerDark,
                  ]}>
                  <Input
                    placeholder="Confirm Password"
                    placeholderTextColor={isDark ? '#888' : '#AAA'}
                    secureTextEntry={isConfirmPasswordHidden}
                    inputContainerStyle={styles.inputContainerStyleNoBorder}
                    style={[styles.inputStyle, isDark && styles.inputStyleDark]}
                    onChangeText={handleChange('confirmPassword')}
                    value={values.confirmPassword}
                    errorStyle={styles.displayNone}
                    rightIcon={
                      <FeatherIcon
                        color={isDark ? '#888' : '#AAA'}
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
                <View style={styles.checkboxContainer}>
                  <BouncyCheckbox
                    size={22}
                    isChecked={isAgreedTerms}
                    fillColor={isDark ? primaryColor : primaryDarkColor}
                    unFillColor={isDark ? '#1a1a1a' : '#fff'}
                    textComponent={
                      <View style={styles.flex1}>
                        <Text
                          style={[
                            styles.checkboxText,
                            isDark && styles.checkboxTextDark,
                          ]}>
                          {privacyTitle}
                        </Text>
                      </View>
                    }
                    iconStyle={styles.checkboxIcon}
                    innerIconStyle={styles.checkboxInnerIcon}
                    onPress={(isChecked: boolean) => {
                      setIsAgreedTerms(isChecked);
                    }}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={_ => handleSubmit()}
                  style={[
                    styles.submitButton,
                    isDark && styles.submitButtonDark,
                  ]}>
                  <Text style={styles.submitButtonText}>Create An Account</Text>
                </TouchableOpacity>

                <View style={styles.footerTextContainer}>
                  <Text
                    style={[
                      styles.footerText,
                      isDark && styles.footerTextDark,
                    ]}>
                    Already Have An Account?{' '}
                    <Text
                      onPress={() => navigation.navigate('SignIn')}
                      style={styles.signInLink}>
                      Sign In
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
                    handleOAuthSignIn={handleGitHubSignIn}
                    isGitHub={true}
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
