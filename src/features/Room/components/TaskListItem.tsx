import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TaskListItemProps } from '../types';
import { getPriorityColor } from '../utils/helpers';
import { styles } from '../styles/Room';

/**
 * Component for rendering an individual task item in the task list
 */
export const TaskListItem: React.FC<TaskListItemProps> = ({
    item,
    onPress,
    isDark,
}) => {
    return (
        <TouchableOpacity
            style={[
                styles.taskItem,
                { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' },
            ]}
            onPress={() => onPress(item)}>
            <View>
                <Text
                    style={{
                        color: isDark ? 'white' : 'black',
                        fontWeight: 'bold',
                        fontSize: 16,
                    }}>
                    {item.title}
                </Text>
                {item.description ? (
                    <Text
                        style={{ color: isDark ? '#bbb' : '#666', marginTop: 5 }}
                        numberOfLines={2}>
                        {item.description}
                    </Text>
                ) : null}
                <View
                    style={{
                        flexDirection: 'row',
                        marginTop: 8,
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                    <View style={{ flexDirection: 'row' }}>
                        <Text
                            style={{
                                color: isDark ? '#aaa' : '#888',
                                fontSize: 12,
                                marginRight: 10,
                            }}>
                            {item.dueDate}
                        </Text>
                        <Text
                            style={{
                                color: getPriorityColor(item.priority),
                                fontSize: 12,
                            }}>
                            {item.priority.toUpperCase()}
                        </Text>
                    </View>
                    <Text
                        style={{
                            fontSize: 11,
                            backgroundColor: '#1a9cd8',
                            color: 'white',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 10,
                        }}>
                        {item.collaborators?.length || 0} Members
                    </Text>
                </View>
                {/* Progress bar */}
                <View
                    style={{
                        height: 4,
                        backgroundColor: isDark ? '#404040' : '#e0e0e0',
                        borderRadius: 2,
                        marginTop: 8,
                        overflow: 'hidden',
                    }}>
                    <View
                        style={{
                            height: '100%',
                            width: `${item.progress || 0}%`,
                            backgroundColor: item.completed ? '#34C759' : '#1a9cd8',
                            borderRadius: 2,
                        }}
                    />
                </View>
            </View>
        </TouchableOpacity>
    );
};
