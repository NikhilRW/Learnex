import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { JoinRoomFormProps } from '../types';
import { styles } from '../styles/Room';

/**
 * Form component for joining an existing meeting room
 */
export const JoinRoomForm: React.FC<JoinRoomFormProps> = ({
    roomCode,
    onRoomCodeChange,
    onJoinRoom,
    loading,
    isDark,
}) => {
    return (
        <View style={styles.form}>
            <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark && styles.darkText]}>Room Code</Text>
                <TextInput
                    style={[
                        styles.input,
                        isDark && styles.darkInput,
                        isDark && styles.darkText,
                    ]}
                    placeholder="Enter room code"
                    placeholderTextColor={isDark ? '#888888' : '#666666'}
                    value={roomCode}
                    onChangeText={onRoomCodeChange}
                    autoCapitalize="characters"
                />
            </View>

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={onJoinRoom}
                disabled={loading}>
                <Text style={styles.buttonText}>
                    {loading ? 'Joining...' : 'Join Meeting'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};
