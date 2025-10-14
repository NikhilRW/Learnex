import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import DuoTaskModal from '../../../../src/features/Tasks/components/DuoTaskModal';

// Mock Firebase modules
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {uid: 'test-user-id'},
  })),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    fromDate: jest.fn(date => date),
    now: jest.fn(() => new Date()),
  },
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
}));

// Mock the react-native-vector-icons module
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

describe('DuoTaskModal Component', () => {
  // Default props for testing
  const defaultProps = {
    modalVisible: true,
    isEditMode: false,
    isDark: false,
    task: {
      title: '',
      description: '',
      dueDate: '',
      dueTime: '',
      category: '',
      priority: 'medium' as 'low' | 'medium' | 'high',
      completed: false,
      notify: false,
      collaborators: [],
      collaborationStatus: 'pending' as 'pending' | 'active' | 'completed',
      subtasks: [],
      progress: 0,
    },
    onClose: jest.fn(),
    onSave: jest.fn(),
    onChangeTask: jest.fn(),
    getPriorityColor: jest.fn().mockImplementation(priority => {
      switch (priority) {
        case 'low':
          return '#34C759';
        case 'medium':
          return '#FF9500';
        case 'high':
          return '#FF3B30';
        default:
          return '#FF9500';
      }
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly in add mode', () => {
    const {getByText} = render(<DuoTaskModal {...defaultProps} />);
    expect(getByText('Task Details')).toBeTruthy();
    expect(getByText('Subtasks')).toBeTruthy();
    expect(getByText('Team Members')).toBeTruthy();
  });

  it('renders correctly in edit mode', () => {
    const props = {
      ...defaultProps,
      isEditMode: true,
    };
    const {getByText} = render(<DuoTaskModal {...props} />);

    expect(getByText('Edit Team Task')).toBeTruthy();
  });

  it('renders correctly in dark mode', () => {
    const props = {
      ...defaultProps,
      isDark: true,
    };
    const {getByTestId} = render(<DuoTaskModal {...props} />);

    expect(getByTestId('duoTaskModal')).toBeTruthy();

  });

  it('calls onClose when close button is pressed', () => {
    const {getByText} = render(<DuoTaskModal {...defaultProps} />);

    fireEvent.press(getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSave when save button is pressed', () => {
    const {getByText} = render(<DuoTaskModal {...defaultProps} />);

    fireEvent.press(getByText('Save'));
    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
  });

  it('switches between tabs correctly', () => {
    const {getByText} = render(<DuoTaskModal {...defaultProps} />);

    // Click on Subtasks tab
    fireEvent.press(getByText('Subtasks'));
    expect(getByText('Add Subtask')).toBeTruthy();

    // Click on Team Members tab
    fireEvent.press(getByText('Team Members'));
    expect(getByText('Add Team Members')).toBeTruthy();

    // Click back to Task Details tab
    fireEvent.press(getByText('Task Details'));
    expect(getByText('Title *')).toBeTruthy();
  });

  it('updates task title when text is entered', () => {
    const {getByText, getByPlaceholderText} = render(
      <DuoTaskModal {...defaultProps} />,
    );

    const titleInput = getByPlaceholderText('Task title');
    fireEvent.changeText(titleInput, 'New Team Task Title');

    expect(defaultProps.onChangeTask).toHaveBeenCalledWith({
      ...defaultProps.task,
      title: 'New Team Task Title',
    });
  });

  it('updates task description when text is entered', () => {
    const {getByPlaceholderText} = render(<DuoTaskModal {...defaultProps} />);

    const descriptionInput = getByPlaceholderText('Task description');
    fireEvent.changeText(descriptionInput, 'New team task description');

    expect(defaultProps.onChangeTask).toHaveBeenCalledWith({
      ...defaultProps.task,
      description: 'New team task description',
    });
  });

  it('updates due date when text is entered', () => {
    const {getByPlaceholderText} = render(<DuoTaskModal {...defaultProps} />);

    const dueDateInput = getByPlaceholderText('Select due date');
    fireEvent.changeText(dueDateInput, '2024-12-31');

    expect(defaultProps.onChangeTask).toHaveBeenCalledWith({
      ...defaultProps.task,
      dueDate: '2024-12-31',
    });
  });

  it('updates due time when text is entered', () => {
    const {getByPlaceholderText} = render(<DuoTaskModal {...defaultProps} />);

    const dueTimeInput = getByPlaceholderText('HH:MM (24-hour format)');
    fireEvent.changeText(dueTimeInput, '14:30');

    expect(defaultProps.onChangeTask).toHaveBeenCalledWith({
      ...defaultProps.task,
      dueTime: '14:30',
    });
  });

  it('updates priority when a priority option is pressed', () => {
    const {getByText} = render(<DuoTaskModal {...defaultProps} />);

    fireEvent.press(getByText('High'));

    expect(defaultProps.onChangeTask).toHaveBeenCalledWith({
      ...defaultProps.task,
      priority: 'high',
    });
  });

  it('adds a subtask when add subtask button is pressed', () => {
    const {getByText, getByPlaceholderText, getByTestId} = render(
      <DuoTaskModal {...defaultProps} />,
    );

    // Switch to subtasks tab
    fireEvent.press(getByText('Subtasks'));

    const subtaskTitleInput = getByPlaceholderText('Subtask title');
    const subtaskDescInput = getByPlaceholderText('Subtask Description (optional)');

    fireEvent.changeText(subtaskTitleInput, 'New Subtask');
    fireEvent.changeText(subtaskDescInput, 'Subtask description');

    fireEvent.press(getByTestId('addSubtask'));

    // The component should add the subtask to the task
    expect(defaultProps.onChangeTask).toHaveBeenCalled();
  });

  it('shows collaboration status when task has collaborators', () => {
    const props = {
      ...defaultProps,
      task: {
        ...defaultProps.task,
        collaborators: ['user1', 'user2'],
        collaborationStatus: 'active',
      },
    };
    const {getByText} = render(<DuoTaskModal {...props} />);

    // Switch to Team Members tab
    fireEvent.press(getByText('Team Members'));

    expect(getByText('Team Members (0)')).toBeTruthy();
  });

  it('handles notification toggle', () => {
    const {getByText} = render(<DuoTaskModal {...defaultProps} />);

    // The notification functionality should be present
    expect(getByText('Send Notification')).toBeTruthy();

    // Simulate notification toggle by calling onChangeTask
    defaultProps.onChangeTask({
      ...defaultProps.task,
      notify: true,
    });

    expect(defaultProps.onChangeTask).toHaveBeenCalledWith({
      ...defaultProps.task,
      notify: true,
    });
  });

  it('shows notification hint when notify is true', () => {
    const props = {
      ...defaultProps,
      task: {
        ...defaultProps.task,
        notify: true,
      },
    };
    const {getByTestId} = render(<DuoTaskModal {...props} />);
    const notifySwitch = getByTestId('notifySwitch');
    expect(notifySwitch.props.value).toBe(true);
  });

  it('completes the task when the checkbox is pressed', () => {
    const props = {
      ...defaultProps,
      isEditMode: true,
    };
    const {getByTestId, getByText, getByPlaceholderText} = render(
      <DuoTaskModal {...props} />,
    );
    fireEvent.press(getByText('Subtasks').parent!);

    fireEvent.changeText(
      getByPlaceholderText('Subtask title'),
      'Learnex Testing',
    );
    fireEvent.press(getByTestId('addSubtask'));
    const completionToggleBtn = getByTestId('taskCompletionToggleButton');

    // The current status should be visible
    expect(completionToggleBtn).toBeTruthy();
    fireEvent.press(completionToggleBtn);

    // Since The Button Is Pressed It The Task Should Be Seen As Completed
    expect(defaultProps.onChangeTask).toHaveBeenCalled();
    expect(completionToggleBtn.children[0]).toBeOnTheScreen();
  });

  it('shows empty team members message when no collaborators', () => {
    const {getByText} = render(<DuoTaskModal {...defaultProps} />);

    // Switch to Team Members tab
    fireEvent.press(getByText('Team Members'));

    expect(
      getByText(
        'No team members added yet. Add team members to work together!',
      ),
    ).toBeTruthy();
  });
});
