import { LegendList } from '@legendapp/list';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
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
import { SCREEN_WIDTH } from 'shared/constants/common';
import { ContactUser } from '../types';
import { getStyles } from '../styles/ContactList';

const ContactListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<UserStackParamList>>();
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const currentUser = firebase.currentUser();

  const [users, setUsers] = useState<ContactUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ContactUser[]>([]);
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
            }) as ContactUser,
        )
        .filter((user: ContactUser) => user.id !== currentUser?.uid); // Exclude current user
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

  const handleUserPress = async (user: ContactUser) => {
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

  const renderUserItem = ({ item }: { item: ContactUser }) => {
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

      <LegendList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={[
          styles.listContent,
          filteredUsers.length === 0 && styles.emptyListContent,
        ]}
        estimatedItemSize={80}
        recycleItems={true}
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

export default ContactListScreen;
