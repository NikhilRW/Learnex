import React from 'react';
import {View, ScrollView, Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {createStyles} from 'events-and-hackathons/styles/EventDetails';
import {SCREEN_WIDTH} from 'shared/constants/common';

// Import modular components and hooks
import {
  EventLogo,
  EventDetailsLoading,
  EventDetailsError,
  EventDetailsNotFound,
  EventDetailsHeader,
  EventDetailsFooter,
} from '../components';
import {useEventDetails} from '../hooks';
import EventContent from '../components/EventContent';

/**
 * Component for Event Details screen
 */
const EventDetails: React.FC = () => {
  const {
    event,
    loading,
    error,
    isDark,
    fetchEventDetails,
    handleShare,
    handleOpenRegistration,
    goBack,
    navigateToEventsList,
  } = useEventDetails();

  const styles = createStyles(isDark);

  /**
   * Render the content based on loading/error state
   */
  const renderContent = () => {
    if (loading) {
      return <EventDetailsLoading styles={styles} />;
    }

    if (error) {
      return (
        <EventDetailsError
          error={error}
          styles={styles}
          onRetry={fetchEventDetails}
        />
      );
    }

    if (!event) {
      return <EventDetailsNotFound styles={styles} onGoBack={goBack} />;
    }

    return (
      <>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}>
          <View style={styles.logoHeaderContainer}>
            {event.imageUrl && event.imageUrl.startsWith('http') ? (
              <Image
                source={{uri: event.imageUrl}}
                style={styles.eventImageBanner}
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

          <EventContent event={event} />
        </ScrollView>

        <EventDetailsFooter
          isDark={isDark}
          styles={styles}
          onRegister={handleOpenRegistration}
          onShare={handleShare}
        />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <EventDetailsHeader
        isDark={isDark}
        styles={styles}
        onBackPress={navigateToEventsList}
      />

      {/* Main content */}
      {renderContent()}
    </SafeAreaView>
  );
};

export default EventDetails;
