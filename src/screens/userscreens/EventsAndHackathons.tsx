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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { createStyles } from '../../styles/screens/EventsAndHackathons.styles';
import { HackathonService } from '../../service/hackathonService';
import { HackathonSummary, EventMode } from '../../types/hackathon';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, parseISO } from 'date-fns';
import EventLogo from '../../components/hackathons/EventLogo';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';

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
 * Formats a date string for display
 */
const formatDate = (dateInput: string | Date): string => {
    try {
        const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
        return format(date, 'dd MMM yyyy');
    } catch (err) {
        return String(dateInput);
    }
};

/**
 * Component for Events and Hackathons screen
 */
const EventsAndHackathons: React.FC = () => {
    const [events, setEvents] = useState<HackathonSummary[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<HackathonSummary[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<string>('India');
    const [locationModalVisible, setLocationModalVisible] = useState<boolean>(false);
    const [filterType, setFilterType] = useState<string>('all'); // all, online, in-person, hybrid
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const navigation = useNavigation();
    const isDark = useTypedSelector((state) => state.user.theme) === 'dark';
    const styles = createStyles(isDark);

    /**
     * Fetch events from the API
     */
    const fetchEvents = async (selectedLocation: string = location) => {
        setLoading(true);
        setError(null);
        try {
            // Get events from service
            const eventsData = await HackathonService.getHackathons(selectedLocation);
            setEvents(eventsData);
            applyFilters(eventsData, filterType);
        } catch (err) {
            console.error('Error fetching events:', err);
            setError('Failed to fetch events. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Apply filters to the events
     */
    const applyFilters = (eventsToFilter: HackathonSummary[], typeFilter: string) => {
        let filtered = [...eventsToFilter];

        // Filter by event type
        if (typeFilter !== 'all') {
            filtered = filtered.filter(event => event.mode === typeFilter);
        }

        setFilteredEvents(filtered);
    };

    /**
     * Initialize component by fetching events
     */
    useEffect(() => {
        fetchEvents();
    }, []);

    /**
     * Handle filter changes
     */
    const handleFilterChange = (newFilter: string) => {
        setFilterType(newFilter);
        applyFilters(events, newFilter);
    };

    /**
     * Handle location selection
     */
    const handleLocationSelect = (selectedLocation: string) => {
        setLocation(selectedLocation);
        setLocationModalVisible(false);
        fetchEvents(selectedLocation);
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
        setRefreshing(true);
        await fetchEvents();
        setRefreshing(false);
    };

    /**
     * Render event item
     */
    const renderItem = ({ item }: { item: HackathonSummary }) => {
        // Ensure event always has a valid image URL
        const imageUrl = item.imageUrl && item.imageUrl.startsWith('http')
            ? item.imageUrl
            : null;
        // Get source as string for reliable comparison
        const sourceStr = typeof item.source === 'string'
            ? item.source.toLowerCase()
            : String(item.source).toLowerCase();

        console.log("Event source:", sourceStr, "imageUrl:", imageUrl);

        return (
            <TouchableOpacity
                style={[styles.eventCard, isDark && styles.darkEventCard]}
                onPress={() => navigateToDetails(item)}
            >
                <View style={styles.eventHeader}>
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.eventLogo}
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={[styles.eventLogo, {
                            backgroundColor: sourceStr === 'hackerearth' ? '#3176B9' : '#6C4AA0',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.3)',
                        }]}>
                            {sourceStr === 'hackerearth' ? (
                                <FontAwesome name="code" size={22} color="#ffffff" />
                            ) : (<MaterialCommunityIcons name="rocket-launch" size={22} color="#ffffff" />
                            )}
                        </View>
                    )}
                    <View style={styles.eventHeaderText}>
                        <Text style={[styles.eventTitle, isDark && styles.darkText]}>
                            {item.title}
                        </Text>
                        <Text style={[styles.eventDate, isDark && styles.darkSubText]}>
                            {formatDate(new Date(item.startDate))} - {formatDate(new Date(item.endDate))}
                        </Text>
                    </View>
                </View>
                <Text
                    style={[styles.eventDescription, isDark && styles.darkSubText]}
                    numberOfLines={3}
                >
                    {item.description}
                </Text>
                <View style={styles.eventFooter}>
                    <View style={styles.locationContainer}>
                        <Ionicons
                            name="location-outline"
                            size={16}
                            color={isDark ? '#ddd' : '#555'}
                        />
                        <Text style={[styles.eventLocation, isDark && styles.darkSubText]}>
                            {item.location}
                        </Text>
                    </View>
                    <View style={styles.eventType}>
                        <Text
                            style={[
                                styles.eventTypeText,
                                {
                                    color:
                                        item.mode === EventMode.ONLINE
                                            ? '#007aff'
                                            : item.mode === EventMode.IN_PERSON
                                                ? '#ff9500'
                                                : '#5856d6',
                                },
                            ]}
                        >
                            {item.mode}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    /**
     * Render location selection item
     */
    const renderLocationItem = ({ item }: { item: string }) => {
        return (
            <TouchableOpacity
                style={styles.locationItem}
                onPress={() => handleLocationSelect(item)}
            >
                <Text style={styles.locationText}>{item}</Text>
            </TouchableOpacity>
        );
    };

    const renderErrorContent = () => (
        <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchEvents()}>
                <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <Text style={[styles.errorText, { marginTop: 20, fontSize: 14 }]}>
                Note: This feature requires the backend server to be running.
                Please make sure the backend server is started with 'npm run dev' in the backend folder.
            </Text>
        </View>
    );

    /**
     * Render main content based on loading/error state
     */
    const renderContent = () => {
        if (loading && !refreshing) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2379C2" />
                    <Text style={{ marginTop: 16, color: isDark ? '#ddd' : '#555' }}>
                        Loading events...
                    </Text>
                </View>

            );
        };
        if (error && !refreshing) {

            return renderErrorContent();
        }
        if (filteredEvents.length === 0 && !refreshing) {
            return (
                <View style={styles.noEventsContainer}>
                    <Text style={styles.noEventsText}>
                        No events found for the selected criteria.
                    </Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => {
                        setFilterType('all');
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
                        tintColor={isDark ? '#fff' : '#2379C2'}
                        title="Refreshing events..."
                        titleColor={isDark ? '#ddd' : '#555'}
                    />
                }
            />
        );
    };

    return (
        <SafeAreaView style={[styles.container]}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={isDark ? 'white' : 'black'} />
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome5Icon name='calendar-alt' size={24} color={isDark ? 'white' : 'black'} />
                    <Text style={[styles.headerTitle, { marginLeft: 10 }]}>Events & Hackathons</Text>
                </View>

                {/* Add refresh button */}
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={onRefresh}
                    disabled={refreshing || loading}
                >
                    {refreshing ? (
                        <ActivityIndicator size="small" color={isDark ? 'white' : 'black'} />
                    ) : (
                        <Ionicons name="refresh" size={24} color={isDark ? 'white' : 'black'} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Location selector */}
            <TouchableOpacity
                style={styles.locationButton}
                onPress={() => setLocationModalVisible(true)}
            >
                <Text style={styles.locationButtonText}>Location: {location}</Text>
                <Ionicons name="chevron-down" size={20} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>

            {/* Filters */}
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
                        All
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        filterType === 'online' && styles.filterButtonActive,
                    ]}
                    onPress={() => handleFilterChange('online')}
                >
                    <Text
                        style={[
                            styles.filterText,
                            filterType === 'online' && styles.filterTextActive,
                        ]}
                    >
                        Online
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        filterType === 'in-person' && styles.filterButtonActive,
                    ]}
                    onPress={() => handleFilterChange('in-person')}
                >
                    <Text
                        style={[
                            styles.filterText,
                            filterType === 'in-person' && styles.filterTextActive,
                        ]}
                    >
                        In-Person
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        filterType === 'hybrid' && styles.filterButtonActive,
                    ]}
                    onPress={() => handleFilterChange('hybrid')}
                >
                    <Text
                        style={[
                            styles.filterText,
                            filterType === 'hybrid' && styles.filterTextActive,
                        ]}
                    >
                        Hybrid
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Main content */}
            <View style={styles.content}>
                {renderContent()}
            </View>

            {/* Location selection modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={locationModalVisible}
                onRequestClose={() => setLocationModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setLocationModalVisible(false)}>
                    <View style={styles.modalContainer}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Select Location</Text>
                                <FlatList
                                    data={LOCATIONS}
                                    renderItem={renderLocationItem}
                                    keyExtractor={(item) => item}
                                />
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setLocationModalVisible(false)}
                                >
                                    <Text style={styles.closeButtonText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
};

export default EventsAndHackathons; 