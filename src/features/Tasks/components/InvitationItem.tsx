import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { styles } from 'tasks/styles/Tasks.styles';
import { InvitationItemProps } from '../types';

const InvitationItem: React.FC<InvitationItemProps> = ({
    item,
    isDark,
    currentUserId,
    onAccept,
    onDecline,
}) => {
    const iconColor = isDark ? '#8e8e8e' : '#666';

    return (
        <View style={[styles.taskCard, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={styles.taskContent}>
                <View style={styles.taskHeader}>
                    <Text
                        style={[styles.taskTitle, isDark ? styles.textDark : styles.textLight]}>
                        {item.title}
                    </Text>
                </View>

                <Text
                    style={[
                        styles.taskDescription,
                        isDark ? styles.descTextDark : styles.descTextLight,
                    ]}>
                    {item.description}
                </Text>

                <View style={styles.taskFooter}>
                    <View style={styles.taskMeta}>
                        <Icon name="person-outline" size={14} color={iconColor} />
                        <Text
                            style={[
                                styles.taskMetaTextLeft,
                                isDark ? styles.metaTextDark : styles.metaTextLight,
                            ]}>
                            From: {item.userId === currentUserId ? 'You' : 'Team Member'}
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
                </View>

                <View style={styles.inviteActions}>
                    <TouchableOpacity
                        style={styles.declineButton}
                        onPress={() => onDecline(item.id)}>
                        <Text style={styles.inviteButtonText}>Decline</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => onAccept(item.id)}>
                        <Text style={styles.inviteButtonText}>Join Team</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default React.memo(InvitationItem);
