import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { MeetingService } from 'room/services/MeetingService';
import { WebRTCService } from 'room/services/WebRTCService';
import Room from 'room/components/Room';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import { UserStackParamList } from 'shared/navigation/routes/UserStack';
import { getAuth } from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TaskService } from 'shared/services/TaskService';
import { styles } from 'room/styles/RoomScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
// Import hooks
import {
  useRoomConnection,
  useRoomMedia,
  useRoomChat,
  useRoomActions,
} from '../hooks';
import RoomLoadingIndicator from '../components/RoomLoadingIndicator';

type RoomScreenRouteProp = RouteProp<UserStackParamList, 'RoomScreen'>;
type RoomScreenNavigationProp = DrawerNavigationProp<UserStackParamList>;

// TODO: test this screen afterwards.

// Service instances
const meetingService = new MeetingService();
const webRTCService = new WebRTCService();
const taskService = new TaskService();

const RoomScreen: React.FC = () => {
  const navigation = useNavigation<RoomScreenNavigationProp>();
  const route = useRoute<RoomScreenRouteProp>();
  const { meeting, isHost } = route.params;
  const userTheme = useTypedSelector(state => state.user);
  const isDark = userTheme.theme === 'dark';
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const currentUser = getAuth().currentUser;
  const firebase = useTypedSelector(state => state.firebase);

  // Cleanup function
  const cleanup = useCallback(async () => {
    try {
      console.log('Cleaning up resources');

      // Leave the meeting
      await meetingService.leaveMeeting(meeting.id);

      // Cleanup services
      meetingService.cleanup();
      webRTCService.cleanup();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }, [meeting.id]);

  // Use chat hook first to get unsubscribeMessages
  const { messages, sendMessage, handleMessageReaction, unsubscribeMessages } =
    useRoomChat({
      meetingId: meeting.id,
    });

  // Use actions hook (needs cleanup and unsubscribeMessages)
  const {
    handleRaiseHand,
    handleReaction,
    confirmLeaveRoom,
    handleMeetingEnded,
  } = useRoomActions({
    meeting,
    isHost,
    isConnecting: false, // Will be updated from connection hook
    meetingService,
    webRTCService,
    taskService,
    cleanup,
    unsubscribeMessages,
  });

  // Use connection hook
  const {
    localStream,
    setLocalStream,
    remoteStreams,
    isConnecting,
    connectionState,
    connectionError,
    connectionAttempts,
    participantStates,
  } = useRoomConnection({
    meeting,
    meetingService,
    webRTCService,
    onMeetingEnded: handleMeetingEnded,
  });

  // Use media hook
  const {
    isAudioEnabled,
    isVideoEnabled,
    isFrontCamera,
    handleToggleAudio,
    handleToggleVideo,
    handleFlipCamera,
    handleLocalStreamUpdate,
  } = useRoomMedia({
    meetingId: meeting.id,
    localStream,
    setLocalStream,
    webRTCService,
  });

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { fullName: fetchedFullName, username: fetchedUsername } =
          await firebase.firebase.user.getNameUsernamestring();
        console.log(fetchedFullName, fetchedUsername);
        setUsername(fetchedUsername);
        setFullName(fetchedFullName);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setUsername('Anonymous');
        setFullName('Anonymous');
      }
    };
    fetchUserData();
  }, [currentUser, firebase.firebase.user]);

  if (isConnecting) {
    return (
      <RoomLoadingIndicator
        confirmLeaveRoom={confirmLeaveRoom}
        connectionAttempts={connectionAttempts}
        connectionError={connectionError}
        connectionState={connectionState}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaViewContainer}>
      {connectionState === 'failed' ? (
        <View style={styles.errorContainer}>
          <Icon name="error" size={64} color="#EA4335" />
          <Text style={styles.errorTitle}>Connection Failed</Text>
          <Text style={styles.errorMessage}>
            {connectionError ||
              'Could not connect to the meeting. Please try again.'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Room
          meeting={meeting}
          localStream={localStream}
          updateLocalStream={handleLocalStreamUpdate}
          remoteStreams={remoteStreams}
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          onEndCall={confirmLeaveRoom}
          onSendMessage={sendMessage}
          onMessageReaction={handleMessageReaction}
          messages={messages}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isDark={isDark}
          currentUserId={currentUser?.uid || ''}
          currentUserName={fullName || username || currentUser?.email || 'You'}
          onRaiseHand={handleRaiseHand}
          onReaction={handleReaction}
          participantStates={participantStates}
          isConnecting={isConnecting}
          onFlipCamera={handleFlipCamera}
          isFrontCamera={isFrontCamera}
        />
      )}
    </SafeAreaView>
  );
};

export default RoomScreen;
