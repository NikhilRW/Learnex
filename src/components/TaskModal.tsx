import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Task } from '../types/taskTypes';
import { styles } from '../styles/screens/userscreens/Tasks.styles';

interface TaskModalProps {
    modalVisible: boolean;
    isEditMode: boolean;
    isDark: boolean;
    newTask: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
    onClose: () => void;
    onUpdateTask: () => void;
    onChangeTask: (task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
    getPriorityColor: (priority: string) => string;
}

const TaskModal = ({
    modalVisible,
    isEditMode,
    isDark,
    newTask,
    onClose,
    onUpdateTask,
    onChangeTask,
    getPriorityColor
}: TaskModalProps) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[
                    styles.modalContent,
                    { backgroundColor: isDark ? '#1a1a1a' : 'white' }
                ]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: isDark ? 'white' : 'black' }]}>
                            {isEditMode ? 'Edit Task' : 'Add New Task'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={24} color={isDark ? 'white' : 'black'} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: isDark ? 'white' : 'black' }]}>Title *</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                                        color: isDark ? 'white' : 'black',
                                        borderColor: isDark ? '#404040' : '#e0e0e0'
                                    }
                                ]}
                                placeholder="Task title"
                                placeholderTextColor={isDark ? '#8e8e8e' : '#999'}
                                value={newTask.title}
                                onChangeText={(text) => onChangeTask({ ...newTask, title: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: isDark ? 'white' : 'black' }]}>Description</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    styles.textArea,
                                    {
                                        backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                                        color: isDark ? 'white' : 'black',
                                        borderColor: isDark ? '#404040' : '#e0e0e0'
                                    }
                                ]}
                                placeholder="Task description"
                                placeholderTextColor={isDark ? '#8e8e8e' : '#999'}
                                value={newTask.description}
                                onChangeText={(text) => onChangeTask({ ...newTask, description: text })}
                                multiline
                                numberOfLines={4}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: isDark ? 'white' : 'black' }]}>Due Date</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                                        color: isDark ? 'white' : 'black',
                                        borderColor: isDark ? '#404040' : '#e0e0e0'
                                    }
                                ]}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={isDark ? '#8e8e8e' : '#999'}
                                value={newTask.dueDate}
                                onChangeText={(text) => onChangeTask({ ...newTask, dueDate: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: isDark ? 'white' : 'black' }]}>Category</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                                        color: isDark ? 'white' : 'black',
                                        borderColor: isDark ? '#404040' : '#e0e0e0'
                                    }
                                ]}
                                placeholder="e.g. Work, Personal, Health"
                                placeholderTextColor={isDark ? '#8e8e8e' : '#999'}
                                value={newTask.category}
                                onChangeText={(text) => onChangeTask({ ...newTask, category: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: isDark ? 'white' : 'black' }]}>Priority</Text>
                            <View style={styles.prioritySelector}>
                                {['low', 'medium', 'high'].map((priority) => (
                                    <TouchableOpacity
                                        key={priority}
                                        style={[
                                            styles.priorityOption,
                                            {
                                                backgroundColor: newTask.priority === priority
                                                    ? getPriorityColor(priority)
                                                    : isDark ? '#2a2a2a' : '#f5f5f5',
                                                borderColor: isDark ? '#404040' : '#e0e0e0'
                                            }
                                        ]}
                                        onPress={() => onChangeTask({ ...newTask, priority: priority as 'low' | 'medium' | 'high' })}
                                    >
                                        <Text style={[
                                            styles.priorityText,
                                            {
                                                color: newTask.priority === priority
                                                    ? 'white'
                                                    : isDark ? 'white' : 'black'
                                            }
                                        ]}>
                                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {isEditMode && (
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: isDark ? 'white' : 'black' }]}>Status</Text>
                                <View style={styles.statusSelector}>
                                    <TouchableOpacity
                                        style={[
                                            styles.statusOption,
                                            {
                                                backgroundColor: !newTask.completed
                                                    ? '#1a9cd8'
                                                    : isDark ? '#2a2a2a' : '#f5f5f5',
                                                borderColor: isDark ? '#404040' : '#e0e0e0'
                                            }
                                        ]}
                                        onPress={() => onChangeTask({ ...newTask, completed: false })}
                                    >
                                        <Text style={[
                                            styles.statusText,
                                            {
                                                color: !newTask.completed
                                                    ? 'white'
                                                    : isDark ? 'white' : 'black'
                                            }
                                        ]}>
                                            Pending
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.statusOption,
                                            {
                                                backgroundColor: newTask.completed
                                                    ? '#34C759'
                                                    : isDark ? '#2a2a2a' : '#f5f5f5',
                                                borderColor: isDark ? '#404040' : '#e0e0e0'
                                            }
                                        ]}
                                        onPress={() => onChangeTask({ ...newTask, completed: true })}
                                    >
                                        <Text style={[
                                            styles.statusText,
                                            {
                                                color: newTask.completed
                                                    ? 'white'
                                                    : isDark ? 'white' : 'black'
                                            }
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
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.addButton]}
                            onPress={onUpdateTask}
                        >
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