import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { HackathonSummary, EventMode } from 'events-and-hackathons/types/hackathon';
import { getEventStatus, getSourceString, getSourceBackgroundColor } from '../utils';

interface EventCardProps {
    item: HackathonSummary;
    isDark: boolean;
    styles: any;
    onPress: (event: HackathonSummary) => void;
}

/**
 * EventCard component - renders a single hackathon/event card
 */
const EventCard: React.FC<EventCardProps> = ({ item, isDark, styles, onPress }) => {
    const sourceStr = getSourceString(item.source);
    const bgColor = getSourceBackgroundColor(sourceStr);
    const status = getEventStatus(item.startDate, item.endDate);

    return (
        <TouchableOpacity
            style={[
                styles.eventCard,
                isDark && styles.darkEventCard,
                status.type === 'ended' && styles.endedEventCard
            ]}
            onPress={() => onPress(item)}
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

export default EventCard;
