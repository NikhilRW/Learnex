import {useEffect, useState} from 'react';
import {Share, Linking, Alert} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import {HackathonService} from 'events-and-hackathons/services/hackathonService';
import {HackathonDetails} from 'events-and-hackathons/types/hackathon';
import {UserStackParamList} from 'shared/navigation/routes/UserStack';

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
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';

  /**
   * Fetch event details from the API
   */
  const fetchEventDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const eventData = await HackathonService.getHackathonDetails(source, id);
      console.log('Event source in details:', source);
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
      console.error('Error sharing event:', err);
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
