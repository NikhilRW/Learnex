import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { HackathonDetails } from 'events-and-hackathons/types/hackathon';

interface EventSectionsProps {
    event: HackathonDetails;
    styles: any;
}

/**
 * Render the event timeline section
 */
export const TimelineSection: React.FC<EventSectionsProps> = ({
    event,
    styles,
}) => {
    if (!event?.timeline || event.timeline.length === 0) {
        return null;
    }

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Timeline</Text>
            {event.timeline.map((item, index) => (
                <View key={index} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineContent}>
                        <Text style={styles.timelineDate}>{item.date}</Text>
                        <Text style={styles.timelineEvent}>{item.event}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
};

/**
 * Render the prize section
 */
export const PrizeSection: React.FC<EventSectionsProps> = ({ event, styles }) => {
    // Check for the new prize field
    if (event?.prize) {
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Prizes</Text>
                <Text style={styles.sectionContent}>{event.prize}</Text>
            </View>
        );
    }

    // Fallback to legacy prizes structure if the new format is not available
    if (event?.prizes) {
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Prizes</Text>
                {event.prizes.first && (
                    <Text style={styles.sectionContent}>
                        🥇 First Prize: {event.prizes.first}
                    </Text>
                )}
                {event.prizes.second && (
                    <Text style={styles.sectionContent}>
                        🥈 Second Prize: {event.prizes.second}
                    </Text>
                )}
                {event.prizes.third && (
                    <Text style={styles.sectionContent}>
                        🥉 Third Prize: {event.prizes.third}
                    </Text>
                )}
                {event.prizes.other && event.prizes.other.length > 0 && (
                    <Text style={styles.sectionContent}>
                        🎁 Additional Prizes: {event.prizes.other.join(', ')}
                    </Text>
                )}
            </View>
        );
    }

    return null;
};

/**
 * Render rules section
 */
export const RulesSection: React.FC<EventSectionsProps> = ({ event, styles }) => {
    if (!event?.rules && !event?.rulesUrl) {
        return null;
    }

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rules</Text>
            {event.rules && (
                <Text style={styles.sectionContent}>{event.rules}</Text>
            )}
            {event.rulesUrl && (
                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => Linking.openURL(event.rulesUrl || '')}>
                    <Text style={styles.linkButtonText}>View Rules</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

/**
 * Render additional info section
 */
export const AdditionalInfoSection: React.FC<EventSectionsProps> = ({
    event,
    styles,
}) => {
    if (!event?.additionalInfo) {
        return null;
    }

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            <Text style={styles.sectionContent}>{event.additionalInfo}</Text>
        </View>
    );
};

/**
 * Render sponsors section
 */
export const SponsorsSection: React.FC<EventSectionsProps> = ({
    event,
    styles,
}) => {
    if (!event?.sponsors || event.sponsors.length === 0) {
        return null;
    }

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sponsors</Text>
            <View style={styles.sponsorsContainer}>
                {event.sponsors.map((sponsor, index) => (
                    <Text key={index} style={styles.sponsorItem}>
                        • {sponsor}
                    </Text>
                ))}
            </View>
        </View>
    );
};

/**
 * Render tags section
 */
export const TagsSection: React.FC<EventSectionsProps> = ({ event, styles }) => {
    if (!event?.tags || event.tags.length === 0) {
        return null;
    }

    return (
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
    );
};

/**
 * Render eligibility section
 */
export const EligibilitySection: React.FC<EventSectionsProps> = ({
    event,
    styles,
}) => {
    if (!event?.eligibility) {
        return null;
    }

    return (
        <>
            <Text style={styles.sectionTitle}>Eligibility</Text>
            <Text style={styles.eventDescription}>{event.eligibility}</Text>
        </>
    );
};

/**
 * Render team size section
 */
export const TeamSizeSection: React.FC<EventSectionsProps> = ({
    event,
    styles,
}) => {
    if (!event?.teamSize) {
        return null;
    }

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team Size</Text>
            <Text style={styles.sectionContent}>
                {event.teamSize.min === event.teamSize.max
                    ? `Exactly ${event.teamSize.min} ${event.teamSize.min === 1 ? 'person' : 'people'} per team`
                    : `${event.teamSize.min} to ${event.teamSize.max} people per team`}
            </Text>
        </View>
    );
};
