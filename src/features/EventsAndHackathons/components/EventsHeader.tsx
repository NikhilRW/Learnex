import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';

interface EventsHeaderProps {
    isDark: boolean;
    loading: boolean;
    styles: any;
    onBackPress: () => void;
    onRefreshPress: () => void;
}

/**
 * EventsHeader component - renders the header with title and navigation
 */
const EventsHeader: React.FC<EventsHeaderProps> = ({
    isDark,
    loading,
    styles,
    onBackPress,
    onRefreshPress,
}) => {
    return (
        <LinearGradient
            colors={isDark ? ['#1a1a1a', '#121212'] : ['#ffffff', '#f8f8f8']}
            style={styles.headerContainer}
        >
            <TouchableOpacity
                style={styles.backButton}
                onPress={onBackPress}
            >
                <Ionicons name="arrow-back" size={24} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
                <FontAwesome5Icon name='calendar-alt' size={24} color={isDark ? 'white' : 'black'} />
                <Text style={[styles.headerTitle, styles.headerTitleMargin]}>Open Hackathons</Text>
            </View>

            <TouchableOpacity
                style={styles.refreshButton}
                onPress={onRefreshPress}
                disabled={loading}
            >
                <Ionicons
                    name="refresh"
                    size={24}
                    color={isDark ? 'white' : 'black'}
                    style={[loading && styles.refreshButtonDisabled]}
                />
            </TouchableOpacity>
        </LinearGradient>
    );
};

export default EventsHeader;
