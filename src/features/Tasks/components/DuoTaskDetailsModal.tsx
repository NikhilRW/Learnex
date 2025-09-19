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
import { styles } from 'tasks/styles/Tasks.styles';
import { TaskService } from 'shared/services/TaskService';
import { getAuth } from '@react-native-firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  Timestamp,
} from '@react-native-firebase/firestore';

interface DuoTaskDetailsModalProps {
  modalVisible: boolean;
  isDark: boolean;
  task: Task;
  onClose: () => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onTaskUpdated?: (updatedTask: Task) => void;
}

// Define additional styles for the modal details
const modalDetailStyles = {
  detailItem: {
    marginBottom: 15,
    paddingHorizontal: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    marginBottom: 5,
  },
};

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
            { backgroundColor: isDark ? '#1a1a1a' : 'white' },
          ]}>
          <View style={styles.modalHeader}>
            <Text
              style={[styles.modalTitle, { color: isDark ? 'white' : 'black' }]}>
              {task?.title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={{ marginHorizontal: 16, marginBottom: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 5,
              }}>
              <Text style={{ color: isDark ? '#8e8e8e' : '#666', fontSize: 12 }}>
                Progress: {task?.progress || 0}%
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                  backgroundColor: task?.completed
                    ? '#34C759'
                    : task?.collaborationStatus === 'active'
                      ? '#007AFF'
                      : '#FF9500',
                }}>
                <Text style={{ color: 'white', fontSize: 10 }}>
                  {task?.completed ? 'Completed' : task?.collaborationStatus}
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
                  width: `${task?.progress || 0}%`,
                  backgroundColor: task?.completed ? '#34C759' : '#1a9cd8',
                  borderRadius: 3,
                }}
              />
            </View>
          </View>

          {/* Tabs */}
          <View
            style={{
              flexDirection: 'row',
              borderBottomWidth: 1,
              borderColor: isDark ? '#404040' : '#e0e0e0',
              marginBottom: 10,
            }}>
            <TouchableOpacity
              style={{
                padding: 10,
                borderBottomWidth: 2,
                borderBottomColor:
                  activeTab === 'details' ? '#1a9cd8' : 'transparent',
              }}
              onPress={() => setActiveTab('details')}>
              <Text style={{ color: isDark ? 'white' : 'black' }}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                padding: 10,
                borderBottomWidth: 2,
                borderBottomColor:
                  activeTab === 'subtasks' ? '#1a9cd8' : 'transparent',
              }}
              onPress={() => setActiveTab('subtasks')}>
              <Text style={{ color: isDark ? 'white' : 'black' }}>Subtasks</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Details Tab */}
            {activeTab === 'details' && (
              <View className="pb-10">
                <View style={modalDetailStyles.detailItem}>
                  <Text
                    style={[
                      modalDetailStyles.detailLabel,
                      { color: isDark ? '#8e8e8e' : '#666' },
                    ]}>
                    Description
                  </Text>
                  <Text
                    style={[
                      modalDetailStyles.detailValue,
                      { color: isDark ? 'white' : 'black' },
                    ]}>
                    {task?.description || 'No description'}
                  </Text>
                </View>

                <View style={modalDetailStyles.detailItem}>
                  <Text
                    style={[
                      modalDetailStyles.detailLabel,
                      { color: isDark ? '#8e8e8e' : '#666' },
                    ]}>
                    Due Date
                  </Text>
                  <Text
                    style={[
                      modalDetailStyles.detailValue,
                      { color: isDark ? 'white' : 'black' },
                    ]}>
                    {task?.dueDate} {task?.dueTime ? `at ${task.dueTime}` : ''}
                  </Text>
                </View>

                <View style={modalDetailStyles.detailItem}>
                  <Text
                    style={[
                      modalDetailStyles.detailLabel,
                      { color: isDark ? '#8e8e8e' : '#666' },
                    ]}>
                    Priority
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: getPriorityColor(
                          task?.priority || 'medium',
                        ),
                        marginRight: 5,
                      }}
                    />
                    <Text
                      style={[
                        modalDetailStyles.detailValue,
                        { color: isDark ? 'white' : 'black' },
                      ]}>
                      {task?.priority.charAt(0).toUpperCase() +
                        task?.priority.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={modalDetailStyles.detailItem}>
                  <Text
                    style={[
                      modalDetailStyles.detailLabel,
                      { color: isDark ? '#8e8e8e' : '#666' },
                    ]}>
                    Category
                  </Text>
                  <Text
                    style={[
                      modalDetailStyles.detailValue,
                      { color: isDark ? 'white' : 'black' },
                    ]}>
                    {task?.category || 'None'}
                  </Text>
                </View>

                <View style={modalDetailStyles.detailItem}>
                  <Text
                    style={[
                      modalDetailStyles.detailLabel,
                      { color: isDark ? '#8e8e8e' : '#666', marginBottom: 5 },
                    ]}>
                    Team Members
                  </Text>
                  {collaborators.map(collaborator => (
                    <View
                      key={collaborator.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                        padding: 10,
                        borderRadius: 5,
                        marginBottom: 5,
                      }}>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: '#1a9cd8',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 10,
                        }}>
                        <Text style={{ color: 'white' }}>
                          {(
                            collaborator.displayName ||
                            collaborator.email ||
                            '?'
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: isDark ? 'white' : 'black' }}>
                          {collaborator.displayName ||
                            collaborator.email ||
                            'Unknown user'}
                          {collaborator.isCurrentUser ? ' (You)' : ''}
                        </Text>
                        <Text
                          style={{
                            color: isDark ? '#8e8e8e' : '#666',
                            fontSize: 12,
                          }}>
                          {collaborator.email}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Only show Edit/Delete buttons if the current user is the task creator */}
                {task && task.userId === getAuth().currentUser?.uid && (
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginTop: 20,
                    }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#FF3B30',
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: 5,
                        alignItems: 'center',
                        flex: 1,
                        marginRight: 5,
                      }}
                      onPress={() => {
                        onClose();
                        onDeleteTask(task.id);
                      }}>
                      <Text style={{ color: 'white' }}>Delete</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        backgroundColor: '#1a9cd8',
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: 5,
                        alignItems: 'center',
                        flex: 1,
                        marginLeft: 5,
                      }}
                      onPress={() => {
                        onClose();
                        onEditTask(task);
                      }}>
                      <Text style={{ color: 'white' }}>Edit</Text>
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
                    style={[
                      modalDetailStyles.detailLabel,
                      { color: isDark ? '#8e8e8e' : '#666' },
                    ]}>
                    Add New Subtask
                  </Text>
                  <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                          color: isDark ? 'white' : 'black',
                          borderColor: isDark ? '#404040' : '#e0e0e0',
                          flex: 1,
                          marginRight: 10,
                        },
                      ]}
                      placeholder="New subtask"
                      placeholderTextColor={isDark ? '#8e8e8e' : '#999'}
                      value={newSubtaskTitle}
                      onChangeText={setNewSubtaskTitle}
                    />
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#1a9cd8',
                        padding: 10,
                        borderRadius: 5,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                      onPress={handleAddSubtask}>
                      <Text style={{ color: 'white' }}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text
                  style={[
                    modalDetailStyles.detailLabel,
                    { color: isDark ? '#8e8e8e' : '#666', marginBottom: 10 },
                  ]}>
                  Subtasks ({task?.subtasks?.length || 0})
                </Text>

                {!task?.subtasks || task.subtasks.length === 0 ? (
                  <Text
                    style={{
                      color: isDark ? '#8e8e8e' : '#666',
                      textAlign: 'center',
                      padding: 20,
                    }}>
                    No subtasks yet. Add some to track progress!
                  </Text>
                ) : (
                  task.subtasks.map(subtask => (
                    <View
                      key={subtask.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 12,
                        borderBottomWidth: 1,
                        borderColor: isDark ? '#404040' : '#e0e0e0',
                      }}>
                      <TouchableOpacity
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: isDark ? '#8e8e8e' : '#666',
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: subtask.completed
                            ? '#1a9cd8'
                            : 'transparent',
                          marginRight: 10,
                        }}
                        onPress={() =>
                          toggleSubtaskCompletion(subtask.id, subtask.completed)
                        }>
                        {subtask.completed && (
                          <Icon name="checkmark" size={16} color="white" />
                        )}
                      </TouchableOpacity>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: isDark ? 'white' : 'black',
                            textDecorationLine: subtask.completed
                              ? 'line-through'
                              : 'none',
                            opacity: subtask.completed ? 0.7 : 1,
                          }}>
                          {subtask.title}
                        </Text>
                        {subtask.description && (
                          <Text
                            style={{
                              color: isDark ? '#8e8e8e' : '#666',
                              fontSize: 12,
                              textDecorationLine: subtask.completed
                                ? 'line-through'
                                : 'none',
                              opacity: subtask.completed ? 0.7 : 1,
                            }}>
                            {subtask.description}
                          </Text>
                        )}

                        {subtask.assignedTo && (
                          <Text
                            style={{
                              color: isDark ? '#8e8e8e' : '#666',
                              fontSize: 10,
                              marginTop: 2,
                            }}>
                            Assigned to:{' '}
                            {subtask.assignedTo === getAuth().currentUser?.uid
                              ? 'You'
                              : 'Team Member'}
                          </Text>
                        )}

                        {subtask.completedBy && (
                          <Text
                            style={{
                              color: '#34C759',
                              fontSize: 10,
                              marginTop: 2,
                            }}>
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
