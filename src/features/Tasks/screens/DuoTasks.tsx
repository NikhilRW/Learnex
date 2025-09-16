import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTypedSelector } from '@/shared/hooks/redux/useTypedSelector';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Task } from 'shared/types/taskTypes';
import { TaskService } from '@/shared/service/TaskService';
import { styles } from 'tasks/styles/Tasks.styles';
import DuoTaskModal from 'tasks/components/DuoTaskModal';
import DuoTaskDetailsModal from 'tasks/components/DuoTaskDetailsModal';
import { getAuth } from '@react-native-firebase/auth';
import { useIsFocused } from '@react-navigation/native';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from '@react-native-firebase/firestore';

import { SafeAreaView } from 'react-native-safe-area-context';

const DuoTasks = () => {
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  const navigation = useNavigation<DrawerNavigationProp<any>>();
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
  const taskService = new TaskService();
  const isFocused = useIsFocused();
  const [taskListeners, setTaskListeners] = useState<any[]>([]); // State to track active listeners

  const [newTask, setNewTask] = useState<
    Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  >({
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
  });

  // Reset form helper
  const resetForm = () => {
    setNewTask({
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
    });
  };

  // Fetch tasks on component mount
  useEffect(() => {
    if (isFocused) {
      fetchTasks();
      fetchInvitations();
      setupTaskListeners();
    }
  }, [isFocused]);

  // Refresh task list when filter changes
  useEffect(() => {
    filterTasks();
  }, [selectedFilter, tasks, searchQuery]);

  // Add a new useEffect for real-time updates
  useEffect(() => {
    // Cleanup function to detach listeners when component unmounts or loses focus
    return () => {
      detachTaskListeners();
    };
  }, [isFocused]);

  const fetchTasks = async () => {
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
  };

  const fetchInvitations = async () => {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) return;

      const invitations = await taskService.getPendingDuoTaskInvitations();
      setInvitations(invitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const filterTasks = () => {
    let result = tasks;

    // Apply status filter
    switch (selectedFilter) {
      case 'active':
        result = result.filter(
          task => task.collaborationStatus === 'active' && !task.completed,
        );
        break;
      case 'pending':
        result = result.filter(task => task.collaborationStatus === 'pending');
        break;
      case 'completed':
        result = result.filter(task => task.completed);
        break;
      case 'all':
      default:
        // No filter needed
        break;
    }

    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        task =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.category.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredTasks(result);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const createDuoTask = async () => {
    if (!newTask.title) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    if (!newTask.collaborators || newTask.collaborators.length < 2) {
      Alert.alert('Error', 'Please add at least one team member');
      return;
    }

    try {
      // Add current user ID to ensure the service has all required fields
      const userId = getAuth().currentUser?.uid || '';
      await taskService.createDuoTask({
        ...newTask,
        userId,
      });
      Alert.alert('Success', 'Team task created successfully');

      closeModal();
      await fetchTasks();
    } catch (error) {
      console.error('Error creating team task:', error);
      Alert.alert('Error', 'Failed to create team task. Please try again.');
    }
  };

  const updateDuoTask = async () => {
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
  };

  const closeModal = () => {
    setModalVisible(false);
    setIsEditMode(false);
    resetForm();
  };

  const acceptInvitation = async (taskId: string) => {
    try {
      await taskService.acceptDuoTaskInvitation(taskId);
      Alert.alert('Success', 'Duo task invitation accepted');
      await fetchTasks();
      await fetchInvitations();
    } catch (error) {
      console.error('Error accepting duo task invitation:', error);
      Alert.alert('Error', 'Failed to accept invitation. Please try again.');
    }
  };

  const declineInvitation = async (taskId: string) => {
    try {
      await taskService.rejectDuoTaskInvitation(taskId);
      Alert.alert('Success', 'Team task invitation declined');
      await fetchTasks();
      await fetchInvitations();
    } catch (error) {
      console.error('Error declining team task invitation:', error);
      Alert.alert('Error', 'Failed to decline invitation. Please try again.');
    }
  };

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setDetailsModalVisible(true);
  };

  const handleEditTask = (task: Task) => {
    setIsEditMode(true);
    setSelectedTask(task);
    const { ...editableFields } = task;
    setNewTask(editableFields);
    setModalVisible(true);
  };

  const deleteTask = async (id: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this duo task?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await taskService.deleteTask(id);
              await fetchTasks();
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task. Please try again.');
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  const getPriorityColor = (priority: string) => {
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
  };

  // Helper to get collaborator count text
  const getCollaboratorText = (task: Task) => {
    const count = task.collaborators?.length || 0;
    if (count <= 1) return '1 member';
    return `${count} team members`;
  };

  // Helper to get status color
  const getStatusColor = (task: Task) => {
    if (task.completed) return '#34C759'; // Green for completed
    switch (task.collaborationStatus) {
      case 'active':
        return '#007AFF'; // Blue for active
      case 'pending':
        return '#FF9500'; // Orange for pending
      default:
        return '#8E8E93'; // Gray for other states
    }
  };

  // Add onRefresh function
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
  }, []);

  // Setup Firestore listeners for real-time updates
  const setupTaskListeners = async () => {
    try {
      // First, fetch tasks to have initial data
      await fetchTasks();

      // Get current user ID
      const userId = getAuth().currentUser?.uid;
      if (!userId) return;

      // Create a listener for the tasks collection
      const unsubscribe = onSnapshot(
        query(
          collection(getFirestore(), 'tasks'),
          where('collaborators', 'array-contains', userId),
          where('isDuoTask', '==', true)
        ),
        snapshot => {
          // Handle task updates in real-time
          if (!snapshot.empty) {
            const updatedTasks = snapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data(),
            })) as Task[];

            // Update tasks state, which will also update filtered tasks
            setTasks(updatedTasks);
          }
        },
        error => {
          console.error('Error in tasks listener:', error);
        },
      );

      // Create a listener for notifications/invitations
      const invitationsUnsubscribe = onSnapshot(
        query(
          collection(getFirestore(), 'notifications'),
          where('userId', '==', userId),
          where('type', '==', 'duo_task_invitation'),
          where('read', '==', false)
        ),
        async snapshot => {
          if (!snapshot.empty) {
            await fetchInvitations();
          }
        },
        error => {
          console.error('Error in invitations listener:', error);
        },
      );

      // Save references to the listeners for cleanup
      setTaskListeners([unsubscribe, invitationsUnsubscribe]);
    } catch (error) {
      console.error('Error setting up task listeners:', error);
    }
  };

  // Detach all active listeners
  const detachTaskListeners = () => {
    taskListeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    setTaskListeners([]);
  };

  const renderInvitationItem = ({ item }: { item: Task }) => (
    <View
      style={[
        styles.taskCard,
        { backgroundColor: isDark ? '#2a2a2a' : 'white' },
      ]}>
      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <Text style={[styles.taskTitle, { color: isDark ? 'white' : 'black' }]}>
            {item.title}
          </Text>
        </View>

        <Text
          style={[
            styles.taskDescription,
            { color: isDark ? '#e0e0e0' : '#333' },
          ]}>
          {item.description}
        </Text>

        <View style={styles.taskFooter}>
          <View style={styles.taskMeta}>
            <Icon
              name="person-outline"
              size={14}
              color={isDark ? '#8e8e8e' : '#666'}
            />
            <Text
              style={[
                styles.taskMetaText,
                { color: isDark ? '#8e8e8e' : '#666', marginLeft: 5 },
              ]}>
              From:{' '}
              {item.userId === getAuth().currentUser?.uid ? 'You' : 'Team Member'}
            </Text>
          </View>

          <View style={styles.taskMeta}>
            <Icon
              name="calendar-outline"
              size={14}
              color={isDark ? '#8e8e8e' : '#666'}
            />
            <Text
              style={[
                styles.taskMetaText,
                { color: isDark ? '#8e8e8e' : '#666', marginLeft: 5 },
              ]}>
              {item.dueDate} {item.dueTime && `at ${item.dueTime}`}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 10,
          }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#FF3B30',
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 5,
              flex: 1,
              marginRight: 5,
              alignItems: 'center',
            }}
            onPress={() => declineInvitation(item.id)}>
            <Text style={{ color: 'white' }}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: '#34C759',
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 5,
              flex: 1,
              marginLeft: 5,
              alignItems: 'center',
            }}
            onPress={() => acceptInvitation(item.id)}>
            <Text style={{ color: 'white' }}>Join Team</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={[styles.taskCard, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}
      onPress={() => openTaskDetails(item)}>
      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <Text
            style={[
              styles.taskTitle,
              { color: isDark ? 'white' : 'black' },
              item.completed && styles.completedTaskTitle,
            ]}>
            {item.title}
          </Text>
          {/* Only show action buttons if the current user is the task creator */}
          {item.userId === getAuth().currentUser?.uid && (
            <View style={styles.taskActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditTask(item)}>
                <Icon
                  name="pencil"
                  size={20}
                  color={isDark ? '#8e8e8e' : '#666'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => deleteTask(item.id)}>
                <Icon
                  name="trash-outline"
                  size={20}
                  color={isDark ? '#8e8e8e' : '#666'}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text
          style={[
            styles.taskDescription,
            { color: isDark ? '#e0e0e0' : '#333' },
            item.completed && styles.completedTaskText,
          ]}>
          {item.description}
        </Text>

        {/* Progress bar */}
        <View style={{ marginTop: 10, marginBottom: 5 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 5,
            }}>
            <Text style={{ color: isDark ? '#8e8e8e' : '#666', fontSize: 12 }}>
              Progress: {item.progress || 0}%
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
                backgroundColor: getStatusColor(item),
              }}>
              <Text style={{ color: 'white', fontSize: 10 }}>
                {item.completed ? 'Completed' : item.collaborationStatus}
              </Text>
            </View>
          </View>

          <View
            style={{
              height: 6,
              backgroundColor: isDark ? '#404040' : '#e0e0e0',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
            <View
              style={{
                height: '100%',
                width: `${item.progress || 0}%`,
                backgroundColor: item.completed ? '#34C759' : '#1a9cd8',
                borderRadius: 3,
              }}
            />
          </View>
        </View>

        <View style={styles.taskFooter}>
          <View style={styles.taskMeta}>
            <View
              style={[
                styles.priorityIndicator,
                { backgroundColor: getPriorityColor(item.priority) },
              ]}
            />
            <Text
              style={[
                styles.taskMetaText,
                { color: isDark ? '#8e8e8e' : '#666' },
              ]}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
            </Text>
          </View>

          <View style={styles.taskMeta}>
            <Icon
              name="calendar-outline"
              size={14}
              color={isDark ? '#8e8e8e' : '#666'}
            />
            <Text
              style={[
                styles.taskMetaText,
                { color: isDark ? '#8e8e8e' : '#666', marginLeft: 5 },
              ]}>
              {item.dueDate}
            </Text>
          </View>

          <View style={styles.taskMeta}>
            <Icon
              name="people-outline"
              size={14}
              color={isDark ? '#8e8e8e' : '#666'}
            />
            <Text
              style={[
                styles.taskMetaText,
                { color: isDark ? '#8e8e8e' : '#666', marginLeft: 5 },
              ]}>
              {getCollaboratorText(item)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' },
      ]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#1a1a1a' : '#f5f5f5'}
      />

      {/* Custom Header */}
      <View
        style={[
          styles.customHeader,
          { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' },
        ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon
            name="arrow-back"
            size={24}
            color={isDark ? 'white' : 'black'}
          />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: isDark ? 'white' : 'black' }]}>
          Team Tasks
        </Text>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={24} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.addTaskButton}
            onPress={() => {
              setIsEditMode(false);
              resetForm();
              setModalVisible(true);
            }}>
            <MaterialIcons name="add-circle" size={24} color="#1a9cd8" />
            <Text style={styles.addTaskButtonText}>Create Team Task</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDark ? '#2a2a2a' : 'white',
              borderColor: isDark ? '#404040' : '#e0e0e0',
            },
          ]}>
          <Icon name="search" size={20} color={isDark ? '#8e8e8e' : '#666'} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? 'white' : 'black' }]}
            placeholder="Search team tasks..."
            placeholderTextColor={isDark ? '#8e8e8e' : '#999'}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Icon
                name="close-circle"
                size={20}
                color={isDark ? '#8e8e8e' : '#666'}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.filtersContainer]}>
          <TouchableOpacity
            key="all"
            style={[
              styles.filterButton,
              selectedFilter === 'all' && styles.activeFilterButton,
              {
                backgroundColor:
                  selectedFilter === 'all'
                    ? '#1a9cd8'
                    : isDark
                      ? '#2a2a2a'
                      : 'white',
                borderColor: isDark ? '#404040' : '#e0e0e0',
              },
            ]}
            onPress={() => setSelectedFilter('all')}>
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    selectedFilter === 'all'
                      ? 'white'
                      : isDark
                        ? 'white'
                        : 'black',
                },
              ]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            key="active"
            style={[
              styles.filterButton,
              selectedFilter === 'active' && styles.activeFilterButton,
              {
                backgroundColor:
                  selectedFilter === 'active'
                    ? '#1a9cd8'
                    : isDark
                      ? '#2a2a2a'
                      : 'white',
                borderColor: isDark ? '#404040' : '#e0e0e0',
              },
            ]}
            onPress={() => setSelectedFilter('active')}>
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    selectedFilter === 'active'
                      ? 'white'
                      : isDark
                        ? 'white'
                        : 'black',
                },
              ]}>
              Active
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            key="pending"
            style={[
              styles.filterButton,
              selectedFilter === 'pending' && styles.activeFilterButton,
              {
                backgroundColor:
                  selectedFilter === 'pending'
                    ? '#1a9cd8'
                    : isDark
                      ? '#2a2a2a'
                      : 'white',
                borderColor: isDark ? '#404040' : '#e0e0e0',
              },
            ]}
            onPress={() => setSelectedFilter('pending')}>
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    selectedFilter === 'pending'
                      ? 'white'
                      : isDark
                        ? 'white'
                        : 'black',
                },
              ]}>
              Pending
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            key="completed"
            style={[
              styles.filterButton,
              selectedFilter === 'completed' && styles.activeFilterButton,
              {
                backgroundColor:
                  selectedFilter === 'completed'
                    ? '#1a9cd8'
                    : isDark
                      ? '#2a2a2a'
                      : 'white',
                borderColor: isDark ? '#404040' : '#e0e0e0',
              },
            ]}
            onPress={() => setSelectedFilter('completed')}>
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    selectedFilter === 'completed'
                      ? 'white'
                      : isDark
                        ? 'white'
                        : 'black',
                },
              ]}>
              Completed
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {invitations.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text
              style={[
                {
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginHorizontal: 16,
                  marginVertical: 8,
                  color: isDark ? 'white' : 'black',
                  marginBottom: 10,
                },
              ]}>
              Invitations
            </Text>
            <FlatList
              data={invitations}
              renderItem={renderInvitationItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 10 }}
              ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
            />
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
            <Text
              style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>
              Loading team tasks...
            </Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="people" size={50} color={isDark ? '#404040' : '#ccc'} />
            <Text
              style={[styles.emptyText, { color: isDark ? '#8e8e8e' : '#666' }]}>
              {searchQuery
                ? 'No team tasks found matching your search'
                : 'No team tasks available. Create one to collaborate!'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            renderItem={renderTaskItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.taskList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#1a9cd8']}
                tintColor={isDark ? 'white' : '#1a9cd8'}
                progressBackgroundColor={isDark ? '#2a2a2a' : '#f0f0f0'}
              />
            }
          />
        )}
      </View>

      {/* Duo Task Modal for creating/editing */}
      <DuoTaskModal
        modalVisible={modalVisible}
        isEditMode={isEditMode}
        isDark={isDark}
        task={newTask}
        onClose={closeModal}
        onSave={isEditMode ? updateDuoTask : createDuoTask}
        onChangeTask={setNewTask}
        getPriorityColor={getPriorityColor}
      />

      {/* Duo Task Details Modal */}
      {selectedTask && (
        <DuoTaskDetailsModal
          modalVisible={detailsModalVisible}
          isDark={isDark}
          task={selectedTask}
          onClose={() => setDetailsModalVisible(false)}
          onDeleteTask={deleteTask}
          onEditTask={handleEditTask}
          onTaskUpdated={updatedTask => {
            // Update the selected task with the latest data
            setSelectedTask(updatedTask);

            // If we have a real-time listener, it will automatically update the task list
            // But for redundancy, also trigger a manual refresh in case listeners aren't working
            fetchTasks();
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default DuoTasks;
