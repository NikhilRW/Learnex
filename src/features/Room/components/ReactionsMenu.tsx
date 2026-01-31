import React from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { ReactionsMenuProps } from '../types/props';
import { styles } from '../styles/RoomComponent.styles';

const ReactionsMenu: React.FC<ReactionsMenuProps> = ({
    showReactions,
    reactionsMenuOpacity,
    onReaction,
}) => {
    if (!showReactions) {
        return null;
    }

    return (
        <Animated.View
            style={[styles.reactionsMenu, { opacity: reactionsMenuOpacity }]}>
            <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => onReaction('thumbsUp')}>
                <Text className="text-2xl font-bold">👍🏻</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => onReaction('thumbsDown')}>
                <Text className="text-2xl font-bold">👎🏻</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => onReaction('clapping')}>
                <Text className="text-2xl font-bold">👏🏻</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => onReaction('smiling')}>
                <Text className="text-2xl font-bold">😂</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default ReactionsMenu;
