import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { styles } from 'tasks/styles/Tasks.styles';
import { TaskModalProps } from '../types';

const TaskModal = ({
  modalVisible,
  isEditMode,
  isDark,
  newTask,
  onClose,
  onUpdateTask,
  onChangeTask,
  getPriorityColor,
}: TaskModalProps) => {
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
            isDark ? styles.modalContentBgDark : styles.modalContentBgLight,
          ]}>
          <View style={styles.modalHeader}>
            <Text
              style={[styles.modalTitle, isDark ? styles.textDark : styles.textLight]}>
              {isEditMode ? 'Edit Task' : 'Add New Task'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  isDark ? styles.textDark : styles.textLight,
                ]}>
                Title *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isDark ? styles.inputFieldDark : styles.inputFieldLight,
                ]}
                placeholder="Task title"
                placeholderTextColor={isDark ? '#8e8e8e' : '#999'}
                value={newTask.title}
                onChangeText={text => onChangeTask({ ...newTask, title: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  isDark ? styles.textDark : styles.textLight,
                ]}>
                Description
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  isDark ? styles.inputFieldDark : styles.inputFieldLight,
                ]}
                placeholder="Task description"
                placeholderTextColor={isDark ? '#8e8e8e' : '#999'}
                value={newTask.description}
                onChangeText={text =>
                  onChangeTask({ ...newTask, description: text })
                }
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  isDark ? styles.textDark : styles.textLight,
                ]}>
                Due Date
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isDark ? styles.inputFieldDark : styles.inputFieldLight,
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={isDark ? '#8e8e8e' : '#999'}
                value={newTask.dueDate}
                onChangeText={text => onChangeTask({ ...newTask, dueDate: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  isDark ? styles.textDark : styles.textLight,
                ]}>
                Due Time
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isDark ? styles.inputFieldDark : styles.inputFieldLight,
                ]}
                placeholder="HH:MM (24-hour format)"
                placeholderTextColor={isDark ? '#8e8e8e' : '#999'}
                value={newTask.dueTime}
                onChangeText={text => onChangeTask({ ...newTask, dueTime: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  isDark ? styles.textDark : styles.textLight,
                ]}>
                Category
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isDark ? styles.inputFieldDark : styles.inputFieldLight,
                ]}
                placeholder="e.g. Work, Personal, Health"
                placeholderTextColor={isDark ? '#8e8e8e' : '#999'}
                value={newTask.category}
                onChangeText={text =>
                  onChangeTask({ ...newTask, category: text })
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  isDark ? styles.textDark : styles.textLight,
                ]}>
                Priority
              </Text>
              <View style={styles.prioritySelector}>
                {['low', 'medium', 'high'].map(priority => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityOption,
                      isDark ? styles.borderColorDark : styles.borderColorLight,
                      newTask.priority === priority
                        ? { backgroundColor: getPriorityColor(priority) }
                        : isDark
                          ? styles.unselectedBgDark
                          : styles.unselectedBgLight,
                    ]}
                    onPress={() =>
                      onChangeTask({
                        ...newTask,
                        priority: priority as 'low' | 'medium' | 'high',
                      })
                    }>
                    <Text
                      style={[
                        styles.priorityText,
                        newTask.priority === priority || isDark
                          ? styles.selectedTextWhite
                          : styles.textLight,
                      ]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <View style={styles.notifyContainer}>
                <Text
                  style={[
                    styles.inputLabel,
                    isDark ? styles.textDark : styles.textLight,
                  ]}>
                  Send Notification
                </Text>
                <Switch
                  testID="notification-switch"
                  trackColor={{
                    false: isDark ? '#555' : '#ccc',
                    true: '#34C759',
                  }}
                  thumbColor={
                    newTask.notify ? '#fff' : isDark ? '#888' : '#f4f3f4'
                  }
                  ios_backgroundColor={isDark ? '#555' : '#ccc'}
                  onValueChange={value =>
                    onChangeTask({ ...newTask, notify: value })
                  }
                  value={newTask.notify}

                />
              </View>
              {newTask.notify && (
                <Text
                  style={[
                    styles.notifyHint,
                    isDark ? styles.hintTextDark : styles.hintTextLight,
                  ]}>
                  You will receive a notification at the scheduled time
                </Text>
              )}
            </View>

            {isEditMode && (
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.inputLabel,
                    isDark ? styles.textDark : styles.textLight,
                  ]}>
                  Status
                </Text>
                <View style={styles.statusSelector}>
                  <TouchableOpacity
                    style={[
                      styles.statusOption,
                      isDark ? styles.borderColorDark : styles.borderColorLight,
                      !newTask.completed
                        ? styles.statusPendingBg
                        : isDark
                          ? styles.unselectedBgDark
                          : styles.unselectedBgLight,
                    ]}
                    onPress={() =>
                      onChangeTask({ ...newTask, completed: false })
                    }>
                    <Text
                      style={[
                        styles.statusText,
                        !newTask.completed || isDark
                          ? styles.selectedTextWhite
                          : styles.textLight,
                      ]}>
                      Pending
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusOption,
                      isDark ? styles.borderColorDark : styles.borderColorLight,
                      newTask.completed
                        ? styles.statusCompletedBg
                        : isDark
                          ? styles.unselectedBgDark
                          : styles.unselectedBgLight,
                    ]}
                    onPress={() => onChangeTask({ ...newTask, completed: true })}>
                    <Text
                      style={[
                        styles.statusText,
                        newTask.completed || isDark
                          ? styles.selectedTextWhite
                          : styles.textLight,
                      ]}>
                      Completed
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.addButton]}
              onPress={onUpdateTask}>
              <Text style={styles.addButtonText}>
                {isEditMode ? 'Update Task' : 'Add Task'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(TaskModal);
