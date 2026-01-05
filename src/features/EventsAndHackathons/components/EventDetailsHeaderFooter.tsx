import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface EventDetailsHeaderProps {
    isDark: boolean;
    styles: any;
    onBackPress: () => void;
}

interface EventDetailsFooterProps {
    isDark: boolean;
    styles: any;
    onRegister: () => void;
    onShare: () => void;
}

/**
 * Header component for Event Details screen
 */
export const EventDetailsHeader: React.FC<EventDetailsHeaderProps> = ({
    isDark,
    styles,
    onBackPress,
}) => {
    return (
        <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
                <Ionicons
                    name="arrow-back"
                    size={24}
                    color={isDark ? 'white' : 'black'}
                />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Event Details</Text>
        </View>
    );
};

/**
 * Footer component with Register and Share buttons
 */
export const EventDetailsFooter: React.FC<EventDetailsFooterProps> = ({
    isDark,
    styles,
    onRegister,
    onShare,
}) => {
    return (
        <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.registerButton} onPress={onRegister}>
                <Text style={styles.registerButtonText}>Register Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareButton} onPress={onShare}>
                <Ionicons
                    name="share-social-outline"
                    size={20}
                    color={isDark ? '#ddd' : '#444'}
                />
                <Text style={styles.shareButtonText}>Share Event</Text>
            </TouchableOpacity>
        </View>
    );
};
