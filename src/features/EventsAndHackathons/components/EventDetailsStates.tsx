import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
    EventDetailsLoadingProps,
    EventDetailsErrorProps,
    EventDetailsNotFoundProps,
} from '../types';

/**
 * Loading state for event details
 */
export const EventDetailsLoading: React.FC<EventDetailsLoadingProps> = ({ styles }) => {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2379C2" />
            <Text style={styles.loadingText}>Loading event details...</Text>
        </View>
    );
};

/**
 * Error state for event details
 */
export const EventDetailsError: React.FC<EventDetailsErrorProps> = ({
    error,
    styles,
    onRetry,
}) => {
    return (
        <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <Text style={styles.errorNote}>
                Note: This feature requires the backend server to be running. Please
                make sure the backend server is started with 'npm run dev' in the
                backend folder.
            </Text>
        </View>
    );
};

/**
 * Not found state for event details
 */
export const EventDetailsNotFound: React.FC<EventDetailsNotFoundProps> = ({
    styles,
    onGoBack,
}) => {
    return (
        <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Event details not found.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onGoBack}>
                <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );
};
