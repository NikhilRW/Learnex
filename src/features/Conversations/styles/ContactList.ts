import {StyleSheet} from 'react-native';
import {SCREEN_WIDTH} from 'shared/constants/common';

export const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.1)',
      backgroundColor: isDark ? '#1a1a1a' : 'white',
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    backIcon: {
      color: isDark ? 'white' : 'black',
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? 'white' : 'black',
    },
    searchContainer: {
      padding: 0,
      marginVertical: 8,
      marginHorizontal: 16,
      borderTopWidth: 0,
      borderBottomWidth: 0,
      backgroundColor: isDark ? '#1a1a1a' : 'white',
    },
    searchInputContainer: {
      borderRadius: 25,
      height: Math.min(SCREEN_WIDTH * 0.2, 50),
      backgroundColor: isDark ? '#333' : '#f5f5f5',
    },
    searchInput: {
      color: isDark ? 'white' : 'black',
      fontSize: 13,
    },
    placeholder: {
      color: isDark ? '#aaa' : '#999',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    emptyListContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyIcon: {
      color: isDark ? '#555' : '#ccc',
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 12,
      color: isDark ? '#aaa' : '#888',
    },
    emptySubText: {
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
      color: isDark ? '#888' : '#aaa',
    },
    userItem: {
      flexDirection: 'row',
      padding: 16,
      borderRadius: 12,
      marginVertical: 6,
      alignItems: 'center',
      backgroundColor: isDark ? '#1a1a1a' : 'white',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 0},
      shadowOpacity: 0,
      shadowRadius: 20,
      elevation: 8,
    },
    avatar: {
      marginRight: 16,
      backgroundColor: '#2379C2',
    },
    userDetails: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 4,
      color: isDark ? 'white' : 'black',
    },
    username: {
      fontSize: 14,
      color: isDark ? '#aaa' : '#777',
    },
  });
