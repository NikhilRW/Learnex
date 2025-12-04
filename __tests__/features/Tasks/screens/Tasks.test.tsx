import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Tasks from '../../../../src/features/Tasks/screens/Tasks';

// Mock @legendapp/list
jest.mock('@legendapp/list', () => ({
  LegendList: ({ data, renderItem, keyExtractor }: any) => {
    const { View } = require('react-native');
    return (
      <View>
        {data.map((item: any, index: number) => (
          <View key={keyExtractor ? keyExtractor(item) : index}>
            {renderItem({ item, index })}
          </View>
        ))}
      </View>
    );
  },
}));

// Mock vector icons used in the component
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');

// Prepare a navigation mock we can inspect. Prefix with 'mock' so it is
// allowed to be referenced inside jest.mock factory functions.
const mockNav = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  openDrawer: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNav,
}));

// Mock auth to supply a current user
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: () => ({ currentUser: { uid: 'test-user' } }),
}));

// Mock the svg constant used for the AI button
jest.mock('shared/constants/svg', () => ({
  AIGeneratedSVGXML: { light: '<svg />', dark: '<svg />' },
}));

// Mock the TaskService used inside the component
const mockGetTasks = jest.fn();
const mockToggleTaskCompletion = jest.fn();

jest.mock('shared/services/TaskService', () => {
  return {
    TaskService: jest.fn().mockImplementation(() => ({
      getTasks: mockGetTasks,
      toggleTaskCompletion: mockToggleTaskCompletion,
      getTaskSuggestion: jest.fn(),
      addTask: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
    })),
  };
});

// Mock theme selector to return light theme by default
jest.mock('hooks/redux/useTypedSelector', () => ({
  useTypedSelector: jest.fn().mockImplementation((_selector: any) => 'light'),
}));

// Mock TaskModal so tests don't depend on its internals. It will render
// a simple label when visible so we can assert modal visibility.
jest.mock('tasks/components/TaskModal', () => {
  // Return a simple functional component
  return ({ modalVisible, onClose, onUpdateTask }: any) => {
    const { View, Text, Button } = require('react-native');
    return (
      <View>
        {modalVisible ? <Text>TaskModalMock</Text> : null}
        <Button title="CloseModal" onPress={onClose} />
        <Button title="UpdateTask" onPress={onUpdateTask} />
      </View>
    );
  };
});

describe('Tasks screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleTasks = [
    {
      id: '1',
      title: 'Task One',
      description: 'First task description',
      dueDate: '2025-10-13',
      dueTime: '12:00',
      priority: 'medium',
      completed: false,
      category: 'Work',
      notify: false,
      isDuoTask: false,
    },
    {
      id: '2',
      title: 'Task Two',
      description: 'Second task description',
      dueDate: '2025-10-14',
      dueTime: '13:00',
      priority: 'high',
      completed: true,
      category: 'Home',
      notify: false,
      isDuoTask: false,
    },
  ];

  it('renders header and task list', async () => {
    mockGetTasks.mockResolvedValueOnce(sampleTasks);

    const { getByText, findByText } = render(<Tasks />);

    // Static UI
    expect(getByText('Tasks')).toBeTruthy();
    expect(getByText('Add Task')).toBeTruthy();
    expect(getByText('Team Tasks')).toBeTruthy();

    // Wait for async tasks to be rendered
    expect(await findByText('Task One')).toBeTruthy();
    expect(await findByText('Task Two')).toBeTruthy();
  });

  it('filters tasks when searching', async () => {
    mockGetTasks.mockResolvedValueOnce(sampleTasks);

    const { findByText, getByPlaceholderText, queryByText } = render(<Tasks />);

    // Ensure tasks loaded
    expect(await findByText('Task One')).toBeTruthy();

    const searchInput = getByPlaceholderText('Search tasks...');
    fireEvent.changeText(searchInput, 'One');

    // Task Two should be filtered out
    await waitFor(() => expect(queryByText('Task Two')).toBeNull());
    expect(queryByText('Task One')).toBeTruthy();
  });

  it('opens modal when Add Task is pressed', async () => {
    mockGetTasks.mockResolvedValueOnce([]);

    const { getByText, queryByText } = render(<Tasks />);

    // Wait for initial fetch
    await waitFor(() => expect(mockGetTasks).toHaveBeenCalled());

    fireEvent.press(getByText('Add Task'));

    // Our mocked TaskModal renders 'TaskModalMock' when visible
    expect(queryByText('TaskModalMock')).toBeTruthy();
  });

  it('navigates to DuoTasks when Team Tasks pressed', async () => {
    mockGetTasks.mockResolvedValueOnce([]);

    const { getByText } = render(<Tasks />);

    // Wait for initial fetch
    await waitFor(() => expect(mockGetTasks).toHaveBeenCalled());

    fireEvent.press(getByText('Team Tasks'));

    expect(mockNav.navigate).toHaveBeenCalledWith('DuoTasks');
  });
});
