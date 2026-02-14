import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MessageReactionsMenuProps } from '../types';
import { styles } from '../styles/RoomComponent.styles';

const MessageReactionsMenu: React.FC<MessageReactionsMenuProps> = ({
    showMessageReactions,
    onClose,
    onReaction,
}) => {
    if (!showMessageReactions) {
        return null;
    }

    return (
        <View style={styles.messageReactionsMenu}>
            <View style={styles.messageReactionsHeader}>
                <Text style={styles.messageReactionsTitle}>Add reaction</Text>
                <TouchableOpacity onPress={onClose}>
                    <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
            <View style={styles.messageReactionsButtons}>
                <TouchableOpacity
                    style={styles.messageReactionButton}
                    onPress={() => onReaction('thumbsUp')}>
                    <Text className="text-sm font-bold">👍🏻</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.messageReactionButton}
                    onPress={() => onReaction('thumbsDown')}>
                    <Text className="text-sm font-bold">👎🏻</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.messageReactionButton}
                    onPress={() => onReaction('heart')}>
                    <Text className="text-sm font-bold">❤️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.messageReactionButton}
                    onPress={() => onReaction('laugh')}>
                    <Text className="text-sm font-bold">😀</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default MessageReactionsMenu;
