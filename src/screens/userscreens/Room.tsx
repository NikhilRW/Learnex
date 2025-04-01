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
} from 'react-native';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { userState } from '../../types/userType';
import { MeetingService } from '../../service/firebase/MeetingService';
import { UserStackParamList } from '../../routes/UserStack';

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
}

const meetingService = new MeetingService();

const Room = () => {
    const navigation = useNavigation<DrawerNavigationProp<UserStackParamList>>();
    const userTheme = useTypedSelector(state => state.user) as userState;
    const isDark = userTheme.theme === 'dark';
    const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const { width, height } = useWindowDimensions();
    const isSmallScreen = width < 380;

    const [meetingRoom, setMeetingRoom] = useState<MeetingRoom>({
        title: '',
        description: '',
        duration: 60,
        capacity: 10,
        isPrivate: false,
        host: 'Current User', // Will be replaced with actual user data
    });
    const handleCreateRoom = async () => {
        // Validate form
        if (!meetingRoom.title.trim()) {
            Alert.alert('Error', 'Please enter a meeting title');
            return;
        }
        if(meetingRoom.duration < 1) {
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
});

export default Room;