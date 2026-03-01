import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Task, SubTask } from 'shared/types/taskTypes';
import { styles, duoTaskDetailsStyles } from 'tasks/styles/Tasks.styles';
import { TaskService } from 'shared/services/TaskService';
import { getAuth } from '@react-native-firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  Timestamp,
} from '@react-native-firebase/firestore';

import { DuoTaskDetailsModalProps } from '../types';

const DuoTaskDetailsModal: React.FC<DuoTaskDetailsModalProps> = ({
  modalVisible,
  isDark,
  task,
  onClose,
  onDeleteTask,
  onEditTask,
  onTaskUpdated,
}) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'subtasks'
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const taskService = new TaskService();
  const loadCollaboratorDetails = useCallback(async () => {
    if (!task?.collaborators) {
      return undefined;
    }

    try {
      const collaboratorDetails = [];

      for (const userId of task.collaborators) {
        const userDoc = await getDoc(doc(getFirestore(), 'users', userId));
        if (userDoc.exists()) {
          collaboratorDetails.push({
            id: userId,
            ...userDoc.data(),
            isCurrentUser: userId === getAuth().currentUser?.uid,
          });
        }
      }

      setCollaborators(collaboratorDetails);
    } catch (error) {
      console.error('Error loading collaborator details:', error);
    }
  }, [task.collaborators]);

  // Load collaborator details when modal opens
  useEffect(() => {
    if (modalVisible && task) {
      loadCollaboratorDetails();
    }
  }, []);

  const handleAddSubtask = async () => {
    if (!task || !newSubtaskTitle.trim()) return;

    try {
      const newSubtask: Omit<SubTask, 'id' | 'createdAt' | 'updatedAt'> = {
        title: newSubtaskTitle,
        completed: false,
        assignedTo: getAuth().currentUser?.uid,
      };

      await taskService.addDuoTaskSubtask(task.id, newSubtask);

      const updatedTask = await taskService.getTaskById(task.id);

      if (updatedTask && onTaskUpdated) {
        onTaskUpdated(updatedTask);
      }

      setNewSubtaskTitle('');
    } catch (error) {
      console.error('Error adding subtask:', error);
      Alert.alert('Error', 'Failed to add subtask. Please try again.');
    }
  };

  const toggleSubtaskCompletion = async (
    subtaskId: string,
    completed: boolean,
  ) => {
    if (!task) return;

    try {
      await taskService.updateDuoTaskSubtask(task.id, subtaskId, {
        completed: !completed,
        completedBy: !completed ? getAuth().currentUser?.uid : undefined,
        completedAt: !completed ? Timestamp.now() : undefined,
      });

      const updatedTask = await taskService.getTaskById(task.id);

      if (updatedTask && onTaskUpdated) {
        onTaskUpdated(updatedTask);
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
      Alert.alert('Error', 'Failed to update subtask. Please try again.');
    }
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

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            isDark ? duoTaskDetailsStyles.modalContentDark : duoTaskDetailsStyles.modalContentLight,
          ]}>
          <View style={styles.modalHeader}>
            <Text
              style={[styles.modalTitle, isDark ? styles.textDark : styles.textLight]}>
              {task?.title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={duoTaskDetailsStyles.progressWrapper}>
            <View style={duoTaskDetailsStyles.progressRow}>
              <Text style={isDark ? duoTaskDetailsStyles.progressLabelDark : duoTaskDetailsStyles.progressLabelLight}>
                Progress: {task?.progress || 0}%
              </Text>

              <View
                style={[
                  duoTaskDetailsStyles.statusBadge,
                  task?.completed
                    ? duoTaskDetailsStyles.statusBadgeCompleted
                    : task?.collaborationStatus === 'active'
                      ? duoTaskDetailsStyles.statusBadgeActive
                      : duoTaskDetailsStyles.statusBadgePending,
                ]}>
                <Text style={duoTaskDetailsStyles.statusBadgeText}>
                  {task?.completed ? 'Completed' : task?.collaborationStatus}
                </Text>
              </View>
            </View>

            <View
              style={[
                duoTaskDetailsStyles.progressTrack,
                isDark ? duoTaskDetailsStyles.progressTrackDark : duoTaskDetailsStyles.progressTrackLight,
              ]}>
              <View
                style={[
                  duoTaskDetailsStyles.progressFill,
                  { width: `${task?.progress || 0}%` },
                  task?.completed ? duoTaskDetailsStyles.progressFillCompleted : duoTaskDetailsStyles.progressFillActive,
                ]}
              />
            </View>
          </View>

          {/* Tabs */}
          <View
            style={[
              duoTaskDetailsStyles.tabsContainer,
              isDark ? duoTaskDetailsStyles.tabsContainerDark : duoTaskDetailsStyles.tabsContainerLight,
            ]}>
            <TouchableOpacity
              style={[
                duoTaskDetailsStyles.tab,
                activeTab === 'details' ? duoTaskDetailsStyles.tabActive : duoTaskDetailsStyles.tabInactive,
              ]}
              onPress={() => setActiveTab('details')}>
              <Text style={isDark ? duoTaskDetailsStyles.tabTextDark : duoTaskDetailsStyles.tabTextLight}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                duoTaskDetailsStyles.tab,
                activeTab === 'subtasks' ? duoTaskDetailsStyles.tabActive : duoTaskDetailsStyles.tabInactive,
              ]}
              onPress={() => setActiveTab('subtasks')}>
              <Text style={isDark ? duoTaskDetailsStyles.tabTextDark : duoTaskDetailsStyles.tabTextLight}>Subtasks</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Details Tab */}
            {activeTab === 'details' && (
              <View className="pb-10">
                <View style={duoTaskDetailsStyles.detailItem}>
                  <Text
                    style={isDark ? duoTaskDetailsStyles.detailLabelDark : duoTaskDetailsStyles.detailLabelLight}>
                    Description
                  </Text>
                  <Text
                    style={isDark ? duoTaskDetailsStyles.detailValueDark : duoTaskDetailsStyles.detailValueLight}>
                    {task?.description || 'No description'}
                  </Text>
                </View>

                <View style={duoTaskDetailsStyles.detailItem}>
                  <Text
                    style={isDark ? duoTaskDetailsStyles.detailLabelDark : duoTaskDetailsStyles.detailLabelLight}>
                    Due Date
                  </Text>
                  <Text
                    style={isDark ? duoTaskDetailsStyles.detailValueDark : duoTaskDetailsStyles.detailValueLight}>
                    {task?.dueDate} {task?.dueTime ? `at ${task.dueTime}` : ''}
                  </Text>
                </View>

                <View style={duoTaskDetailsStyles.detailItem}>
                  <Text
                    style={isDark ? duoTaskDetailsStyles.detailLabelDark : duoTaskDetailsStyles.detailLabelLight}>
                    Priority
                  </Text>
                  <View style={duoTaskDetailsStyles.priorityRow}>
                    <View
                      style={[
                        duoTaskDetailsStyles.priorityDot,
                        { backgroundColor: getPriorityColor(task?.priority || 'medium') },
                      ]}
                    />
                    <Text
                      style={isDark ? duoTaskDetailsStyles.detailValueDark : duoTaskDetailsStyles.detailValueLight}>
                      {task?.priority.charAt(0).toUpperCase() +
                        task?.priority.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={duoTaskDetailsStyles.detailItem}>
                  <Text
                    style={isDark ? duoTaskDetailsStyles.detailLabelDark : duoTaskDetailsStyles.detailLabelLight}>
                    Category
                  </Text>
                  <Text
                    style={isDark ? duoTaskDetailsStyles.detailValueDark : duoTaskDetailsStyles.detailValueLight}>
                    {task?.category || 'None'}
                  </Text>
                </View>

                <View style={duoTaskDetailsStyles.detailItem}>
                  <Text
                    style={[
                      isDark ? duoTaskDetailsStyles.detailLabelDark : duoTaskDetailsStyles.detailLabelLight,
                      duoTaskDetailsStyles.teamMemberLabel,
                    ]}>
                    Team Members
                  </Text>
                  {collaborators.map(collaborator => (
                    <View
                      key={collaborator.id}
                      style={[
                        duoTaskDetailsStyles.collaboratorCard,
                        isDark ? duoTaskDetailsStyles.collaboratorCardDark : duoTaskDetailsStyles.collaboratorCardLight,
                      ]}>
                      <View style={duoTaskDetailsStyles.avatar}>
                        <Text style={duoTaskDetailsStyles.avatarText}>
                          {(
                            collaborator.displayName ||
                            collaborator.email ||
                            '?'
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      </View>
                      <View style={duoTaskDetailsStyles.collaboratorInfo}>
                        <Text style={isDark ? duoTaskDetailsStyles.collaboratorNameDark : duoTaskDetailsStyles.collaboratorNameLight}>
                          {collaborator.displayName ||
                            collaborator.email ||
                            'Unknown user'}
                          {collaborator.isCurrentUser ? ' (You)' : ''}
                        </Text>
                        <Text
                          style={isDark ? duoTaskDetailsStyles.collaboratorEmailDark : duoTaskDetailsStyles.collaboratorEmailLight}>
                          {collaborator.email}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Only show Edit/Delete buttons if the current user is the task creator */}
                {task && task.userId === getAuth().currentUser?.uid && (
                  <View style={duoTaskDetailsStyles.actionRow}>
                    <TouchableOpacity
                      style={duoTaskDetailsStyles.deleteButton}
                      onPress={() => {
                        onClose();
                        onDeleteTask(task.id);
                      }}>
                      <Text style={duoTaskDetailsStyles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={duoTaskDetailsStyles.editButton}
                      onPress={() => {
                        onClose();
                        onEditTask(task);
                      }}>
                      <Text style={duoTaskDetailsStyles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Subtasks Tab */}
            {activeTab === 'subtasks' && (
              <View>
                <View style={styles.inputGroup}>
                  <Text
                    style={isDark ? duoTaskDetailsStyles.detailLabelDark : duoTaskDetailsStyles.detailLabelLight}>
                    Add New Subtask
                  </Text>
                  <View style={duoTaskDetailsStyles.addSubtaskRow}>
                    <TextInput
                      style={[
                        styles.input,
                        isDark ? styles.inputDark : styles.inputLight,
                        duoTaskDetailsStyles.addSubtaskInput,
                      ]}
                      placeholder="New subtask"
                      placeholderTextColor={isDark ? '#8e8e8e' : '#999'}
                      value={newSubtaskTitle}
                      onChangeText={setNewSubtaskTitle}
                    />
                    <TouchableOpacity
                      style={duoTaskDetailsStyles.addSubtaskButton}
                      onPress={handleAddSubtask}>
                      <Text style={duoTaskDetailsStyles.addSubtaskButtonText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text
                  style={[
                    isDark ? duoTaskDetailsStyles.detailLabelDark : duoTaskDetailsStyles.detailLabelLight,
                    duoTaskDetailsStyles.subtaskCountLabel,
                  ]}>
                  Subtasks ({task?.subtasks?.length || 0})
                </Text>

                {!task?.subtasks || task.subtasks.length === 0 ? (
                  <Text
                    style={[
                      isDark ? styles.metaTextDark : styles.metaTextLight,
                      duoTaskDetailsStyles.emptySubtasksText,
                    ]}>
                    No subtasks yet. Add some to track progress!
                  </Text>
                ) : (
                  task.subtasks.map(subtask => (
                    <View
                      key={subtask.id}
                      style={[
                        duoTaskDetailsStyles.subtaskRow,
                        isDark ? duoTaskDetailsStyles.subtaskRowDark : duoTaskDetailsStyles.subtaskRowLight,
                      ]}>
                      <TouchableOpacity
                        style={[
                          duoTaskDetailsStyles.subtaskCheckbox,
                          isDark ? duoTaskDetailsStyles.subtaskCheckboxDark : duoTaskDetailsStyles.subtaskCheckboxLight,
                          subtask.completed ? duoTaskDetailsStyles.subtaskCheckboxActive : duoTaskDetailsStyles.subtaskCheckboxInactive,
                        ]}
                        onPress={() =>
                          toggleSubtaskCompletion(subtask.id, subtask.completed)
                        }>
                        {subtask.completed && (
                          <Icon name="checkmark" size={16} color="white" />
                        )}
                      </TouchableOpacity>

                      <View style={duoTaskDetailsStyles.subtaskContent}>
                        <Text
                          style={[
                            isDark ? duoTaskDetailsStyles.subtaskTitleDark : duoTaskDetailsStyles.subtaskTitleLight,
                            subtask.completed && duoTaskDetailsStyles.subtaskTitleCompleted,
                          ]}>
                          {subtask.title}
                        </Text>
                        {subtask.description && (
                          <Text
                            style={[
                              isDark ? duoTaskDetailsStyles.subtaskDescDark : duoTaskDetailsStyles.subtaskDescLight,
                              subtask.completed && duoTaskDetailsStyles.subtaskDescCompleted,
                            ]}>
                            {subtask.description}
                          </Text>
                        )}

                        {subtask.assignedTo && (
                          <Text
                            style={isDark ? duoTaskDetailsStyles.assignedTextDark : duoTaskDetailsStyles.assignedTextLight}>
                            Assigned to:{' '}
                            {subtask.assignedTo === getAuth().currentUser?.uid
                              ? 'You'
                              : 'Team Member'}
                          </Text>
                        )}

                        {subtask.completedBy && (
                          <Text style={duoTaskDetailsStyles.completedByText}>
                            Completed by:{' '}
                            {subtask.completedBy === getAuth().currentUser?.uid
                              ? 'You'
                              : 'Team Member'}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default DuoTaskDetailsModal;
