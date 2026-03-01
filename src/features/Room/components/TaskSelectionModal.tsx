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
                        isDark ? styles.modalBgDark : styles.modalBgLight,
                    ]}>
                    <View style={styles.modalHeader}>
                        <Text
                            style={[
                                styles.modalTitle,
                                isDark ? styles.textWhite : styles.textBlack,
                            ]}>
                            Select a Team Task
                        </Text>
                        <View style={styles.flexRow}>
                            <TouchableOpacity
                                onPress={onRefresh}
                                style={styles.modalRefreshMargin}
                                disabled={isLoading}>
                                <Text
                                    style={[
                                        styles.modalRefreshText,
                                        isLoading
                                            ? isDark
                                                ? styles.refreshTextDisabledDark
                                                : styles.refreshTextDisabledLight
                                            : isDark
                                                ? styles.refreshTextActiveDark
                                                : styles.refreshTextActiveLight,
                                    ]}>
                                    Refresh
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose}>
                                <Text
                                    style={[
                                        styles.cancelText,
                                        isDark ? styles.textWhite : styles.textBlack,
                                    ]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={isDark ? styles.textWhite : styles.textBlack}>
                                Loading team tasks...
                            </Text>
                        </View>
                    ) : tasks.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={isDark ? styles.textWhite : styles.textBlack}>
                                No team tasks found
                            </Text>
                            <Text
                                style={[
                                    styles.subtitleText,
                                    isDark ? styles.subtitleTextDark : styles.subtitleTextLight,
                                ]}>
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
