import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { CreateRoomFormProps } from '../types';
import { styles } from '../styles/Room';

/**
 * Form component for creating a new meeting room
 */
export const CreateRoomForm: React.FC<CreateRoomFormProps> = ({
    meetingRoom,
    onMeetingRoomChange,
    selectedTask,
    onShowTaskModal,
    onClearTask,
    onCreateRoom,
    loading,
    isDark,
}) => {
    return (
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
                    onChangeText={text => onMeetingRoomChange({ title: text })}
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
                    onChangeText={text => onMeetingRoomChange({ description: text })}
                />
            </View>

            {/* Task selection */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark && styles.darkText]}>
                    Associated Team Task (Optional)
                </Text>
                <View style={styles.flexRow}>
                    <TouchableOpacity
                        style={[
                            styles.input,
                            styles.taskSelector,
                            isDark && styles.darkInput,
                            styles.flex1,
                        ]}
                        onPress={onShowTaskModal}>
                        <Text
                            style={[
                                selectedTask
                                    ? (isDark ? styles.darkText : styles.lightText)
                                    : (isDark ? styles.placeholderTextDark : styles.placeholderTextLight),
                            ]}>
                            {selectedTask
                                ? selectedTask.title
                                : 'Select a team task for this meeting'}
                        </Text>
                    </TouchableOpacity>

                    {selectedTask && (
                        <TouchableOpacity
                            style={[
                                styles.clearButton,
                                isDark ? styles.clearButtonDark : styles.clearButtonLight,
                            ]}
                            onPress={onClearTask}>
                            <Text
                                style={styles.clearButtonText}>
                                ✕
                            </Text>
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
                        onMeetingRoomChange({ duration: parseInt(text, 10) || 0 })
                    }
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark && styles.darkText]}>Capacity</Text>
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
                        onMeetingRoomChange({ capacity: parseInt(text, 10) || 0 })
                    }
                />
            </View>

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={onCreateRoom}
                disabled={loading}>
                <Text style={styles.buttonText}>
                    {loading ? 'Creating...' : 'Create Meeting'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};
