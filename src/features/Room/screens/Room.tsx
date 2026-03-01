import React, { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import { userState } from 'shared/types/userType';
import { styles } from 'room/styles/Room';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCREEN_SIZE_BREAKPOINT } from '../constants/common';
import { useRoomForm, useTaskSelection, useRoomNavigation } from '../hooks';
import { TabSelector } from '../components/TabSelector';
import { CreateRoomForm } from '../components/CreateRoomForm';
import { JoinRoomForm } from '../components/JoinRoomForm';
import { TaskSelectionModal } from '../components/TaskSelectionModal';

/**
 * Main Room screen component
 * Orchestrates room creation and joining functionality
 */
const Room = () => {
  const userTheme = useTypedSelector(state => state.user) as userState;
  const isDark = userTheme.theme === 'dark';
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const { width } = useWindowDimensions();
  const isSmallScreen = width < SCREEN_SIZE_BREAKPOINT;

  // Room form management
  const {
    meetingRoom,
    updateMeetingRoom,
    setMeetingRoom,
    roomCode,
    setRoomCode,
    loading,
    setLoading,
    handleCreateRoom,
    handleJoinRoom,
  } = useRoomForm();

  // Task selection management
  const {
    tasks,
    isTasksLoading,
    showTaskModal,
    selectedTask,
    fetchTasks,
    handleTaskSelect,
    handleShowTaskModal,
    handleClearTask,
    handleCloseTaskModal,
  } = useTaskSelection();

  // Handle navigation from external sources (LexAI, deep links)
  useRoomNavigation(setActiveTab, setRoomCode, setLoading, (task) => {
    handleTaskSelect(task);
    setMeetingRoom(prev => ({ ...prev, taskId: task.id }));
  });

  // Handle navigation from external sources (LexAI, deep links)
  useRoomNavigation(setActiveTab, setRoomCode, setLoading, (task) => {
    handleTaskSelect(task);
    setMeetingRoom(prev => ({ ...prev, taskId: task.id }));
  });

  // Handle task clear with taskId update
  const handleClearTaskWithId = () => {
    handleClearTask();
    setMeetingRoom(prev => ({ ...prev, taskId: '' }));
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screenContainer, isDark && styles.screenContainerDark]}>
      <KeyboardAvoidingView
        style={[
          styles.container,
          isDark && styles.darkContainer,
          { marginBottom: insets.bottom, marginTop: insets.top },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isSmallScreen && styles.scrollContentSmall,
          ]}>
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                isDark && styles.darkText,
                isSmallScreen && styles.smallTitle,
              ]}>
              Video Meeting
            </Text>
          </View>

          <TabSelector
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isDark={isDark}
            isSmallScreen={isSmallScreen}
          />

          {activeTab === 'create' ? (
            <CreateRoomForm
              meetingRoom={meetingRoom}
              onMeetingRoomChange={updateMeetingRoom}
              selectedTask={selectedTask}
              onShowTaskModal={handleShowTaskModal}
              onClearTask={handleClearTaskWithId}
              onCreateRoom={handleCreateRoom}
              loading={loading}
              isDark={isDark}
            />
          ) : (
            <JoinRoomForm
              roomCode={roomCode}
              onRoomCodeChange={setRoomCode}
              onJoinRoom={handleJoinRoom}
              loading={loading}
              isDark={isDark}
            />
          )}

          <TaskSelectionModal
            visible={showTaskModal}
            tasks={tasks}
            isLoading={isTasksLoading}
            selectedTask={selectedTask}
            onTaskSelect={(task) => {
              handleTaskSelect(task);
              setMeetingRoom(prev => ({ ...prev, taskId: task.id }));
            }}
            onRefresh={fetchTasks}
            onClose={handleCloseTaskModal}
            isDark={isDark}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Room;
