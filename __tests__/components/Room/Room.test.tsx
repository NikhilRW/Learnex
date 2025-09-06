import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Room from '../../../src/components/Room/Room';
import { Meeting } from '../../../src/service/firebase/MeetingService';
import { ParticipantState } from '../../../src/service/firebase/WebRTCService';

// Mock dependencies
jest.mock('react-native-webrtc', () => ({
  RTCView: 'RTCView',
  MediaStream: jest.fn(),
  MediaStreamTrack: jest.fn(),
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');
jest.mock('react-native-reanimated', () => ({
  default: {
    View: 'ReanimatedView',
    FadeIn: 'FadeIn',
    FadeOut: 'FadeOut',
  },
}));

jest.mock('../../../src/hooks/useTypedSelector', () => ({
  useTypedSelector: jest.fn(),
}));

jest.mock('../../../src/service/firebase/UserService', () => ({
  UserService: jest.fn().mockImplementation(() => ({
    getUserInfo: jest.fn(),
  })),
}));

// Mock Redux store
const mockStore = configureStore({
  reducer: {
    firebase: (state = { firebase: {} }) => state,
    user: (state = { theme: 'light' }) => state,
  },
});

// Mock data
const mockMeeting: Meeting = {
  id: 'test-meeting-id',
  title: 'Test Meeting',
  description: 'Test Description',
  roomCode: 'TEST123',
  hostId: 'host-user-id',
  participants: ['user1', 'user2', 'user3'],
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  isPrivate: false,
  maxParticipants: 10,
  duration: 60,
  startTime: new Date(),
  endTime: new Date(Date.now() + 3600000),
};

const mockMessages = [
  {
    id: 'msg1',
    senderId: 'user1',
    senderName: 'John Doe',
    text: 'Hello everyone!',
    timestamp: new Date(),
    isMe: false,
    reactions: {},
  },
  {
    id: 'msg2',
    senderId: 'current-user',
    senderName: 'Me',
    text: 'Hi there!',
    timestamp: new Date(),
    isMe: true,
    reactions: {},
  },
];

const mockParticipantStates = new Map([
  ['user1', { isAudioEnabled: true, isVideoEnabled: true, isHandRaised: false, isSpeaking: false }],
  ['user2', { isAudioEnabled: false, isVideoEnabled: true, isHandRaised: true, isSpeaking: false }],
  ['user3', { isAudioEnabled: true, isVideoEnabled: false, isHandRaised: false, isSpeaking: true }],
]);

const mockProps = {
  meeting: mockMeeting,
  localStream: null,
  remoteStreams: [],
  updateLocalStream: jest.fn(),
  onToggleAudio: jest.fn(),
  onToggleVideo: jest.fn(),
  onEndCall: jest.fn(),
  onSendMessage: jest.fn(),
  onMessageReaction: jest.fn(),
  messages: mockMessages,
  isAudioEnabled: true,
  isVideoEnabled: true,
  isDark: false,
  currentUserId: 'current-user',
  currentUserName: 'Current User',
  onRaiseHand: jest.fn(),
  onReaction: jest.fn(),
  participantStates: mockParticipantStates,
  isConnecting: false,
  onFlipCamera: jest.fn(),
};

describe('Room Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (require('../../../src/hooks/useTypedSelector').useTypedSelector as jest.Mock)
      .mockReturnValue({ firebase: { firebase: {} }, theme: 'light' });
  });

  const renderRoom = (props = {}) => {
    return render(
      <Provider store={mockStore}>
        <Room {...mockProps} {...props} />
      </Provider>
    );
  };

  describe('Rendering', () => {
    it('renders correctly with basic props', () => {
      const { getByText } = renderRoom();
      expect(getByText('Test Meeting')).toBeTruthy();
    });

    it('renders in dark mode', () => {
      const { getByTestId } = renderRoom({ isDark: true });
      expect(getByTestId('room-container')).toBeTruthy();
    });

    it('shows connecting state', () => {
      const { getByText } = renderRoom({ isConnecting: true });
      expect(getByText('Connecting...')).toBeTruthy();
    });
  });

  describe('Video Controls', () => {
    it('toggles audio when audio button is pressed', () => {
      const onToggleAudio = jest.fn();
      const { getByTestId } = renderRoom({ onToggleAudio });
      
      fireEvent.press(getByTestId('audio-toggle-button'));
      expect(onToggleAudio).toHaveBeenCalledTimes(1);
    });

    it('toggles video when video button is pressed', () => {
      const onToggleVideo = jest.fn();
      const { getByTestId } = renderRoom({ onToggleVideo });
      
      fireEvent.press(getByTestId('video-toggle-button'));
      expect(onToggleVideo).toHaveBeenCalledTimes(1);
    });

    it('shows correct audio state', () => {
      const { getByTestId } = renderRoom({ isAudioEnabled: false });
      expect(getByTestId('audio-toggle-button')).toHaveStyle({ opacity: 0.5 });
    });

    it('shows correct video state', () => {
      const { getByTestId } = renderRoom({ isVideoEnabled: false });
      expect(getByTestId('video-toggle-button')).toHaveStyle({ opacity: 0.5 });
    });

    it('flips camera when flip button is pressed', () => {
      const onFlipCamera = jest.fn();
      const { getByTestId } = renderRoom({ onFlipCamera });
      
      fireEvent.press(getByTestId('flip-camera-button'));
      expect(onFlipCamera).toHaveBeenCalledTimes(1);
    });
  });

  describe('Chat Functionality', () => {
    it('opens chat panel when chat button is pressed', async () => {
      const { getByTestId, queryByTestId } = renderRoom();
      
      expect(queryByTestId('chat-panel')).toBeNull();
      
      fireEvent.press(getByTestId('chat-button'));
      
      await waitFor(() => {
        expect(getByTestId('chat-panel')).toBeTruthy();
      });
    });

    it('sends message when send button is pressed', async () => {
      const onSendMessage = jest.fn();
      const { getByTestId } = renderRoom({ onSendMessage });
      
      fireEvent.press(getByTestId('chat-button'));
      
      await waitFor(() => {
        const messageInput = getByTestId('message-input');
        const sendButton = getByTestId('send-message-button');
        
        fireEvent.changeText(messageInput, 'Test message');
        fireEvent.press(sendButton);
        
        expect(onSendMessage).toHaveBeenCalledWith('Test message');
      });
    });

    it('displays messages correctly', () => {
      const { getByText } = renderRoom();
      
      fireEvent.press(getByTestId('chat-button'));
      
      expect(getByText('Hello everyone!')).toBeTruthy();
      expect(getByText('Hi there!')).toBeTruthy();
    });

    it('shows message reactions', async () => {
      const onMessageReaction = jest.fn();
      const { getByTestId } = renderRoom({ onMessageReaction });
      
      fireEvent.press(getByTestId('chat-button'));
      
      await waitFor(() => {
        const message = getByTestId('message-msg1');
        fireEvent.longPress(message);
        
        expect(getByTestId('message-reactions')).toBeTruthy();
      });
    });
  });

  describe('Participants Management', () => {
    it('opens participants panel when participants button is pressed', async () => {
      const { getByTestId, queryByTestId } = renderRoom();
      
      expect(queryByTestId('participants-panel')).toBeNull();
      
      fireEvent.press(getByTestId('participants-button'));
      
      await waitFor(() => {
        expect(getByTestId('participants-panel')).toBeTruthy();
      });
    });

    it('displays participant count correctly', async () => {
      const { getByText, getByTestId } = renderRoom();
      
      fireEvent.press(getByTestId('participants-button'));
      
      await waitFor(() => {
        expect(getByText('Participants (3)')).toBeTruthy();
      });
    });

    it('shows participant states correctly', async () => {
      const { getByTestId } = renderRoom();
      
      fireEvent.press(getByTestId('participants-button'));
      
      await waitFor(() => {
        expect(getByTestId('participant-user1')).toBeTruthy();
        expect(getByTestId('participant-user2')).toBeTruthy();
        expect(getByTestId('participant-user3')).toBeTruthy();
      });
    });

    it('pins participant when pin button is pressed', async () => {
      const { getByTestId } = renderRoom();
      
      fireEvent.press(getByTestId('participants-button'));
      
      await waitFor(() => {
        const pinButton = getByTestId('pin-participant-user1');
        fireEvent.press(pinButton);
        
        expect(getByTestId('pinned-participant')).toBeTruthy();
      });
    });
  });

  describe('Reactions and Hand Raising', () => {
    it('opens reactions menu when reactions button is pressed', async () => {
      const { getByTestId, queryByTestId } = renderRoom();
      
      expect(queryByTestId('reactions-menu')).toBeNull();
      
      fireEvent.press(getByTestId('reactions-button'));
      
      await waitFor(() => {
        expect(getByTestId('reactions-menu')).toBeTruthy();
      });
    });

    it('sends reaction when reaction button is pressed', async () => {
      const onReaction = jest.fn();
      const { getByTestId } = renderRoom({ onReaction });
      
      fireEvent.press(getByTestId('reactions-button'));
      
      await waitFor(() => {
        const thumbsUpButton = getByTestId('thumbs-up-reaction');
        fireEvent.press(thumbsUpButton);
        
        expect(onReaction).toHaveBeenCalledWith('thumbsUp');
      });
    });

    it('toggles hand raising when hand button is pressed', () => {
      const onRaiseHand = jest.fn();
      const { getByTestId } = renderRoom({ onRaiseHand });
      
      fireEvent.press(getByTestId('hand-raise-button'));
      expect(onRaiseHand).toHaveBeenCalledWith(true);
      
      fireEvent.press(getByTestId('hand-raise-button'));
      expect(onRaiseHand).toHaveBeenCalledWith(false);
    });
  });

  describe('Quick Messages', () => {
    it('opens quick messages when quick messages button is pressed', async () => {
      const { getByTestId, queryByTestId } = renderRoom();
      
      expect(queryByTestId('quick-messages-menu')).toBeNull();
      
      fireEvent.press(getByTestId('quick-messages-button'));
      
      await waitFor(() => {
        expect(getByTestId('quick-messages-menu')).toBeTruthy();
      });
    });

    it('sends quick message when quick message button is pressed', async () => {
      const onSendMessage = jest.fn();
      const { getByTestId } = renderRoom({ onSendMessage });
      
      fireEvent.press(getByTestId('quick-messages-button'));
      
      await waitFor(() => {
        const quickMessageButton = getByTestId('quick-message-ok');
        fireEvent.press(quickMessageButton);
        
        expect(onSendMessage).toHaveBeenCalledWith('OK');
      });
    });
  });

  describe('End Call', () => {
    it('calls onEndCall when end call button is pressed', () => {
      const onEndCall = jest.fn();
      const { getByTestId } = renderRoom({ onEndCall });
      
      fireEvent.press(getByTestId('end-call-button'));
      expect(onEndCall).toHaveBeenCalledTimes(1);
    });

    it('shows confirmation dialog before ending call', () => {
      const onEndCall = jest.fn();
      const { getByTestId } = renderRoom({ onEndCall });
      
      const alertSpy = jest.spyOn(require('react-native'), 'Alert').mockImplementation(({ onPress }) => {
        onPress();
      });
      
      fireEvent.press(getByTestId('end-call-button'));
      
      expect(alertSpy).toHaveBeenCalledWith(
        'End Call',
        'Are you sure you want to end this call?',
        expect.any(Array)
      );
      
      alertSpy.mockRestore();
    });
  });

  describe('Screen Sharing', () => {
    it('toggles screen sharing when screen share button is pressed', () => {
      const { getByTestId } = renderRoom();
      
      fireEvent.press(getByTestId('screen-share-button'));
    });
  });

  describe('Keyboard Handling', () => {
    it('adjusts layout when keyboard is visible', () => {
      const { getByTestId } = renderRoom();
      
      act(() => {
        const keyboardEvent = {
          duration: 250,
          easing: 'keyboard',
          endCoordinates: {
            height: 300,
            screenX: 0,
            screenY: 400,
            width: 400,
          },
          startCoordinates: {
            height: 0,
            screenX: 0,
            screenY: 700,
            width: 400,
          },
        };
        require('react-native').Keyboard.emit('keyboardDidShow', keyboardEvent);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing local stream gracefully', () => {
      const { getByTestId } = renderRoom({ localStream: null });
      expect(getByTestId('room-container')).toBeTruthy();
    });

    it('handles empty messages array', () => {
      const { getByTestId } = renderRoom({ messages: [] });
      
      fireEvent.press(getByTestId('chat-button'));
      expect(getByTestId('chat-panel')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels', () => {
      const { getByLabelText } = renderRoom();
      
      expect(getByLabelText('Toggle audio')).toBeTruthy();
      expect(getByLabelText('Toggle video')).toBeTruthy();
      expect(getByLabelText('End call')).toBeTruthy();
    });
  });
});
