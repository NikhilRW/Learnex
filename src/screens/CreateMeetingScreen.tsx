import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Text,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MeetingService } from '../service/firebase/MeetingService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

const meetingService = new MeetingService();

export const CreateMeetingScreen: React.FC = () => {
    const navigation = useNavigation();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date(Date.now() + 3600000)); // +1 hour
    const [isPrivate, setIsPrivate] = useState(false);
    const [maxParticipants, setMaxParticipants] = useState('10');
    const [loading, setLoading] = useState(false);

    const handleCreateMeeting = async () => {
        try {
            setLoading(true);

            const meetingData = {
                title,
                description,
                startTime,
                endTime,
                isPrivate,
                maxParticipants: parseInt(maxParticipants, 10),
                settings: {
                    muteOnEntry: true,
                    allowChat: true,
                    allowScreenShare: true,
                    recordingEnabled: false,
                },
            };

            const meetingId = await meetingService.createMeeting(meetingData);
            const meeting = await meetingService.getMeeting(meetingId);

            // Navigate to Room screen with meeting data
            navigation.navigate('Room', {
                meeting,
                isHost: true,
            });
        } catch (error) {
            Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to create meeting',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Meeting Title"
                    value={title}
                    onChangeText={setTitle}
                    placeholderTextColor="#666"
                />

                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Meeting Description"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    placeholderTextColor="#666"
                />

                <View style={styles.dateContainer}>
                    <Text style={styles.label}>Start Time</Text>
                    <DateTimePicker
                        value={startTime}
                        mode="datetime"
                        onChange={(_, date) => date && setStartTime(date)}
                    />
                </View>

                <View style={styles.dateContainer}>
                    <Text style={styles.label}>End Time</Text>
                    <DateTimePicker
                        value={endTime}
                        mode="datetime"
                        onChange={(_, date) => date && setEndTime(date)}
                    />
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Private Meeting</Text>
                    <TouchableOpacity
                        style={[styles.toggle, isPrivate && styles.toggleActive]}
                        onPress={() => setIsPrivate(!isPrivate)}
                    >
                        <Text style={styles.toggleText}>{isPrivate ? 'Yes' : 'No'}</Text>
                    </TouchableOpacity>
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Max Participants"
                    value={maxParticipants}
                    onChangeText={setMaxParticipants}
                    keyboardType="number-pad"
                    placeholderTextColor="#666"
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleCreateMeeting}
                    disabled={loading || !title.trim()}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>Create Meeting</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    form: {
        padding: 20,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    dateContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    toggle: {
        backgroundColor: '#f5f5f5',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        width: 80,
        alignItems: 'center',
    },
    toggleActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    toggleText: {
        fontSize: 16,
        color: '#333',
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default CreateMeetingScreen; 