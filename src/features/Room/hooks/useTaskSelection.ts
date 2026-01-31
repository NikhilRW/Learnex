import {useState, useCallback, useEffect} from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Task} from 'shared/types/taskTypes';
import {TaskService} from 'shared/services/TaskService';

const taskService = new TaskService();

/**
 * Custom hook for managing task selection logic
 * Handles task fetching, selection state, and modal visibility
 */
export const useTaskSelection = () => {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  /**
   * Fetches user's team/duo tasks
   */
  const fetchTasks = useCallback(async () => {
    try {
      setIsTasksLoading(true);
      // Get team/duo tasks instead of normal tasks
      const userTasks = await taskService.getDuoTasks();
      // Filter out completed tasks
      const pendingTasks = userTasks.filter(task => !task.completed);
      setTasks(pendingTasks);

      // Verify if selected task still exists and is not completed
      if (selectedTask) {
        const taskStillExists = pendingTasks.some(
          task => task.id === selectedTask.id,
        );
        if (!taskStillExists) {
          // Selected task no longer exists or is completed, clear selection
          setSelectedTask(null);
        }
      }
    } catch (error) {
      console.error('Error fetching team tasks:', error);
      Alert.alert('Error', 'Failed to load team tasks');
    } finally {
      setIsTasksLoading(false);
    }
  }, [selectedTask]);

  /**
   * Handles task selection from the modal
   */
  const handleTaskSelect = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(false);
  }, []);

  /**
   * Opens task modal and refreshes tasks
   */
  const handleShowTaskModal = useCallback(() => {
    fetchTasks();
    setShowTaskModal(true);
  }, [fetchTasks]);

  /**
   * Clears selected task
   */
  const handleClearTask = useCallback(() => {
    setSelectedTask(null);
  }, []);

  /**
   * Closes task modal
   */
  const handleCloseTaskModal = useCallback(() => {
    setShowTaskModal(false);
  }, []);

  // Fetch tasks when component mounts and when screen is focused
  useEffect(() => {
    fetchTasks();

    // Add focus listener to refresh tasks when returning to this screen
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTasks();
    });

    // Clean up the listener when the component is unmounted
    return unsubscribe;
  }, [fetchTasks, navigation]);

  return {
    tasks,
    isTasksLoading,
    showTaskModal,
    selectedTask,
    fetchTasks,
    handleTaskSelect,
    handleShowTaskModal,
    handleClearTask,
    handleCloseTaskModal,
  };
};
