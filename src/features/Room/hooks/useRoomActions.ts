import {useCallback, useEffect} from 'react';
import {Alert, BackHandler} from 'react-native';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {MeetingService} from 'room/services/MeetingService';
import {WebRTCService, ParticipantState} from 'room/services/WebRTCService';
import {TaskService} from 'shared/services/TaskService';
import {UserStackParamList} from 'shared/navigation/routes/UserStack';
import {Meeting} from './useRoomConnection';

type RoomScreenNavigationProp = DrawerNavigationProp<UserStackParamList>;

export interface UseRoomActionsParams {
  meeting: Meeting;
  isHost: boolean;
  isConnecting: boolean;
  meetingService: MeetingService;
  webRTCService: WebRTCService;
  taskService: TaskService;
  cleanup: () => Promise<void>;
  unsubscribeMessages: (() => void) | null;
}

export interface UseRoomActionsReturn {
  handleRaiseHand: (raised: boolean) => Promise<void>;
  handleReaction: (
    reaction: 'thumbsUp' | 'thumbsDown' | 'clapping' | 'waving' | 'smiling',
  ) => Promise<void>;
  handleEndCall: () => Promise<void>;
  confirmLeaveRoom: () => void;
  handleMeetingEnded: () => void;
}

export const useRoomActions = ({
  meeting,
  isHost,
  isConnecting,
  meetingService,
  webRTCService,
  taskService,
  cleanup,
}: UseRoomActionsParams): UseRoomActionsReturn => {
  const navigation = useNavigation<RoomScreenNavigationProp>();

  const handleMeetingEnded = useCallback(() => {
    // If we're the host and there's an associated task, we've already handled task completion
    // in the handleEndCall function, so we just navigate back
    if (isHost) {
      cleanup();
      navigation.dispatch(
        CommonActions.navigate('Tabs', {
          screen: 'Home',
        }),
      );
      return;
    }

    Alert.alert('Meeting Ended', 'The meeting has been ended by the host', [
      {
        text: 'OK',
        onPress: () => {
          cleanup();
          navigation.dispatch(
            CommonActions.navigate('Tabs', {
              screen: 'Home',
            }),
          );
        },
      },
    ]);
  }, [cleanup, isHost, navigation]);

  const handleRaiseHand = useCallback(
    async (raised: boolean) => {
      // Update participant state in Firestore
      await webRTCService.updateLocalParticipantState(meeting.id, {
        isHandRaised: raised,
      });
    },
    [meeting.id, webRTCService],
  );

  const handleReaction = useCallback(
    async (
      reaction: 'thumbsUp' | 'thumbsDown' | 'clapping' | 'waving' | 'smiling',
    ) => {
      // Create update object with all reactions set to false
      const update: Partial<ParticipantState> = {
        isThumbsUp: false,
        isThumbsDown: false,
        isClapping: false,
        isWaving: false,
        isSmiling: false,
      };

      // Set the selected reaction to true
      switch (reaction) {
        case 'thumbsUp':
          update.isThumbsUp = true;
          break;
        case 'thumbsDown':
          update.isThumbsDown = true;
          break;
        case 'clapping':
          update.isClapping = true;
          break;
        case 'waving':
          update.isWaving = true;
          break;
        case 'smiling':
          update.isSmiling = true;
          break;
      }

      // Update participant state in Firestore
      await webRTCService.updateLocalParticipantState(meeting.id, update);
      setTimeout(() => {
        webRTCService.updateLocalParticipantState(meeting.id, {
          isThumbsUp: false,
          isThumbsDown: false,
          isClapping: false,
          isWaving: false,
          isSmiling: false,
        });
      }, 2500);
    },
    [meeting.id, webRTCService],
  );

  const handleEndCall = useCallback(async () => {
    try {
      if (isHost) {
        // Check if meeting has an associated task
        if (meeting.taskId) {
          // Prompt user about task completion
          Alert.alert(
            'Task Completion',
            `Did you complete the task associated with this meeting?`,
            [
              {
                text: 'No',
                style: 'cancel',
                onPress: async () => {
                  await meetingService.endMeeting(meeting.id);
                  cleanup();
                  navigation.dispatch(
                    CommonActions.navigate('Tabs', {
                      screen: 'Tasks',
                    }),
                  );
                },
              },
              {
                text: 'Yes',
                onPress: async () => {
                  try {
                    // Mark task as completed
                    await taskService.updateTask(meeting.taskId!, {
                      completed: true,
                    });
                    await meetingService.endMeeting(meeting.id);
                    cleanup();
                    navigation.dispatch(
                      CommonActions.navigate('Tabs', {
                        screen: 'Tasks',
                      }),
                    );
                  } catch (error) {
                    console.error('Failed to update task:', error);
                    Alert.alert('Error', 'Failed to update task status');
                    await meetingService.endMeeting(meeting.id);
                    cleanup();
                    navigation.dispatch(
                      CommonActions.navigate('Tabs', {
                        screen: 'Home',
                      }),
                    );
                  }
                },
              },
            ],
            {cancelable: false},
          );
        } else {
          // No associated task, end meeting normally
          await meetingService.endMeeting(meeting.id);
          cleanup();
          navigation.dispatch(
            CommonActions.navigate('Tabs', {
              screen: 'Home',
            }),
          );
        }
      } else {
        await meetingService.leaveMeeting(meeting.id);
        cleanup();
        navigation.dispatch(
          CommonActions.navigate('Tabs', {
            screen: 'Home',
          }),
        );
      }
    } catch (error) {
      console.error('Failed to end/leave meeting:', error);
      // Even if there's an error, try to navigate away
      navigation.dispatch(
        CommonActions.navigate('Tabs', {
          screen: 'Home',
        }),
      );
    }
  }, [
    cleanup,
    isHost,
    meeting.id,
    meeting.taskId,
    meetingService,
    navigation,
    taskService,
  ]);

  // Add confirmation dialog for leaving the room
  const confirmLeaveRoom = useCallback(() => {
    Alert.alert(
      'Leave Meeting',
      'Are you sure you want to leave this meeting?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            if (isConnecting) {
              // If still connecting, just clean up and navigate back
              cleanup();
              navigation.dispatch(
                CommonActions.navigate('Tabs', {
                  screen: 'Home',
                }),
              );
            } else {
              // Otherwise use the normal end call flow
              handleEndCall();
            }
          },
        },
      ],
    );
  }, [cleanup, handleEndCall, isConnecting, navigation]);

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Show confirmation dialog instead of immediately ending call
        confirmLeaveRoom();
        return true;
      },
    );

    return () => {
      backHandler.remove();
      BackHandler.addEventListener('hardwareBackPress', () => false);
    };
  }, [confirmLeaveRoom]);

  return {
    handleRaiseHand,
    handleReaction,
    handleEndCall,
    confirmLeaveRoom,
    handleMeetingEnded,
  };
};
