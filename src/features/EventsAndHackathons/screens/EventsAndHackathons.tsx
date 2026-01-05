import { LegendList } from '@legendapp/list';
import React, { useCallback } from 'react';
import { RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createStyles } from 'events-and-hackathons/styles/EventsAndHackathons';
import { HackathonSummary } from 'events-and-hackathons/types/hackathon';

// Import modular components and hooks
import {
    EventCard,
    EventsHeader,
    FilterBar,
    LoadingState,
    ErrorState,
    EmptyState,
} from '../components';
import { useEventsAndHackathons } from '../hooks';

/**
 * Component for Events and Hackathons screen
 */
const EventsAndHackathons: React.FC = () => {
    const {
        isDark,
        filteredEvents,
        loading,
        error,
        filterType,
        refreshing,
        fetchEvents,
        handleFilterChange,
        navigateToDetails,
        onRefresh,
        handleManualRefresh,
        handleResetFilters,
        goBack,
    } = useEventsAndHackathons();

    const styles = createStyles(isDark);

    /**
     * Render event item
     */
    const renderItem = useCallback(({ item }: { item: HackathonSummary }) => {
        return (
            <EventCard
                item={item}
                isDark={isDark}
                styles={styles}
                onPress={navigateToDetails}
            />
        );
    }, [isDark, styles, navigateToDetails]);

    /**
     * Render main content based on loading/error state
     */
    const renderContent = () => {
        if (loading && !refreshing) {
            return <LoadingState styles={styles} />;
        }

        if (error && !refreshing) {
            return (
                <ErrorState
                    error={error}
                    isDark={isDark}
                    styles={styles}
                    onRetry={() => fetchEvents()}
                />
            );
        }

        if (filteredEvents.length === 0 && !refreshing) {
            return (
                <EmptyState
                    isDark={isDark}
                    styles={styles}
                    onResetFilters={handleResetFilters}
                />
            );
        }

        return (
            <LegendList
                data={filteredEvents}
                renderItem={renderItem}
                keyExtractor={(item, index) => {
                    const id = item.id || `item-${index}`;
                    return `${item.source}-${id}`;
                }}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                estimatedItemSize={200}
                recycleItems={true}
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
            <EventsHeader
                isDark={isDark}
                loading={loading}
                styles={styles}
                onBackPress={goBack}
                onRefreshPress={handleManualRefresh}
            />

            {/* Mode Filters */}
            <FilterBar
                filterType={filterType}
                onFilterChange={handleFilterChange}
                styles={styles}
            />

            {/* Main content */}
            {renderContent()}
        </SafeAreaView>
    );
};

export default EventsAndHackathons;