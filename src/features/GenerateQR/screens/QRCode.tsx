import {
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Share,
  Platform,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import QRCodeView from 'react-native-qrcode-svg';
import {useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import {selectFirebase, selectIsDark} from 'shared/store/selectors';
import Icon from 'react-native-vector-icons/Ionicons';
import {createStyles} from 'qr-code/styles/QRCode';
import {SafeAreaView} from 'react-native-safe-area-context';
import {logger} from 'shared/utils/logger';

// QR code format - uses a specific URI scheme for app deep linking
// Format: learnex://chat/{userId}
const QRCode = () => {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const isDark = useTypedSelector(selectIsDark);
  const firebase = useTypedSelector(selectFirebase);
  const currentUser = firebase.auth.currentUser();
  const [fullName, setFullName] = useState<string>('');
  const [qrValue, setQrValue] = useState<string>('');
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const styles = createStyles(isDark);

  useEffect(() => {
    const fetchData = async () => {
      const {fullName} = await firebase.user.getNameUsernamestring();
      setFullName(fullName);

      // Create a deep link URL with the current user's ID
      // This URL will be used to start a chat with the user when scanned
      if (currentUser && currentUser.uid) {
        const deepLinkUrl = `learnex://chat/${currentUser.uid}`;
        setQrValue(deepLinkUrl);
      }
    };
    fetchData();
  }, [currentUser, firebase.user]);

  // Function to share the deep link
  const handleShare = async () => {
    if (!qrValue) return;

    try {
      setIsSharing(true);

      // Create message for different platforms
      const message = Platform.select({
        ios: `Chat with me on Learnex: ${qrValue}`,
        android: `Chat with me on Learnex: ${qrValue}`,
        default: `Chat with me on Learnex: ${qrValue}`,
      });

      const result = await Share.share({
        message,
        url: qrValue, // iOS only
        title: 'Share Learnex Chat Link',
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
          logger.debug(
            'Shared with activity type:',
            result.activityType,
            'QRCode',
          );
        } else {
          // Shared
          logger.debug('Shared successfully', undefined, 'QRCode');
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        logger.debug('Share dismissed', undefined, 'QRCode');
      }
    } catch (error) {
      logger.error('Error sharing:', error, 'QRCode');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#1a1a1a' : '#f5f5f5'}
      />
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon
            name="arrow-back"
            size={24}
            color={isDark ? 'white' : 'black'}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your QR Code</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          disabled={isSharing || !qrValue}>
          <Icon
            name="share-social-outline"
            size={24}
            color={isDark ? 'white' : 'black'}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.qrCodeContainer}>
        <QRCodeView
          ecl="M"
          quietZone={10}
          value={qrValue || 'Loading...'}
          logo={{
            uri:
              currentUser?.photoURL ||
              'https://ui-avatars.com/api/?name==' +
                encodeURIComponent(fullName) ||
              'Anonymous',
          }}
          logoSize={100}
          logoMargin={-20}
          logoBorderRadius={35}
          logoBackgroundColor="transparent"
          size={300}
        />

        <Text style={styles.infoText}>
          Scan this QR code to start a conversation with me
        </Text>

        <TouchableOpacity
          style={[
            styles.shareButtonLarge,
            (!qrValue || isSharing) && styles.disabledOpacity,
          ]}
          onPress={handleShare}
          disabled={isSharing || !qrValue}>
          <Icon
            name="share-social"
            size={20}
            color="white"
            style={styles.shareButtonIcon}
          />
          <Text style={styles.shareButtonText}>
            {isSharing ? 'Sharing...' : 'Share Chat Link'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default QRCode;
