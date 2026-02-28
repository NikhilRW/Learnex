import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { Avatar, SearchBar } from 'react-native-elements';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { UserStackParamList } from 'shared/navigation/routes/UserStack';
import { MessageService } from 'conversations/services/MessageService';
import { Conversation } from 'conversations/models/Message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SwipeListView } from 'react-native-swipe-list-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDistanceToNow } from 'date-fns';
import { getUsernameForLogo } from 'shared/helpers/common/stringHelpers';
import Snackbar from 'react-native-snackbar';
import { styles } from 'conversations/styles/Conversations';
import { SCREEN_WIDTH } from 'shared/constants/common';

// TODO: refactor the component logic into hook.

const ConversationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<UserStackParamList>>();
  // const insets = useSafeAreaInsets();
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const currentUser = firebase.currentUser();
  //const reduxUserPhoto = useTypedSelector(state => state.user.userPhoto);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<
    Conversation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const messageService = new MessageService();

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = messageService.listenToConversations(
      currentUser.uid,
      newConversations => {
        setConversations(newConversations);
        setFilteredConversations(newConversations);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const searchLower = search.toLowerCase();
      const filtered = conversations.filter(conversation => {
        const otherParticipantId = conversation.participants.find(
          id => id !== currentUser?.uid,
        );
        if (!otherParticipantId) return false;

        const otherParticipantDetails =
          conversation.participantDetails[otherParticipantId];
        return otherParticipantDetails.name.toLowerCase().includes(searchLower);
      });
      setFilteredConversations(filtered);
    }
  }, [search, conversations, currentUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    // The listener will automatically update, but we'll wait briefly for visual feedback
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleNewMessage = () => {
    navigation.navigate('ContactList');
  };

  const handleConversationPress = (conversation: Conversation) => {
    const otherParticipantId = conversation.participants.find(
      id => id !== currentUser?.uid,
    );
    if (!otherParticipantId) return;

    navigation.navigate('Chat', {
      conversationId: conversation.id,
      recipientId: otherParticipantId,
      recipientName: conversation.participantDetails[otherParticipantId].name,
      recipientPhoto: conversation.participantDetails[otherParticipantId].image,
      isQrInitiated: false,
    });
  };

  // Handle conversation deletion
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      // Show confirmation dialog
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Alert.alert(
          'Delete Conversation',
          'Are you sure you want to delete this conversation? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  Snackbar.show({
                    text: 'Deleting conversation...',
                    duration: Snackbar.LENGTH_INDEFINITE,
                  });

                  await messageService.deleteConversation(conversationId);

                  Snackbar.dismiss();
                  Snackbar.show({
                    text: 'Conversation deleted successfully',
                    duration: Snackbar.LENGTH_SHORT,
                    backgroundColor: '#4CAF50',
                  });
                } catch (error) {
                  console.error('Error deleting conversation:', error);
                  Snackbar.show({
                    text: 'Failed to delete conversation',
                    duration: Snackbar.LENGTH_LONG,
                    backgroundColor: '#F44336',
                  });
                }
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      Snackbar.show({
        text: 'Failed to delete conversation',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#F44336',
      });
    }
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      {loading ? (
        <ActivityIndicator size="large" color="#2379C2" />
      ) : (
        <>
          <MaterialIcons
            name="chat-bubble-outline"
            size={80}
            color={isDark ? '#555' : '#ccc'}
          />
          <Text style={[styles.emptyText, isDark ? styles.darkEmptyText : styles.lightEmptyText]}>
            No conversations yet
          </Text>
          <Text
            style={[styles.emptySubText, isDark ? styles.darkEmptySubText : styles.lightEmptySubText]}>
            Start messaging with your peers
          </Text>
          <TouchableOpacity
            style={[styles.newMessageButton, styles.emptyButtonMarginTop]}
            onPress={handleNewMessage}>
            <Text style={styles.newMessageButtonText}>Start New Chat</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const otherParticipantId = item.participants.find(
      id => id !== currentUser?.uid,
    );
    if (!otherParticipantId) return null;

    const otherParticipant = item.participantDetails[otherParticipantId];
    const isUnread =
      item.unreadCount && item.unreadCount[currentUser?.uid || ''] > 0;
    const lastMessageTime = item.lastMessage?.timestamp
      ? formatDistanceToNow(new Date(item.lastMessage.timestamp), {
        addSuffix: true,
      })
      : '';

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          isDark
            ? isUnread ? styles.darkUnreadConversationItem : styles.darkConversationItem
            : isUnread ? styles.lightUnreadConversationItem : styles.lightConversationItem,
        ]}
        onPress={() => {
          navigation.navigate('Chat', {
            conversationId: item.id,
            recipientId: otherParticipantId,
            recipientName: otherParticipant.name,
            recipientPhoto: otherParticipant.image,
            isQrInitiated: false,
          });
        }}>
        {otherParticipant.image ? (
          <Avatar
            rounded
            source={{ uri: otherParticipant.image }}
            size={Math.min(SCREEN_WIDTH * 0.12, 50)}
            containerStyle={styles.avatar}
          />
        ) : (
          <Avatar
            rounded
            title={getUsernameForLogo(otherParticipant.name)}
            size={Math.min(SCREEN_WIDTH * 0.12, 50)}
            containerStyle={[styles.avatar, styles.avatarPlaceholderBg]}
          />
        )}

        <View style={styles.conversationDetails}>
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.participantName,
                isDark ? styles.darkParticipantName : styles.lightParticipantName,
                isUnread && styles.unreadParticipantName,
              ]}
              numberOfLines={1}>
              {otherParticipant.name}
            </Text>
            <Text style={[styles.timeText, isDark ? styles.darkTimeText : styles.lightTimeText]}>
              {lastMessageTime}
            </Text>
          </View>

          <View style={styles.lastMessageContainer}>
            {otherParticipant.typing ? (
              <Text style={[styles.typingText, styles.typingHighlight]}>
                typing...
              </Text>
            ) : (
              <Text
                style={[
                  styles.lastMessageText,
                  isDark
                    ? isUnread ? styles.darkUnreadMessageText : styles.darkReadMessageText
                    : isUnread ? styles.lightUnreadMessageText : styles.lightReadMessageText,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item.lastMessage?.text || 'No messages yet'}
              </Text>
            )}

            {isUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {currentUser && item.unreadCount
                    ? item.unreadCount[currentUser.uid] || 0
                    : 0}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render hidden item with delete action
  const renderHiddenItem = ({ item }: { item: Conversation }) => (
    <View
      style={[
        styles.rowBack,
        isDark ? styles.darkRowBack : styles.lightRowBack,
      ]}>
      <TouchableOpacity
        style={[styles.deleteButton]}
        onPress={() => handleDeleteConversation(item.id)}>
        <MaterialIcons name="delete" size={24} color="#ffffff" />
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        isDark ? styles.darkContainer : styles.lightContainer,
      ]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark ? styles.darkText : styles.lightText]}>
          Messages
        </Text>
        <TouchableOpacity
          style={styles.newMessageButtonSmall}
          onPress={handleNewMessage}>
          <Ionicons
            name="create-outline"
            size={Math.min(SCREEN_WIDTH * 0.06, 24)}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* @ts-ignore */}
      <SearchBar
        placeholder="Search conversations..."
        onChangeText={(text: string = '') => setSearch(text)}
        value={search}
        containerStyle={[
          styles.searchContainer,
          isDark ? styles.darkSearchBackground : styles.lightSearchBackground,
        ]}
        inputContainerStyle={[
          styles.searchInputContainer,
          isDark ? styles.darkSearchInputBackground : styles.lightSearchInputBackground,
        ]}
        inputStyle={isDark ? styles.darkText : styles.lightText}
        placeholderTextColor={isDark ? '#aaa' : '#999'}
        round
        lightTheme={!isDark}
      />

      {filteredConversations.length === 0 ? (
        renderEmptyList()
      ) : (
        <SwipeListView
          data={filteredConversations}
          renderItem={renderConversationItem}
          renderHiddenItem={renderHiddenItem}
          keyExtractor={item => item.id}
          rightOpenValue={-75}
          disableRightSwipe
          contentContainerStyle={[
            styles.listContent,
            filteredConversations.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2379C2']}
              tintColor={isDark ? '#2379C2' : '#2379C2'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ConversationsScreen;
