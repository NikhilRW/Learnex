import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
    KeyboardAvoidingView,
    Dimensions,
    useWindowDimensions,
    Modal,
    FlatList,
} from 'react-native';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { userState } from '../../types/userType';
import { MeetingService } from '../../service/firebase/MeetingService';
import { UserStackParamList } from '../../routes/UserStack';
import { TaskService } from '../../service/firebase/TaskService';
import { Task } from '../../types/taskTypes';

// Define room route params interface
interface RoomParams {
    meetingData?: {
        id: string;
        title: string;
        description: string;
        duration: number;
        maxParticipants: number;
        isPrivate: boolean;
        taskId?: string;
        host: string;
        status: string;
        participants: string[];
        roomCode: string;
        settings: {
            muteOnEntry: boolean;
            allowChat: boolean;
            allowScreenShare: boolean;
            recordingEnabled: boolean;
        };
        createdAt: Date;
        updatedAt: Date;
    },
    joinMode?: boolean;
    roomCode?: string;
}

type RoomScreenRouteProp = RouteProp<{ Room: RoomParams }, 'Room'>;

interface MeetingRoom {
    id?: string;
    title: string;
    description: string;
    duration: number;
    capacity: number;
    isPrivate: boolean;
    meetingLink?: string;
    host: string;
    roomCode?: string;
    taskId?: string;
}

const meetingService = new MeetingService();
const taskService = new TaskService();

const Room = () => {
    const navigation = useNavigation<DrawerNavigationProp<UserStackParamList>>();
    const route = useRoute<RoomScreenRouteProp>();
    const userTheme = useTypedSelector(state => state.user) as userState;
    const isDark = userTheme.theme === 'dark';
    const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const { width, height } = useWindowDimensions();
    const isSmallScreen = width < 380;

    // Task related states
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isTasksLoading, setIsTasksLoading] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const [meetingRoom, setMeetingRoom] = useState<MeetingRoom>({
        title: '',
        description: '',
        duration: 60,
        capacity: 10,
        isPrivate: false,
        host: 'Current User', // Will be replaced with actual user data
        taskId: '', // Initialize taskId field
    });

    // Check for meeting data passed from LexAI
    useEffect(() => {
        const main = async () => {
            // Handle meeting data if provided
            if (route.params?.meetingData) {
                const agenticMeetingData = route.params.meetingData;
                console.log('Received meeting data from LexAI:', agenticMeetingData);
                const meetingData = {
                    title: agenticMeetingData.title || '',
                    description: agenticMeetingData.description || '',
                    duration: agenticMeetingData.duration || 60,
                    maxParticipants: agenticMeetingData.maxParticipants || 10,
                    isPrivate: agenticMeetingData.isPrivate || false,
                    host: 'Current User', // Will be set during creation
                    taskId: agenticMeetingData.taskId || '',
                    settings: {
                        muteOnEntry: true,
                        allowChat: true,
                        allowScreenShare: true,
                        recordingEnabled: false,
                    },
                };
                // If there's a taskId, try to find the corresponding task
                if (agenticMeetingData.taskId) {
                    const fetchTaskDetails = async () => {
                        try {
                            // Find task in the loaded tasks list
                            const userTasks = await taskService.getTasks();
                            const task = userTasks.find(t => t.id === agenticMeetingData.taskId);
                            if (task) {
                                setSelectedTask(task);
                            }
                        } catch (error) {
                            console.error('Failed to fetch task details:', error);
                        }
                    };

                    fetchTaskDetails();
                }

                // Optionally auto-create the meeting if fully specified
                if (agenticMeetingData.title) {
                    setActiveTab('create');
                    const meetingId = await meetingService.createMeeting(meetingData);
                    const meeting = await meetingService.getMeeting(meetingId);
                    // Navigate to RoomScreen with meeting data
                    navigation.navigate('RoomScreen', {
                        meeting,
                        isHost: true,
                    });
                }
            }
            // Handle join mode if provided
            else if (route.params?.joinMode && route.params?.roomCode) {
                console.log('Received join room request with code:', route.params.roomCode);
                // Set active tab to join
                setActiveTab('join');
                // Set the room code
                setRoomCode(route.params.roomCode);
                try {
                    setLoading(true);
                    // Get meeting by room code
                    const meeting = await meetingService.getMeetingByRoomCode(route.params.roomCode);
                    // Navigate to RoomScreen with meeting data
                    navigation.navigate('RoomScreen', {
                        meeting,
                        isHost: false,
                    });
                } catch (error) {
                    console.error('Failed to join meeting:', error);
                    Alert.alert(
                        'Error',
                        error instanceof Error ? error.message : 'Failed to join meeting'
                    );
                    setLoading(false);
                }
            }
        }
        main();
    }, [route.params]);

    // Fetch tasks when component mounts and when screen is focused
    useEffect(() => {
        fetchTasks();

        // Add focus listener to refresh tasks when returning to this screen
        const unsubscribe = navigation.addListener('focus', () => {
            fetchTasks();
        });

        // Clean up the listener when the component is unmounted
        return unsubscribe;
    }, [navigation]);

    // Function to fetch user's tasks
    const fetchTasks = async () => {
        try {
            setIsTasksLoading(true);
            // Get team/duo tasks instead of normal tasks
            const userTasks = await taskService.getDuoTasks();
            // Filter out completed tasks
            const pendingTasks = userTasks.filter(task => !task.completed);
            setTasks(pendingTasks);

            // Verify if selected task still exists and is not completed
            if (selectedTask) {
                const taskStillExists = pendingTasks.some(task => task.id === selectedTask.id);
                if (!taskStillExists) {
                    // Selected task no longer exists or is completed, clear selection
                    setSelectedTask(null);
                    setMeetingRoom(prev => ({ ...prev, taskId: '' }));
                }
            }
        } catch (error) {
            console.error('Error fetching team tasks:', error);
            Alert.alert('Error', 'Failed to load team tasks');
        } finally {
            setIsTasksLoading(false);
        }
    };

    const handleCreateRoom = async () => {
        // Validate form
        if (!meetingRoom.title.trim()) {
            Alert.alert('Error', 'Please enter a meeting title');
            return;
        }
        if (meetingRoom.duration < 1) {
            Alert.alert('Error', 'Duration must be at least 1 minute');
            return;
        }
        try {
            setLoading(true);
            if (meetingRoom.capacity < 2) {
                Alert.alert('Error', 'Capacity must be at least 2');
                setLoading(false);
                return;
            }
            if (meetingRoom.capacity > 50) {
                Alert.alert('Error', 'Capacity must be less than 50');
                setLoading(false);
                return;
            }
            // Create meeting using MeetingService
            const meetingData = {
                title: meetingRoom.title,
                description: meetingRoom.description,
                duration: meetingRoom.duration,
                isPrivate: meetingRoom.isPrivate,
                maxParticipants: meetingRoom.capacity,
                host: meetingRoom.host, // Include host field
                taskId: meetingRoom.taskId, // Include taskId field
                settings: {
                    muteOnEntry: true,
                    allowChat: true,
                    allowScreenShare: true,
                    recordingEnabled: false,
                },
            };

            const meetingId = await meetingService.createMeeting(meetingData);
            const meeting = await meetingService.getMeeting(meetingId);

            // Navigate to RoomScreen with meeting data
            navigation.navigate('RoomScreen', {
                meeting,
                isHost: true,
            });
        } catch (error) {
            console.error('Failed to create meeting:', error);
            Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to create meeting'
            );
        } finally {
            setLoading(false);
        }
    };

    // Function to handle task selection
    const handleTaskSelect = (task: Task) => {
        setSelectedTask(task);
        setMeetingRoom(prev => ({ ...prev, taskId: task.id }));
        setShowTaskModal(false);
    };

    // Function to handle showing the task modal
    const handleShowTaskModal = () => {
        // Fetch the latest tasks before showing the modal
        fetchTasks();
        setShowTaskModal(true);
    };

    // Task modal component
    const renderTaskModal = () => (
        <Modal
            visible={showTaskModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowTaskModal(false)}
            onShow={() => fetchTasks()}
        >
            <View style={[styles.modalOverlay]}>
                <View style={[
                    styles.modalContent,
                    { backgroundColor: isDark ? '#1a1a1a' : 'white' }
                ]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: isDark ? 'white' : 'black' }]}>
                            Select a Team Task
                        </Text>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                                onPress={fetchTasks}
                                style={{ marginRight: 15 }}
                                disabled={isTasksLoading}
                            >
                                <Text style={{
                                    color: isTasksLoading ? (isDark ? '#555' : '#ccc') : (isDark ? '#2379C2' : '#2379C2'),
                                    fontSize: 16
                                }}>
                                    Refresh
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                                <Text style={{ color: isDark ? 'white' : 'black', fontSize: 16 }}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {isTasksLoading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={{ color: isDark ? 'white' : 'black' }}>Loading team tasks...</Text>
                        </View>
                    ) : tasks.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={{ color: isDark ? 'white' : 'black' }}>No team tasks found</Text>
                            <Text style={{ color: isDark ? '#aaa' : '#666', marginTop: 5 }}>
                                Create team tasks in the Team Tasks section first
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={tasks}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.taskItem,
                                        { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }
                                    ]}
                                    onPress={() => handleTaskSelect(item)}
                                >
                                    <View>
                                        <Text style={{
                                            color: isDark ? 'white' : 'black',
                                            fontWeight: 'bold',
                                            fontSize: 16
                                        }}>
                                            {item.title}
                                        </Text>
                                        {item.description ? (
                                            <Text
                                                style={{ color: isDark ? '#bbb' : '#666', marginTop: 5 }}
                                                numberOfLines={2}
                                            >
                                                {item.description}
                                            </Text>
                                        ) : null}
                                        <View style={{ flexDirection: 'row', marginTop: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View style={{ flexDirection: 'row' }}>
                                                <Text style={{
                                                    color: isDark ? '#aaa' : '#888',
                                                    fontSize: 12,
                                                    marginRight: 10
                                                }}>
                                                    {item.dueDate}
                                                </Text>
                                                <Text style={{
                                                    color: getPriorityColor(item.priority),
                                                    fontSize: 12
                                                }}>
                                                    {item.priority.toUpperCase()}
                                                </Text>
                                            </View>
                                            <Text style={{
                                                fontSize: 11,
                                                backgroundColor: '#1a9cd8',
                                                color: 'white',
                                                paddingHorizontal: 6,
                                                paddingVertical: 2,
                                                borderRadius: 10
                                            }}>
                                                {item.collaborators?.length || 0} Members
                                            </Text>
                                        </View>
                                        {/* Add progress bar */}
                                        <View style={{
                                            height: 4,
                                            backgroundColor: isDark ? '#404040' : '#e0e0e0',
                                            borderRadius: 2,
                                            marginTop: 8,
                                            overflow: 'hidden'
                                        }}>
                                            <View style={{
                                                height: '100%',
                                                width: `${item.progress || 0}%`,
                                                backgroundColor: item.completed ? '#34C759' : '#1a9cd8',
                                                borderRadius: 2
                                            }} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );

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

    const handleJoinRoom = async () => {
        if (!roomCode.trim()) {
            Alert.alert('Error', 'Please enter a room code');
            return;
        }

        try {
            setLoading(true);

            // Get meeting by room code
            const meeting = await meetingService.getMeetingByRoomCode(roomCode);

            // Navigate to RoomScreen with meeting data
            navigation.navigate('RoomScreen', {
                meeting,
                isHost: false,
            });
        } catch (error) {
            console.error('Failed to join meeting:', error);
            Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to join meeting'
            );
        } finally {
            setLoading(false);
        }
    };

    const renderCreateRoomForm = () => (
        <View style={styles.form}>
            <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark && styles.darkText]}>
                    Meeting Title
                </Text>
                <TextInput
                    style={[
                        styles.input,
                        isDark && styles.darkInput,
                        isDark && styles.darkText,
                    ]}
                    placeholder="Enter meeting title"
                    placeholderTextColor={isDark ? '#888888' : '#666666'}
                    value={meetingRoom.title}
                    onChangeText={text =>
                        setMeetingRoom(prev => ({ ...prev, title: text }))
                    }
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark && styles.darkText]}>
                    Description
                </Text>
                <TextInput
                    style={[
                        styles.input,
                        styles.textArea,
                        isDark && styles.darkInput,
                        isDark && styles.darkText,
                    ]}
                    placeholder="Enter meeting description"
                    placeholderTextColor={isDark ? '#888888' : '#666666'}
                    multiline
                    numberOfLines={4}
                    value={meetingRoom.description}
                    onChangeText={text =>
                        setMeetingRoom(prev => ({ ...prev, description: text }))
                    }
                />
            </View>

            {/* Task selection */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark && styles.darkText]}>
                    Associated Team Task (Optional)
                </Text>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                        style={[
                            styles.input,
                            styles.taskSelector,
                            isDark && styles.darkInput,
                            { flex: 1 }
                        ]}
                        onPress={handleShowTaskModal}
                    >
                        <Text style={[
                            selectedTask ? { color: isDark ? 'white' : 'black' } : { color: isDark ? '#888888' : '#666666' },
                        ]}>
                            {selectedTask ? selectedTask.title : "Select a team task for this meeting"}
                        </Text>
                    </TouchableOpacity>

                    {selectedTask && (
                        <TouchableOpacity
                            style={[
                                styles.clearButton,
                                { backgroundColor: isDark ? '#333' : '#f0f0f0', borderColor: isDark ? '#444' : '#ddd', }
                            ]}
                            onPress={() => {
                                setSelectedTask(null);
                                setMeetingRoom(prev => ({ ...prev, taskId: '' }));
                            }}
                        >
                            <Text style={{ color: isDark ? '#ff3b30' : '#ff3b30', marginVertical: 'auto', fontSize: 18, paddingBottom: 3 }}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark && styles.darkText]}>
                    Duration (minutes)
                </Text>
                <TextInput
                    style={[
                        styles.input,
                        isDark && styles.darkInput,
                        isDark && styles.darkText,
                    ]}
                    placeholder="Enter meeting duration"
                    placeholderTextColor={isDark ? '#888888' : '#666666'}
                    keyboardType="number-pad"
                    value={meetingRoom.duration.toString()}
                    onChangeText={text =>
                        setMeetingRoom(prev => ({
                            ...prev,
                            duration: parseInt(text) || 0,
                        }))
                    }
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark && styles.darkText]}>
                    Capacity
                </Text>
                <TextInput
                    style={[
                        styles.input,
                        isDark && styles.darkInput,
                        isDark && styles.darkText,
                    ]}
                    placeholder="Enter participant capacity"
                    placeholderTextColor={isDark ? '#888888' : '#666666'}
                    keyboardType="number-pad"
                    value={meetingRoom.capacity.toString()}
                    onChangeText={text =>
                        setMeetingRoom(prev => ({
                            ...prev,
                            capacity: parseInt(text) || 0,
                        }))
                    }
                />
            </View>
            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleCreateRoom}
                disabled={loading}>
                <Text style={styles.buttonText}>
                    {loading ? 'Creating...' : 'Create Meeting'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderJoinRoomForm = () => (
        <View style={styles.form}>
            <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark && styles.darkText]}>
                    Room Code
                </Text>
                <TextInput
                    style={[
                        styles.input,
                        isDark && styles.darkInput,
                        isDark && styles.darkText,
                    ]}
                    placeholder="Enter room code"
                    placeholderTextColor={isDark ? '#888888' : '#666666'}
                    value={roomCode}
                    onChangeText={setRoomCode}
                    autoCapitalize="characters"
                />
            </View>

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleJoinRoom}
                disabled={loading}>
                <Text style={styles.buttonText}>
                    {loading ? 'Joining...' : 'Join Meeting'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={[styles.container, isDark && styles.darkContainer]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={[
                styles.scrollContent,
                { padding: isSmallScreen ? 12 : 20 }
            ]}>
                <View style={styles.header}>
                    <Text style={[
                        styles.title,
                        isDark && styles.darkText,
                        isSmallScreen && styles.smallTitle
                    ]}>
                        Video Meeting
                    </Text>
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'create' && styles.activeTab,
                            isDark && styles.darkTab,
                            activeTab === 'create' && isDark && styles.darkActiveTab,
                        ]}
                        onPress={() => setActiveTab('create')}>
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === 'create' && styles.activeTabText,
                                isDark && styles.darkTabText,
                                activeTab === 'create' &&
                                isDark &&
                                styles.darkActiveTabText,
                                isSmallScreen && styles.smallTabText
                            ]}>
                            Create
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'join' && styles.activeTab,
                            isDark && styles.darkTab,
                            activeTab === 'join' && isDark && styles.darkActiveTab,
                        ]}
                        onPress={() => setActiveTab('join')}>
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === 'join' && styles.activeTabText,
                                isDark && styles.darkTabText,
                                activeTab === 'join' && isDark && styles.darkActiveTabText,
                                isSmallScreen && styles.smallTabText
                            ]}>
                            Join
                        </Text>
                    </TouchableOpacity>
                </View>
                {activeTab === 'create' ? renderCreateRoomForm() : renderJoinRoomForm()}
                {renderTaskModal()}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const { width } = Dimensions.get('window');
const isSmallDevice = width < 380;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    darkContainer: {
        backgroundColor: '#121212',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    smallTitle: {
        fontSize: 20,
    },
    darkText: {
        color: '#f5f5f5',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        paddingVertical: isSmallDevice ? 8 : 12,
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
    },
    activeTab: {
        backgroundColor: '#007AFF',
    },
    darkTab: {
        backgroundColor: '#333',
    },
    darkActiveTab: {
        backgroundColor: '#0055CC',
    },
    tabText: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: '600',
        color: '#555',
    },
    smallTabText: {
        fontSize: 14,
    },
    activeTabText: {
        color: 'white',
    },
    darkTabText: {
        color: '#ccc',
    },
    darkActiveTabText: {
        color: 'white',
    },
    form: {
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: isSmallDevice ? 12 : 16,
    },
    label: {
        fontSize: isSmallDevice ? 14 : 16,
        marginBottom: isSmallDevice ? 6 : 8,
        color: '#333',
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: isSmallDevice ? 10 : 12,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: isSmallDevice ? 14 : 16,
        color: '#333',
    },
    darkInput: {
        backgroundColor: '#2a2a2a',
        borderColor: '#444',
    },
    textArea: {
        height: isSmallDevice ? 80 : 100,
        textAlignVertical: 'top',
    },
    dateButton: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: isSmallDevice ? 10 : 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    dateButtonText: {
        fontSize: isSmallDevice ? 14 : 16,
        color: '#333',
    },
    privacyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleContainer: {
        padding: 4,
    },
    toggleSwitch: {
        width: isSmallDevice ? 44 : 50,
        height: isSmallDevice ? 24 : 28,
        borderRadius: isSmallDevice ? 12 : 14,
        backgroundColor: '#ccc',
        padding: 2,
    },
    toggleActive: {
        backgroundColor: '#007AFF',
    },
    toggleCircle: {
        width: isSmallDevice ? 20 : 24,
        height: isSmallDevice ? 20 : 24,
        borderRadius: isSmallDevice ? 10 : 12,
        backgroundColor: 'white',
    },
    toggleCircleActive: {
        transform: [{ translateX: isSmallDevice ? 20 : 22 }],
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: isSmallDevice ? 14 : 16,
        alignItems: 'center',
        marginTop: isSmallDevice ? 16 : 20,
    },
    buttonDisabled: {
        backgroundColor: '#999',
    },
    buttonText: {
        color: 'white',
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: '600',
    },
    taskSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 12,
        maxHeight: '80%',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    taskItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    clearButton: {
        padding: 8,
        borderRadius: 8,
        marginLeft: 8,
        borderWidth: 1,
    },
});

export default Room;