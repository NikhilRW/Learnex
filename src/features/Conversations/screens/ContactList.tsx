import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Avatar, SearchBar } from 'react-native-elements';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageService } from '../services/MessageService';
import { getUsernameForLogo } from 'shared/helpers/common/stringHelpers';
import Snackbar from 'react-native-snackbar';
import {
  getFirestore,
  collection,
  getDocs,
} from '@react-native-firebase/firestore';
import { UserStackParamList } from 'shared/navigation/routes/UserStack';
import { NavigationProp } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface User {
  id: string;
  username: string;
  fullName: string;
  image?: string;
  lastSeen?: number;
}

const ContactListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<UserStackParamList>>();
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const currentUser = firebase.currentUser();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const messageService = new MessageService();

  const styles = getStyles(isDark);

  const fetchUsers = useCallback(async () => {
    try {
      const usersSnapshot = await getDocs(collection(getFirestore(), 'users'));

      const usersData = usersSnapshot.docs
        .map(
          (doc: any) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as User,
        )
        .filter((user: User) => user.id !== currentUser?.uid); // Exclude current user
      setUsers(usersData);
      setFilteredUsers(usersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
      Snackbar.show({
        text: 'Failed to load contacts',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    fetchUsers();
  }, [currentUser, fetchUsers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchUsers();
    } catch (error) {
      console.error('Error refreshing contacts:', error);
      Snackbar.show({
        text: 'Failed to refresh contacts',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    } finally {
      setRefreshing(false);
    }
  }, [fetchUsers]);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredUsers(users);
    } else {
      const searchLower = search.toLowerCase();
      const filtered = users.filter(
        user =>
          user.username.toLowerCase().includes(searchLower) ||
          user.fullName.toLowerCase().includes(searchLower),
      );
      setFilteredUsers(filtered);
    }
  }, [search, users]);

  const handleUserPress = async (user: User) => {
    if (!currentUser) return;

    try {
      Snackbar.show({
        text: 'Setting up conversation...',
        duration: Snackbar.LENGTH_INDEFINITE,
        textColor: 'white',
        backgroundColor: '#2379C2',
      });

      const conversation = await messageService.getOrCreateConversation(
        currentUser.uid,
        user.id,
      );

      Snackbar.dismiss();

      navigation.navigate('Chat', {
        conversationId: conversation.id,
        recipientId: user.id,
        recipientName: user.fullName || user.username,
        recipientPhoto: user.image,
        isQrInitiated: false,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      Snackbar.show({
        text: 'Failed to start conversation',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    }
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      {loading ? (
        <ActivityIndicator size="large" color="#2379C2" />
      ) : (
        <>
          <Ionicons
            name="people-outline"
            size={80}
            color={styles.emptyIcon.color}
          />
          <Text style={styles.emptyText}>No contacts found</Text>
          {search.length > 0 && (
            <Text style={styles.emptySubText}>Try a different search term</Text>
          )}
        </>
      )}
    </View>
  );

  const renderUserItem = ({ item }: { item: User }) => {
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserPress(item)}>
        {item.image ? (
          <Avatar
            rounded
            size={Math.min(SCREEN_WIDTH * 0.12, 50)}
            containerStyle={styles.avatar}
            source={{ uri: item.image }}
          />
        ) : (
          <Avatar
            rounded
            title={getUsernameForLogo(item.fullName || item.username)}
            size={Math.min(SCREEN_WIDTH * 0.12, 50)}
            containerStyle={styles.avatar}
          />
        )}

        <View style={styles.userDetails}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.fullName || item.username}
          </Text>

          <Text style={styles.username}>@{item.username}</Text>
        </View>

        <Ionicons name="chatbubble-outline" size={24} color="#2379C2" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={Math.min(SCREEN_WIDTH * 0.06, 24)}
            color={styles.backIcon.color}
          />
        </TouchableOpacity>

        <Text style={styles.title}>New Message</Text>
      </View>

      <SearchBar
        placeholder="Search contacts..."
        value={search}
        onChangeText={(text: string = '') => {
          setSearch(text);
        }}
        platform="default"
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInputContainer}
        inputStyle={styles.searchInput}
        textAlignVertical="center"
        placeholderTextColor={styles.placeholder.color}
        round
        lightTheme={!isDark}
        searchIcon={{ name: 'search', size: 25 }}
        clearIcon={{ name: 'clear', size: 25 }}
        showLoading={false}
        cancelButtonTitle={''}
        showCancel={false}
      />

      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={[
          styles.listContent,
          filteredUsers.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2379C2']}
            tintColor={isDark ? '#ffffff' : '#2379C2'}
            progressBackgroundColor={isDark ? '#2a2a2a' : '#f0f0f0'}
          />
        }
      />
    </SafeAreaView>
  );
};

const getStyles = (isDark: boolean) =>
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
      shadowOffset: { width: 0, height: 0 },
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

export default ContactListScreen;
