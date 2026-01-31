import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { styles } from '../styles/Chat.styles';

export interface MessageContextMenuProps {
    visible: boolean;
    isDark: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
    visible,
    isDark,
    onEdit,
    onDelete,
    onClose,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}>
                <View style={[styles.contextMenu, isDark && styles.darkContextMenu]}>
                    <TouchableOpacity style={styles.contextMenuItem} onPress={onEdit}>
                        <MaterialIcons
                            name="edit"
                            size={20}
                            color={isDark ? '#ffffff' : '#333333'}
                        />
                        <Text style={[styles.contextMenuText, isDark && styles.darkText]}>
                            Edit Message
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.contextMenuItem, styles.deleteMenuItem]}
                        onPress={onDelete}>
                        <MaterialIcons name="delete" size={20} color="#ff3b30" />
                        <Text style={styles.deleteText}>Delete Message</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};
