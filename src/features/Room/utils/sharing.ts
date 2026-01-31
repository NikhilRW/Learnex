import {Platform, Share, Alert, Clipboard, ToastAndroid} from 'react-native';

/**
 * Share meeting invite with room code and links
 * @param roomCode - Meeting room code
 * @param meetingTitle - Title of the meeting
 */
export const shareMeetingInvite = async (
  roomCode: string,
  meetingTitle?: string,
): Promise<void> => {
  try {
    const deepLink = `learnex://meeting?roomCode=${roomCode}`;
    const webFallbackUrl = `https://learnex-web.vercel.app/join/${roomCode}`;

    const shareMessage = Platform.select({
      ios: `Join my Learnex meeting.\n\nMeeting code: ${roomCode}\n\nTap link to join: ${deepLink}\n\nDon't have the app? ${webFallbackUrl}`,
      android: `Join my Learnex meeting.\n\nMeeting code: ${roomCode}\n\nTap link to join: ${deepLink}\n\nDon't have the app? Visit: ${webFallbackUrl}`,
      default: `Join my Learnex meeting with code: ${roomCode}\n\nOpen in app: ${deepLink}\n\nOr visit: ${webFallbackUrl}`,
    });

    await Share.share({
      message: shareMessage,
      title: meetingTitle || 'Join my Learnex meeting',
      url: Platform.OS === 'ios' ? deepLink : undefined,
    });

    console.log('Successfully shared invite link');
  } catch (error) {
    console.error('Error sharing invite:', error);
  }
};

/**
 * Copy room code to clipboard
 * @param roomCode - Meeting room code
 */
export const copyRoomCode = (roomCode: string): void => {
  try {
    Clipboard.setString(roomCode);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Room code copied to clipboard!', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied', 'Room code copied to clipboard!');
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
};
