import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from '../styles/Chat.styles';
import { EditMessageModalProps } from '../types';

export const EditMessageModal: React.FC<EditMessageModalProps> = ({
    editText,
    isDark,
    onChangeText,
    onSave,
    onCancel,
}) => {
    return (
        <View style={[styles.editContainer, isDark && styles.darkEditContainer]}>
            <View style={styles.editHeader}>
                <Text style={[styles.editHeaderText, isDark && styles.darkText]}>
                    Edit Message
                </Text>
                <TouchableOpacity onPress={onCancel} style={styles.closeEditButton}>
                    <Icon name="close" size={24} color={isDark ? '#ffffff' : '#000000'} />
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
                    onPress={onCancel}
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
