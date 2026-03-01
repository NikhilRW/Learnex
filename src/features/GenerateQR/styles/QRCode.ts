import {StyleSheet} from 'react-native';

export const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 13,
      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? 'white' : 'black',
    },
    backButton: {
      padding: 8,
    },
    shareButton: {
      padding: 8,
    },
    customHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 56,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0, 0, 0, 0.1)',
      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
    },
    qrCodeContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      borderRadius: 20,
      padding: 20,
      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
    },
    infoText: {
      marginTop: 20,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 30,
      color: isDark ? '#cccccc' : '#555555',
    },
    shareButtonLarge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
      marginTop: 20,
      width: '80%',
      maxWidth: 300,
      backgroundColor: '#2379C2',
    },
    shareButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    shareButtonIcon: {
      marginRight: 8,
    },
    iconColor: {
      color: isDark ? 'white' : 'black',
    },
    disabledOpacity: {
      opacity: 0.6,
    },
  });
