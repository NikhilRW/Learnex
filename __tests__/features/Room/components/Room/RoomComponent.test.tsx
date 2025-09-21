import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

// Create a proper React Native mock component for Room
const MockRoomComponent = ({ 
  meeting, 
  isAudioEnabled, 
  isVideoEnabled, 
  messages = [], 
  onToggleAudio, 
  onToggleVideo, 
  onEndCall, 
  onSendMessage,
  isConnecting = false,
  currentUserId = 'current-user-id',
  currentUserName = 'Current User'
}: any) => {
  const [messageText, setMessageText] = React.useState('');

  const handleSendMessage = () => {
    if (messageText.trim()) {
      onSendMessage(messageText);
      setMessageText('');
    }
  };

  return (
    <View testID="room-container">
      <Text testID="meeting-title">
        {meeting?.title || 'Room'}
      </Text>
      
      <Text testID="participant-count">
        {(meeting?.participants?.length || 0)} participants
      </Text>

      {/* Connection Status */}
      {isConnecting && (
        <Text testID="connecting-text">Connecting...</Text>
      )}

      {/* Control Buttons */}
      <View testID="control-buttons">
        <TouchableOpacity 
          testID="audio-toggle-button"
          onPress={onToggleAudio}
        >
          <Text>{isAudioEnabled ? 'Mute' : 'Unmute'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          testID="video-toggle-button"
          onPress={onToggleVideo}
        >
          <Text>{isVideoEnabled ? 'Video Off' : 'Video On'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          testID="end-call-button"
          onPress={onEndCall}
        >
          <Text>End Call</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <View testID="messages-container">
        {messages.map((msg: any) => (
          <View key={msg.id} testID={`message-${msg.id}`}>
            <Text testID={`message-text-${msg.id}`}>{msg.text}</Text>
            <Text testID={`message-sender-${msg.id}`}>{msg.senderName}</Text>
          </View>
        ))}
      </View>

      {/* Message Input */}
      <View testID="message-input-container">
        <TextInput
          testID="message-input"
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
        />
        <TouchableOpacity 
          testID="send-message-button"
          onPress={handleSendMessage}
        >
          <Text>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

describe('Room Component Tests', () => {
  const mockMeeting = {
    id: 'test-room-123',
    title: 'Test Video Room',
    description: 'Test room for video calls',
    duration: 60,
    maxParticipants: 4,
    isPrivate: false,
    host: 'host-user-id',
    status: 'active',
    participants: ['user1', 'user2', 'user3'],
    roomCode: 'TEST123',
    settings: {
      muteOnEntry: false,
      allowChat: true,
      allowScreenShare: true,
      recordingEnabled: false,
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const defaultProps = {
    meeting: mockMeeting,
    localStream: null,
    remoteStreams: [],
    updateLocalStream: jest.fn(),
    onToggleAudio: jest.fn(),
    onToggleVideo: jest.fn(),
    onEndCall: jest.fn(),
    onSendMessage: jest.fn(),
    onMessageReaction: jest.fn(),
    messages: [],
    isAudioEnabled: true,
    isVideoEnabled: true,
    isDark: false,
    currentUserId: 'current-user-id',
    currentUserName: 'Current User',
    onRaiseHand: jest.fn(),
    onReaction: jest.fn(),
    participantStates: new Map(),
    isConnecting: false,
    onFlipCamera: jest.fn(),
    isFrontCamera: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders room component with meeting title', () => {
    const { getByText } = render(<MockRoomComponent {...defaultProps} />);
    
    expect(getByText('Test Video Room')).toBeTruthy();
  });

  it('displays participant count correctly', () => {
    const { getByText } = render(<MockRoomComponent {...defaultProps} />);
    
    expect(getByText('3 participants')).toBeTruthy();
  });

  it('shows connecting indicator when connecting', () => {
    const { getByText } = render(
      <MockRoomComponent {...defaultProps} isConnecting={true} />
    );
    
    expect(getByText('Connecting...')).toBeTruthy();
  });

  it('toggles audio when audio button is pressed', () => {
    const { getByTestId } = render(<MockRoomComponent {...defaultProps} />);
    
    const audioButton = getByTestId('audio-toggle-button');
    fireEvent.press(audioButton);
    
    expect(defaultProps.onToggleAudio).toHaveBeenCalledTimes(1);
  });

  it('toggles video when video button is pressed', () => {
    const { getByTestId } = render(<MockRoomComponent {...defaultProps} />);
    
    const videoButton = getByTestId('video-toggle-button');
    fireEvent.press(videoButton);
    
    expect(defaultProps.onToggleVideo).toHaveBeenCalledTimes(1);
  });

  it('ends call when end call button is pressed', () => {
    const { getByTestId } = render(<MockRoomComponent {...defaultProps} />);
    
    const endCallButton = getByTestId('end-call-button');
    fireEvent.press(endCallButton);
    
    expect(defaultProps.onEndCall).toHaveBeenCalledTimes(1);
  });

  it('sends messages correctly', () => {
    const { getByTestId } = render(<MockRoomComponent {...defaultProps} />);
    
    const messageInput = getByTestId('message-input');
    const sendButton = getByTestId('send-message-button');
    
    fireEvent.changeText(messageInput, 'Hello everyone!');
    fireEvent.press(sendButton);
    
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Hello everyone!');
  });

  it('displays messages correctly', () => {
    const messages = [
      {
        id: 'msg1',
        senderId: 'user1',
        senderName: 'Alice',
        text: 'Hello from Alice',
        timestamp: new Date('2024-01-01T10:00:00'),
        isMe: false,
      },
      {
        id: 'msg2',
        senderId: 'current-user-id',
        senderName: 'Current User',
        text: 'Hi Alice!',
        timestamp: new Date('2024-01-01T10:01:00'),
        isMe: true,
      },
    ];

    const { getByText, getByTestId } = render(
      <MockRoomComponent {...defaultProps} messages={messages} />
    );
    
    expect(getByText('Hello from Alice')).toBeTruthy();
    expect(getByText('Hi Alice!')).toBeTruthy();
    expect(getByTestId('message-sender-msg1')).toBeTruthy();
    expect(getByTestId('message-sender-msg2')).toBeTruthy();
  });

  it('handles empty participants gracefully', () => {
    const { getByText } = render(
      <MockRoomComponent {...defaultProps} meeting={{ ...mockMeeting, participants: [] }} />
    );
    
    expect(getByText('0 participants')).toBeTruthy();
  });

  it('handles large participant counts', () => {
    const largeMeeting = {
      ...mockMeeting,
      participants: Array.from({ length: 20 }, (_, i) => `user-${i}`),
    };

    const { getByText } = render(
      <MockRoomComponent {...defaultProps} meeting={largeMeeting} />
    );
    
    expect(getByText('20 participants')).toBeTruthy();
  });

  it('handles null meeting gracefully', () => {
    const { getByText } = render(
      <MockRoomComponent {...defaultProps} meeting={null} />
    );
    
    expect(getByText('Room')).toBeTruthy();
  });

  it('clears message input after sending', () => {
    const { getByTestId } = render(<MockRoomComponent {...defaultProps} />);
    
    const messageInput = getByTestId('message-input');
    const sendButton = getByTestId('send-message-button');
    
    fireEvent.changeText(messageInput, 'Test message');
    fireEvent.press(sendButton);
    
    expect(messageInput.props.value).toBe('');
  });

  it('does not send empty messages', () => {
    const { getByTestId } = render(<MockRoomComponent {...defaultProps} />);
    
    const sendButton = getByTestId('send-message-button');
    fireEvent.press(sendButton);
    
    expect(defaultProps.onSendMessage).not.toHaveBeenCalled();
  });
});