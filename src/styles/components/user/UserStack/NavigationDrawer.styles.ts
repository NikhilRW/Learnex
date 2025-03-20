import {StyleSheet, Dimensions, Platform} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 400); // Max width of 400
const CONTENT_PADDING = Math.min(SCREEN_WIDTH * 0.08, 32); // Responsive padding

export const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#FFFFFF',
      width: DRAWER_WIDTH,
    },
    scrollView: {
      flexGrow: 1,
      backgroundColor: isDark ? '#121212' : '#FFFFFF',
    },
    contentContainer: {
      width: '100%',
      paddingHorizontal: CONTENT_PADDING,
      paddingTop: Math.min(SCREEN_WIDTH * 0.12, 48),
      paddingBottom: Math.min(SCREEN_WIDTH * 0.1, 40),
      flexDirection: 'column',
      gap: Math.min(SCREEN_WIDTH * 0.06, 24),
      backgroundColor: isDark ? '#121212' : '#FFFFFF',
    },
    profileContainer: {
      backgroundColor: isDark ? '#1E1E1E' : '#F8F8F8',
      borderRadius: 16,
      width: '100%',
      padding: Math.min(SCREEN_WIDTH * 0.04, 16),
      ...Platform.select({
        ios: {
          shadowColor: isDark ? '#000000' : '#000000',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: isDark ? 0.2 : 0.1,
          shadowRadius: 12,
        },
        android: {
          elevation: 6,
          borderWidth: 0.2,
          borderColor: isDark ? '#333333' : '#E0E0E0',
        },
      }),
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: Math.min(SCREEN_WIDTH * 0.15, 60),
      height: Math.min(SCREEN_WIDTH * 0.15, 60),
      borderRadius: Math.min(SCREEN_WIDTH * 0.075, 30),
      borderWidth: 2,
      borderColor: isDark ? '#2379C2' : '#2379C2',
    },
    usernameContainer: {
      marginLeft: Math.min(SCREEN_WIDTH * 0.04, 16),
      flex: 1,
      justifyContent: 'center',
    },
    username: {
      fontWeight: '700',
      fontSize: Math.min(SCREEN_WIDTH * 0.045, 18),
      color: isDark ? '#FFFFFF' : '#333333',
      letterSpacing: 0.3,
    },
    optionsContainer: {
      width: '100%',
      backgroundColor: isDark ? '#1E1E1E' : '#F8F8F8',
      borderRadius: 16,
      padding: Math.min(SCREEN_WIDTH * 0.04, 16),
      ...Platform.select({
        ios: {
          shadowColor: isDark ? '#000000' : '#000000',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: isDark ? 0.2 : 0.1,
          shadowRadius: 12,
        },
        android: {
          elevation: 6,
          borderWidth: 0.2,
          borderColor: isDark ? '#333333' : '#E0E0E0',
        },
      }),
    },
    optionsList: {
      gap: Math.min(SCREEN_WIDTH * 0.05, 20),
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Math.min(SCREEN_WIDTH * 0.02, 8),
      borderRadius: 10,
    },
    optionText: {
      fontWeight: '600',
      fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
      marginLeft: Math.min(SCREEN_WIDTH * 0.07, 28),
      color: isDark ? '#E0E0E0' : '#333333',
      flex: 1,
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? '#333333' : '#E0E0E0',
      marginVertical: Math.min(SCREEN_WIDTH * 0.04, 16),
      width: '100%',
    },
    signOutButtonContainer: {
      marginTop: Math.min(SCREEN_WIDTH * 0.04, 16),
      width: '100%',
    },
    signOutButton: {
      backgroundColor: '#2379C2',
      paddingVertical: Math.min(SCREEN_WIDTH * 0.03, 12),
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 3},
          shadowOpacity: 0.15,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
          borderWidth: 0.1,
          borderColor: '#1a65a3',
        },
      }),
    },
    signOutText: {
      color: 'white',
      marginLeft: Math.min(SCREEN_WIDTH * 0.02, 8),
      fontWeight: '600',
      fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
      letterSpacing: 0.5,
    },
    sectionTitle: {
      fontSize: Math.min(SCREEN_WIDTH * 0.035, 14),
      fontWeight: '700',
      color: isDark ? '#888888' : '#888888',
      marginBottom: Math.min(SCREEN_WIDTH * 0.03, 12),
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    iconContainer: {
      width: Math.min(SCREEN_WIDTH * 0.09, 36),
      height: Math.min(SCREEN_WIDTH * 0.09, 36),
      borderRadius: Math.min(SCREEN_WIDTH * 0.045, 18),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark
        ? 'rgba(35, 121, 194, 0.15)'
        : 'rgba(35, 121, 194, 0.1)',
      ...Platform.select({
        android: {
          borderWidth: 0.5,
          borderColor: isDark
            ? 'rgba(35, 121, 194, 0.3)'
            : 'rgba(35, 121, 194, 0.2)',
        },
      }),
    },
  });
