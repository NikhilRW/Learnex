import axios from 'axios';
import React, { useRef } from 'react';
import { View } from 'react-native';
import Config from 'react-native-config';
import WebView from 'react-native-webview';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import Snackbar from 'react-native-snackbar';
import { useTypedDispatch } from 'hooks/redux/useTypedDispatch';
import { changeIsLoggedIn, changeProfileColor } from 'shared/reducers/User';
import { getRandomColors } from 'shared/helpers/common/stringHelpers';

const LinkedInAuth = () => {
  const ref = useRef<WebView>(null);
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const dispatch = useTypedDispatch();

  const handleURIChange = (event: ShouldStartLoadRequest) => {
    if (event.url.includes('code=')) {
      handleDeepLink(event.url);
      return false;
    } else {
      return true;
    }
  };
  const handleDeepLink = async (url: string) => {
    const authenticationCode = new URL(url).searchParams.get('code');
    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      {
        grant_type: 'authorization_code',
        code: authenticationCode,
        client_id: Config.LINKEDIN_CLIENT_ID!,
        client_secret: Config.LINKEDIN_CLIENT_SECRET!,
        redirect_uri: 'https://learnex-web.vercel.app/auth/linkedin/sign-in',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    if (response.data.access_token !== null) {
      const { success, error } = await firebase.auth.linkedinSignIn(
        response.data.access_token,
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
        console.log(error);
      }
    } else {
      Snackbar.show({ text: 'LinkedIn Authentication Failed' });
    }
  };
  let a;
  return (
    <View className="flex-1">
      <WebView
        source={{
          uri: 'https://www.linkedin.com/oauth/v2/authorization?redirect_uri=https%3A%2F%2Flearnex-web.vercel.app%2Fauth%2Flinkedin%2Fsign-in&client_id=782j1d8cgc8xaw&response_type=code&scope=email%20profile',
        }}
        style={{
          flex: 1,
          height: '100%',
          position: 'absolute',
          zIndex: 1000,
          width: '100%',
          top: 0,
          left: 0,
        }}
        ref={ref}
        onShouldStartLoadWithRequest={handleURIChange}
      />
    </View>
  );
};

export default LinkedInAuth;

// In The SignIn.tsx
// <TouchableOpacity
//                       disabled={isLinkedInLoading || isSubmitting}
//                       onPress={handleLinkedInSignIn}
//                       style={{
//                         width: 38,
//                         height: 38,
//                         justifyContent: 'center',
//                         alignItems: 'center',
//                         backgroundColor: '#0066C8',
//                         borderRadius: 30,
//                       }}>
//                       {isLinkedInLoading ? (
//                         <>{/* <ButtonLoader /> */}</>
//                       ) : (
//                         <Image
//                           source={require('shared/res/webp/linkedin.webp')}
//                           style={{
//                             width: 38,
//                             height: 38,
//                             borderRadius: 30,
//                             marginBottom: 1.5,
//                           }}
//                         />
//                       )}
//                     </TouchableOpacity>
