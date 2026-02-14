import {useEffect} from 'react';
import {Alert} from 'react-native';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {RoomParams} from '../types';
import {DEFAULT_MEETING_SETTINGS} from '../constants/common';
import {MeetingService} from '../services/MeetingService';
import {TaskService} from 'shared/services/TaskService';
import {UserStackParamList} from 'shared/navigation/routes/UserStack';

type RoomScreenRouteProp = RouteProp<{Room: RoomParams}, 'Room'>;

const meetingService = new MeetingService();
const taskService = new TaskService();

/**
 * Custom hook for handling room navigation from external sources
 * Manages auto-creation/joining from LexAI or deep links
 */
export const useRoomNavigation = (
  setActiveTab: (tab: 'create' | 'join') => void,
  setRoomCode: (code: string) => void,
  setLoading: (loading: boolean) => void,
  setSelectedTask: (task: any) => void,
) => {
  const route = useRoute<RoomScreenRouteProp>();
  const navigation = useNavigation<DrawerNavigationProp<UserStackParamList>>();

  useEffect(() => {
    const main = async () => {
      // Handle meeting data if provided
      if (route.params?.meetingData) {
        const agenticMeetingData = route.params.meetingData;
        console.log('Received meeting data from LexAI:', agenticMeetingData);
        const meetingData = {
          title: agenticMeetingData.title || '',
          description: agenticMeetingData.description || '',
          duration: agenticMeetingData.duration || 60,
          maxParticipants: agenticMeetingData.maxParticipants || 10,
          isPrivate: agenticMeetingData.isPrivate || false,
          host: 'Current User', // Will be set during creation
          taskId: agenticMeetingData.taskId || '',
          settings: DEFAULT_MEETING_SETTINGS,
        };

        // If there's a taskId, try to find the corresponding task
        if (agenticMeetingData.taskId) {
          const fetchTaskDetails = async () => {
            try {
              // Find task in the loaded tasks list
              const userTasks = await taskService.getTasks();
              const task = userTasks.find(
                t => t.id === agenticMeetingData.taskId,
              );
              if (task) {
                setSelectedTask(task);
              }
            } catch (error) {
              console.error('Failed to fetch task details:', error);
            }
          };

          fetchTaskDetails();
        }

        // Optionally auto-create the meeting if fully specified
        if (agenticMeetingData.title) {
          setActiveTab('create');
          const meetingId = await meetingService.createMeeting(meetingData);
          const meeting = await meetingService.getMeeting(meetingId);
          // Navigate to RoomScreen with meeting data
          navigation.navigate('RoomScreen', {
            meeting,
            isHost: true,
          });
        }
      }
      // Handle join mode if provided
      else if (route.params?.joinMode && route.params?.roomCode) {
        console.log(
          'Received join room request with code:',
          route.params.roomCode,
        );
        // Set active tab to join
        setActiveTab('join');
        // Set the room code
        setRoomCode(route.params.roomCode);
        try {
          setLoading(true);
          // Get meeting by room code
          const meeting = await meetingService.getMeetingByRoomCode(
            route.params.roomCode,
          );
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
          setLoading(false);
        }
      }
    };
    main();
  }, [
    navigation,
    route.params,
    setActiveTab,
    setRoomCode,
    setLoading,
    setSelectedTask,
  ]);
};
