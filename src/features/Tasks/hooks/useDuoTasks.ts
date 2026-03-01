import {useState, useEffect, useCallback, useRef} from 'react';
import {Alert} from 'react-native';
import {Task} from 'shared/types/taskTypes';
import {TaskService} from 'shared/services/TaskService';
import {getAuth} from '@react-native-firebase/auth';
import {useIsFocused} from '@react-navigation/native';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from '@react-native-firebase/firestore';

const DEFAULT_DUO_TASK: Omit<
  Task,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
> = {
  title: '',
  description: '',
  dueDate: new Date().toISOString().split('T')[0],
  dueTime: '12:00',
  priority: 'medium',
  completed: false,
  category: '',
  notify: true,
  isDuoTask: true,
  collaborationStatus: 'pending',
  subtasks: [],
  progress: 0,
};

export const useDuoTasks = () => {
  const taskService = useRef(new TaskService()).current;
  const isFocused = useIsFocused();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invitations, setInvitations] = useState<Task[]>([]);
  const [newTask, setNewTask] =
    useState<Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>(
      DEFAULT_DUO_TASK,
    );

  // Hold unsubscribe callbacks in a ref to avoid stale closures
  const listenersRef = useRef<Array<() => void>>([]);

  const resetForm = useCallback(() => {
    setNewTask({
      ...DEFAULT_DUO_TASK,
      dueDate: new Date().toISOString().split('T')[0],
    });
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const duoTasks = await taskService.getDuoTasks();
      setTasks(duoTasks);
    } catch (error) {
      console.error('Error fetching team tasks:', error);
      Alert.alert('Error', 'Failed to load team tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [taskService]);

  const fetchInvitations = useCallback(async () => {
    try {
      const pendingInvites = await taskService.getPendingDuoTaskInvitations();
      setInvitations(pendingInvites);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  }, [taskService]);

  // Client-side filter + search
  useEffect(() => {
    let result = tasks;
    switch (selectedFilter) {
      case 'active':
        result = result.filter(
          t => t.collaborationStatus === 'active' && !t.completed,
        );
        break;
      case 'pending':
        result = result.filter(t => t.collaborationStatus === 'pending');
        break;
      case 'completed':
        result = result.filter(t => t.completed);
        break;
    }
    if (searchQuery) {
      result = result.filter(
        t =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    setFilteredTasks(result);
  }, [selectedFilter, tasks, searchQuery]);

  const setupTaskListeners = useCallback(async () => {
    await fetchTasks();
    const userId = getAuth().currentUser?.uid;
    if (!userId) return;

    const unsubscribeTasks = onSnapshot(
      query(
        collection(getFirestore(), 'tasks'),
        where('collaborators', 'array-contains', userId),
        where('isDuoTask', '==', true),
      ),
      snapshot => {
        if (!snapshot.empty) {
          const updatedTasks = snapshot.docs.map((d: any) => ({
            id: d.id,
            ...d.data(),
          })) as Task[];
          setTasks(updatedTasks);
        }
      },
      error => console.error('Error in tasks listener:', error),
    );

    const unsubscribeInvitations = onSnapshot(
      query(
        collection(getFirestore(), 'notifications'),
        where('userId', '==', userId),
        where('type', '==', 'duo_task_invitation'),
        where('read', '==', false),
      ),
      async snapshot => {
        if (!snapshot.empty) await fetchInvitations();
      },
      error => console.error('Error in invitations listener:', error),
    );

    listenersRef.current = [unsubscribeTasks, unsubscribeInvitations];
  }, [fetchTasks, fetchInvitations]);

  const detachListeners = useCallback(() => {
    listenersRef.current.forEach(unsub => unsub());
    listenersRef.current = [];
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchTasks();
      fetchInvitations();
      setupTaskListeners();
    }
    return () => detachListeners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const handleSearch = useCallback((text: string) => setSearchQuery(text), []);
  const handleSelectFilter = useCallback(
    (filter: string) => setSelectedFilter(filter),
    [],
  );

  const createDuoTask = useCallback(async () => {
    if (!newTask.title) {
      Alert.alert('Error', 'Task title is required');
      return;
    }
    if (!newTask.collaborators || newTask.collaborators.length < 2) {
      Alert.alert('Error', 'Please add at least one team member');
      return;
    }
    try {
      const userId = getAuth().currentUser?.uid || '';
      await taskService.createDuoTask({...newTask, userId});
      Alert.alert('Success', 'Team task created successfully');
      closeModal();
      await fetchTasks();
    } catch (error) {
      console.error('Error creating team task:', error);
      Alert.alert('Error', 'Failed to create team task. Please try again.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTask, taskService, fetchTasks]);

  const updateDuoTask = useCallback(async () => {
    if (!selectedTask) return;
    try {
      await taskService.updateTask(selectedTask.id, newTask);
      Alert.alert('Success', 'Duo task updated successfully');
      closeModal();
      await fetchTasks();
    } catch (error) {
      console.error('Error updating duo task:', error);
      Alert.alert('Error', 'Failed to update duo task. Please try again.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTask, newTask, taskService, fetchTasks]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setIsEditMode(false);
    resetForm();
  }, [resetForm]);

  const acceptInvitation = useCallback(
    async (taskId: string) => {
      try {
        await taskService.acceptDuoTaskInvitation(taskId);
        Alert.alert('Success', 'Duo task invitation accepted');
        await fetchTasks();
        await fetchInvitations();
      } catch (error) {
        console.error('Error accepting duo task invitation:', error);
        Alert.alert('Error', 'Failed to accept invitation. Please try again.');
      }
    },
    [taskService, fetchTasks, fetchInvitations],
  );

  const declineInvitation = useCallback(
    async (taskId: string) => {
      try {
        await taskService.rejectDuoTaskInvitation(taskId);
        Alert.alert('Success', 'Team task invitation declined');
        await fetchTasks();
        await fetchInvitations();
      } catch (error) {
        console.error('Error declining team task invitation:', error);
        Alert.alert('Error', 'Failed to decline invitation. Please try again.');
      }
    },
    [taskService, fetchTasks, fetchInvitations],
  );

  const openTaskDetails = useCallback((task: Task) => {
    setSelectedTask(task);
    setDetailsModalVisible(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setIsEditMode(true);
    setSelectedTask(task);
    const {...editableFields} = task;
    setNewTask(editableFields);
    setModalVisible(true);
  }, []);

  const deleteTask = useCallback(
    async (id: string) => {
      Alert.alert(
        'Delete Task',
        'Are you sure you want to delete this duo task?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await taskService.deleteTask(id);
                await fetchTasks();
              } catch (error) {
                console.error('Error deleting task:', error);
                Alert.alert(
                  'Error',
                  'Failed to delete task. Please try again.',
                );
              }
            },
          },
        ],
      );
    },
    [taskService, fetchTasks],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTasks();
      await fetchInvitations();
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchTasks, fetchInvitations]);

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

  const getStatusColor = useCallback((task: Task) => {
    if (task.completed) return '#34C759';
    switch (task.collaborationStatus) {
      case 'active':
        return '#007AFF';
      case 'pending':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  }, []);

  const getCollaboratorText = useCallback((task: Task) => {
    const count = task.collaborators?.length || 0;
    return count <= 1 ? '1 member' : `${count} team members`;
  }, []);

  return {
    // State
    filteredTasks,
    searchQuery,
    selectedFilter,
    modalVisible,
    detailsModalVisible,
    selectedTask,
    isEditMode,
    isLoading,
    refreshing,
    invitations,
    newTask,
    // Setters
    setModalVisible,
    setDetailsModalVisible,
    setSelectedTask,
    setNewTask,
    // Handlers
    handleSearch,
    handleSelectFilter,
    createDuoTask,
    updateDuoTask,
    closeModal,
    acceptInvitation,
    declineInvitation,
    openTaskDetails,
    handleEditTask,
    deleteTask,
    onRefresh,
    fetchTasks,
    getPriorityColor,
    getStatusColor,
    getCollaboratorText,
    resetForm,
  };
};
