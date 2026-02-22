import { View, Text } from 'react-native';
import React from 'react';
import { createStyles } from 'events-and-hackathons/styles/EventDetails';
import { useTypedSelector } from '@/shared/hooks/redux/useTypedSelector';
import { formatDate } from '../utils';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  TimelineSection,
  PrizeSection,
  RulesSection,
  AdditionalInfoSection,
  SponsorsSection,
  TagsSection,
  EligibilitySection,
  TeamSizeSection,
} from '../components';
import { EventContentProps } from '../types';

const EventContent: React.FC<EventContentProps> = ({ event }) => {
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  const styles = createStyles(isDark);
  return (
    <View style={styles.content}>
      <Text style={styles.eventTitle}>{event.title}</Text>
      <Text style={styles.sourceLabel}>
        {event.source === 'hackerearth'
          ? 'HackerEarth Event'
          : 'Devfolio Event'}
      </Text>
      <Text style={styles.eventDescription}>{event.description}</Text>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="calendar-outline" size={20} color="#2379C2" />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Dates</Text>
            <Text style={styles.infoText}>
              {formatDate(event.startDate as string)} -{' '}
              {formatDate(event.endDate as string)}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="location-outline" size={20} color="#2379C2" />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoText}>
              {event.location || 'Not specified'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="layers-outline" size={20} color="#2379C2" />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Event Type</Text>
            <Text style={styles.infoText}>
              {event.mode === 'online'
                ? 'Online Event'
                : event.mode === 'hybrid'
                  ? 'Hybrid Event'
                  : 'In-person Event'}
            </Text>
          </View>
        </View>
      </View>

      {/* Optional sections - render only if data exists */}
      <TimelineSection event={event} styles={styles} />
      <PrizeSection event={event} styles={styles} />
      <RulesSection event={event} styles={styles} />
      <AdditionalInfoSection event={event} styles={styles} />
      <SponsorsSection event={event} styles={styles} />
      <TagsSection event={event} styles={styles} />
      <EligibilitySection event={event} styles={styles} />
      <TeamSizeSection event={event} styles={styles} />
    </View>
  );
};

export default EventContent;
