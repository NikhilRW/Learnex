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
    avatarContainer: {
      position: 'relative',
      width: Math.min(SCREEN_WIDTH * 0.15, 60),
      height: Math.min(SCREEN_WIDTH * 0.15, 60),
    },
    avatar: {
      width: Math.min(SCREEN_WIDTH * 0.15, 60),
      height: Math.min(SCREEN_WIDTH * 0.15, 60),
      borderRadius: Math.min(SCREEN_WIDTH * 0.075, 30),
      borderWidth: 2,
      borderColor: isDark ? '#2379C2' : '#2379C2',
    },
    editIconContainer: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: '#2379C2',
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#121212' : 'white',
    },
    usernameEditIcon: {
      marginLeft: 5,
      marginTop: 1,
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
    email: {
      fontSize: Math.min(SCREEN_WIDTH * 0.035, 14),
      color: isDark ? '#AAAAAA' : '#666666',
      marginTop: 2,
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
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoPickerContainer: {
      width: '80%',
      maxWidth: 320,
      borderRadius: 16,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.25,
          shadowRadius: 10,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    photoPickerTitle: {
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#444' : '#eee',
    },
    photoPickerOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#444' : '#eee',
    },
    photoPickerOptionText: {
      fontSize: 16,
      marginLeft: 16,
    },
    photoPickerCancelButton: {
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderTopWidth: 1,
    },
    photoPickerCancelText: {
      fontSize: 16,
      fontWeight: '600',
    },
    activityIndicatorContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarTitle: {
      fontSize: Math.min(SCREEN_WIDTH * 0.06, 24),
      fontFamily: 'Kufam-Thin',
    },
    avatarContainerStyle: {
      backgroundColor: '#2379C2',
    },
    modalPhotoPickerContainerDark: {
      backgroundColor: '#222',
    },
    modalPhotoPickerContainerLight: {
      backgroundColor: 'white',
    },
    modalPhotoPickerTitleDark: {
      color: 'white',
    },
    modalPhotoPickerTitleLight: {
      color: '#333',
    },
    modalPhotoPickerOptionTextDark: {
      color: 'white',
    },
    modalPhotoPickerOptionTextLight: {
      color: '#333',
    },
    modalPhotoPickerCancelButtonDark: {
      borderTopColor: '#444',
    },
    modalPhotoPickerCancelButtonLight: {
      borderTopColor: '#eee',
    },
    // Add these new styles for the username edit modal
    usernameInput: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      paddingHorizontal: 12,
      marginVertical: 10,
      fontSize: 13,
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: '',
    },
    usernameInputDark: {
      borderColor: '#555',
      backgroundColor: '#333',
      color: 'white',
    },
    usernameInputLight: {
      borderColor: '#ddd',
      backgroundColor: 'white',
      color: 'black',
    },
    usernameHint: {
      fontSize: 12,
      marginBottom: 15,
      textAlign: 'center',
      fontFamily: 'Kufam-Regular',
    },
    usernameHintDark: {
      color: '#999',
    },
    usernameHintLight: {
      color: '#666',
    },
    usernameButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    usernameButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginHorizontal: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    usernameCancelButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#FF3B30',
    },
    usernameCancelButtonDark: {
      borderColor: '#FF3B30',
    },
    usernameCancelButtonLight: {
      borderColor: '#FF3B30',
    },
    usernameUpdateButton: {
      backgroundColor: '#2379C2',
    },
    usernameButtonDisabled: {
      backgroundColor: '#999',
    },
    usernameButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 600,
    },
    activityIndicatorBgDark: {
      backgroundColor: '#333',
    },
    activityIndicatorBgLight: {
      backgroundColor: '#eee',
    },
    lexAiIcon: {
      width: Math.min(SCREEN_WIDTH * 0.045, 18),
      height: Math.min(SCREEN_WIDTH * 0.045, 18),
      tintColor: '#2379C2',
    },
    dangerText: {
      color: '#FF3B30',
    },
    modalContentPadding: {
      padding: 10,
    },
  });
