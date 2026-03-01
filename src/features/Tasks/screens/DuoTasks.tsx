import React, { useCallback } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Task } from 'shared/types/taskTypes';
import { styles } from 'tasks/styles/Tasks.styles';
import DuoTaskModal from 'tasks/components/DuoTaskModal';
import DuoTaskDetailsModal from 'tasks/components/DuoTaskDetailsModal';
import DuoTaskItem from 'tasks/components/DuoTaskItem';
import InvitationItem from 'tasks/components/InvitationItem';
import FilterBar from 'tasks/components/FilterBar';
import { getAuth } from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDuoTasks } from '../hooks/useDuoTasks';
import { FilterOption } from '../types';

const DUO_FILTERS: FilterOption[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
];

const keyExtractor = (item: Task) => item.id;
const InvitationSeparator = () => <View style={styles.invitationSeparator} />;

const DuoTasks = () => {
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const currentUserId = getAuth().currentUser?.uid ?? '';

  const {
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
    setDetailsModalVisible,
    setSelectedTask,
    setNewTask,
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
    setModalVisible,
  } = useDuoTasks();

  const iconColor = isDark ? 'white' : 'black';
  const metaIconColor = isDark ? '#8e8e8e' : '#666';
  const indicatorColor = isDark ? '#fff' : '#000';
  const emptyIconColor = isDark ? '#404040' : '#ccc';

  const renderInvitationItem = useCallback(
    ({ item }: { item: Task }) => (
      <InvitationItem
        item={item}
        isDark={isDark}
        currentUserId={currentUserId}
        onAccept={acceptInvitation}
        onDecline={declineInvitation}
      />
    ),
    [isDark, currentUserId, acceptInvitation, declineInvitation],
  );

  const renderTaskItem = useCallback(
    ({ item }: { item: Task }) => (
      <DuoTaskItem
        item={item}
        isDark={isDark}
        currentUserId={currentUserId}
        onPress={openTaskDetails}
        onEdit={handleEditTask}
        onDelete={deleteTask}
        getPriorityColor={getPriorityColor}
        getStatusColor={getStatusColor}
        getCollaboratorText={getCollaboratorText}
      />
    ),
    [
      isDark,
      currentUserId,
      openTaskDetails,
      handleEditTask,
      deleteTask,
      getPriorityColor,
      getStatusColor,
      getCollaboratorText,
    ],
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
          Team Tasks
        </Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {/* Action button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.addTaskButton}
            onPress={() => {
              resetForm();
              setModalVisible(true);
            }}>
            <MaterialIcons name="add-circle" size={24} color="#1a9cd8" />
            <Text style={styles.addTaskButtonText}>Create Team Task</Text>
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
            placeholder="Search team tasks..."
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
          filters={DUO_FILTERS}
          selectedFilter={selectedFilter}
          isDark={isDark}
          onSelectFilter={handleSelectFilter}
        />

        {/* Invitations */}
        {invitations.length > 0 && (
          <View style={styles.invitationsWrapper}>
            <Text
              style={[
                styles.invitationsTitle,
                isDark ? styles.invitationsTitleDark : styles.invitationsTitleLight,
              ]}>
              Invitations
            </Text>
            <LegendList
              data={invitations}
              renderItem={renderInvitationItem}
              keyExtractor={keyExtractor}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.invitationsListContent}
              ItemSeparatorComponent={InvitationSeparator}
              estimatedItemSize={200}
              recycleItems
            />
          </View>
        )}

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={indicatorColor} />
            <Text style={[styles.loadingText, isDark ? styles.textDark : styles.textLight]}>
              Loading team tasks...
            </Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="people" size={50} color={emptyIconColor} />
            <Text
              style={[styles.emptyText, isDark ? styles.metaTextDark : styles.metaTextLight]}>
              {searchQuery
                ? 'No team tasks found matching your search'
                : 'No team tasks available. Create a new team task to get started!'}
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
              />
            }
          />
        )}
      </View>

      {/* Create / Edit modal */}
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

      {/* Details modal */}
      {selectedTask && (
        <DuoTaskDetailsModal
          modalVisible={detailsModalVisible}
          isDark={isDark}
          task={selectedTask}
          onClose={() => setDetailsModalVisible(false)}
          onDeleteTask={deleteTask}
          onEditTask={handleEditTask}
          onTaskUpdated={updatedTask => {
            setSelectedTask(updatedTask);
            fetchTasks();
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default DuoTasks;
