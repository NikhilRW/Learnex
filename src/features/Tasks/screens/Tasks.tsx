import React, { useCallback, useMemo } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  StatusBar,
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
import { styles } from 'tasks/styles/Tasks.styles';
import TaskModal from 'tasks/components/TaskModal';
import TaskItem from 'tasks/components/TaskItem';
import FilterBar from 'tasks/components/FilterBar';
import { SvgXml } from 'react-native-svg';
import { AIGeneratedSVGXML } from 'shared/constants/svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTasks } from '../hooks/useTasks';
import { FilterOption } from '../types';

const STATIC_FILTERS: FilterOption[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
];

const keyExtractor = (item: Task) => item.id;

// TODO: make sure when user goes from the single task to duo task when user come back from duo task user should be pushed back to single task not direct home page
// TODO: add new AI API for the new AI task generation.
const Tasks = () => {
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  const {
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
    setModalVisible,
    setNewTask,
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
  } = useTasks();

  const iconColor = isDark ? 'white' : 'black';
  const metaIconColor = isDark ? '#8e8e8e' : '#666';
  const indicatorColor = isDark ? '#fff' : '#000';
  const emptyIconColor = isDark ? '#404040' : '#ccc';

  const allFilters = useMemo<FilterOption[]>(
    () => [...STATIC_FILTERS, ...categories.map(c => ({ key: c, label: c }))],
    [categories],
  );

  const renderTaskItem = useCallback(
    ({ item }: { item: Task }) => (
      <TaskItem
        item={item}
        isDark={isDark}
        onToggle={toggleTaskCompletion}
        onEdit={handleEditTask}
        onDelete={deleteTask}
        getPriorityColor={getPriorityColor}
      />
    ),
    [isDark, toggleTaskCompletion, handleEditTask, deleteTask, getPriorityColor],
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
      ]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#1a1a1a' : '#f5f5f5'}
      />

      {/* Header */}
      <View
        style={[
          styles.customHeader,
          isDark ? styles.containerDark : styles.containerLight,
        ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark ? styles.textDark : styles.textLight]}>
          Tasks
        </Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {/* Action buttons */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.addTaskButton}
            onPress={() => {
              resetForm();
              setModalVisible(true);
            }}>
            <MaterialIcons name="add-circle" size={24} color="#1a9cd8" />
            <Text style={styles.addTaskButtonText}>Add Task</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addTaskButton, styles.teamTasksButton]}
            onPress={() => navigation.navigate('DuoTasks')}>
            <MaterialIcons name="people" size={24} color="#1a9cd8" />
            <Text style={styles.addTaskButtonText}>Team Tasks</Text>
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View
          style={[
            styles.searchContainer,
            isDark ? styles.searchContainerDark : styles.searchContainerLight,
          ]}>
          <Icon name="search" size={20} color={metaIconColor} />
          <TextInput
            style={[styles.searchInput, isDark ? styles.textDark : styles.textLight]}
            placeholder="Search tasks..."
            placeholderTextColor={isDark ? '#8e8e8e' : '#999'}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Icon name="close-circle" size={20} color={metaIconColor} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter chips */}
        <FilterBar
          filters={allFilters}
          selectedFilter={selectedFilter}
          isDark={isDark}
          onSelectFilter={handleSelectFilter}
        />

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={indicatorColor} />
            <Text style={[styles.loadingText, isDark ? styles.textDark : styles.textLight]}>
              Loading tasks...
            </Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="tasks" size={50} color={emptyIconColor} />
            <Text
              style={[styles.emptyText, isDark ? styles.metaTextDark : styles.metaTextLight]}>
              {searchQuery
                ? 'No tasks found matching your search'
                : 'No tasks available. Add a new task to get started!'}
            </Text>
          </View>
        ) : (
          <LegendList
            data={filteredTasks}
            renderItem={renderTaskItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.taskList}
            showsVerticalScrollIndicator={false}
            estimatedItemSize={150}
            recycleItems
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

      {/* AI generation overlay */}
      {isAIGeneratingTask && (
        <View
          className="w-screen absolute justify-center items-center h-screen"
          style={[styles.aiOverlay, isDark ? styles.aiOverlayDark : styles.aiOverlayLight]}>
          <ActivityIndicator size={50} color={'#1a9cd8'} />
        </View>
      )}

      {/* AI suggestion FAB */}
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

