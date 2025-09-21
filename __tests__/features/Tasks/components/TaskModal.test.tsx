import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import TaskModal from '../../../../src/features/Tasks/components/TaskModal';

// Mock the react-native-vector-icons module
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

describe('TaskModal Component', () => {
  // Default props for testing
  const defaultProps = {
    modalVisible: true,
    isEditMode: false,
    isDark: false,
    newTask: {
      title: '',
      description: '',
      dueDate: '',
      dueTime: '',
      category: '',
      priority: 'medium' as 'low' | 'medium' | 'high',
      completed: false,
      notify: false,
    },
    onClose: jest.fn(),
    onUpdateTask: jest.fn(),
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
    const {getByText} = render(<TaskModal {...defaultProps} />);

    expect(getByText('Add New Task')).toBeTruthy();
    expect(getByText('Add Task')).toBeTruthy();
  });

  it('renders correctly in edit mode', () => {
    const props = {
      ...defaultProps,
      isEditMode: true,
    };
    const {getByText} = render(<TaskModal {...props} />);

    expect(getByText('Edit Task')).toBeTruthy();
    expect(getByText('Update Task')).toBeTruthy();
    expect(getByText('Status')).toBeTruthy();
  });

  it('renders correctly in dark mode', () => {
    const props = {
      ...defaultProps,
      isDark: true,
    };
    const {getByText} = render(<TaskModal {...props} />);

    expect(getByText('Add New Task')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const {getByText} = render(<TaskModal {...defaultProps} />);

    fireEvent.press(getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onUpdateTask when add/update button is pressed', () => {
    const {getByText} = render(<TaskModal {...defaultProps} />);

    fireEvent.press(getByText('Add Task'));
    expect(defaultProps.onUpdateTask).toHaveBeenCalledTimes(1);
  });

  it('updates task title when text is entered', () => {
    const {getByPlaceholderText} = render(<TaskModal {...defaultProps} />);

    const titleInput = getByPlaceholderText('Task title');
    fireEvent.changeText(titleInput, 'New Task Title');

    expect(defaultProps.onChangeTask).toHaveBeenCalledWith({
      ...defaultProps.newTask,
      title: 'New Task Title',
    });
  });

  it('updates task description when text is entered', () => {
    const {getByPlaceholderText} = render(<TaskModal {...defaultProps} />);

    const descriptionInput = getByPlaceholderText('Task description');
    fireEvent.changeText(descriptionInput, 'New task description');

    expect(defaultProps.onChangeTask).toHaveBeenCalledWith({
      ...defaultProps.newTask,
      description: 'New task description',
    });
  });

  it('updates due date when text is entered', () => {
    const {getByPlaceholderText} = render(<TaskModal {...defaultProps} />);

    const dueDateInput = getByPlaceholderText('YYYY-MM-DD');
    fireEvent.changeText(dueDateInput, '2024-12-31');

    expect(defaultProps.onChangeTask).toHaveBeenCalledWith({
      ...defaultProps.newTask,
      dueDate: '2024-12-31',
    });
  });

  it('updates due time when text is entered', () => {
    const {getByPlaceholderText} = render(<TaskModal {...defaultProps} />);

    const dueTimeInput = getByPlaceholderText('HH:MM (24-hour format)');
    fireEvent.changeText(dueTimeInput, '14:30');

    expect(defaultProps.onChangeTask).toHaveBeenCalledWith({
      ...defaultProps.newTask,
      dueTime: '14:30',
    });
  });

  it('updates category when text is entered', () => {
    const {getByPlaceholderText} = render(<TaskModal {...defaultProps} />);

    const categoryInput = getByPlaceholderText('e.g. Work, Personal, Health');
    fireEvent.changeText(categoryInput, 'Work');

    expect(defaultProps.onChangeTask).toHaveBeenCalledWith({
      ...defaultProps.newTask,
      category: 'Work',
    });
  });

  it('updates priority when a priority option is pressed', () => {
    const {getByText} = render(<TaskModal {...defaultProps} />);

    fireEvent.press(getByText('High'));

    expect(defaultProps.onChangeTask).toHaveBeenCalledWith({
      ...defaultProps.newTask,
      priority: 'high',
    });
  });

  it('has a notification toggle functionality', () => {
    // We'll test the notification toggle functionality by checking if the component
    // renders the notification text and if onChangeTask is called with the right params

    // First, render with notify false
    const {getByTestId} = render(<TaskModal {...defaultProps} />);

    // Verify the notification label is present
    expect(getByTestId('notification-switch')).toBeTruthy();

    expect(getByTestId('notification-switch').props.value).toBe(false);
    fireEvent(getByTestId('notification-switch'), 'onValueChange', true);


    // Now simulate what would happen when the notification is toggled
    // by directly calling the onChangeTask function that would be triggered
    // defaultProps.onChangeTask({
    //   ...defaultProps.newTask,
    //   notify: true
    // });

    // Verify onChangeTask was called with notify set to true
    expect(defaultProps.onChangeTask).toHaveBeenCalledWith({
      ...defaultProps.newTask,
      notify: true,
    });
  });

  it('shows notification hint when notify is true', () => {
    const props = {
      ...defaultProps,
      newTask: {
        ...defaultProps.newTask,
        notify: true,
      },
    };
    const {getByText} = render(<TaskModal {...props} />);

    expect(
      getByText('You will receive a notification at the scheduled time'),
    ).toBeTruthy();
  });

  it('shows status options in edit mode', () => {
    const props = {
      ...defaultProps,
      isEditMode: true,
    };
    const {getByText} = render(<TaskModal {...props} />);

    expect(getByText('Pending')).toBeTruthy();
    expect(getByText('Completed')).toBeTruthy();
  });

  it('updates task status when status option is pressed', () => {
    const props = {
      ...defaultProps,
      isEditMode: true,
    };
    const {getByText} = render(<TaskModal {...props} />);

    fireEvent.press(getByText('Completed'));

    expect(defaultProps.onChangeTask).toHaveBeenCalledWith({
      ...defaultProps.newTask,
      completed: true,
    });
  });
});
