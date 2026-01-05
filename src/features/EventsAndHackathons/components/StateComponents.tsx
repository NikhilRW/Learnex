import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface LoadingStateProps {
    styles: any;
}

/**
 * LoadingState component - renders loading indicator
 */
export const LoadingState: React.FC<LoadingStateProps> = ({ styles }) => {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2379C2" />
            <Text style={styles.loadingText}>
                Loading events...
            </Text>
        </View>
    );
};

interface ErrorStateProps {
    error: string | null;
    isDark: boolean;
    styles: any;
    onRetry: () => void;
}

/**
 * ErrorState component - renders error message with retry button
 */
export const ErrorState: React.FC<ErrorStateProps> = ({ error, isDark, styles, onRetry }) => {
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

interface EmptyStateProps {
    isDark: boolean;
    styles: any;
    onResetFilters: () => void;
}

/**
 * EmptyState component - renders empty state with reset filters button
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ isDark, styles, onResetFilters }) => {
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
