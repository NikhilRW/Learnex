import {StyleSheet, Dimensions} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#f5f5f5',
    },
    headerContainer: {
      backgroundColor: isDark ? '#1a1a1a' : 'white',
      paddingVertical: 16,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? 'white' : '#333',
      marginLeft: 20,
      flex: 1,
    },
    backButton: {
      padding: 8,
    },
    scrollView: {
      flex: 1,
    },
    logoHeaderContainer: {
      width: '100%',
      height: SCREEN_WIDTH * 0.6,
      backgroundColor: isDark ? '#232323' : '#f9f9f9',
      justifyContent: 'center',
      alignItems: 'center',
    },
    eventLogo: {
      margin: 20,
    },
    imageContainer: {
      width: '100%',
      height: SCREEN_WIDTH * 0.6,
      backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
    },
    eventImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    content: {
      padding: 20,
      backgroundColor: isDark ? '#1a1a1a' : 'white',
      marginTop: -20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      flex: 1,
    },
    eventTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? 'white' : '#333',
      marginBottom: 8,
    },
    sourceLabel: {
      fontSize: 14,
      color: '#2379C2',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? 'white' : '#333',
      marginTop: 24,
      marginBottom: 12,
    },
    eventDescription: {
      fontSize: 16,
      lineHeight: 24,
      color: isDark ? '#ddd' : '#555',
      marginBottom: 20,
    },
    infoContainer: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f8f8',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    infoRow: {
      flexDirection: 'row',
      marginBottom: 12,
      alignItems: 'flex-start',
    },
    infoIcon: {
      width: 24,
      marginRight: 12,
      alignItems: 'center',
    },
    infoTextContainer: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 14,
      color: isDark ? '#bbb' : '#777',
      marginBottom: 2,
    },
    infoText: {
      fontSize: 16,
      color: isDark ? 'white' : '#333',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginVertical: 8,
    },
    tag: {
      backgroundColor: isDark ? '#444' : '#f0f0f0',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
    },
    tagText: {
      fontSize: 14,
      color: isDark ? '#ddd' : '#555',
    },
    prizeContainer: {
      marginVertical: 8,
    },
    prizeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    prizeLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#ddd' : '#555',
      width: 80,
    },
    prizeValue: {
      fontSize: 16,
      color: isDark ? 'white' : '#333',
      flex: 1,
    },
    sponsorsContainer: {
      marginTop: 8,
    },
    sponsorItem: {
      fontSize: 16,
      color: isDark ? '#ddd' : '#555',
      marginBottom: 6,
    },
    buttonContainer: {
      padding: 20,
      backgroundColor: isDark ? '#1a1a1a' : 'white',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : '#eee',
    },
    registerButton: {
      backgroundColor: '#2379C2',
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    registerButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 16,
    },
    shareButton: {
      backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
      marginTop: 12,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    shareButtonText: {
      color: isDark ? 'white' : '#333',
      fontWeight: '600',
      fontSize: 16,
      marginLeft: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
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
      borderRadius: 8,
    },
    retryButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '500',
    },
    timeRemainingContainer: {
      backgroundColor: '#2379C2',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 20,
      alignItems: 'center',
    },
    timeRemainingText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '500',
    },
    timePassed: {
      backgroundColor: isDark ? '#444' : '#f0f0f0',
    },
    timePassedText: {
      color: isDark ? '#ddd' : '#555',
    },
  });
