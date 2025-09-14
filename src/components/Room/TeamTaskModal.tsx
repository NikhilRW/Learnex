import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Switch,
    FlatList,
    Alert,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Task, SubTask } from '../../types/taskTypes';
import { styles } from '../../styles/screens/userscreens/Tasks.styles';
import { getFirestore, collection, doc, getDocs, Timestamp, query, where, limit } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

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

interface TeamTaskModalProps {
    modalVisible: boolean;
    isEditMode: boolean;
    isDark: boolean;
    task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
    onClose: () => void;
    onSave: () => void;
    onChangeTask: (task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
    getPriorityColor: (priority: string) => string;
}

const TeamTaskModal: React.FC<TeamTaskModalProps> = ({
    modalVisible,
    isEditMode,
    isDark,
    task,
    onClose,
    onSave,
    onChangeTask,
    getPriorityColor
}) => {
    const [collaboratorEmail, setCollaboratorEmail] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [collaboratorData, setCollaboratorData] = useState<any>(null);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('details'); // 'details', 'subtasks', 'collaboration'

    // Subtask management
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [newSubtaskDescription, setNewSubtaskDescription] = useState('');
    const [subtasks, setSubtasks] = useState<SubTask[]>(task.subtasks || []);

    // Initialize collaborators list from task
    useEffect(() => {
        if (task.collaborators && task.collaborators.length > 0) {
            fetchCollaboratorDetails();
        }
    }, [task.collaborators]);

    // Fetch collaborator details for display
    const fetchCollaboratorDetails = async () => {
        if (!task.collaborators || task.collaborators.length === 0) return;

        const currentUserId = getAuth().currentUser?.uid || '';
        const otherCollaboratorIds = task.collaborators.filter(id => id !== currentUserId);

        let collaboratorsList: any[] = [];
        for (const id of otherCollaboratorIds) {
            try {
                const userDoc = await getDoc(doc(getFirestore(), 'users', id));
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    collaboratorsList.push({
                        id: userDoc.id,
                        displayName: userData?.displayName || userData?.email || 'Unknown User',
                        email: userData?.email || '',
                        photoURL: userData?.photoURL || null
                    });
                }
            } catch (err) {
                console.error('Error fetching collaborator details:', err);
            }
        }

        setCollaborators(collaboratorsList);
    };

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
            subtasks
        });

        // Calculate progress
        if (subtasks.length > 0) {
            const completedCount = subtasks.filter(s => s.completed).length;
            const percentage = Math.round((completedCount / subtasks.length) * 100);
            onChangeTask({
                ...task,
                subtasks,
                progress: percentage
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
            const userSnapshot = await getDocs(query(collection(getFirestore(), 'users'), where('email', '==', collaboratorEmail), limit(1)));

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
                    photoURL: userData.photoURL
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
                    isDuoTask: true, // Keep this flag for compatibility
                    isTeamTask: true, // New flag for team tasks
                    collaborators: updatedCollaborators,
                    collaborationStatus: 'pending'
                });

                // Add to UI collaborators list
                setCollaborators([...collaborators, {
                    id: userId,
                    displayName: userData.displayName || userData.email,
                    email: userData.email,
                    photoURL: userData.photoURL
                }]);

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
            updatedAt: Timestamp.now()
        };

        setSubtasks([...subtasks, newSubtask]);
        setNewSubtaskTitle('');
        setNewSubtaskDescription('');
    };

    const toggleSubtaskCompletion = (id: string) => {
        setSubtasks(subtasks.map(subtask => {
            if (subtask.id === id) {
                return {
                    ...subtask,
                    completed: !subtask.completed,
                    completedBy: !subtask.completed ? getAuth().currentUser?.uid : undefined,
                    completedAt: !subtask.completed ? Timestamp.now() : undefined,
                    updatedAt: Timestamp.now()
                };
            }
            return subtask;
        }));
    };

    const removeSubtask = (id: string) => {
        setSubtasks(subtasks.filter(subtask => subtask.id !== id));
    };

    const removeCollaborator = (collaboratorId: string) => {
        // Remove from collaborators list in the UI
        setCollaborators(collaborators.filter(c => c.id !== collaboratorId));

        // Remove from task collaborators array
        if (task.collaborators) {
            const updatedCollaborators = task.collaborators.filter(id => id !== collaboratorId);
            onChangeTask({
                ...task,
                collaborators: updatedCollaborators,
                // If only the current user remains, it's not a team task anymore
                isTeamTask: updatedCollaborators.length > 1,
                isDuoTask: updatedCollaborators.length > 1
            });
        }
    };

    // Reset collaboration if all collaborators are removed
    const resetCollaboration = () => {
        setCollaborators([]);
        onChangeTask({
            ...task,
            isDuoTask: false,
            isTeamTask: false,
            collaborators: [getAuth().currentUser?.uid || ''],
            collaborationStatus: undefined
        });
        setCollaboratorEmail('');
        setCollaboratorData(null);
    };

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
                            {isEditMode ? 'Edit Team Task' : 'Create Team Task'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={24} color={isDark ? 'white' : 'black'} />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={[
                        styles.tabsContainer,
                        isDark ? styles.darkTabsContainer : styles.lightTabsContainer
                    ]}>
                        <TouchableOpacity
                            style={[
                                styles.tabButton,
                                activeTab === 'details' ? styles.tabButtonActive : styles.tabButtonInactive
                            ]}
                            onPress={() => setActiveTab('details')}
                        >
                            <Text style={isDark ? styles.darkTabText : styles.tabText}>Task Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.tabButton,
                                activeTab === 'subtasks' ? styles.tabButtonActive : styles.tabButtonInactive
                            ]}
                            onPress={() => setActiveTab('subtasks')}
                        >
                            <Text style={isDark ? styles.darkTabText : styles.tabText}>Subtasks</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.tabButton,
                                activeTab === 'collaboration' ? styles.tabButtonActive : styles.tabButtonInactive
                            ]}
                            onPress={() => setActiveTab('collaboration')}
                        >
                            <Text style={isDark ? styles.darkTabText : styles.tabText}>Team Members</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {/* Task Details Tab */}
                        {activeTab === 'details' && (
                            <>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: isDark ? 'white' : 'black' }]}>Title *</Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            isDark ? styles.inputDark : styles.inputLight
                                        ]}
                                        placeholder="Task title"
                                        placeholderTextColor={isDark ? styles.placeholderDark.color : styles.placeholderLight.color}
                                        value={task.title}
                                        onChangeText={(text) => onChangeTask({ ...task, title: text })}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: isDark ? 'white' : 'black' }]}>Description</Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            styles.textArea,
                                            isDark ? styles.inputDark : styles.inputLight
                                        ]}
                                        placeholder="Task description"
                                        placeholderTextColor={isDark ? styles.placeholderDark.color : styles.placeholderLight.color}
                                        value={task.description}
                                        onChangeText={(text) => onChangeTask({ ...task, description: text })}
                                        multiline
                                        numberOfLines={4}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: isDark ? 'white' : 'black' }]}>Due Date</Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            isDark ? styles.inputDark : styles.inputLight
                                        ]}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={isDark ? styles.placeholderDark.color : styles.placeholderLight.color}
                                        value={task.dueDate}
                                        onChangeText={(text) => onChangeTask({ ...task, dueDate: text })}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: isDark ? 'white' : 'black' }]}>Due Time</Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            isDark ? styles.inputDark : styles.inputLight
                                        ]}
                                        placeholder="HH:MM (24-hour format)"
                                        placeholderTextColor={isDark ? styles.placeholderDark.color : styles.placeholderLight.color}
                                        value={task.dueTime}
                                        onChangeText={(text) => onChangeTask({ ...task, dueTime: text })}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: isDark ? 'white' : 'black' }]}>Category</Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            isDark ? styles.inputDark : styles.inputLight
                                        ]}
                                        placeholder="e.g. Work, Personal, Health"
                                        placeholderTextColor={isDark ? styles.placeholderDark.color : styles.placeholderLight.color}
                                        value={task.category}
                                        onChangeText={(text) => onChangeTask({ ...task, category: text })}
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
                                                        backgroundColor: task.priority === priority
                                                            ? getPriorityColor(priority)
                                                            : isDark ? '#2a2a2a' : '#f5f5f5',
                                                        borderColor: isDark ? '#404040' : '#e0e0e0'
                                                    }
                                                ]}
                                                onPress={() => onChangeTask({ ...task, priority: priority as 'low' | 'medium' | 'high' })}
                                            >
                                                <Text style={[
                                                    styles.priorityText,
                                                    {
                                                        color: task.priority === priority
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

                                <View style={styles.inputGroup}>
                                    <View style={styles.notifyContainer}>
                                        <Text style={[styles.inputLabel, { color: isDark ? 'white' : 'black' }]}>Send Notification</Text>
                                        <Switch
                                            trackColor={{ false: isDark ? '#555' : '#ccc', true: '#34C759' }}
                                            thumbColor={task.notify ? '#fff' : isDark ? '#888' : '#f4f3f4'}
                                            ios_backgroundColor={isDark ? '#555' : '#ccc'}
                                            onValueChange={(value) => onChangeTask({ ...task, notify: value })}
                                            value={task.notify}
                                        />
                                    </View>
                                </View>
                            </>
                        )}

                        {/* Subtasks Tab */}
                        {activeTab === 'subtasks' && (
                            <>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: isDark ? 'white' : 'black' }]}>
                                        Add Subtasks
                                    </Text>
                                    <Text style={isDark ? styles.darkSubtaskDescription : styles.subtaskDescription}>
                                        Break down your task into smaller, manageable subtasks
                                    </Text>

                                    <TextInput
                                        style={[
                                            styles.input,
                                            isDark ? styles.inputDark : styles.inputLight,
                                            { marginBottom: 5 }
                                        ]}
                                        placeholder="Subtask title"
                                        placeholderTextColor={isDark ? styles.placeholderDark.color : styles.placeholderLight.color}
                                        value={newSubtaskTitle}
                                        onChangeText={setNewSubtaskTitle}
                                    />

                                    <TextInput
                                        style={[
                                            styles.input,
                                            {
                                                backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                                                color: isDark ? 'white' : 'black',
                                                borderColor: isDark ? '#404040' : '#e0e0e0',
                                                marginBottom: 10
                                            }
                                        ]}
                                        placeholder="Description (optional)"
                                        placeholderTextColor={isDark ? '#8e8e8e' : '#999'}
                                        value={newSubtaskDescription}
                                        onChangeText={setNewSubtaskDescription}
                                    />

                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#1a9cd8',
                                            padding: 10,
                                            borderRadius: 5,
                                            alignItems: 'center',
                                            marginBottom: 20
                                        }}
                                        onPress={addSubtask}
                                    >
                                        <Text style={{ color: 'white' }}>Add Subtask</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: isDark ? 'white' : 'black', marginBottom: 10 }]}>
                                        Subtasks ({subtasks.length})
                                    </Text>

                                    {subtasks.length === 0 ? (
                                        <Text style={{ color: isDark ? '#8e8e8e' : '#666', textAlign: 'center', padding: 20 }}>
                                            No subtasks yet. Add some to track progress!
                                        </Text>
                                    ) : (
                                        <FlatList
                                            data={subtasks}
                                            keyExtractor={(item) => item.id}
                                            renderItem={({ item }) => (
                                                <View style={{
                                                    flexDirection: 'row',
                                                    padding: 10,
                                                    borderBottomWidth: 1,
                                                    borderColor: isDark ? '#404040' : '#e0e0e0',
                                                    alignItems: 'center'
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
                                                            backgroundColor: item.completed ? '#1a9cd8' : 'transparent',
                                                            marginRight: 10
                                                        }}
                                                        onPress={() => toggleSubtaskCompletion(item.id)}
                                                    >
                                                        {item.completed && (
                                                            <Icon name="checkmark" size={16} color="white" />
                                                        )}
                                                    </TouchableOpacity>

                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{
                                                            color: isDark ? 'white' : 'black',
                                                            textDecorationLine: item.completed ? 'line-through' : 'none',
                                                            opacity: item.completed ? 0.7 : 1
                                                        }}>
                                                            {item.title}
                                                        </Text>
                                                        {item.description && (
                                                            <Text style={{
                                                                color: isDark ? '#8e8e8e' : '#666',
                                                                fontSize: 12,
                                                                textDecorationLine: item.completed ? 'line-through' : 'none',
                                                                opacity: item.completed ? 0.7 : 1
                                                            }}>
                                                                {item.description}
                                                            </Text>
                                                        )}
                                                    </View>

                                                    <TouchableOpacity onPress={() => removeSubtask(item.id)}>
                                                        <Icon name="trash-outline" size={20} color={isDark ? '#8e8e8e' : '#666'} />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        />
                                    )}
                                </View>
                            </>
                        )}

                        {/* Collaboration Tab */}
                        {activeTab === 'collaboration' && (
                            <>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: isDark ? 'white' : 'black' }]}>
                                        Add Team Members
                                    </Text>
                                    <Text style={[{ color: isDark ? '#8e8e8e' : '#666', marginBottom: 10, fontSize: 12 }]}>
                                        Enter email of the person you want to add to the team
                                    </Text>

                                    <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                                                    color: isDark ? 'white' : 'black',
                                                    borderColor: isDark ? '#404040' : '#e0e0e0',
                                                    flex: 1,
                                                    marginRight: 5
                                                }
                                            ]}
                                            placeholder="Collaborator email"
                                            placeholderTextColor={isDark ? '#8e8e8e' : '#999'}
                                            value={collaboratorEmail}
                                            onChangeText={setCollaboratorEmail}
                                            keyboardType="email-address"
                                        />

                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: '#1a9cd8',
                                                padding: 10,
                                                borderRadius: 5,
                                                justifyContent: 'center'
                                            }}
                                            onPress={searchCollaborator}
                                            disabled={isSearching}
                                        >
                                            {isSearching ? (
                                                <ActivityIndicator size="small" color="white" />
                                            ) : (
                                                <Text style={{ color: 'white' }}>Add</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    {error && (
                                        <Text style={{ color: '#FF3B30', marginBottom: 10 }}>
                                            {error}
                                        </Text>
                                    )}

                                    <Text style={[styles.inputLabel, { color: isDark ? 'white' : 'black', marginTop: 20, marginBottom: 10 }]}>
                                        Team Members ({collaborators.length})
                                    </Text>

                                    {collaborators.length === 0 ? (
                                        <Text style={{ color: isDark ? '#8e8e8e' : '#666', textAlign: 'center', padding: 10 }}>
                                            No team members added yet. Add collaborators to work together!
                                        </Text>
                                    ) : (
                                        <FlatList
                                            data={collaborators}
                                            keyExtractor={(item) => item.id}
                                            renderItem={({ item }) => (
                                                <View style={{
                                                    flexDirection: 'row',
                                                    padding: 10,
                                                    backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                                                    borderRadius: 5,
                                                    alignItems: 'center',
                                                    marginBottom: 10
                                                }}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={{ color: isDark ? 'white' : 'black' }}>
                                                            {item.displayName}
                                                        </Text>
                                                        <Text style={{ color: isDark ? '#8e8e8e' : '#666', fontSize: 12 }}>
                                                            {item.email}
                                                        </Text>
                                                    </View>

                                                    <TouchableOpacity onPress={() => removeCollaborator(item.id)}>
                                                        <Icon name="close-circle" size={24} color={isDark ? '#8e8e8e' : '#666'} />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        />
                                    )}

                                    {collaborators.length > 0 && (
                                        <TouchableOpacity
                                            style={{
                                                marginTop: 10,
                                                padding: 10,
                                                borderRadius: 5,
                                                backgroundColor: '#FF3B30',
                                                alignItems: 'center'
                                            }}
                                            onPress={resetCollaboration}
                                        >
                                            <Text style={{ color: 'white' }}>Remove All Collaborators</Text>
                                        </TouchableOpacity>
                                    )}

                                    <Text style={[{ color: isDark ? '#8e8e8e' : '#666', marginTop: 20, fontSize: 12 }]}>
                                        Once you save the task, your team members will receive invitations.
                                    </Text>
                                </View>
                            </>
                        )}
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={onSave}
                        >
                            <Text style={styles.buttonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default TeamTaskModal;