import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { styles } from 'conversations/styles/Chat';
import { MessageContextMenuProps } from '../types';

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
    visible,
    isDark,
    onClose,
    onEdit,
    onDelete,
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
                            color={isDark ? '#fff' : '#333'}
                        />
                        <Text style={[styles.contextMenuText, isDark && styles.darkContextMenuText]}>
                            Edit Message
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.contextMenuItem, styles.deleteMenuItem]}
                        onPress={onDelete}>
                        <MaterialIcons name="delete" size={20} color="#ff3b30" />
                        <Text style={[styles.contextMenuText, styles.deleteMenuText]}>
                            Delete Message
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default MessageContextMenu;
