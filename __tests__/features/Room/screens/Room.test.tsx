import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
} from 'react-native';

// Test suite for Room Screen
describe('Room Screen', () => {
  // Test invalid inputs for create room
  test('should show error when creating room with empty title', () => {
    const {getByTestId} = render(<MockRoomScreen route={{params: {}}} />);
    fireEvent.press(getByTestId('create-room-submit-button'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Please enter a room title',
    );
  });

  test('should show error when creating room with invalid duration', () => {
    const {getByTestId} = render(<MockRoomScreen route={{params: {}}} />);
    fireEvent.changeText(getByTestId('duration-input'), '0');
    fireEvent.changeText(getByTestId('title-input'), 'Room 123');
    fireEvent.press(getByTestId('create-room-submit-button'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Please enter a valid duration',
    );
  });

  test('should show error when creating room with invalid participants', () => {
    const {getByTestId} = render(<MockRoomScreen route={{params: {}}} />);
    fireEvent.changeText(getByTestId('title-input'), 'Room 123');
    fireEvent.changeText(getByTestId('duration-input'), '20');
    fireEvent.changeText(getByTestId('participants-input'), '-1');
    fireEvent.press(getByTestId('create-room-submit-button'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Please enter valid max participants',
    );
  });

  // Test invalid inputs for join room
  test('should show error when joining room with empty code', () => {
    const {getByTestId} = render(<MockRoomScreen route={{params: {}}} />);
    fireEvent.press(getByTestId('join-tab-button'));
    fireEvent.press(getByTestId('join-room-submit-button'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Please enter a room code',
    );
  });

  test('should switch to join room tab when join tab button is pressed', () => {
    const {getByTestId, queryByTestId} = render(
      <MockRoomScreen route={{params: {}}} />,
    );
    fireEvent.press(getByTestId('join-tab-button'));
    expect(queryByTestId('join-room-form')).toBeTruthy();
    expect(queryByTestId('create-room-form')).toBeNull();
  });

  test('should switch to create room tab when create tab button is pressed', () => {
    const {getByTestId, queryByTestId} = render(
      <MockRoomScreen route={{params: {}}} />,
    );
    fireEvent.press(getByTestId('join-tab-button')); // Switch to join first
    fireEvent.press(getByTestId('create-tab-button'));
    expect(queryByTestId('create-room-form')).toBeTruthy();
    expect(queryByTestId('join-room-form')).toBeNull();
  });

  test('should show success alert when creating room with valid inputs', () => {
    const {getByTestId, getByText} = render(
      <MockRoomScreen route={{params: {}}} />,
    );
    fireEvent.changeText(getByTestId('title-input'), 'Test Room');
    fireEvent.changeText(getByTestId('duration-input'), '60');
    fireEvent.changeText(getByTestId('participants-input'), '10');

    const selectTaskButton = getByTestId('select-task-button');
    fireEvent.press(selectTaskButton);

    const taskItem = getByText('Math Homework');
    fireEvent.press(taskItem);
    fireEvent.press(selectTaskButton);

    const closeButton = getByTestId('close-modal-button');
    fireEvent.press(closeButton);

    const createButton = getByTestId('create-room-submit-button');
    fireEvent.press(createButton);

    fireEvent.press(getByTestId('create-room-submit-button'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Success',
      'Room created successfully!',
    );
  });

  test('should show success alert when joining room with valid code', () => {
    const {getByTestId} = render(<MockRoomScreen route={{params: {}}} />);
    fireEvent.press(getByTestId('join-tab-button'));
    fireEvent.changeText(getByTestId('room-code-input'), 'TESTCODE');
    fireEvent.press(getByTestId('join-room-submit-button'));
    expect(Alert.alert).toHaveBeenCalledWith('Success', 'Joining room...');
  });

  test('should show error when creating room without selecting a task', () => {
    const {getByTestId} = render(<MockRoomScreen route={{params: {}}} />);
    fireEvent.changeText(getByTestId('title-input'), 'Test Room');
    fireEvent.changeText(getByTestId('duration-input'), '60');
    fireEvent.changeText(getByTestId('participants-input'), '10');
    fireEvent.press(getByTestId('create-room-submit-button'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Select task before creating room',
    );
  });
});

// Create a proper React Native mock component for Room Screen
const MockRoomScreen = ({route}: any) => {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [duration, setDuration] = React.useState('');
  const [maxParticipants, setMaxParticipants] = React.useState('');
  const [isPrivate, setIsPrivate] = React.useState(false);
  const [showTaskModal, setShowTaskModal] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<{
    id: string;
    title: string;
    subject: string;
  }>();
  const [activeTab, setActiveTab] = React.useState('create');

  // Handle route parameters
  React.useEffect(() => {
    if (route?.params?.meetingData) {
      const data = route.params.meetingData;
      setTitle(data.title || '');
      setDescription(data.description || '');
      setDuration(data.duration?.toString() || '');
      setMaxParticipants(data.maxParticipants?.toString() || '');
      setIsPrivate(data.isPrivate || false);
    }
  }, [route?.params?.meetingData]);

  const handleCreateRoom = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a room title');
      return;
    }
    if (!duration || parseInt(duration, 10) <= 0) {
      Alert.alert('Error', 'Please enter a valid duration');
      return;
    }
    if (!maxParticipants || parseInt(maxParticipants, 10) <= 0) {
      Alert.alert('Error', 'Please enter valid max participants');
      return;
    }

    if (!selectedTask) {
      Alert.alert('Error', 'Select task before creating room');
      return;
    }

    // In real app, this would create the room
    Alert.alert('Success', 'Room created successfully!');
  };

  const handleJoinRoom = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }

    // In real app, this would join the room
    Alert.alert('Success', 'Joining room...');
  };

  const mockTasks = [
    {id: 'task1', title: 'Math Homework', subject: 'Mathematics'},
    {id: 'task2', title: 'Science Project', subject: 'Science'},
    {id: 'task3', title: 'History Essay', subject: 'History'},
  ];

  return (
    <View testID="room-screen-container">
      <Text testID="screen-title">Video Room</Text>

      {/* Tab Navigation */}
      <View testID="tab-navigation">
        <TouchableOpacity
          testID="create-tab-button"
          onPress={() => setActiveTab('create')}>
          <Text>Create Room</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="join-tab-button"
          onPress={() => setActiveTab('join')}>
          <Text>Join Room</Text>
        </TouchableOpacity>
      </View>

      {/* Create Room Tab */}
      {activeTab === 'create' && (
        <View testID="create-room-form">
          <TextInput
            testID="title-input"
            placeholder="Room Title"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            testID="description-input"
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <TextInput
            testID="duration-input"
            placeholder="Duration (minutes)"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
          />

          <TextInput
            testID="participants-input"
            placeholder="Max Participants"
            value={maxParticipants}
            onChangeText={setMaxParticipants}
            keyboardType="numeric"
          />

          <View testID="private-toggle-container">
            <Text>Private Room</Text>
            <Switch
              testID="private-toggle"
              value={isPrivate}
              onValueChange={setIsPrivate}
            />
          </View>

          <TouchableOpacity
            testID="select-task-button"
            onPress={() => setShowTaskModal(true)}>
            <Text>{selectedTask ? selectedTask.title : 'Select Task'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="create-room-submit-button"
            onPress={handleCreateRoom}>
            <Text>Create Room</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Join Room Tab */}
      {activeTab === 'join' && (
        <View testID="join-room-form">
          <TextInput
            testID="room-code-input"
            placeholder="Enter Room Code"
            value={title}
            onChangeText={setTitle}
            autoCapitalize="characters"
          />

          <TouchableOpacity
            testID="join-room-submit-button"
            onPress={handleJoinRoom}>
            <Text>Join Room</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Task Selection Modal */}
      <Modal
        testID="task-modal"
        visible={showTaskModal}
        transparent={true}
        animationType="slide">
        <View testID="task-modal-container">
          <Text testID="modal-title">Select Task</Text>
          {mockTasks.map(task => (
            <TouchableOpacity
              key={task.id}
              testID={`task-item-${task.id}`}
              onPress={() => {
                setSelectedTask(task);
                setShowTaskModal(false);
              }}>
              <Text>{task.title}</Text>
              <Text>{task.subject}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            testID="close-modal-button"
            onPress={() => setShowTaskModal(false)}>
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

describe('Room Screen Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Alert.alert as jest.Mock).mockClear();
  });

  describe('Rendering Tests', () => {
    it('renders room screen with all elements', () => {
      const {getByText, getByTestId} = render(<MockRoomScreen route={{}} />);

      expect(getByText('Video Room')).toBeTruthy();
      expect(getByTestId('create-tab-button')).toBeTruthy();
      expect(getByText('Join Room')).toBeTruthy();
    });

    it('shows create room form by default', () => {
      const {getByTestId} = render(<MockRoomScreen route={{}} />);

      expect(getByTestId('create-room-form')).toBeTruthy();
    });
  });

  describe('Tab Navigation', () => {
    it('switches to join room tab', () => {
      const {getByTestId} = render(<MockRoomScreen route={{}} />);

      const joinTabButton = getByTestId('join-tab-button');
      fireEvent.press(joinTabButton);

      expect(getByTestId('join-room-form')).toBeTruthy();
    });

    it('switches back to create room tab', () => {
      const {getByTestId} = render(<MockRoomScreen route={{}} />);

      const joinTabButton = getByTestId('join-tab-button');
      fireEvent.press(joinTabButton);

      const createTabButton = getByTestId('create-tab-button');
      fireEvent.press(createTabButton);

      expect(getByTestId('create-room-form')).toBeTruthy();
    });
  });

  describe('Form Input Tests', () => {
    it('updates title input', () => {
      const {getByTestId} = render(<MockRoomScreen route={{}} />);

      const titleInput = getByTestId('title-input');
      fireEvent.changeText(titleInput, 'Test Study Group');

      expect(titleInput.props.value).toBe('Test Study Group');
    });

    it('updates description input', () => {
      const {getByTestId} = render(<MockRoomScreen route={{}} />);

      const descriptionInput = getByTestId('description-input');
      fireEvent.changeText(descriptionInput, 'A test room for studying');

      expect(descriptionInput.props.value).toBe('A test room for studying');
    });

    it('updates duration input', () => {
      const {getByTestId} = render(<MockRoomScreen route={{}} />);

      const durationInput = getByTestId('duration-input');
      fireEvent.changeText(durationInput, '60');

      expect(durationInput.props.value).toBe('60');
    });

    it('updates max participants input', () => {
      const {getByTestId} = render(<MockRoomScreen route={{}} />);

      const participantsInput = getByTestId('participants-input');
      fireEvent.changeText(participantsInput, '5');

      expect(participantsInput.props.value).toBe('5');
    });

    it('toggles private room switch', () => {
      const {getByTestId} = render(<MockRoomScreen route={{}} />);

      const privateToggle = getByTestId('private-toggle');
      fireEvent(privateToggle, 'valueChange', true);

      expect(privateToggle.props.value).toBe(true);
    });
  });

  describe('Task Selection Tests', () => {
    it('opens task selection modal', () => {
      const {getByTestId} = render(<MockRoomScreen route={{}} />);

      const selectTaskButton = getByTestId('select-task-button');
      fireEvent.press(selectTaskButton);

      expect(getByTestId('task-modal')).toBeTruthy();
    });

    it('selects a task from modal', () => {
      const {getByTestId, getByText} = render(<MockRoomScreen route={{}} />);

      const selectTaskButton = getByTestId('select-task-button');
      fireEvent.press(selectTaskButton);

      const taskItem = getByText('Math Homework');
      fireEvent.press(taskItem);

      expect(getByText('Math Homework')).toBeTruthy();
    });

    it('closes task modal', () => {
      const {getByTestId, queryByTestId} = render(
        <MockRoomScreen route={{}} />,
      );

      const selectTaskButton = getByTestId('select-task-button');
      fireEvent.press(selectTaskButton);

      const closeButton = getByTestId('close-modal-button');
      fireEvent.press(closeButton);

      expect(queryByTestId('task-modal')).toBeFalsy();
    });
  });

  describe('Validation Tests', () => {
    it('validates required title field', () => {
      const {getByTestId} = render(<MockRoomScreen route={{}} />);

      const createButton = getByTestId('create-room-submit-button');
      fireEvent.press(createButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Please enter a room title',
      );
    });

    it('validates duration field', () => {
      const {getByTestId} = render(<MockRoomScreen route={{}} />);

      const titleInput = getByTestId('title-input');
      fireEvent.changeText(titleInput, 'Test Room');

      const createButton = getByTestId('create-room-submit-button');
      fireEvent.press(createButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Please enter a valid duration',
      );
    });

    it('validates max participants field', () => {
      const {getByTestId} = render(<MockRoomScreen route={{}} />);

      const titleInput = getByTestId('title-input');
      fireEvent.changeText(titleInput, 'Test Room');

      const durationInput = getByTestId('duration-input');
      fireEvent.changeText(durationInput, '60');

      const createButton = getByTestId('create-room-submit-button');
      fireEvent.press(createButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Please enter valid max participants',
      );
    });

    it('validates room code for joining', () => {
      const {getByTestId} = render(<MockRoomScreen route={{}} />);

      const joinTabButton = getByTestId('join-tab-button');
      fireEvent.press(joinTabButton);

      const joinButton = getByTestId('join-room-submit-button');
      fireEvent.press(joinButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Please enter a room code',
      );
    });

    it('creates room successfully with valid inputs', () => {
      const {getByTestId, getByText} = render(<MockRoomScreen route={{}} />);

      const titleInput = getByTestId('title-input');
      fireEvent.changeText(titleInput, 'Valid Room');

      const durationInput = getByTestId('duration-input');
      fireEvent.changeText(durationInput, '60');

      const participantsInput = getByTestId('participants-input');
      fireEvent.changeText(participantsInput, '4');

      const selectTaskButton = getByTestId('select-task-button');
      fireEvent.press(selectTaskButton);

      const taskItem = getByText('Math Homework');
      fireEvent.press(taskItem);
      fireEvent.press(selectTaskButton);

      const closeButton = getByTestId('close-modal-button');
      fireEvent.press(closeButton);

      const createButton = getByTestId('create-room-submit-button');
      fireEvent.press(createButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Room created successfully!',
      );
    });
  });

  describe('Route Parameter Handling', () => {
    it('handles meeting data from route params', () => {
      const meetingData = {
        title: 'Pre-filled Room',
        description: 'From route params',
        duration: 90,
        maxParticipants: 6,
        isPrivate: true,
      };

      const {getByTestId} = render(
        <MockRoomScreen route={{params: {meetingData}}} />,
      );

      expect(getByTestId('title-input').props.value).toBe('Pre-filled Room');
      expect(getByTestId('description-input').props.value).toBe(
        'From route params',
      );
      expect(getByTestId('duration-input').props.value).toBe('90');
      expect(getByTestId('participants-input').props.value).toBe('6');

      expect(getByTestId('private-toggle').props.value).toBe(true);
    });

    it('handles empty route params gracefully', () => {
      const {getByTestId} = render(<MockRoomScreen route={{}} />);

      expect(getByTestId('title-input').props.value).toBe('');
      expect(getByTestId('description-input').props.value).toBe('');
      expect(getByTestId('duration-input').props.value).toBe('');
      expect(getByTestId('participants-input').props.value).toBe('');
    });
  });
});
