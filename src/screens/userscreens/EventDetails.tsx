import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    Share,
    Linking,
    Alert,
    Dimensions,
    Image
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { UserStackParamList } from '../../routes/UserStack';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { createStyles } from '../../styles/screens/EventDetails.styles';
import { HackathonService } from '../../service/hackathonService';
import { HackathonDetails } from '../../types/hackathon';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, formatDistance, parseISO, isPast } from 'date-fns';
import EventLogo from '../../components/hackathons/EventLogo';

// Get screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type EventDetailsRouteProp = RouteProp<UserStackParamList, 'EventDetails'>;

/**
 * Formats a date string for display
 */
const formatDate = (dateString: string): string => {
    try {
        const date = parseISO(dateString);
        return format(date, 'dd MMMM yyyy, h:mm a');
    } catch (err) {
        return dateString;
    }
};

/**
 * Gets the time remaining string
 */
const getTimeRemaining = (dateString: string): { timeString: string; isPast: boolean } => {
    try {
        const date = parseISO(dateString);
        const now = new Date();
        const past = isPast(date);

        if (past) {
            return {
                timeString: `Ended ${formatDistance(date, now, { addSuffix: true })}`,
                isPast: true
            };
        }

        return {
            timeString: `Starts ${formatDistance(date, now, { addSuffix: true })}`,
            isPast: false
        };
    } catch (err) {
        return { timeString: 'Date information unavailable', isPast: false };
    }
};

/**
 * Component for Event Details screen
 */
const EventDetails: React.FC = () => {
    const [event, setEvent] = useState<HackathonDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const navigation = useNavigation();
    const route = useRoute<EventDetailsRouteProp>();
    const { id, source } = route.params;
    const isDark = useTypedSelector((state) => state.user.theme) === 'dark';
    const styles = createStyles(isDark);

    /**
     * Fetch event details from the API
     */
    const fetchEventDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const eventData = await HackathonService.getHackathonDetails(source, id);
            console.log("Event source in details:", source);
            setEvent(eventData);
        } catch (err) {
            console.error('Error fetching event details:', err);
            setError('Failed to fetch event details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Initialize by fetching event details
     */
    useEffect(() => {
        fetchEventDetails();
    }, [id, source]);

    /**
     * Share event with others
     */
    const handleShare = async () => {
        if (!event) return;

        try {
            const result = await Share.share({
                title: event.title,
                message: `Check out this event: ${event.title}\n\n${event.description}\n\nRegister at: ${event.url}`,
                url: event.url
            });
        } catch (error) {
            console.error('Error sharing event:', error);
        }
    };

    /**
     * Open registration URL
     */
    const handleOpenRegistration = () => {
        if (!event) return;

        // Check if registration deadline has passed
        try {
            const deadline = parseISO(event.registrationDeadline);
            if (isPast(deadline)) {
                Alert.alert(
                    'Registration Closed',
                    'The registration deadline for this event has passed.',
                    [{ text: 'OK' }]
                );
                return;
            }
        } catch (err) {
            // Continue if date parsing fails
        }

        // Open URL
        Linking.canOpenURL(event.url).then(supported => {
            if (supported) {
                Linking.openURL(event.url);
            } else {
                Alert.alert(
                    'Cannot Open URL',
                    'Unable to open the registration link. Please try manually visiting ' + event.url,
                    [{ text: 'OK' }]
                );
            }
        });
    };

    const renderErrorContent = () => (
        <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchEventDetails}
            >
                <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <Text style={[styles.errorText, { marginTop: 20, fontSize: 14 }]}>
                Note: This feature requires the backend server to be running.
                Please make sure the backend server is started with 'npm run dev' in the backend folder.
            </Text>
        </View>
    );

    /**
     * Render the content based on loading/error state
     */
    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2379C2" />
                    <Text style={{ marginTop: 16, color: isDark ? '#ddd' : '#555' }}>
                        Loading event details...
                    </Text>
                </View>
            );
        }

        if (error) {
            return renderErrorContent();
        }

        if (!event) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Event details not found.</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.retryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Calculate time remaining
        const { timeString, isPast } = getTimeRemaining(event.startDate);

        return (
            <>
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.logoHeaderContainer}>
                        {event.imageUrl && event.imageUrl.startsWith('http') ? (
                            <Image
                                source={{ uri: event.imageUrl }}
                                className='w-[90vw] h-[30vh] object-center '
                                style={{borderRadius: 20,width: SCREEN_WIDTH * 0.9, height: SCREEN_WIDTH * 0.4}}
                                resizeMode="contain"
                            />
                        ) : (
                            <EventLogo
                                source={event.source}
                                size={SCREEN_WIDTH * 0.4}
                                isDark={isDark}
                                style={styles.eventLogo}
                            />
                        )}
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <Text style={styles.sourceLabel}>
                            {event.source === 'hackerearth' ? 'HackerEarth Event' : 'Devfolio Event'}
                        </Text>

                        <View style={[styles.timeRemainingContainer, isPast && styles.timePassed]}>
                            <Text style={[styles.timeRemainingText, isPast && styles.timePassedText]}>
                                {timeString}
                            </Text>
                        </View>

                        <Text style={styles.eventDescription}>{event.description}</Text>

                        <View style={styles.infoContainer}>
                            <View style={styles.infoRow}>
                                <View style={styles.infoIcon}>
                                    <Ionicons name="calendar-outline" size={20} color={isDark ? '#2379C2' : '#2379C2'} />
                                </View>
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Dates</Text>
                                    <Text style={styles.infoText}>
                                        {formatDate(event.startDate)} - {formatDate(event.endDate)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <View style={styles.infoIcon}>
                                    <Ionicons name="location-outline" size={20} color={isDark ? '#2379C2' : '#2379C2'} />
                                </View>
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Location</Text>
                                    <Text style={styles.infoText}>{event.location}</Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <View style={styles.infoIcon}>
                                    <MaterialCommunityIcons
                                        name={event.mode === 'online' ? 'web' : event.mode === 'hybrid' ? 'laptop' : 'map-marker'}
                                        size={20}
                                        color={isDark ? '#2379C2' : '#2379C2'}
                                    />
                                </View>
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Event Type</Text>
                                    <Text style={styles.infoText}>
                                        {event.mode === 'online' ? 'Online Event' : event.mode === 'hybrid' ? 'Hybrid Event' : 'In-person Event'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <View style={styles.infoIcon}>
                                    <Ionicons name="time-outline" size={20} color={isDark ? '#2379C2' : '#2379C2'} />
                                </View>
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoLabel}>Registration Deadline</Text>
                                    <Text style={styles.infoText}>{formatDate(event.registrationDeadline)}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Optional sections - render only if data exists */}

                        {event.prizes && (
                            <>
                                <Text style={styles.sectionTitle}>Prizes</Text>
                                <View style={styles.prizeContainer}>
                                    {event.prizes.first && (
                                        <View style={styles.prizeRow}>
                                            <Text style={styles.prizeLabel}>1st Prize:</Text>
                                            <Text style={styles.prizeValue}>{event.prizes.first}</Text>
                                        </View>
                                    )}
                                    {event.prizes.second && (
                                        <View style={styles.prizeRow}>
                                            <Text style={styles.prizeLabel}>2nd Prize:</Text>
                                            <Text style={styles.prizeValue}>{event.prizes.second}</Text>
                                        </View>
                                    )}
                                    {event.prizes.third && (
                                        <View style={styles.prizeRow}>
                                            <Text style={styles.prizeLabel}>3rd Prize:</Text>
                                            <Text style={styles.prizeValue}>{event.prizes.third}</Text>
                                        </View>
                                    )}
                                    {event.prizes.other && event.prizes.other.map((prize, index) => (
                                        <View key={index} style={styles.prizeRow}>
                                            <Text style={styles.prizeLabel}>Other:</Text>
                                            <Text style={styles.prizeValue}>{prize}</Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}

                        {event.sponsors && event.sponsors.length > 0 && (
                            <>
                                <Text style={styles.sectionTitle}>Sponsors</Text>
                                <View style={styles.sponsorsContainer}>
                                    {event.sponsors.map((sponsor, index) => (
                                        <Text key={index} style={styles.sponsorItem}>• {sponsor}</Text>
                                    ))}
                                </View>
                            </>
                        )}

                        {event.tags && event.tags.length > 0 && (
                            <>
                                <Text style={styles.sectionTitle}>Tags</Text>
                                <View style={styles.tagsContainer}>
                                    {event.tags.map((tag, index) => (
                                        <View key={index} style={styles.tag}>
                                            <Text style={styles.tagText}>{tag}</Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}

                        {event.teamSize && (
                            <>
                                <Text style={styles.sectionTitle}>Team Size</Text>
                                <Text style={styles.eventDescription}>
                                    {event.teamSize.min === event.teamSize.max
                                        ? `Exactly ${event.teamSize.min} ${event.teamSize.min === 1 ? 'person' : 'people'} per team`
                                        : `${event.teamSize.min} to ${event.teamSize.max} people per team`}
                                </Text>
                            </>
                        )}

                        {event.eligibility && (
                            <>
                                <Text style={styles.sectionTitle}>Eligibility</Text>
                                <Text style={styles.eventDescription}>{event.eligibility}</Text>
                            </>
                        )}
                    </View>
                </ScrollView>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.registerButton}
                        onPress={handleOpenRegistration}
                    >
                        <Text style={styles.registerButtonText}>Register Now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.shareButton}
                        onPress={handleShare}
                    >
                        <Ionicons name="share-social-outline" size={20} color={isDark ? '#ddd' : '#444'} />
                        <Text style={styles.shareButtonText}>Share Event</Text>
                    </TouchableOpacity>
                </View>
            </>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        // @ts-ignore - Ignoring type error since we know this screen exists
                        navigation.navigate('EventsAndHackathons');
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color={isDark ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Event Details</Text>
            </View>

            {/* Main content */}
            {renderContent()}
        </SafeAreaView>
    );
};

export default EventDetails; 