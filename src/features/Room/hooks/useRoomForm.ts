import {useState, useCallback} from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {MeetingRoom} from '../types/object';
import {
  DEFAULT_MEETING_ROOM,
  DEFAULT_MEETING_SETTINGS,
} from '../constants/common';
import {
  validateMeetingRoom,
  validateRoomCode,
  showValidationError,
} from '../utils/validation';
import {MeetingService} from '../services/MeetingService';
import {UserStackParamList} from 'shared/navigation/routes/UserStack';

const meetingService = new MeetingService();

/**
 * Custom hook for managing room form state and operations
 * Handles meeting room creation and joining logic
 */
export const useRoomForm = () => {
  const navigation = useNavigation<DrawerNavigationProp<UserStackParamList>>();
  const [meetingRoom, setMeetingRoom] =
    useState<MeetingRoom>(DEFAULT_MEETING_ROOM);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Updates meeting room state with partial updates
   */
  const updateMeetingRoom = useCallback((updates: Partial<MeetingRoom>) => {
    setMeetingRoom(prev => ({...prev, ...updates}));
  }, []);

  /**
   * Handles room creation with validation
   */
  const handleCreateRoom = useCallback(async () => {
    // Validate form
    const validationError = validateMeetingRoom(meetingRoom);
    if (validationError) {
      showValidationError(validationError);
      return;
    }

    try {
      setLoading(true);

      // Create meeting using MeetingService
      const meetingData = {
        title: meetingRoom.title,
        description: meetingRoom.description,
        duration: meetingRoom.duration,
        isPrivate: meetingRoom.isPrivate,
        maxParticipants: meetingRoom.capacity,
        host: meetingRoom.host,
        taskId: meetingRoom.taskId,
        settings: DEFAULT_MEETING_SETTINGS,
      };

      const meetingId = await meetingService.createMeeting(meetingData);
      const meeting = await meetingService.getMeeting(meetingId);

      // Navigate to RoomScreen with meeting data
      navigation.navigate('RoomScreen', {
        meeting,
        isHost: true,
      });
    } catch (error) {
      console.error('Failed to create meeting:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create meeting',
      );
    } finally {
      setLoading(false);
    }
  }, [meetingRoom, navigation]);

  /**
   * Handles joining a room with validation
   */
  const handleJoinRoom = useCallback(async () => {
    const validationError = validateRoomCode(roomCode);
    if (validationError) {
      showValidationError(validationError);
      return;
    }

    try {
      setLoading(true);

      // Get meeting by room code
      const meeting = await meetingService.getMeetingByRoomCode(roomCode);

      // Navigate to RoomScreen with meeting data
      navigation.navigate('RoomScreen', {
        meeting,
        isHost: false,
      });
    } catch (error) {
      console.error('Failed to join meeting:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to join meeting',
      );
    } finally {
      setLoading(false);
    }
  }, [roomCode, navigation]);

  return {
    meetingRoom,
    updateMeetingRoom,
    setMeetingRoom,
    roomCode,
    setRoomCode,
    loading,
    setLoading,
    handleCreateRoom,
    handleJoinRoom,
  };
};
