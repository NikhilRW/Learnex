import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { styles } from 'conversations/styles/Chat';
import { EditMessageInputProps } from '../types';

const EditMessageInput: React.FC<EditMessageInputProps> = ({
    isDark,
    editText,
    onChangeText,
    onClose,
    onSave,
}) => {
    return (
        <View style={[styles.editContainer, isDark && styles.darkEditContainer]}>
            <View style={styles.editHeader}>
                <Text style={[styles.editHeaderText, isDark && styles.darkEditHeaderText]}>
                    Edit Message
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeEditButton}>
                    <Ionicons
                        name="close"
                        size={24}
                        color={isDark ? 'white' : 'black'}
                    />
                </TouchableOpacity>
            </View>

            <TextInput
                style={[styles.editInput, isDark && styles.darkEditInput]}
                value={editText}
                onChangeText={onChangeText}
                multiline
                autoFocus
            />

            <View style={styles.editActions}>
                <TouchableOpacity
                    onPress={onClose}
                    style={[styles.editButton, styles.cancelButton]}>
                    <Text style={styles.editButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onSave}
                    style={[styles.editButton, styles.saveButton]}
                    disabled={!editText.trim()}>
                    <Text style={styles.editButtonText}>Save</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default EditMessageInput;
