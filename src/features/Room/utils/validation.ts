import {Alert} from 'react-native';
import {MeetingRoom, ValidationError} from '../types';
import {MEETING_CONSTRAINTS} from '../constants/common';

/**
 * Validates meeting room data before creation
 * @param meetingRoom - The meeting room data to validate
 * @returns ValidationError if invalid, null if valid
 */
export const validateMeetingRoom = (
  meetingRoom: MeetingRoom,
): ValidationError | null => {
  if (!meetingRoom.title.trim()) {
    return {
      field: 'title',
      message: 'Please enter a meeting title',
    };
  }

  if (meetingRoom.duration < MEETING_CONSTRAINTS.minDuration) {
    return {
      field: 'duration',
      message: `Duration must be at least ${MEETING_CONSTRAINTS.minDuration} minute`,
    };
  }

  if (meetingRoom.capacity < MEETING_CONSTRAINTS.minCapacity) {
    return {
      field: 'capacity',
      message: `Capacity must be at least ${MEETING_CONSTRAINTS.minCapacity}`,
    };
  }

  if (meetingRoom.capacity > MEETING_CONSTRAINTS.maxCapacity) {
    return {
      field: 'capacity',
      message: `Capacity must be less than ${MEETING_CONSTRAINTS.maxCapacity}`,
    };
  }

  return null;
};

/**
 * Validates room code before joining
 * @param roomCode - The room code to validate
 * @returns ValidationError if invalid, null if valid
 */
export const validateRoomCode = (roomCode: string): ValidationError | null => {
  if (!roomCode.trim()) {
    return {
      field: 'roomCode',
      message: 'Please enter a room code',
    };
  }

  return null;
};

/**
 * Shows validation error as an alert
 * @param error - The validation error to display
 */
export const showValidationError = (error: ValidationError): void => {
  Alert.alert('Error', error.message);
};
