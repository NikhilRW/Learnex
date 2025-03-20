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
} from 'react-native';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { userState } from '../../types/userType';
import { MeetingService } from '../../service/firebase/MeetingService';
import { UserStackParamList } from '../../routes/UserStack';

interface MeetingRoom {
    id?: string;
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
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

    const [meetingRoom, setMeetingRoom] = useState<MeetingRoom>({
        title: '',
        description: '',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000), // Default 1 hour duration
        capacity: 10,
        isPrivate: false,
        host: 'Current User', // Will be replaced with actual user data
    });

    const handleDateChange = (
        event: DateTimePickerEvent,
        selectedDate: Date | undefined,
        isStartTime: boolean,
    ) => {
        if (Platform.OS === 'android') {
            setShowStartPicker(false);
            setShowEndPicker(false);
        }

        if (selectedDate) {
            if (isStartTime) {
                // Ensure end time is after start time
                const newEndTime =
                    selectedDate > meetingRoom.endTime
                        ? new Date(selectedDate.getTime() + 3600000)
                        : meetingRoom.endTime;

                setMeetingRoom(prev => ({
                    ...prev,
                    startTime: selectedDate,
                    endTime: newEndTime,
                }));
            } else {
                if (selectedDate <= meetingRoom.startTime) {
                    Alert.alert('Invalid Time', 'End time must be after start time');
                    return;
                }
                setMeetingRoom(prev => ({
                    ...prev,
                    endTime: selectedDate,
                }));
            }
        }
    };

    const handleCreateRoom = async () => {
        // Validate form
        if (!meetingRoom.title.trim()) {
            Alert.alert('Error', 'Please enter a meeting title');
            return;
        }

        if (meetingRoom.endTime <= meetingRoom.startTime) {
            Alert.alert('Error', 'End time must be after start time');
            return;
        }

        try {
            setLoading(true);

            // Create meeting using MeetingService
            const meetingData = {
                title: meetingRoom.title,
                description: meetingRoom.description,
                startTime: meetingRoom.startTime,
                endTime: meetingRoom.endTime,
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
                    Start Time
                </Text>
                <TouchableOpacity
                    style={[styles.dateButton, isDark && styles.darkInput]}
                    onPress={() => setShowStartPicker(true)}>
                    <Text style={[styles.dateButtonText, isDark && styles.darkText]}>
                        {meetingRoom.startTime.toLocaleString()}
                    </Text>
                </TouchableOpacity>
                {showStartPicker && (
                    <DateTimePicker
                        value={meetingRoom.startTime}
                        mode="datetime"
                        display="default"
                        onChange={(event, date) => handleDateChange(event, date, true)}
                    />
                )}
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark && styles.darkText]}>
                    End Time
                </Text>
                <TouchableOpacity
                    style={[styles.dateButton, isDark && styles.darkInput]}
                    onPress={() => setShowEndPicker(true)}>
                    <Text style={[styles.dateButtonText, isDark && styles.darkText]}>
                        {meetingRoom.endTime.toLocaleString()}
                    </Text>
                </TouchableOpacity>
                {showEndPicker && (
                    <DateTimePicker
                        value={meetingRoom.endTime}
                        mode="datetime"
                        display="default"
                        onChange={(event, date) => handleDateChange(event, date, false)}
                    />
                )}
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

            <View style={styles.inputGroup}>
                <View style={styles.privacyContainer}>
                    <Text style={[styles.label, isDark && styles.darkText]}>
                        Private Meeting
                    </Text>
                    <TouchableOpacity
                        style={styles.toggleContainer}
                        onPress={() =>
                            setMeetingRoom(prev => ({
                                ...prev,
                                isPrivate: !prev.isPrivate,
                            }))
                        }>
                        <View
                            style={[
                                styles.toggleSwitch,
                                meetingRoom.isPrivate && styles.toggleActive,
                            ]}>
                            <View
                                style={[
                                    styles.toggleCircle,
                                    meetingRoom.isPrivate && styles.toggleCircleActive,
                                ]}
                            />
                        </View>
                    </TouchableOpacity>
                </View>
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
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.title, isDark && styles.darkText]}>
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
        paddingVertical: 12,
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
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
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
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333',
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
        color: '#333',
    },
    darkInput: {
        backgroundColor: '#2a2a2a',
        borderColor: '#444',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    dateButton: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    dateButtonText: {
        fontSize: 16,
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
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#ccc',
        padding: 2,
    },
    toggleActive: {
        backgroundColor: '#007AFF',
    },
    toggleCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'white',
    },
    toggleCircleActive: {
        transform: [{ translateX: 22 }],
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonDisabled: {
        backgroundColor: '#999',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default Room;