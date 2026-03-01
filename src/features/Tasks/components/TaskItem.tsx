import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { styles } from 'tasks/styles/Tasks.styles';
import { TaskItemProps } from '../types';

const TaskItem: React.FC<TaskItemProps> = ({
    item,
    isDark,
    onToggle,
    onEdit,
    onDelete,
    getPriorityColor,
}) => {
    const iconColor = isDark ? '#8e8e8e' : '#666';

    return (
        <View style={[styles.taskCard, isDark ? styles.cardDark : styles.cardLight]}>
            <TouchableOpacity
                style={styles.taskCheckbox}
                onPress={() => onToggle(item.id)}>
                <View
                    style={[styles.checkbox, item.completed && styles.checkboxCompleted]}>
                    {item.completed && <Icon name="checkmark" size={16} color="white" />}
                </View>
            </TouchableOpacity>

            <View style={styles.taskContent}>
                <View style={styles.taskHeader}>
                    <Text
                        style={[
                            styles.taskTitle,
                            isDark ? styles.textDark : styles.textLight,
                            item.completed && styles.completedTaskTitle,
                        ]}>
                        {item.title}
                    </Text>
                    <View style={styles.taskActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => onEdit(item)}>
                            <Icon name="pencil" size={20} color={iconColor} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => onDelete(item.id)}>
                            <Icon name="trash-outline" size={20} color={iconColor} />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text
                    style={[
                        styles.taskDescription,
                        isDark ? styles.descTextDark : styles.descTextLight,
                        item.completed && styles.completedTaskText,
                    ]}>
                    {item.description}
                </Text>

                <View style={styles.taskFooter}>
                    <View style={styles.taskMeta}>
                        <View
                            style={[
                                styles.priorityIndicator,
                                { backgroundColor: getPriorityColor(item.priority) },
                            ]}
                        />
                        <Text
                            style={[
                                styles.taskMetaText,
                                isDark ? styles.metaTextDark : styles.metaTextLight,
                            ]}>
                            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                        </Text>
                    </View>

                    <View style={styles.taskMeta}>
                        <Icon name="calendar-outline" size={14} color={iconColor} />
                        <Text
                            style={[
                                styles.taskMetaTextLeft,
                                isDark ? styles.metaTextDark : styles.metaTextLight,
                            ]}>
                            {item.dueDate} {item.dueTime && `at ${item.dueTime}`}
                        </Text>
                    </View>

                    <View style={styles.taskCategory}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default React.memo(TaskItem);
