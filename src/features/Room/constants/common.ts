import {SCREEN_WIDTH} from '@/shared/constants/common';
import {MeetingRoom, MeetingConstraints} from '../types/object';

export const MAX_CONNECTION_ATTEMPTS = 3;

export const isSmallDevice = SCREEN_WIDTH < 380;

export const SCREEN_SIZE_BREAKPOINT = 380;

export const DEFAULT_MEETING_ROOM: MeetingRoom = {
  title: '',
  description: '',
  duration: 60,
  capacity: 10,
  isPrivate: false,
  host: 'Current User',
  taskId: '',
};

export const MEETING_CONSTRAINTS: MeetingConstraints = {
  minCapacity: 2,
  maxCapacity: 50,
  minDuration: 1,
};

export const PRIORITY_COLORS = {
  high: '#FF3B30',
  medium: '#FF9500',
  low: '#34C759',
  default: '#8E8E93',
} as const;

export const DEFAULT_MEETING_SETTINGS = {
  muteOnEntry: true,
  allowChat: true,
  allowScreenShare: true,
  recordingEnabled: false,
};

// Room component constants
export const QUICK_MESSAGES = [
  "I'll be right back",
  'Can you hear me?',
  "I can't hear you",
  'Please speak louder',
  "Let's discuss this later",
  'I agree',
  'I disagree',
  'Great idea!',
  'Could you repeat that?',
  'Thanks everyone',
];

export const AVATAR_COLORS = [
  '#4285F4', // Google Blue
  '#EA4335', // Google Red
  '#FBBC05', // Google Yellow
  '#34A853', // Google Green
  '#8AB4F8', // Light Blue
  '#F28B82', // Light Red
  '#FDD663', // Light Yellow
  '#81C995', // Light Green
];

export const ANIMATION_DURATION = {
  panel: 250,
  menu: 200,
  buttonPress: 100,
};

export const CONTROLS_HIDE_TIMEOUT = 3000;
