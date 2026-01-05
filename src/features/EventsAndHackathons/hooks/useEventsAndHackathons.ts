import {useEffect, useState, useCallback} from 'react';
import {Platform, ToastAndroid} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import {AnyAction} from '@reduxjs/toolkit';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import {HackathonService} from '@/features/EventsAndHackathons/services/hackathonService';
import {HackathonSummary} from 'events-and-hackathons/types/hackathon';
import {
  fetchHackathons,
  setFilterType,
  clearHackathonCache,
} from 'shared/reducers/Hackathon';

/**
 * Toast helper to show messages on Android
 */
const showToast = (message: string, duration: 'short' | 'long' = 'short') => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(
      message,
      duration === 'short' ? ToastAndroid.SHORT : ToastAndroid.LONG,
    );
  }
};

/**
 * Custom hook for Events and Hackathons screen logic
 *
 * Encapsulates:
 * - Redux state management
 * - Event fetching and caching
 * - Pull-to-refresh and manual refresh
 * - Filter management
 * - Navigation
 */
export const useEventsAndHackathons = () => {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  // Get state from Redux
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  const {events, filteredEvents, loading, error, filterType, lastFetched} =
    useTypedSelector(state => state.hackathon);

  /**
   * Fetch events from the API
   */
  const fetchEvents = useCallback(
    async (forceRefresh = false): Promise<boolean> => {
      try {
        const result = await dispatch(
          fetchHackathons({
            location: 'India',
            forceRefresh: forceRefresh,
          }) as unknown as AnyAction,
        );

        return result.type.includes('/fulfilled');
      } catch (fetchError) {
        console.error('Error fetching events:', fetchError);
        return false;
      }
    },
    [dispatch],
  );

  /**
   * Effect for initial load and focus listener
   */
  useEffect(() => {
    console.log('Initial load: Fetching events');
    fetchEvents();

    // Add listener for when screen comes into focus
    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log('Events screen focused, fetching data...');
      fetchEvents();
    });

    return () => {
      unsubscribeFocus();
    };
    // eslint-disable-next-line
  }, [navigation]);

  /**
   * Handle filter changes
   */
  const handleFilterChange = useCallback(
    (newFilter: string) => {
      dispatch(setFilterType(newFilter));
    },
    [dispatch],
  );

  /**
   * Navigate to event details
   */
  const navigateToDetails = useCallback(
    (event: HackathonSummary) => {
      // @ts-ignore - Ignoring type error since we know these are the correct params
      navigation.navigate('EventDetails', {
        id: event.id,
        source: event.source,
      });
    },
    [navigation],
  );

  /**
   * Handle refresh when pull-to-refresh is triggered
   */
  const onRefresh = useCallback(async () => {
    console.log('User triggered Pull-to-Refresh');
    setRefreshing(true);

    try {
      dispatch(clearHackathonCache());
      const success = await fetchEvents(true);

      if (success) {
        showToast('Events refreshed successfully!');
      } else {
        showToast('Failed to refresh events. Try again later.', 'long');
      }
    } catch (refreshError) {
      console.error('Error refreshing events:', refreshError);
      showToast(
        'Failed to refresh events. Check your network connection.',
        'long',
      );
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, fetchEvents]);

  /**
   * Handle manual refresh from the reload button
   */
  const handleManualRefresh = useCallback(async () => {
    console.log('User triggered Manual Refresh');
    showToast('Fetching latest events...');
    setRefreshing(true);

    try {
      dispatch(clearHackathonCache());

      // Trigger backend scraping
      try {
        const refreshResult = await HackathonService.refreshEvents({
          waitForCompletion: true,
        });

        if (refreshResult.success) {
          console.log('Backend scraping successful');
          showToast('Events refreshed successfully!');
        } else {
          console.log('Backend scraping failed:', refreshResult.message);

          if (
            refreshResult.message &&
            (refreshResult.message.includes('timed out') ||
              refreshResult.message.includes('timeout') ||
              refreshResult.message.includes('429'))
          ) {
            showToast('Scraping service timed out. Try again later.', 'long');
          } else {
            showToast(`Refresh failed: ${refreshResult.message}`, 'long');
          }
        }
      } catch (serverError) {
        console.error('Error during server refresh:', serverError);
        showToast('Server refresh failed.', 'long');
      }

      // Wait briefly then fetch available data
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const result = await dispatch(
          fetchHackathons({
            location: 'India',
            forceRefresh: false,
          }) as unknown as AnyAction,
        );

        const receivedData =
          result.type.includes('/fulfilled') &&
          result.payload &&
          Array.isArray(result.payload.events) &&
          result.payload.events.length > 0;

        if (receivedData) {
          console.log(`Loaded ${result.payload.events.length} events`);
        } else {
          showToast('No events found. Try again later.', 'long');
        }
      } catch (fetchError) {
        console.error('Error fetching events after refresh:', fetchError);
        showToast(
          'Failed to load events. Check your network connection.',
          'long',
        );
      }
    } catch (manualRefreshError) {
      console.error('Error refreshing events:', manualRefreshError);
      showToast('Failed to refresh events.', 'long');
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  /**
   * Handle reset filters and fetch
   */
  const handleResetFilters = useCallback(() => {
    handleFilterChange('all');
    fetchEvents();
  }, [handleFilterChange, fetchEvents]);

  /**
   * Go back navigation
   */
  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    // State
    isDark,
    events,
    filteredEvents,
    loading,
    error,
    filterType,
    lastFetched,
    refreshing,

    // Actions
    fetchEvents,
    handleFilterChange,
    navigateToDetails,
    onRefresh,
    handleManualRefresh,
    handleResetFilters,
    goBack,
  };
};

export default useEventsAndHackathons;
