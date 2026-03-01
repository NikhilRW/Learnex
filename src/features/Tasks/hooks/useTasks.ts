import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  startTransition,
} from 'react';
import {Alert} from 'react-native';
import {Task} from 'shared/types/taskTypes';
import {TaskService} from 'shared/services/TaskService';
import {getAuth} from '@react-native-firebase/auth';

const DEFAULT_TASK: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  title: '',
  description: '',
  dueDate: new Date().toISOString().split('T')[0],
  dueTime: '12:00',
  priority: 'medium',
  completed: false,
  category: '',
  notify: true,
  isDuoTask: false,
};

export const useTasks = () => {
  const taskService = useMemo(() => new TaskService(), []);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isAIGeneratingTask, setIsAIGeneratingTask] = useState(false);
  const [newTask, setNewTask] =
    useState<Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>(
      DEFAULT_TASK,
    );

  const resetForm = useCallback(() => {
    setNewTask({
      ...DEFAULT_TASK,
      dueDate: new Date().toISOString().split('T')[0],
    });
  }, []);

  const fetchTasks = useCallback(
    async (filter = 'all') => {
      try {
        setIsLoading(true);
        const allTasks = await taskService.getTasks();

        const uniqueCategories = [
          ...new Set(allTasks.map(task => task.category)),
        ].filter(Boolean);
        setCategories(uniqueCategories);

        let fetchedTasks: Task[];
        switch (filter) {
          case 'completed':
            fetchedTasks = allTasks.filter(task => task.completed);
            break;
          case 'pending':
            fetchedTasks = allTasks.filter(task => !task.completed);
            break;
          case 'all':
            fetchedTasks = allTasks;
            break;
          default:
            fetchedTasks = allTasks.filter(
              task => task.category.toLowerCase() === filter.toLowerCase(),
            );
            break;
        }

        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        Alert.alert('Error', 'Failed to load tasks. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [taskService],
  );

  // Client-side search filter
  useEffect(() => {
    let result = tasks;
    if (searchQuery) {
      result = result.filter(
        task =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.category.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    setFilteredTasks(result);
  }, [searchQuery, tasks]);

  useEffect(() => {
    fetchTasks(selectedFilter);
  }, [fetchTasks, selectedFilter]);

  const handleSearch = useCallback((text: string) => {
    startTransition(() => setSearchQuery(text));
  }, []);

  const handleSelectFilter = useCallback((filter: string) => {
    startTransition(() => setSelectedFilter(filter));
  }, []);

  const toggleTaskCompletion = useCallback(
    async (id: string) => {
      try {
        await taskService.toggleTaskCompletion(id);
        await fetchTasks(selectedFilter);
      } catch (error) {
        console.error('Error toggling task completion:', error);
        Alert.alert('Error', 'Failed to update task status. Please try again.');
      }
    },
    [taskService, fetchTasks, selectedFilter],
  );

  const handleEditTask = useCallback((task: Task) => {
    setIsEditMode(true);
    setCurrentTaskId(task.id);
    const {...editableFields} = task;
    setNewTask(editableFields);
    setModalVisible(true);
  }, []);

  const updateTask = useCallback(async () => {
    if (!newTask.title) {
      Alert.alert('Error', 'Task title is required');
      return;
    }
    try {
      if (isEditMode && currentTaskId) {
        await taskService.updateTask(currentTaskId, newTask);
        Alert.alert('Success', 'Task updated successfully');
      } else {
        const userId = getAuth().currentUser?.uid;
        if (userId) {
          await taskService.addTask({userId, ...newTask, isDuoTask: false});
          Alert.alert('Success', 'Task added successfully');
        } else {
          Alert.alert('Some Error Occurred. Please Try Again');
        }
      }
      closeModal();
      await fetchTasks(selectedFilter);
    } catch (error) {
      const err = error as Error;
      console.error('Error updating task:', err);
      Alert.alert(
        'Error',
        err.message || 'Failed to save task. Please try again.',
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    newTask,
    isEditMode,
    currentTaskId,
    taskService,
    selectedFilter,
    fetchTasks,
  ]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setIsEditMode(false);
    setCurrentTaskId(null);
    resetForm();
  }, [resetForm]);

  const deleteTask = useCallback(
    async (id: string) => {
      Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await taskService.deleteTask(id);
              await fetchTasks(selectedFilter);
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task. Please try again.');
            }
          },
        },
      ]);
    },
    [taskService, fetchTasks, selectedFilter],
  );

  const getAITaskSuggestion = useCallback(async () => {
    if (isAIGeneratingTask) return;
    setIsAIGeneratingTask(true);
    const newAITask = await taskService.getTaskSuggestion();
    const [title, description] = newAITask.split('|');
    setNewTask(prev => ({...prev, title, description}));
    setIsAIGeneratingTask(false);
    setModalVisible(true);
  }, [isAIGeneratingTask, taskService]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setSearchQuery('');
      await fetchTasks(selectedFilter);
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      Alert.alert(
        'Refresh Error',
        'Failed to refresh tasks. Please try again.',
      );
    } finally {
      setRefreshing(false);
    }
  }, [fetchTasks, selectedFilter]);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  }, []);

  return {
    // State
    filteredTasks,
    searchQuery,
    selectedFilter,
    modalVisible,
    isEditMode,
    isLoading,
    categories,
    refreshing,
    isAIGeneratingTask,
    newTask,
    // Setters
    setModalVisible,
    setNewTask,
    // Handlers
    handleSearch,
    handleSelectFilter,
    toggleTaskCompletion,
    handleEditTask,
    updateTask,
    closeModal,
    deleteTask,
    getAITaskSuggestion,
    onRefresh,
    getPriorityColor,
    resetForm,
  };
};
