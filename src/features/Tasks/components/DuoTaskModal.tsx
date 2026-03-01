import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Switch,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import Icon from 'react-native-vector-icons/Ionicons';
import { Task, SubTask } from 'shared/types/taskTypes';
import {
    styles,
    duoTaskModalStyles,
} from 'tasks/styles/Tasks.styles';
import {
    getFirestore,
    collection,
    doc,
    getDocs,
    Timestamp,
    query,
    where,
    limit,
    getDoc,
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
// Replace uuid import with custom generator
// import { v4 as uuidv4 } from 'uuid';

// Custom UUID generator that doesn't rely on crypto.getRandomValues()
const generateUUID = (): string => {
    // Use a timestamp-based prefix to ensure uniqueness
    const timestamp = Date.now().toString(36);

    // Generate random segments
    const randomSegment1 = Math.random().toString(36).substring(2, 15);
    const randomSegment2 = Math.random().toString(36).substring(2, 15);

    // Combine timestamp and random segments to form a UUID-like string
    return `${timestamp}-${randomSegment1}-${randomSegment2}`;
};

import { DuoTaskModalProps } from '../types';

const DuoTaskModal: React.FC<DuoTaskModalProps> = ({
    modalVisible,
    isEditMode,
    isDark,
    task,
    onClose,
    onSave,
    onChangeTask,
}) => {
    const [collaboratorEmail, setCollaboratorEmail] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [, setCollaboratorData] = useState<any>(null);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('details'); // 'details', 'subtasks', 'collaboration'

    // Subtask management
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [newSubtaskDescription, setNewSubtaskDescription] = useState('');
    const [subtasks, setSubtasks] = useState<SubTask[]>(task.subtasks || []);

    // Fetch collaborator details for display
    const fetchCollaboratorDetails = useCallback(async () => {
        if (!task.collaborators || task.collaborators.length === 0) return;

        const currentUserId = getAuth().currentUser?.uid || '';
        const otherCollaboratorIds = task.collaborators.filter(
            id => id !== currentUserId,
        );

        let collaboratorsList: any[] = [];
        for (const id of otherCollaboratorIds) {
            try {
                const userDoc = await getDoc(doc(getFirestore(), 'users', id));

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    collaboratorsList.push({
                        id: userDoc.id,
                        displayName:
                            userData?.displayName || userData?.email || 'Unknown User',
                        email: userData?.email || '',
                        photoURL: userData?.photoURL || null,
                    });
                }
            } catch (err) {
                console.error('Error fetching collaborator details:', err);
            }
        }

        setCollaborators(collaboratorsList);
    }, [task.collaborators]);
    // Initialize collaborators list from task
    useEffect(() => {
        if (task.collaborators && task.collaborators.length > 1) {
            fetchCollaboratorDetails();
        }
    }, [task.collaborators, fetchCollaboratorDetails]);

    // Sync subtasks with task
    useEffect(() => {
        if (task.subtasks) {
            setSubtasks(task.subtasks);
        }
    }, [task.subtasks]);

    // Update task subtasks when subtasks state changes
    useEffect(() => {
        onChangeTask({
            ...task,
            subtasks,
        });

        // Calculate progress
        if (subtasks.length > 0) {
            const completedCount = subtasks.filter(s => s.completed).length;
            const percentage = Math.round((completedCount / subtasks.length) * 100);
            onChangeTask({
                ...task,
                subtasks,
                progress: percentage,
            });
        }
    }, [subtasks]);

    const searchCollaborator = async () => {
        if (!collaboratorEmail) {
            setError('Please enter a collaborator email');
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            // Search for user by email
            const userSnapshot = await getDocs(
                query(
                    collection(getFirestore(), 'users'),
                    where('email', '==', collaboratorEmail),
                    limit(1),
                ),
            );

            if (userSnapshot.empty) {
                setError('User not found');
                setCollaboratorData(null);
            } else {
                const userData = userSnapshot.docs[0].data();
                const userId = userSnapshot.docs[0].id;

                // Check if user is trying to add themselves
                if (userId === getAuth().currentUser?.uid) {
                    setError('You cannot add yourself as a collaborator');
                    setCollaboratorData(null);
                    return;
                }

                // Check if user is already a collaborator
                if (task.collaborators && task.collaborators.includes(userId)) {
                    setError('This user is already a collaborator');
                    setCollaboratorData(null);
                    return;
                }

                setCollaboratorData({
                    id: userId,
                    displayName: userData.displayName || userData.email,
                    email: userData.email,
                    photoURL: userData.photoURL,
                });

                // Add the new collaborator to the list
                const currentUserId = getAuth().currentUser?.uid || '';
                const existingCollaborators = task.collaborators || [currentUserId];
                const updatedCollaborators = [...existingCollaborators];

                if (!updatedCollaborators.includes(userId)) {
                    updatedCollaborators.push(userId);
                }

                // Update the task with the new collaborator
                onChangeTask({
                    ...task,
                    isDuoTask: true,
                    collaborators: updatedCollaborators,
                    collaborationStatus: 'pending',
                });

                // Add to UI collaborators list
                setCollaborators([
                    ...collaborators,
                    {
                        id: userId,
                        displayName: userData.displayName || userData.email,
                        email: userData.email,
                        photoURL: userData.photoURL,
                    },
                ]);

                // Reset the input
                setCollaboratorEmail('');
                setCollaboratorData(null);
            }
        } catch (err) {
            console.error('Error searching for collaborator:', err);
            setError('An error occurred while searching for the collaborator');
        } finally {
            setIsSearching(false);
        }
    };

    const addSubtask = () => {
        if (!newSubtaskTitle.trim()) {
            Alert.alert('Error', 'Subtask title is required');
            return;
        }

        const newSubtask: SubTask = {
            id: generateUUID(),
            title: newSubtaskTitle,
            description: newSubtaskDescription,
            completed: false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        setSubtasks([...subtasks, newSubtask]);
        setNewSubtaskTitle('');
        setNewSubtaskDescription('');
    };

    const toggleSubtaskCompletion = (id: string) => {
        setSubtasks(
            subtasks.map(subtask => {
                if (subtask.id === id) {
                    return {
                        ...subtask,
                        completed: !subtask.completed,
                        completedBy: !subtask.completed
                            ? getAuth().currentUser?.uid
                            : undefined,
                        completedAt: !subtask.completed ? Timestamp.now() : undefined,
                        updatedAt: Timestamp.now(),
                    };
                }
                return subtask;
            }),
        );
    };

    const removeSubtask = (id: string) => {
        setSubtasks(subtasks.filter(subtask => subtask.id !== id));
    };

    const removeCollaborator = (collaboratorId: string) => {
        // Remove from collaborators list in the UI
        setCollaborators(collaborators.filter(c => c.id !== collaboratorId));

        // Remove from task collaborators array
        if (task.collaborators) {
            const currentUserId = getAuth().currentUser?.uid || '';
            const updatedCollaborators = task.collaborators.filter(
                id => id !== collaboratorId,
            );

            // Make sure current user is still in the collaborators list
            if (!updatedCollaborators.includes(currentUserId)) {
                updatedCollaborators.push(currentUserId);
            }

            onChangeTask({
                ...task,
                collaborators: updatedCollaborators,
                // Keep as a team task if there are still multiple collaborators
                isDuoTask: updatedCollaborators.length > 1,
            });
        }
    };

    // Reset collaboration if all collaborators are removed
    const resetCollaboration = () => {
        setCollaborators([]);
        onChangeTask({
            ...task,
            isDuoTask: false,
            collaborators: [getAuth().currentUser?.uid || ''],
            collaborationStatus: undefined,
        });
        setCollaboratorEmail('');
        setCollaboratorData(null);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            testID='duoTaskModal'
            onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View
                    style={[
                        styles.modalContent,
                        duoTaskModalStyles.modalContent,
                        isDark
                            ? duoTaskModalStyles.modalContentDark
                            : duoTaskModalStyles.modalContentLight,
                    ]}>
                    <View style={styles.modalHeader}>
                        <Text
                            style={[
                                styles.modalTitle,
                                duoTaskModalStyles.modalTitle,
                                isDark
                                    ? duoTaskModalStyles.modalTitleDark
                                    : duoTaskModalStyles.modalTitleLight,
                            ]}>
                            {isEditMode ? 'Edit Team Task' : 'Create Team Task'}
                        </Text>
                        <TouchableOpacity
                            style={duoTaskModalStyles.closeButton}
                            onPress={onClose}>
                            <Icon
                                name="close"
                                size={24}
                                color={
                                    isDark
                                        ? duoTaskModalStyles.tabTextDark.color
                                        : duoTaskModalStyles.tabTextLight.color
                                }
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View
                        style={[
                            duoTaskModalStyles.tabsContainer,
                            isDark
                                ? duoTaskModalStyles.tabsContainerDark
                                : duoTaskModalStyles.tabsContainerLight,
                        ]}>
                        <TouchableOpacity
                            style={[
                                duoTaskModalStyles.tab,
                                activeTab === 'details'
                                    ? duoTaskModalStyles.tabActive
                                    : duoTaskModalStyles.tabInactive,
                            ]}
                            onPress={() => setActiveTab('details')}>
                            <Text
                                style={[
                                    duoTaskModalStyles.tabText,
                                    isDark
                                        ? duoTaskModalStyles.tabTextDark
                                        : duoTaskModalStyles.tabTextLight,
                                ]}>
                                Task Details
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                duoTaskModalStyles.tab,
                                activeTab === 'subtasks'
                                    ? duoTaskModalStyles.tabActive
                                    : duoTaskModalStyles.tabInactive,
                            ]}
                            onPress={() => setActiveTab('subtasks')}>
                            <Text
                                style={[
                                    duoTaskModalStyles.tabText,
                                    isDark
                                        ? duoTaskModalStyles.tabTextDark
                                        : duoTaskModalStyles.tabTextLight,
                                ]}>
                                Subtasks
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                duoTaskModalStyles.tab,
                                activeTab === 'collaboration'
                                    ? duoTaskModalStyles.tabActive
                                    : duoTaskModalStyles.tabInactive,
                            ]}
                            onPress={() => setActiveTab('collaboration')}>
                            <Text
                                style={[
                                    duoTaskModalStyles.tabText,
                                    duoTaskModalStyles.teamMembersTabText,
                                    isDark
                                        ? duoTaskModalStyles.tabTextDark
                                        : duoTaskModalStyles.tabTextLight,
                                ]}>
                                Team Members
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {/* Task Details Tab */}
                        {activeTab === 'details' && (
                            <>
                                <View style={styles.inputGroup}>
                                    <Text
                                        style={[
                                            styles.inputLabel,
                                            duoTaskModalStyles.inputLabel,
                                            isDark
                                                ? duoTaskModalStyles.inputLabelDark
                                                : duoTaskModalStyles.inputLabelLight,
                                        ]}>
                                        Title *
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            duoTaskModalStyles.input,
                                            isDark
                                                ? duoTaskModalStyles.inputDark
                                                : duoTaskModalStyles.inputLight,
                                        ]}
                                        placeholder="Task title"
                                        placeholderTextColor={
                                            isDark
                                                ? duoTaskModalStyles.placeholderDark.color
                                                : duoTaskModalStyles.placeholderLight.color
                                        }
                                        value={task.title}
                                        onChangeText={text => onChangeTask({ ...task, title: text })}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text
                                        style={[
                                            styles.inputLabel,
                                            duoTaskModalStyles.inputLabel,
                                            isDark
                                                ? duoTaskModalStyles.inputLabelDark
                                                : duoTaskModalStyles.inputLabelLight,
                                        ]}>
                                        Description
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            duoTaskModalStyles.input,
                                            duoTaskModalStyles.descriptionInput,
                                            isDark
                                                ? duoTaskModalStyles.inputDark
                                                : duoTaskModalStyles.inputLight,
                                        ]}
                                        placeholder="Task description"
                                        placeholderTextColor={
                                            isDark
                                                ? duoTaskModalStyles.placeholderDark.color
                                                : duoTaskModalStyles.placeholderLight.color
                                        }
                                        value={task.description}
                                        onChangeText={text =>
                                            onChangeTask({ ...task, description: text })
                                        }
                                        multiline
                                        numberOfLines={4}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text
                                        style={[
                                            styles.inputLabel,
                                            duoTaskModalStyles.inputLabel,
                                            isDark
                                                ? duoTaskModalStyles.inputLabelDark
                                                : duoTaskModalStyles.inputLabelLight,
                                        ]}>
                                        Due Date
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            duoTaskModalStyles.input,
                                            isDark
                                                ? duoTaskModalStyles.inputDark
                                                : duoTaskModalStyles.inputLight,
                                        ]}
                                        placeholder="Select due date"
                                        placeholderTextColor={
                                            isDark
                                                ? duoTaskModalStyles.placeholderDark.color
                                                : duoTaskModalStyles.placeholderLight.color
                                        }
                                        value={task.dueDate}
                                        onChangeText={text =>
                                            onChangeTask({ ...task, dueDate: text })
                                        }
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text
                                        style={[
                                            styles.inputLabel,
                                            duoTaskModalStyles.inputLabel,
                                            isDark
                                                ? duoTaskModalStyles.inputLabelDark
                                                : duoTaskModalStyles.inputLabelLight,
                                        ]}>
                                        Due Time
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            duoTaskModalStyles.input,
                                            isDark
                                                ? duoTaskModalStyles.inputDark
                                                : duoTaskModalStyles.inputLight,
                                        ]}
                                        placeholder="HH:MM (24-hour format)"
                                        placeholderTextColor={
                                            isDark
                                                ? duoTaskModalStyles.placeholderDark.color
                                                : duoTaskModalStyles.placeholderLight.color
                                        }
                                        value={task.dueTime}
                                        onChangeText={text =>
                                            onChangeTask({ ...task, dueTime: text })
                                        }
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text
                                        style={[
                                            styles.inputLabel,
                                            duoTaskModalStyles.inputLabel,
                                            isDark
                                                ? duoTaskModalStyles.inputLabelDark
                                                : duoTaskModalStyles.inputLabelLight,
                                        ]}>
                                        Priority
                                    </Text>
                                    <View style={styles.prioritySelector}>
                                        {['low', 'medium', 'high'].map(priority => (
                                            <TouchableOpacity
                                                key={priority}
                                                style={[
                                                    styles.priorityOption,
                                                    duoTaskModalStyles.priorityButton,
                                                    isDark
                                                        ? duoTaskModalStyles.priorityButtonDark
                                                        : duoTaskModalStyles.priorityButtonLight,
                                                    task.priority === priority &&
                                                    duoTaskModalStyles.priorityButtonActive,
                                                ]}
                                                onPress={() =>
                                                    onChangeTask({
                                                        ...task,
                                                        priority: priority as 'low' | 'medium' | 'high',
                                                    })
                                                }>
                                                <Text
                                                    style={[
                                                        duoTaskModalStyles.priorityButtonText,
                                                        task.priority === priority
                                                            ? duoTaskModalStyles.priorityButtonTextActive
                                                            : isDark
                                                                ? duoTaskModalStyles.priorityButtonTextDark
                                                                : duoTaskModalStyles.priorityButtonTextLight,
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
                                                duoTaskModalStyles.inputLabel,
                                                isDark
                                                    ? duoTaskModalStyles.inputLabelDark
                                                    : duoTaskModalStyles.inputLabelLight,
                                            ]}>
                                            Send Notification
                                        </Text>
                                        <Switch
                                            trackColor={{
                                                false: isDark
                                                    ? duoTaskModalStyles.switchTrackDark.backgroundColor
                                                    : duoTaskModalStyles.switchTrackLight.backgroundColor,
                                                true: duoTaskModalStyles.switchTrackActive
                                                    .backgroundColor,
                                            }}
                                            thumbColor={
                                                task.notify
                                                    ? duoTaskModalStyles.switchThumbActive.backgroundColor
                                                    : isDark
                                                        ? duoTaskModalStyles.switchThumbDark.backgroundColor
                                                        : duoTaskModalStyles.switchThumbLight
                                                            .backgroundColor
                                            }
                                            ios_backgroundColor={
                                                isDark
                                                    ? duoTaskModalStyles.switchTrackDark.backgroundColor
                                                    : duoTaskModalStyles.switchTrackLight.backgroundColor
                                            }
                                            onValueChange={value =>
                                                onChangeTask({ ...task, notify: value })
                                            }
                                            value={task.notify}
                                            testID='notifySwitch'
                                        />
                                    </View>
                                </View>
                            </>
                        )}

                        {/* Subtasks Tab */}
                        {activeTab === 'subtasks' && (
                            <>
                                <View style={styles.inputGroup}>
                                    <Text
                                        style={[
                                            styles.inputLabel,
                                            duoTaskModalStyles.inputLabel,
                                            isDark
                                                ? duoTaskModalStyles.inputLabelDark
                                                : duoTaskModalStyles.inputLabelLight,
                                        ]}>
                                        Add Subtasks
                                    </Text>
                                    <Text
                                        style={[
                                            duoTaskModalStyles.descriptionText,
                                            isDark
                                                ? duoTaskModalStyles.descriptionTextDark
                                                : duoTaskModalStyles.descriptionTextLight,
                                        ]}>
                                        Break down your task into smaller, manageable subtasks
                                    </Text>

                                    <TextInput
                                        style={[
                                            styles.input,
                                            duoTaskModalStyles.input,
                                            duoTaskModalStyles.subtaskInput,
                                            isDark
                                                ? duoTaskModalStyles.inputDark
                                                : duoTaskModalStyles.inputLight,
                                        ]}
                                        placeholder="Subtask title"
                                        placeholderTextColor={
                                            isDark
                                                ? duoTaskModalStyles.placeholderDark.color
                                                : duoTaskModalStyles.placeholderLight.color
                                        }
                                        value={newSubtaskTitle}
                                        onChangeText={setNewSubtaskTitle}
                                    />

                                    <TextInput
                                        style={[
                                            styles.input,
                                            duoTaskModalStyles.input,
                                            duoTaskModalStyles.subtaskDescriptionInput,
                                            isDark
                                                ? duoTaskModalStyles.inputDark
                                                : duoTaskModalStyles.inputLight,
                                        ]}
                                        placeholder="Subtask Description (optional)"
                                        placeholderTextColor={
                                            isDark
                                                ? duoTaskModalStyles.placeholderDark.color
                                                : duoTaskModalStyles.placeholderLight.color
                                        }
                                        value={newSubtaskDescription}
                                        onChangeText={setNewSubtaskDescription}
                                    />

                                    <TouchableOpacity
                                        testID="addSubtask"
                                        style={duoTaskModalStyles.addButton}
                                        onPress={addSubtask}>
                                        <Text style={duoTaskModalStyles.addButtonText}>
                                            Add Subtask
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text
                                        style={[
                                            styles.inputLabel,
                                            duoTaskModalStyles.inputLabel,
                                            isDark
                                                ? duoTaskModalStyles.inputLabelDark
                                                : duoTaskModalStyles.inputLabelLight,
                                            duoTaskModalStyles.subtasksCount,
                                        ]}>
                                        Subtasks ({subtasks.length})
                                    </Text>

                                    {subtasks.length === 0 ? (
                                        <Text
                                            style={[
                                                duoTaskModalStyles.emptySubtasksText,
                                                isDark
                                                    ? duoTaskModalStyles.emptySubtasksTextDark
                                                    : duoTaskModalStyles.emptySubtasksTextLight,
                                            ]}>
                                            No subtasks yet. Add some to track progress!
                                        </Text>
                                    ) : (
                                        <LegendList
                                            data={subtasks}
                                            keyExtractor={item => item.id}
                                            estimatedItemSize={50}
                                            recycleItems={true}
                                            renderItem={({ item }) => (
                                                <View
                                                    style={[
                                                        duoTaskModalStyles.subtaskListRow,
                                                        isDark
                                                            ? duoTaskModalStyles.subtaskListRowDark
                                                            : duoTaskModalStyles.subtaskListRowLight,
                                                    ]}>
                                                    <TouchableOpacity
                                                        testID='taskCompletionToggleButton'
                                                        style={[
                                                            duoTaskModalStyles.subtaskCheckbox,
                                                            {
                                                                borderColor: isDark
                                                                    ? duoTaskModalStyles.subtaskCheckboxDark
                                                                        .borderColor
                                                                    : duoTaskModalStyles.subtaskCheckboxLight
                                                                        .borderColor,
                                                                backgroundColor: item.completed
                                                                    ? duoTaskModalStyles.subtaskCheckboxActive
                                                                        .backgroundColor
                                                                    : duoTaskModalStyles.subtaskCheckboxInactive
                                                                        .backgroundColor,
                                                            },
                                                        ]}
                                                        onPress={() => toggleSubtaskCompletion(item.id)}>
                                                        {item.completed && (
                                                            <Icon testID="checkmark" name="checkmark" size={16} color="white" />
                                                        )}
                                                    </TouchableOpacity>

                                                    <View
                                                        style={duoTaskModalStyles.subtaskTitleContainer}>
                                                        <Text
                                                            style={[
                                                                duoTaskModalStyles.subtaskTitle,
                                                                isDark
                                                                    ? duoTaskModalStyles.subtaskTitleDark
                                                                    : duoTaskModalStyles.subtaskTitleLight,
                                                                item.completed &&
                                                                duoTaskModalStyles.subtaskTitleCompleted,
                                                            ]}>
                                                            {item.title}
                                                        </Text>
                                                        {item.description && (
                                                            <Text
                                                                style={[
                                                                    duoTaskModalStyles.subtaskDescription,
                                                                    isDark
                                                                        ? duoTaskModalStyles.subtaskDescriptionDark
                                                                        : duoTaskModalStyles.subtaskDescriptionLight,
                                                                    item.completed &&
                                                                    duoTaskModalStyles.subtaskDescriptionCompleted,
                                                                ]}>
                                                                {item.description}
                                                            </Text>
                                                        )}
                                                    </View>

                                                    <TouchableOpacity
                                                        onPress={() => removeSubtask(item.id)}
                                                        style={duoTaskModalStyles.removeSubtaskButton}>
                                                        <Icon
                                                            name="trash-outline"
                                                            size={20}
                                                            color={
                                                                isDark
                                                                    ? duoTaskModalStyles.removeSubtaskIconDark
                                                                        .color
                                                                    : duoTaskModalStyles.removeSubtaskIconLight
                                                                        .color
                                                            }
                                                        />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                            style={duoTaskModalStyles.subtaskList}
                                        />
                                    )}
                                </View>
                            </>
                        )}

                        {/* Collaboration Tab */}
                        {activeTab === 'collaboration' && (
                            <>
                                <View style={styles.inputGroup}>
                                    <Text
                                        style={[
                                            styles.inputLabel,
                                            duoTaskModalStyles.inputLabel,
                                            isDark
                                                ? duoTaskModalStyles.inputLabelDark
                                                : duoTaskModalStyles.inputLabelLight,
                                        ]}>
                                        Add Team Members
                                    </Text>
                                    <Text
                                        style={[
                                            duoTaskModalStyles.descriptionText,
                                            duoTaskModalStyles.collaborationHintText,
                                            isDark
                                                ? duoTaskModalStyles.collaborationHintTextDark
                                                : duoTaskModalStyles.collaborationHintTextLight,
                                        ]}>
                                        Enter email of the person you want to add to the team
                                    </Text>
                                    <View style={duoTaskModalStyles.collaboratorInputContainer}>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                duoTaskModalStyles.input,
                                                duoTaskModalStyles.collaboratorInput,
                                                isDark
                                                    ? duoTaskModalStyles.inputDark
                                                    : duoTaskModalStyles.inputLight,
                                            ]}
                                            placeholder="Team member email"
                                            placeholderTextColor={
                                                isDark
                                                    ? duoTaskModalStyles.placeholderDark.color
                                                    : duoTaskModalStyles.placeholderLight.color
                                            }
                                            value={collaboratorEmail}
                                            onChangeText={setCollaboratorEmail}
                                            keyboardType="email-address"
                                        />

                                        <TouchableOpacity
                                            style={duoTaskModalStyles.addCollaboratorButton}
                                            onPress={searchCollaborator}
                                            disabled={isSearching}>
                                            {isSearching ? (
                                                <ActivityIndicator size="small" color="white" />
                                            ) : (
                                                <Text
                                                    style={duoTaskModalStyles.addCollaboratorButtonText}>
                                                    Add
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    {error && (
                                        <Text style={duoTaskModalStyles.errorText}>{error}</Text>
                                    )}

                                    <Text
                                        style={[
                                            styles.inputLabel,
                                            duoTaskModalStyles.inputLabel,
                                            duoTaskModalStyles.teamMembersCount,
                                            isDark
                                                ? duoTaskModalStyles.inputLabelDark
                                                : duoTaskModalStyles.inputLabelLight,
                                        ]}>
                                        Team Members ({collaborators.length})
                                    </Text>

                                    {collaborators.length === 0 ? (
                                        <Text
                                            style={[
                                                duoTaskModalStyles.emptyTeamMembersText,
                                                isDark
                                                    ? duoTaskModalStyles.collaborationHintTextDark
                                                    : duoTaskModalStyles.collaborationHintTextLight,
                                            ]}>
                                            No team members added yet. Add team members to work
                                            together!
                                        </Text>
                                    ) : (
                                        <LegendList
                                            data={collaborators}
                                            keyExtractor={item => item.id}
                                            estimatedItemSize={60}
                                            recycleItems={true}
                                            renderItem={({ item }) => (
                                                <View
                                                    style={[
                                                        duoTaskModalStyles.collaboratorItem,
                                                        isDark
                                                            ? duoTaskModalStyles.collaboratorItemDark
                                                            : duoTaskModalStyles.collaboratorItemLight,
                                                    ]}>
                                                    <View style={duoTaskModalStyles.collaboratorDetails}>
                                                        <Text
                                                            style={[
                                                                isDark
                                                                    ? duoTaskModalStyles.collaboratorNameDark
                                                                    : duoTaskModalStyles.collaboratorNameLight,
                                                            ]}>
                                                            {item.displayName}
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                isDark
                                                                    ? duoTaskModalStyles.collaboratorEmailDark
                                                                    : duoTaskModalStyles.collaboratorEmailLight,
                                                            ]}>
                                                            {item.email}
                                                        </Text>
                                                    </View>

                                                    <TouchableOpacity
                                                        onPress={() => removeCollaborator(item.id)}
                                                        style={duoTaskModalStyles.removeCollaboratorButton}>
                                                        <Icon
                                                            name="close-circle"
                                                            size={24}
                                                            color={
                                                                isDark
                                                                    ? duoTaskModalStyles
                                                                        .removeCollaboratorIconDark.color
                                                                    : duoTaskModalStyles
                                                                        .removeCollaboratorIconLight.color
                                                            }
                                                        />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        />
                                    )}

                                    {collaborators.length > 0 && (
                                        <TouchableOpacity
                                            style={duoTaskModalStyles.removeAllCollaboratorsButton}
                                            onPress={resetCollaboration}>
                                            <Text
                                                style={
                                                    duoTaskModalStyles.removeAllCollaboratorsButtonText
                                                }>
                                                Remove All Team Members
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    <Text
                                        style={[
                                            duoTaskModalStyles.collaborationHintText,
                                            isDark
                                                ? duoTaskModalStyles.collaborationHintTextDark
                                                : duoTaskModalStyles.collaborationHintTextLight,
                                        ]}>
                                        Once you save the task, all team members will receive
                                        invitations to collaborate.
                                    </Text>
                                </View>
                            </>
                        )}
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}>
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={onSave}>
                            <Text style={styles.buttonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default DuoTaskModal;
