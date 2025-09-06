import {ImageSourcePropType, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {Image} from 'react-native';
import ButtonLoader from './ButtonLoader';
import {styles} from '../../styles/components/auth/OAuthButton.styles';

const OAuthButton = ({
  handleOAuthSignIn,
  isOAuthLoading,
  isSubmitting,
  oauthImage,
  isGitHub,
}: {
  isOAuthLoading: boolean;
  isSubmitting: boolean;
  handleOAuthSignIn: () => void;
  oauthImage: ImageSourcePropType;
  isGitHub: boolean;
}) => {
  return (
    <View>
      <TouchableOpacity
        disabled={isOAuthLoading || isSubmitting}
        onPress={handleOAuthSignIn}
        style={styles.oauthButtonContainer}>
        {isOAuthLoading ? (
          <ButtonLoader />
        ) : (
          <Image
            source={oauthImage}
            className="w-50 h-50"
            style={isGitHub ? styles.gitHubOAuthImage : styles.oauthImage}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default OAuthButton;
