import {
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Share,
  Platform,
} from 'react-native';
import {useEffect, useState} from 'react';
import QRCodeView from 'react-native-qrcode-svg';
import {useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import {selectFirebase} from 'shared/store/selectors';
import Icon from 'react-native-vector-icons/Ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';
import {withUnistyles} from 'react-native-unistyles';
import {styles} from 'qr-code/styles/QRCode';
import {logger} from 'shared/utils/logger';

const UniQRCodeView = withUnistyles(QRCodeView, theme => ({
  quietZone: theme.sizes.qrQuietZone,
  logoSize: theme.sizes.qrLogoSize,
  logoMargin: theme.sizes.qrLogoMargin,
  logoBorderRadius: theme.sizes.qrLogoRadius,
  size: theme.sizes.qrSize,
}));
const HeaderIcon = withUnistyles(Icon, theme => ({
  size: theme.iconSizes.lg,
  color: theme.colors.text.primary,
}));
const ShareIcon = withUnistyles(Icon, theme => ({
  size: theme.iconSizes.md,
  color: theme.colors.textOnPrimary,
}));
const UniStatusBar = withUnistyles(StatusBar, (theme, rt) => ({
  backgroundColor: theme.colors.background,
  barStyle:
    rt.colorScheme === 'dark'
      ? ('light-content' as const)
      : ('dark-content' as const),
}));

// QR code format - uses a specific URI scheme for app deep linking
// Format: learnex://chat/{userId}
const QRCode = () => {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const firebase = useTypedSelector(selectFirebase);
  const currentUser = firebase.auth.currentUser();
  const [fullName, setFullName] = useState<string>('');
  const [qrValue, setQrValue] = useState<string>('');
  const [isSharing, setIsSharing] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      const {fullName: actualFullName} =
        await firebase.user.getNameUsernamestring();
      setFullName(actualFullName);

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
      <UniStatusBar />
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <HeaderIcon name="arrow-back" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your QR Code</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          disabled={isSharing || !qrValue}>
          <HeaderIcon name="share-social-outline" />
        </TouchableOpacity>
      </View>
      <View style={styles.qrCodeContainer}>
        <UniQRCodeView
          ecl="M"
          value={qrValue || 'Loading...'}
          logo={{
            uri:
              currentUser?.photoURL ||
              'https://ui-avatars.com/api/?name==' +
                encodeURIComponent(fullName) ||
              'Anonymous',
          }}
          logoBackgroundColor="transparent"
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
          <ShareIcon name="share-social" style={styles.shareButtonIcon} />
          <Text style={styles.shareButtonText}>
            {isSharing ? 'Sharing...' : 'Share Chat Link'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default QRCode;
