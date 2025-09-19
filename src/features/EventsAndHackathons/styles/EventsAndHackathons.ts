import {SCREEN_HEIGHT, SCREEN_WIDTH} from 'shared/constants/common';
import {StyleSheet} from 'react-native';

export const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#f5f5f5',
    },
    headerContainer: {
      backgroundColor: isDark ? '#1a1a1a' : 'white',
      paddingVertical: 16,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? 'white' : '#333',
    },
    backButton: {
      padding: 8,
    },
    refreshButton: {
      padding: 8,
      marginLeft: 'auto',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    filterContainer: {
      flexDirection: 'row',
      marginBottom: 12,
      marginTop: 12,
      paddingHorizontal: 16,
      flexWrap: 'wrap',
    },
    filterButton: {
      marginRight: 10,
      marginBottom: 8,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#e0e0e0',
    },
    filterButtonActive: {
      backgroundColor: '#2379C2',
      borderColor: '#2379C2',
    },
    liveFilterButtonActive: {
      backgroundColor: '#2e7d32',
      borderColor: '#2e7d32',
    },
    upcomingFilterButtonActive: {
      backgroundColor: '#0288d1',
      borderColor: '#0288d1',
    },
    onlineFilterButtonActive: {
      backgroundColor: '#0288d1',
      borderColor: '#0288d1',
    },
    inPersonFilterButtonActive: {
      backgroundColor: '#2e7d32',
      borderColor: '#2e7d32',
    },
    filterText: {
      fontSize: 14,
      color: isDark ? '#e0e0e0' : '#555',
    },
    filterTextActive: {
      color: 'white',
    },
    liveFilterTextActive: {
      color: 'white',
    },
    upcomingFilterTextActive: {
      color: 'white',
    },
    onlineFilterTextActive: {
      color: 'white',
    },
    inPersonFilterTextActive: {
      color: 'white',
    },
    liveFilterContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    miniLiveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#fff',
      marginRight: 5,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      color: isDark ? '#ddd' : '#555',
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: isDark ? '#e0e0e0' : '#555',
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: '#2379C2',
      borderRadius: 20,
      marginTop: 12,
    },
    retryButtonText: {
      color: 'white',
      fontWeight: '500',
    },
    listContainer: {
      padding: 16,
      paddingBottom: 24,
    },
    eventCard: {
      backgroundColor: isDark ? '#1e1e1e' : 'white',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
      position: 'relative',
      overflow: 'hidden',
    },
    darkEventCard: {
      backgroundColor: '#1e1e1e',
    },
    endedEventCard: {
      opacity: 0.85,
      borderColor: isDark ? '#333' : '#e0e0e0',
      borderWidth: 1,
    },
    eventHeader: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    eventHeaderText: {
      flex: 1,
    },
    eventLogo: {
      width: 56,
      height: 56,
      borderRadius: 12,
      marginRight: 12,
      backgroundColor: '#f1f1f1',
    },
    eventTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDark ? '#ffffff' : '#222',
      marginBottom: 6,
    },
    endedEventTitle: {
      color: isDark ? '#aaaaaa' : '#777777',
    },
    eventDate: {
      fontSize: 13,
      color: '#666',
    },
    eventDescription: {
      fontSize: 14,
      color: isDark ? '#aaa' : '#666',
      marginBottom: 12,
      lineHeight: 20,
    },
    liveIndicator: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: '#2e7d32',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderBottomLeftRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 1,
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#fff',
      marginRight: 5,
    },
    liveText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    eventMetaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      marginRight: 8,
      marginBottom: 3,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    organizerText: {
      fontSize: 12,
      color: isDark ? '#888' : '#777',
    },
    endedEventSubText: {
      color: isDark ? '#666' : '#999',
    },
    endedOpacity: {
      opacity: 0.7,
    },
    onlineEventTypeText: {
      color: '#0288d1',
    },
    inPersonEventTypeText: {
      color: '#2e7d32',
    },
    hybridEventTypeText: {
      color: '#e65100',
    },
    headerTitleMargin: {
      marginLeft: 10,
    },
    refreshButtonDisabled: {
      opacity: 0.5,
    },
    eventFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    locationText: {
      fontSize: 13,
      color: isDark ? '#aaa' : '#666',
      marginLeft: 4,
    },
    eventTypeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    eventTypeTag: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    },
    eventTypeText: {
      fontSize: 12,
      fontWeight: '500',
    },
    onlineTag: {
      backgroundColor: isDark ? 'rgba(2,136,209,0.15)' : '#e1f5fe',
    },
    inPersonTag: {
      backgroundColor: isDark ? 'rgba(46,125,50,0.15)' : '#e8f5e9',
    },
    hybridTag: {
      backgroundColor: isDark ? 'rgba(230,81,0,0.15)' : '#fff3e0',
    },
    sourceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sourceText: {
      fontSize: 12,
      color: '#888',
    },
    darkText: {
      color: '#e0e0e0',
    },
    darkSubText: {
      color: '#aaa',
    },
    locationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#1e1e1e' : 'white',
      paddingVertical: 12,
      marginVertical: 8,
      marginHorizontal: 16,
      borderRadius: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 1,
    },
    locationButtonText: {
      fontSize: 15,
      fontWeight: '500',
      color: isDark ? '#e0e0e0' : '#444',
      marginRight: 8,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      width: SCREEN_WIDTH * 0.8,
      maxHeight: SCREEN_HEIGHT * 0.6,
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 20,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    darkModalContent: {
      backgroundColor: '#2a2a2a',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 16,
      textAlign: 'center',
    },
    locationItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#444' : '#eee',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    selectedLocationItem: {
      backgroundColor: isDark ? '#3a3a3a' : '#f0f7ff',
    },
    locationItemText: {
      fontSize: 16,
      color: '#333',
    },
    selectedLocationText: {
      color: '#2379C2',
      fontWeight: '500',
    },
    closeButton: {
      marginTop: 16,
      backgroundColor: isDark ? '#444' : '#eee',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignSelf: 'center',
    },
    closeButtonText: {
      color: isDark ? '#e0e0e0' : '#444',
      fontWeight: '500',
      textAlign: 'center',
    },
    noEventsContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    noEventsText: {
      fontSize: 16,
      color: isDark ? '#e0e0e0' : '#555',
      textAlign: 'center',
      marginBottom: 12,
      marginTop: 16,
    },
  });
