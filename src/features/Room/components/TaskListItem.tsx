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
                isDark ? styles.taskItemBgDark : styles.taskItemBgLight,
            ]}
            onPress={() => onPress(item)}>
            <View>
                <Text
                    style={[
                        styles.taskItemTitle,
                        isDark ? styles.textWhite : styles.textBlack,
                    ]}>
                    {item.title}
                </Text>
                {item.description ? (
                    <Text
                        style={[
                            styles.taskItemDescription,
                            isDark ? styles.descriptionTextDark : styles.descriptionTextLight,
                        ]}
                        numberOfLines={2}>
                        {item.description}
                    </Text>
                ) : null}
                <View style={styles.taskItemMetaRow}>
                    <View style={styles.flexRow}>
                        <Text
                            style={[
                                styles.taskItemDate,
                                isDark ? styles.dateTextDark : styles.dateTextLight,
                            ]}>
                            {item.dueDate}
                        </Text>
                        <Text
                            style={[
                                styles.taskItemPriority,
                                { color: getPriorityColor(item.priority) },
                            ]}>
                            {item.priority.toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.taskItemMemberBadge}>
                        {item.collaborators?.length || 0} Members
                    </Text>
                </View>
                {/* Progress bar */}
                <View
                    style={[
                        styles.taskItemProgressTrack,
                        isDark ? styles.progressTrackBgDark : styles.progressTrackBgLight,
                    ]}>
                    <View
                        style={[
                            styles.taskItemProgressFill,
                            {
                                width: `${item.progress || 0}%`,
                            },
                            item.completed ? styles.progressFillCompleted : styles.progressFillActive,
                        ]}
                    />
                </View>
            </View>
        </TouchableOpacity>
    );
};
