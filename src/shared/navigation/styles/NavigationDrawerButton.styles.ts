import {StyleSheet, Dimensions} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export const getStyles = (isDark: boolean, profileColor: string) =>
  StyleSheet.create({
    image: {
      height: 20,
      width: 20,
      tintColor: 'black',
      backgroundColor: isDark ? '#2a2a2a' : '#F0F0F0',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      padding: 7,
      position: 'relative',
      paddingRight: 10,
    },
    profilePic: {
      width: 35,
      height: 35,
      borderRadius: 17.5,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 20,
      marginHorizontal: 10,
      flex: 1,
      minHeight: 40,
      overflow: 'hidden',
      backgroundColor: isDark ? '#2a2a2a' : '#F0F0F0'
    },
    searchIcon: {
      marginRight: '2%',
      zIndex: 2,
    },
    searchInput: {
      flex: 1,
      padding: 1,
      marginRight: '2%',
      fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
      position: 'relative',
    },
    greetingContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40, // Account for search icon and padding
    },
    greetingText: {
      textAlign: 'center',
      width: '100%',
      fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    },
    container: {
      width: 45,
      height: 45,
      paddingBottom: 4,
      borderRadius: 30,
      borderWidth: 2,
      borderColor: isDark ? '#2379C2' : '#2379C2',
      backgroundColor: profileColor!,
    },
    menuIcon: {
      width: Math.min(SCREEN_WIDTH * 0.08, 32),
      height: Math.min(SCREEN_WIDTH * 0.08, 32),
      marginVertical: 'auto',
      marginLeft: '3%',
      marginTop: '2%',
      tintColor: isDark ? 'white' : 'black',
    },
    avatarTitleStyle: {
      textAlign: 'center',
      fontSize: Math.min(SCREEN_WIDTH * 0.0375, 15),
      fontFamily: 'Kufam-Thin',
    },
    searchInputStyle: {
      color: isDark ? 'white' : 'black',
      backgroundColor: isDark ? '#2a2a2a' : '#F0F0F0',
      flex: 1,
      padding: 1,
      marginRight: '2%',
      width: '100%',
      fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    },
    searchIconMarginRight: {marginRight: '2%'},
  });
