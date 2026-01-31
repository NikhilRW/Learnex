import React from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { LegendList } from '@legendapp/list';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { QuickMessagesMenuProps } from '../types/props';
import { QUICK_MESSAGES } from '../constants/common';
import { styles } from '../styles/RoomComponent.styles';

const QuickMessagesMenu: React.FC<QuickMessagesMenuProps> = ({
    showQuickMessages,
    quickMessagesMenuOpacity,
    onClose,
    onSendQuickMessage,
}) => {
    if (!showQuickMessages) {
        return null;
    }

    return (
        <Animated.View
            style={[styles.quickMessagesMenu, { opacity: quickMessagesMenuOpacity }]}>
            <View style={styles.quickMessagesHeader}>
                <TouchableOpacity onPress={onClose}>
                    <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
            <LegendList
                data={QUICK_MESSAGES}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.quickMessageItem}
                        onPress={() => onSendQuickMessage(item)}>
                        <Text style={styles.quickMessageText}>{item}</Text>
                    </TouchableOpacity>
                )}
                style={styles.quickMessagesList}
                estimatedItemSize={50}
                recycleItems={true}
            />
        </Animated.View>
    );
};

export default QuickMessagesMenu;
