import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { styles } from '../styles/SavedPosts';
import { SavedPostsEmptyStateProps } from '../types';

const SavedPostsEmptyState: React.FC<SavedPostsEmptyStateProps> = ({
    isDark,
    onExplore,
}) => (
    <View style={styles.emptyContainer}>
        <MaterialIcons
            name="bookmark-border"
            size={80}
            color={isDark ? '#4a4a4a' : '#cccccc'}
        />
        <Text
            style={[
                styles.emptyTitle,
                isDark ? styles.darkEmptyTitle : styles.lightEmptyTitle,
            ]}>
            No Saved Posts
        </Text>
        <Text
            style={[
                styles.emptyText,
                isDark ? styles.darkEmptyText : styles.lightEmptyText,
            ]}>
            Posts you save will appear here. Tap the bookmark icon on any post to save
            it for later.
        </Text>
        <TouchableOpacity style={styles.exploreButton} onPress={onExplore}>
            <Text style={styles.exploreButtonText}>Explore Posts</Text>
        </TouchableOpacity>
    </View>
);

export default SavedPostsEmptyState;
