import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { styles } from 'tasks/styles/Tasks.styles';
import { DuoTaskItemProps } from '../types';

const DuoTaskItem: React.FC<DuoTaskItemProps> = ({
    item,
    isDark,
    currentUserId,
    onPress,
    onEdit,
    onDelete,
    getPriorityColor,
    getStatusColor,
    getCollaboratorText,
}) => {
    const isOwner = item.userId === currentUserId;
    const iconColor = isDark ? '#8e8e8e' : '#666';

    const progressFillDynamic = {
        width: `${item.progress || 0}%` as const,
        backgroundColor: item.completed ? '#34C759' : '#1a9cd8',
    };

    return (
        <TouchableOpacity
            style={[styles.taskCard, isDark ? styles.cardDark : styles.cardLight]}
            onPress={() => onPress(item)}>
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
                    {isOwner && (
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
                    )}
                </View>

                <Text
                    style={[
                        styles.taskDescription,
                        isDark ? styles.descTextDark : styles.descTextLight,
                        item.completed && styles.completedTaskText,
                    ]}>
                    {item.description}
                </Text>

                {/* Progress bar */}
                <View style={styles.progressWrapper}>
                    <View style={styles.progressRow}>
                        <Text
                            style={[
                                styles.progressText,
                                isDark ? styles.metaTextDark : styles.metaTextLight,
                            ]}>
                            Progress: {item.progress || 0}%
                        </Text>
                        <View
                            style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
                            <Text style={styles.statusBadgeText}>
                                {item.completed ? 'Completed' : item.collaborationStatus}
                            </Text>
                        </View>
                    </View>
                    <View
                        style={[
                            styles.progressTrack,
                            isDark ? styles.progressTrackDark : styles.progressTrackLight,
                        ]}>
                        <View
                            style={[
                                styles.progressFill,
                                progressFillDynamic,
                            ]}
                        />
                    </View>
                </View>

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
                            {item.dueDate}
                        </Text>
                    </View>

                    <View style={styles.taskMeta}>
                        <Icon name="people-outline" size={14} color={iconColor} />
                        <Text
                            style={[
                                styles.taskMetaTextLeft,
                                isDark ? styles.metaTextDark : styles.metaTextLight,
                            ]}>
                            {getCollaboratorText(item)}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default React.memo(DuoTaskItem);
