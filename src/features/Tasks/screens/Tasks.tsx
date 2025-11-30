import React, { useState, useEffect, useCallback, useMemo, startTransition } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Task } from 'shared/types/taskTypes';
import { TaskService } from 'shared/services/TaskService';
import { styles } from 'tasks/styles/Tasks.styles';
import TaskModal from 'tasks/components/TaskModal';
import { SvgXml } from 'react-native-svg';
import { AIGeneratedSVGXML } from 'shared/constants/svg';
import { getAuth } from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';

const Tasks = () => {
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const taskService = useMemo(() => new TaskService(), []);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isAIGeneratingTask, setIsAIGeneratingTask] = useState<boolean>(false);

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
    isDuoTask: false,
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
      isDuoTask: false,
    });
  };

  const fetchTasks = useCallback(
    async (filter = 'all') => {
      try {
        setIsLoading(true);
        // Get all tasks first
        const allTasks = await taskService.getTasks();

        console.log(
          'Tasks :: fetchTasks() :: All tasks count:',
          allTasks.length,
        );
        // Add debug log to show tasks and their isDuoTask status
        console.log('Tasks :: fetchTasks() :: Task details:');
        allTasks.forEach(task => {
          console.log(
            `Task: ${task.title}, isDuoTask: ${task.isDuoTask}, ID: ${task.id}`,
          );
        });

        // Extract unique categories for filter chips
        const uniqueCategories = [
          ...new Set(allTasks.map(task => task.category)),
        ].filter(Boolean);
        setCategories(uniqueCategories);

        // Then filter them client-side based on the filter
        let fetchedTasks;
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
            // Filter by category if it's not one of the predefined filters
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

  // Filter tasks based on search query only (category filtering is now handled by Firestore)
  useEffect(() => {
    let result = tasks;

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
  }, [searchQuery, tasks]);

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks(selectedFilter);
  }, [fetchTasks, selectedFilter]); // Re-fetch when filter changes

  const handleSearch = (text: string) => {
    startTransition(() => {
      setSearchQuery(text);
    });
  };

  const toggleTaskCompletion = async (id: string) => {
    try {
      await taskService.toggleTaskCompletion(id);
      // Refresh tasks with current filter
      await fetchTasks(selectedFilter);
    } catch (error) {
      console.error('Error toggling task completion:', error);
      Alert.alert('Error', 'Failed to update task status. Please try again.');
    }
  };

  const handleEditTask = (task: Task) => {
    setIsEditMode(true);
    setCurrentTaskId(task.id);
    const { ...editableFields } = task;
    setNewTask(editableFields);
    setModalVisible(true);
  };

  const updateTask = async () => {
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
          await taskService.addTask({
            userId,
            ...newTask,
            isDuoTask: false, // Explicitly mark as a regular task
          });
          Alert.alert('Success', 'Task added successfully');
        } else {
          Alert.alert('Some Error Occured Please Try Again');
        }
      }

      closeModal();
      await fetchTasks(selectedFilter);
    } catch (error) {
      let err = error as Error;
      console.error('Error updating task:', err);
      // Show more specific error message if available
      const errorMessage =
        err.message || 'Failed to save task. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setIsEditMode(false);
    setCurrentTaskId(null);
    resetForm();
  };

  const getAITaskSuggestion = async () => {
    if (isAIGeneratingTask) {
      return;
    }
    setIsAIGeneratingTask(true);
    const newAITask = await taskService.getTaskSuggestion();
    const newTaskTitleAndDescription = newAITask.split('|');
    setNewTask(prev => ({
      ...prev,
      title: newTaskTitleAndDescription[0],
      description: newTaskTitleAndDescription[1],
    }));
    setIsAIGeneratingTask(false);
    setModalVisible(true);
  };

  const deleteTask = async (id: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await taskService.deleteTask(id);
            // Refresh tasks with current filter
            await fetchTasks(selectedFilter);
          } catch (error) {
            console.error('Error deleting task:', error);
            Alert.alert('Error', 'Failed to delete task. Please try again.');
          }
        },
        style: 'destructive',
      },
    ]);
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

  const renderTaskItem = ({ item }: { item: Task }) => (
    <View
      style={[
        styles.taskCard,
        { backgroundColor: isDark ? '#2a2a2a' : 'white' },
      ]}>
      <TouchableOpacity
        style={styles.taskCheckbox}
        onPress={() => toggleTaskCompletion(item.id)}>
        <View
          style={[
            styles.checkbox,
            item.completed && {
              backgroundColor: '#1a9cd8',
              borderColor: '#1a9cd8',
            },
          ]}>
          {item.completed && <Icon name="checkmark" size={16} color="white" />}
        </View>
      </TouchableOpacity>

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
        </View>

        <Text
          style={[
            styles.taskDescription,
            { color: isDark ? '#e0e0e0' : '#333' },
            item.completed && styles.completedTaskText,
          ]}>
          {item.description}
        </Text>

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
              {item.dueDate} {item.dueTime && `at ${item.dueTime}`}
            </Text>
          </View>

          <View style={styles.taskCategory}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Add onRefresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Clear any existing searches or filters to get fresh data
      setSearchQuery('');
      await fetchTasks(selectedFilter);
      console.log('Tasks refreshed successfully');
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      Alert.alert(
        'Refresh Error',
        'Failed to refresh tasks. Please try again.',
      );
    } finally {
      setRefreshing(false);
    }
  }, [selectedFilter]);

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
          Tasks
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
            <Text style={styles.addTaskButtonText}>Add Task</Text>
          </TouchableOpacity>

          {/* Add a button to navigate to Team Tasks */}
          <TouchableOpacity
            style={[styles.addTaskButton, { marginLeft: 10 }]}
            onPress={() => navigation.navigate('DuoTasks')}>
            <MaterialIcons name="people" size={24} color="#1a9cd8" />
            <Text style={styles.addTaskButtonText}>Team Tasks</Text>
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
            placeholder="Search tasks..."
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
          {/* Standard filters */}
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
            onPress={() => startTransition(() => setSelectedFilter('all'))}>

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
            onPress={() => startTransition(() => setSelectedFilter('pending'))}>

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
            onPress={() => startTransition(() => setSelectedFilter('completed'))}>

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

          {/* Dynamic category filters */}
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                selectedFilter === category && styles.activeFilterButton,
                {
                  backgroundColor:
                    selectedFilter === category
                      ? '#1a9cd8'
                      : isDark
                        ? '#2a2a2a'
                        : 'white',
                  borderColor: isDark ? '#404040' : '#e0e0e0',
                },
              ]}
              onPress={() => startTransition(() => setSelectedFilter(category))}>
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      selectedFilter === category
                        ? 'white'
                        : isDark
                          ? 'white'
                          : 'black',
                  },
                ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
            <Text
              style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>
              Loading tasks...
            </Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome
              name="tasks"
              size={50}
              color={isDark ? '#404040' : '#ccc'}
            />
            <Text
              style={[styles.emptyText, { color: isDark ? '#8e8e8e' : '#666' }]}>
              {searchQuery
                ? 'No tasks found matching your search'
                : 'No tasks available. Add a new task to get started!'}
            </Text>
          </View>
        ) : (
          <LegendList
            data={filteredTasks}
            renderItem={renderTaskItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.taskList}
            showsVerticalScrollIndicator={false}
            estimatedItemSize={150}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#1a9cd8']}
                tintColor={isDark ? 'white' : '#1a9cd8'}
                progressBackgroundColor={isDark ? '#2a2a2a' : '#f0f0f0'}
                title="Refreshing Tasks..."
                titleColor={isDark ? 'white' : 'black'}
              />
            }
          />
        )}
      </View>
      <TaskModal
        modalVisible={modalVisible}
        isEditMode={isEditMode}
        isDark={isDark}
        newTask={newTask}
        onClose={closeModal}
        onUpdateTask={updateTask}
        onChangeTask={setNewTask}
        getPriorityColor={getPriorityColor}
      />
      {/* Floating AI Suggestion Button */}
      {isAIGeneratingTask && (
        <View
          className="w-screen absolute justify-center items-center h-screen"
          style={{
            zIndex: 500,
            backgroundColor: isDark ? '#00000060' : '#00000030',
          }}>
          <ActivityIndicator size={50} color={'#1a9cd8'} />
        </View>
      )}
      <Pressable
        onPress={getAITaskSuggestion}
        className="absolute bottom-4 right-4 bg-[#1A9CD81A] p-3 rounded-2xl">
        <SvgXml
          xml={AIGeneratedSVGXML[isDark ? 'dark' : 'light']}
          width={36}
          height={36}
        />
      </Pressable>
    </SafeAreaView>
  );
};

export default Tasks;
