import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ListLoadingProps, ListErrorProps, ListEmptyProps } from '../types';
/**
 * LoadingState component - renders loading indicator
 */
export const LoadingState: React.FC<ListLoadingProps> = ({ styles }) => {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2379C2" />
            <Text style={styles.loadingText}>
                Loading events...
            </Text>
        </View>
    );
};

/**
 * ErrorState component - renders error message with retry button
 */
export const ErrorState: React.FC<ListErrorProps> = ({ error, isDark, styles, onRetry }) => {
    return (
        <View style={styles.errorContainer}>
            <MaterialCommunityIcons
                name="cloud-alert"
                size={50}
                color={isDark ? '#ddd' : '#555'}
            />
            <Text style={[styles.errorText, isDark && styles.darkText]}>
                {error || "Something went wrong while fetching events"}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
        </View>
    );
};

/**
 * EmptyState component - renders empty state with reset filters button
 */
export const EmptyState: React.FC<ListEmptyProps> = ({ isDark, styles, onResetFilters }) => {
    return (
        <View style={styles.noEventsContainer}>
            <MaterialCommunityIcons
                name="calendar-remove"
                size={60}
                color={isDark ? '#555' : '#ddd'}
            />
            <Text style={styles.noEventsText}>
                No events found for the selected criteria.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={onResetFilters}>
                <Text style={styles.retryButtonText}>Reset Filters</Text>
            </TouchableOpacity>
        </View>
    );
};
