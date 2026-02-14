import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { LegendList } from '@legendapp/list';
import { TaskSelectionModalProps } from '../types';
import { TaskListItem } from './TaskListItem';
import { styles } from '../styles/Room';

/**
 * Modal component for selecting tasks from a list
 */
export const TaskSelectionModal: React.FC<TaskSelectionModalProps> = ({
    visible,
    tasks,
    isLoading,
    onTaskSelect,
    onRefresh,
    onClose,
    isDark,
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
            onShow={onRefresh}>
            <View style={[styles.modalOverlay]}>
                <View
                    style={[
                        styles.modalContent,
                        { backgroundColor: isDark ? '#1a1a1a' : 'white' },
                    ]}>
                    <View style={styles.modalHeader}>
                        <Text
                            style={[styles.modalTitle, { color: isDark ? 'white' : 'black' }]}>
                            Select a Team Task
                        </Text>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                                onPress={onRefresh}
                                style={{ marginRight: 15 }}
                                disabled={isLoading}>
                                <Text
                                    style={{
                                        color: isLoading
                                            ? isDark
                                                ? '#555'
                                                : '#ccc'
                                            : isDark
                                                ? '#2379C2'
                                                : '#2379C2',
                                        fontSize: 16,
                                    }}>
                                    Refresh
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose}>
                                <Text style={{ color: isDark ? 'white' : 'black', fontSize: 16 }}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={{ color: isDark ? 'white' : 'black' }}>
                                Loading team tasks...
                            </Text>
                        </View>
                    ) : tasks.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={{ color: isDark ? 'white' : 'black' }}>
                                No team tasks found
                            </Text>
                            <Text style={{ color: isDark ? '#aaa' : '#666', marginTop: 5 }}>
                                Create team tasks in the Team Tasks section first
                            </Text>
                        </View>
                    ) : (
                        <LegendList
                            data={tasks}
                            keyExtractor={item => item.id}
                            estimatedItemSize={100}
                            recycleItems={true}
                            renderItem={({ item }) => (
                                <TaskListItem item={item} onPress={onTaskSelect} isDark={isDark} />
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};
