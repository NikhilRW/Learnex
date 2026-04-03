import {useEffect, useState} from 'react';
import {Share, Linking, Alert} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import {selectIsDark} from 'shared/store/selectors';
import {HackathonService} from '../services';
import {HackathonDetails} from '../types';
import {UserStackParamList} from 'shared/navigation/routes/UserStack';
import {logger} from 'shared/utils/logger';

type EventDetailsRouteProp = RouteProp<UserStackParamList, 'EventDetails'>;

/**
 * Custom hook for Event Details screen logic
 *
 * Encapsulates:
 * - Event data fetching
 * - Loading and error states
 * - Share functionality
 * - Registration link handling
 * - Navigation
 */
export const useEventDetails = () => {
  const [event, setEvent] = useState<HackathonDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation();
  const route = useRoute<EventDetailsRouteProp>();
  const {id, source} = route.params;
  const isDark = useTypedSelector(selectIsDark);

  /**
   * Fetch event details from the API
   */
  const fetchEventDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const eventData = await HackathonService.getHackathonDetails(source, id);
      logger.debug('Event source in details:', source, 'EventDetails');
      setEvent(eventData);
    } catch (err) {
      logger.error('Error fetching event details:', err, 'EventDetails');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, source]);

  /**
   * Share event with others
   */
  const handleShare = async () => {
    if (!event) return;

    try {
      await Share.share({
        title: event.title,
        message: `Check out this event: ${event.title}\n\n${event.description}\n\nRegister at: ${event.url}`,
        url: event.url,
      });
    } catch (err) {
      logger.error('Error sharing event:', err, 'EventDetails');
    }
  };

  /**
   * Handle opening the registration link
   */
  const handleOpenRegistration = () => {
    if (!event) return;

    Linking.canOpenURL(event.url).then(supported => {
      if (supported) {
        Linking.openURL(event.url);
      } else {
        Alert.alert(
          'Cannot Open URL',
          'Unable to open the registration link. Please try manually visiting ' +
            event.url,
          [{text: 'OK'}],
        );
      }
    });
  };

  /**
   * Navigate back
   */
  const goBack = () => {
    navigation.goBack();
  };

  /**
   * Navigate to events list
   */
  const navigateToEventsList = () => {
    // @ts-ignore - Ignoring type error since we know this screen exists
    navigation.navigate('EventsAndHackathons');
  };

  return {
    // State
    event,
    loading,
    error,
    isDark,

    // Actions
    fetchEventDetails,
    handleShare,
    handleOpenRegistration,
    goBack,
    navigateToEventsList,
  };
};

export default useEventDetails;
