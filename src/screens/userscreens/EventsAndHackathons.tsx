import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    Modal,
    TouchableWithoutFeedback,
    Platform,
    Linking,
    Image,
    StyleSheet,
    StatusBar,
    RefreshControl,
    ToastAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { createStyles } from '../../styles/screens/EventsAndHackathons.styles';
import { HackathonService } from '../../service/hackathonService';
import { HackathonSummary, EventMode, EventSource } from '../../types/hackathon';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, parseISO, isAfter, isBefore, isWithinInterval, addMinutes, addHours } from 'date-fns';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import { useDispatch } from 'react-redux';
import { fetchHackathons, refreshHackathons, setFilterType, clearHackathonCache } from '../../reducers/Hackathon';
import { AnyAction } from '@reduxjs/toolkit';
import LinearGradient from 'react-native-linear-gradient';

/**
 * SIMPLIFIED REFRESH APPROACH:
 * 
 * The backend now handles caching with a 5-minute threshold.
 * Frontend simply requests data and the backend decides whether to:
 * 1. Return cached data (if less than 5 minutes old)
 * 2. Do a fresh scrape (if cache is older than 5 minutes)
 * 
 * No frontend timestamp tracking is needed anymore.
 */

// Event locations for filter
const LOCATIONS = [
    'India',
    'Bangalore',
    'Mumbai',
    'Delhi',
    'Hyderabad',
    'Chennai',
    'Pune',
    'Kolkata',
];

/**
 * Format a date for display
 * @param dateString ISO date string
 * @returns Formatted date
 */
const formatDate = (dateString: string): string => {
    try {
        // Some date strings might already be formatted or invalid
        if (!dateString || dateString === "Invalid Date") {
            return "TBA";
        }

        // If it's already formatted like "25 May 2023", return as is
        if (/\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/.test(dateString)) {
            return dateString;
        }

        const date = parseISO(dateString);
        if (isNaN(date.getTime())) {
            return "TBA";
        }

        return format(date, 'dd MMM yyyy');
    } catch (error) {
        console.error("Error formatting date:", error);
        return "TBA";
    }
};

/**
 * Get event status based on start and end dates
 * @param startDate Event start date
 * @param endDate Event end date
 * @returns Status object with type and text
 */
const getEventStatus = (startDate: string, endDate: string): { type: 'upcoming' | 'live' | 'ended', text: string } => {
    try {
        const now = new Date();
        const start = parseISO(startDate);
        const end = parseISO(endDate);

        // Check if dates are valid
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return { type: 'upcoming', text: 'Dates TBA' };
        }

        // Check if event has ended
        if (isAfter(now, end)) {
            // Event has ended
            return { type: 'ended', text: 'Ended' };
        }

        // Check if event is live
        if (isWithinInterval(now, { start, end })) {
            // Calculate remaining time
            const hoursLeft = Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60));
            if (hoursLeft < 24) {
                return { type: 'live', text: `Live • ${hoursLeft}h left` };
            }
            const daysLeft = Math.round(hoursLeft / 24);
            return { type: 'live', text: `Live • ${daysLeft}d left` };
        }

        // Event is upcoming
        const daysToStart = Math.round((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysToStart <= 7) {
            if (daysToStart === 0) {
                const hoursToStart = Math.round((start.getTime() - now.getTime()) / (1000 * 60 * 60));
                return { type: 'upcoming', text: `Starts in ${hoursToStart}h` };
            }
            if (daysToStart === 1) {
                return { type: 'upcoming', text: 'Starts tomorrow' };
            }
            return { type: 'upcoming', text: `Starts in ${daysToStart} days` };
        }

        return { type: 'upcoming', text: formatDate(startDate) };
    } catch (error) {
        console.error('Error calculating event status:', error);
        return { type: 'upcoming', text: formatDate(startDate) };
    }
};

/**
 * Render error content when fetch fails
 */
const renderErrorContent = (error: string | null, isDark: boolean, retryFn: () => void, styles: any) => {
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
            <TouchableOpacity style={styles.retryButton} onPress={retryFn}>
                <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
        </View>
    );
};

/**
 * Component for Events and Hackathons screen
 */
const EventsAndHackathons: React.FC = () => {
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const dispatch = useDispatch();
    const navigation = useNavigation();

    // Get state from Redux
    const isDark = useTypedSelector((state) => state.user.theme) === 'dark';
    const { events, filteredEvents, loading, error, filterType, lastFetched } =
        useTypedSelector((state) => state.hackathon);
    const styles = createStyles(isDark);

    /**
     * Fetch events from the API
     */
    const fetchEvents = async (forceRefresh = false) => {
        try {
            // Dispatch the fetch action
            // The backend will handle the caching and decide if it needs to scrape
            const result = await dispatch(fetchHackathons({
                location: 'India',
                forceRefresh: forceRefresh
            }) as unknown as AnyAction);

            return result.type.includes('/fulfilled');
        } catch (error) {
            console.error('Error fetching events:', error);
            return false;
        }
    };

    /**
     * Effect for initial load and focus listener
     */
    useEffect(() => {
        console.log('Initial load: Fetching events');
        // Fetch once at initial load
        fetchEvents();

        // Add listener for when screen comes into focus
        const unsubscribeFocus = navigation.addListener('focus', () => {
            // Fetch fresh data when screen is focused
            console.log('Events screen focused, fetching data...');
            fetchEvents();
        });

        // Clean up the focus listener
        return () => {
            unsubscribeFocus();
        };
    }, [navigation]);

    /**
     * Handle filter changes
     */
    const handleFilterChange = (newFilter: string) => {
        dispatch(setFilterType(newFilter));
    };

    /**
     * Navigate to event details
     */
    const navigateToDetails = (event: HackathonSummary) => {
        // @ts-ignore - Ignoring type error since we know these are the correct params
        navigation.navigate('EventDetails', {
            id: event.id,
            source: event.source,
        });
    };

    /**
     * Handle refresh when pull-to-refresh is triggered
     */
    const onRefresh = async () => {
        console.log('User triggered Pull-to-Refresh');
        setRefreshing(true);

        try {
            // Clear the Redux cache first
            dispatch(clearHackathonCache());

            // Request fresh data with forceRefresh=true to ensure backend re-scrapes
            const success = await fetchEvents(true);

            if (success) {
                if (Platform.OS === 'android') {
                    ToastAndroid.show('Events refreshed successfully!', ToastAndroid.SHORT);
                }
            } else {
                if (Platform.OS === 'android') {
                    ToastAndroid.show('Failed to refresh events. Try again later.', ToastAndroid.LONG);
                }
            }
        } catch (error) {
            console.error('Error refreshing events:', error);
            if (Platform.OS === 'android') {
                ToastAndroid.show('Failed to refresh events. Check your network connection.', ToastAndroid.LONG);
            }
        } finally {
            setRefreshing(false);
        }
    };

    /**
     * Handle manual refresh from the reload button
     */
    const handleManualRefresh = async () => {
        console.log('User triggered Manual Refresh');

        if (Platform.OS === 'android') {
            ToastAndroid.show('Fetching latest events...', ToastAndroid.SHORT);
        }

        setRefreshing(true);

        try {
            // Clear the Redux cache first
            dispatch(clearHackathonCache());

            // Trigger a refresh on the backend to scrape fresh data
            try {
                // Trigger the backend to scrape fresh data
                const refreshResult = await HackathonService.refreshEvents({ waitForCompletion: true });

                if (refreshResult.success) {
                    console.log('Backend scraping successful');

                    if (Platform.OS === 'android') {
                        ToastAndroid.show('Events refreshed successfully!', ToastAndroid.SHORT);
                    }
                } else {
                    console.log('Backend scraping failed:', refreshResult.message);

                    // Show more specific error messages for common issues
                    if (Platform.OS === 'android') {
                        // Check if the error message contains timeout indicators
                        if (refreshResult.message &&
                            (refreshResult.message.includes('timed out') ||
                                refreshResult.message.includes('timeout') ||
                                refreshResult.message.includes('429'))) {
                            ToastAndroid.show('Scraping service timed out. Try again later.', ToastAndroid.LONG);
                        } else {
                            ToastAndroid.show(`Refresh failed: ${refreshResult.message}`, ToastAndroid.LONG);
                        }
                    }
                }
            } catch (error) {
                console.error('Error during server refresh:', error);
                if (Platform.OS === 'android') {
                    ToastAndroid.show('Server refresh failed.', ToastAndroid.LONG);
                }
            }

            // Even if server refresh failed, try to fetch available data
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const result = await dispatch(fetchHackathons({
                    location: 'India',
                    forceRefresh: true
                }) as unknown as AnyAction);

                const receivedData = result.type.includes('/fulfilled') &&
                    result.payload &&
                    Array.isArray(result.payload.events) &&
                    result.payload.events.length > 0;

                if (receivedData) {
                    console.log(`Loaded ${result.payload.events.length} events`);
                } else {
                    if (Platform.OS === 'android') {
                        ToastAndroid.show('No events found. Try again later.', ToastAndroid.LONG);
                    }
                }
            } catch (fetchError) {
                console.error('Error fetching events after refresh:', fetchError);
                if (Platform.OS === 'android') {
                    ToastAndroid.show('Failed to load events. Check your network connection.', ToastAndroid.LONG);
                }
            }
        } catch (error) {
            console.error('Error refreshing events:', error);
            if (Platform.OS === 'android') {
                ToastAndroid.show('Failed to refresh events.', ToastAndroid.LONG);
            }
        } finally {
            setRefreshing(false);
        }
    };

    /**
     * Render event item
     */
    const renderItem = ({ item }: { item: HackathonSummary }) => {
        // Determine source for display
        const sourceStr = typeof item.source === 'string'
            ? item.source
            : item.source === EventSource.HACKEREARTH
                ? 'hackerearth'
                : 'devfolio';

        // Get default background color based on source
        const bgColor = sourceStr === 'hackerearth' ? '#3176B9' : '#6C4AA0';

        // Get event status
        const status = getEventStatus(item.startDate, item.endDate);

        // Determine status color and styles
        let statusColor = '#888';
        let statusBgColor = '#f0f0f0';

        if (status.type === 'live') {
            statusColor = '#2e7d32';
            statusBgColor = '#e8f5e9';
        } else if (status.type === 'upcoming') {
            statusColor = '#0288d1';
            statusBgColor = '#e1f5fe';
        } else if (status.type === 'ended') {
            statusColor = '#757575';
            statusBgColor = '#eeeeee';
        }

        return (
            <TouchableOpacity
                style={[
                    styles.eventCard,
                    isDark && styles.darkEventCard,
                    status.type === 'ended' && styles.endedEventCard
                ]}
                onPress={() => navigateToDetails(item)}
                activeOpacity={0.7}
            >
                {status.type === 'live' && (
                    <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE NOW</Text>
                    </View>
                )}

                <View style={styles.eventHeader}>
                    {item.imageUrl && item.imageUrl.startsWith('http') ? (
                        <Image
                            source={{ uri: item.imageUrl }}
                            style={[styles.eventLogo, {
                                width: 56,
                                height: 56,
                                borderRadius: 12,
                                marginRight: 12,
                                opacity: status.type === 'ended' ? 0.7 : 1
                            }]}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.eventLogo, {
                            width: 56,
                            height: 56,
                            backgroundColor: bgColor,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.3)',
                            opacity: status.type === 'ended' ? 0.7 : 1
                        }]}>
                            {sourceStr === 'hackerearth' ? (
                                <MaterialCommunityIcons name="rocket-launch" size={24} color="#ffffff" />
                            ) : (
                                <MaterialCommunityIcons name="code-braces" size={24} color="#ffffff" />
                            )}
                        </View>
                    )}
                    <View style={styles.eventHeaderText}>
                        <Text
                            style={[
                                styles.eventTitle,
                                isDark && styles.darkText,
                                status.type === 'ended' && styles.endedEventTitle
                            ]}
                            numberOfLines={2}
                        >
                            {item.title}
                        </Text>

                        <View style={styles.eventMetaContainer}>
                            <Text
                                style={[
                                    styles.organizerText,
                                    isDark && styles.darkSubText,
                                    status.type === 'ended' && styles.endedEventSubText
                                ]}
                            >
                                by {sourceStr.charAt(0).toUpperCase() + sourceStr.slice(1)}
                            </Text>
                        </View>
                    </View>
                </View>

                <Text
                    style={[
                        styles.eventDescription,
                        isDark && styles.darkSubText,
                        status.type === 'ended' && styles.endedEventSubText
                    ]}
                    numberOfLines={2}
                >
                    {item.description}
                </Text>

                <View style={styles.eventFooter}>
                    <View style={styles.eventTypeContainer}>
                        <View
                            style={[
                                styles.eventTypeTag,
                                item.mode === EventMode.ONLINE
                                    ? styles.onlineTag
                                    : item.mode === EventMode.IN_PERSON
                                        ? styles.inPersonTag
                                        : styles.hybridTag,
                                status.type === 'ended' && styles.endedOpacity
                            ]}
                        >
                            <Text style={[
                                styles.eventTypeText,
                                item.mode === EventMode.ONLINE
                                    ? styles.onlineEventTypeText
                                    : item.mode === EventMode.IN_PERSON
                                        ? styles.inPersonEventTypeText
                                        : styles.hybridEventTypeText,
                                status.type === 'ended' && styles.endedOpacity
                            ]}>
                                {item.mode === EventMode.ONLINE
                                    ? 'Online'
                                    : item.mode === EventMode.IN_PERSON
                                        ? 'In-Person'
                                        : 'Hybrid'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.locationContainer}>
                        <Ionicons
                            name="location-outline"
                            size={14}
                            color={isDark ? '#aaa' : '#666'}
                            style={[status.type === 'ended' && styles.endedOpacity]}
                        />
                        <Text
                            style={[
                                styles.locationText,
                                isDark && styles.darkSubText,
                                status.type === 'ended' && styles.endedEventSubText
                            ]}
                        >
                            {item.location || 'Location TBA'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    /**
     * Render main content based on loading/error state
     */
    const renderContent = () => {
        if (loading && !refreshing) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2379C2" />
                    <Text style={styles.loadingText}>
                        Loading events...
                    </Text>
                </View>
            );
        }

        if (error && !refreshing) {
            return renderErrorContent(error, isDark, () => fetchEvents(), styles);
        }

        if (filteredEvents.length === 0 && !refreshing) {
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
                    <TouchableOpacity style={styles.retryButton} onPress={() => {
                        handleFilterChange('all');
                        fetchEvents();
                    }}>
                        <Text style={styles.retryButtonText}>Reset Filters</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <FlatList
                data={filteredEvents}
                renderItem={renderItem}
                keyExtractor={(item, index) => {
                    // Create a reliable, unique key that doesn't change on re-render
                    // Using index as a fallback if id is undefined or empty
                    const id = item.id || `item-${index}`;
                    return `${item.source}-${id}`;
                }}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2379C2']}
                        tintColor={isDark ? '#ffffff' : '#2379C2'}
                    />
                }
            />
        );
    };

    return (
        <SafeAreaView style={[styles.container]}>
            {/* Header with title */}
            <LinearGradient
                colors={isDark ? ['#1a1a1a', '#121212'] : ['#ffffff', '#f8f8f8']}
                style={styles.headerContainer}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={isDark ? 'white' : 'black'} />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <FontAwesome5Icon name='calendar-alt' size={24} color={isDark ? 'white' : 'black'} />
                    <Text style={[styles.headerTitle, styles.headerTitleMargin]}>Open Hackathons</Text>
                </View>

                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={handleManualRefresh}
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

            {/* Mode Filters */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        filterType === 'all' && styles.filterButtonActive,
                    ]}
                    onPress={() => handleFilterChange('all')}
                >
                    <Text
                        style={[
                            styles.filterText,
                            filterType === 'all' && styles.filterTextActive,
                        ]}
                    >
                        All Types
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        filterType === 'online' && styles.onlineFilterButtonActive,
                    ]}
                    onPress={() => handleFilterChange('online')}
                >
                    <Text
                        style={[
                            styles.filterText,
                            filterType === 'online' && styles.onlineFilterTextActive,
                        ]}
                    >
                        Online
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        filterType === 'in-person' && styles.inPersonFilterButtonActive,
                    ]}
                    onPress={() => handleFilterChange('in-person')}
                >
                    <Text
                        style={[
                            styles.filterText,
                            filterType === 'in-person' && styles.inPersonFilterTextActive,
                        ]}
                    >
                        In-Person
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Main content */}
            {renderContent()}
        </SafeAreaView>
    );
};

export default EventsAndHackathons;