import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Image,
    RefreshControl
} from 'react-native';
import { Avatar, SearchBar } from 'react-native-elements';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { useNavigation, CommonActions } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageService } from '../../service/firebase/MessageService';
import { getUsernameForLogo } from '../../helpers/stringHelpers';
import Snackbar from 'react-native-snackbar';
import firestore from '@react-native-firebase/firestore';
import { log } from 'console';
import { UserStackParamList } from '../../routes/UserStack';
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
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NavigationProp<UserStackParamList>>();
    const isDark = useTypedSelector((state) => state.user.theme) === "dark";
    const firebase = useTypedSelector(state => state.firebase.firebase);
    const currentUser = firebase.currentUser();

    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const messageService = new MessageService();

    // Define fetchUsers outside useEffect so it can be reused
    const fetchUsers = async () => {
        try {
            const usersSnapshot = await firestore().collection('users').get();

            const usersData = usersSnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as User))
                .filter(user => user.id !== currentUser?.uid); // Exclude current user
            console.log("userdata : " + usersData[0]);
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
    };

    useEffect(() => {
        fetchUsers();
    }, [currentUser]);

    // Add onRefresh callback function with fetchUsers dependency
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
            const filtered = users.filter(user =>
                user.username.toLowerCase().includes(searchLower) ||
                user.fullName.toLowerCase().includes(searchLower)
            );
            setFilteredUsers(filtered);
        }
    }, [search, users]);

    const handleUserPress = async (user: User) => {
        if (!currentUser) return;

        try {
            // Show loading indicator
            Snackbar.show({
                text: 'Setting up conversation...',
                duration: Snackbar.LENGTH_INDEFINITE,
                textColor: 'white',
                backgroundColor: '#2379C2',
            });

            // Create or get conversation
            const conversation = await messageService.getOrCreateConversation(currentUser.uid, user.id);

            // Dismiss loading indicator
            Snackbar.dismiss();

            // Navigate to chat
            navigation.navigate('Chat', {
                conversationId: conversation.id,
                recipientId: user.id,
                recipientName: user.fullName || user.username,
                recipientPhoto: user.image
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
                    <Ionicons name="people-outline" size={80} color={isDark ? '#555' : '#ccc'} />
                    <Text style={[styles.emptyText, { color: isDark ? '#aaa' : '#888' }]}>
                        No contacts found
                    </Text>
                    {search.length > 0 && (
                        <Text style={[styles.emptySubText, { color: isDark ? '#888' : '#aaa' }]}>
                            Try a different search term
                        </Text>
                    )}
                </>
            )}
        </View>
    );

    const renderUserItem = ({ item }: { item: User }) => {
        const lastSeen = item.lastSeen
            ? new Date(item.lastSeen).toLocaleDateString()
            : 'Never';

        return (
            <TouchableOpacity
                style={[
                    styles.userItem,
                    { backgroundColor: isDark ? '#1a1a1a' : 'white' }
                ]}
                onPress={() => handleUserPress(item)}
            >
                {item.image ? (
                <Avatar
                    rounded
                    size={Math.min(SCREEN_WIDTH * 0.12, 50)}
                    containerStyle={[styles.avatar, { backgroundColor: '#2379C2' }]}
                    source={{ uri: item.image }}
                />
                ) : (
                    <Avatar
                        rounded
                        title={getUsernameForLogo(item.fullName || item.username)}
                        size={Math.min(SCREEN_WIDTH * 0.12, 50)}
                        containerStyle={[styles.avatar, { backgroundColor: '#2379C2' }]}
                    />
                )}

                <View style={styles.userDetails}>
                    <Text
                        style={[
                            styles.userName,
                            { color: isDark ? 'white' : 'black' }
                        ]}
                        numberOfLines={1}
                    >
                        {item.fullName || item.username}
                    </Text>

                    <Text style={[styles.username, { color: isDark ? '#aaa' : '#777' }]}>
                        @{item.username}
                    </Text>
                </View>

                <Ionicons
                    name="chatbubble-outline"
                    size={24}
                    color="#2379C2"
                />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[
            styles.container,
            {
                backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9',
            }
        ]}>
            <View style={[
                styles.header,
                { backgroundColor: isDark ? '#1a1a1a' : 'white' }
            ]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={Math.min(SCREEN_WIDTH * 0.06, 24)}
                        color={isDark ? 'white' : 'black'}
                    />
                </TouchableOpacity>

                <Text style={[
                    styles.title,
                    { color: isDark ? 'white' : 'black' }
                ]}>
                    New Message
                </Text>
            </View>

            <SearchBar
                placeholder="Search contacts..."
                onChangeText={setSearch as any}
                value={search}
                platform="default"
                containerStyle={[
                    styles.searchContainer,
                    { backgroundColor: isDark ? '#1a1a1a' : 'white' }
                ]}
                inputContainerStyle={[
                    styles.searchInputContainer,
                    { backgroundColor: isDark ? '#333' : '#f5f5f5' }
                ]}
                inputStyle={{ color: isDark ? 'white' : 'black' }}
                placeholderTextColor={isDark ? '#aaa' : '#999'}
                round
                lightTheme={!isDark}
            />

            <FlatList
                data={filteredUsers}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={renderEmptyList}
                contentContainerStyle={[
                    styles.listContent,
                    filteredUsers.length === 0 && styles.emptyListContent
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
    },
    searchContainer: {
        padding: 0,
        marginVertical: 8,
        marginHorizontal: 16,
        borderTopWidth: 0,
        borderBottomWidth: 0,
    },
    searchInputContainer: {
        borderRadius: 25,
        height: Math.min(SCREEN_WIDTH * 0.1, 40),
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
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 12,
    },
    emptySubText: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    userItem: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginVertical: 6,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.,
        shadowRadius: 20,
        elevation: 8,
    },
    avatar: {
        marginRight: 16,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    username: {
        fontSize: 14,
    },
});

export default ContactListScreen; 