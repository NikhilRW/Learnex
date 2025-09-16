import Home from 'home/screens/Home';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import NavigationDrawer from '../../components/user/UserStack/NavigationDrawer';
import NavigationDrawerButton from '../../components/user/UserStack/NavigationDrawerButton';
import Search from 'search-post/screens/Search';
import CreatePost from '../../features/CreatePost/screens/CreatePost';
import Room from '../../screens/userscreens/Room';
import RoomScreen from '../../screens/userscreens/RoomScreen';
import Tasks from '../../screens/userscreens/Tasks';
import DuoTasks from '../../features/Tasks/screens/DuoTasks';
import EventsAndHackathons from '../../features/EventsAndHackathons/screens/EventsAndHackathons';
import EventDetails from '../../screens/userscreens/EventDetails';
import ConversationsScreen from 'conversations/screens/Conversations';
import ChatScreen from 'conversations/screens/Chat';
import ContactListScreen from 'conversations/screens/ContactList';
import SavedPosts from '../../features/SavedPost/screens/SavedPosts';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTypedSelector } from '@/shared/hooks/redux/useTypedSelector';
import NavigationIconHelper from 'shared/helpers/navigation/NavigationIconHelper';
import { Dimensions, Alert, ImageSourcePropType } from 'react-native';
import { useEffect, useRef } from 'react';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useTypedDispatch } from '@/shared/hooks/redux/useTypedDispatch';
import { clearDeepLink, markDeepLinkProcessed } from 'shared/reducers/DeepLink';
import { MeetingService } from '../../service/firebase/MeetingService';
import QRCode from 'qr-code/screens/QRCode';
import { MessageService } from 'conversations/services/MessageService';
import LexAI from 'lex-ai/screens/LexAI';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
} from '@react-native-firebase/firestore';
import FloatingBottomTabBar from '../../components/common/FloatingBottomTabBar';
import { getMessaging } from '@react-native-firebase/messaging';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Type definitions for navigation parameters
 * Defines the shape of navigation props for each screen
 */
export type UserStackParamList = {
  Search: { searchText?: string };
  Home: undefined;
  CreatePost: undefined;
  Room:
  | {
    meetingData?: {
      id: string;
      title: string;
      description: string;
      duration: number;
      isPrivate: boolean;
      maxParticipants: number;
      taskId?: string;
      host: string;
      status: string;
      participants: string[];
      roomCode: string;
      settings: {
        muteOnEntry: boolean;
        allowChat: boolean;
        allowScreenShare: boolean;
        recordingEnabled: boolean;
      };
      createdAt: Date;
      updatedAt: Date;
    };
    joinMode?: boolean;
    roomCode?: string;
  }
  | undefined;
  RoomScreen: {
    meeting: any;
    isHost: boolean;
  };
  Tasks: undefined;
  DuoTasks: undefined;
  EventsAndHackathons: undefined;
  EventDetails: {
    id: string;
    source: string;
  };
  LexAI: undefined;
  Conversations: undefined;
  Chat: {
    conversationId: string;
    recipientId: string;
    recipientName: string;
    recipientPhoto?: string | ImageSourcePropType;
    isQrInitiated: boolean;
  };
  ContactList: undefined;
  SavedPosts: undefined;
  QRCode: undefined;
};

export type UserNavigationProps = BottomTabNavigationProp<UserStackParamList>;

/**
 * Parse room code from a deep link URL
 */
const extractRoomCodeFromUrl = (url: string): string | null => {
  try {
    // Handle both formats: learnex://meeting?roomCode=ABC123 or https://learnex-web.vercel.app/join/ABC123
    const urlObj = new URL(url);

    if (urlObj.protocol === 'learnex:') {
      // Mobile deep link format
      const params = new URLSearchParams(urlObj.search);
      return params.get('roomCode');
    } else if (urlObj.hostname.includes('learnex-web.vercel.app')) {
      // Check for old query parameter format
      const params = new URLSearchParams(urlObj.search);
      const queryCode = params.get('code');

      if (queryCode) {
        return queryCode;
      }

      // Check for new path format: /join/ABC123
      const pathParts = urlObj.pathname.split('/');
      if (pathParts.length >= 3 && pathParts[1] === 'join') {
        return pathParts[2];
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing deep link URL:', error);
    return null;
  }
};

/**
 * Parse user ID from a chat deep link URL
 * Format: learnex://chat/{userId}
 */
const extractUserIdFromChatUrl = (url: string): string | null => {
  try {
    // Check if this is a chat deep link
    if (url.startsWith('learnex://chat/')) {
      // Extract the userId from the path
      const userId = url.replace('learnex://chat/', '');
      if (userId && userId.length > 0) {
        return userId;
      }
    }
    return null;
  } catch (error) {
    console.error('Error parsing chat deep link URL:', error);
    return null;
  }
};

/**
 * Main navigation stack for authenticated users
 * Combines drawer navigation with bottom tab navigation
 */
const UserStack = () => {
  const Drawer = createDrawerNavigator();
  const Tab = createBottomTabNavigator<UserStackParamList>();
  const isDark = useTypedSelector(state => state.user.theme) === 'dark';
  const deepLinkUrl = useTypedSelector(state => state.deepLink.url);
  const deepLinkProcessed = useTypedSelector(state => state.deepLink.processed);
  const navigation = useNavigation();
  const dispatch = useTypedDispatch();
  const meetingService = useRef(new MeetingService()).current;
  const messageService = useRef(new MessageService()).current;
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const messaging = getMessaging();

  // Set up notification channels and handlers for direct messages and tasks
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Import notification service
        const notificationService =
          require('../service/NotificationService').default;

        // Set up notification channels (for Android)
        await notificationService.setupNotificationChannels();

        // Set up foreground notification handlers for navigation
        notificationService.setupNotificationHandlers(navigation);

        // Set up background notification handler
        notificationService.setupBackgroundHandler();

        // Start listening for new messages to trigger notifications
        notificationService.setupMessageListener();

        // Start listening for tasks to schedule notifications
        notificationService.setupTaskNotificationListener();

        // Initialize Firebase Cloud Messaging
        const fcmInitialized = await notificationService.initializeFCM();
        if (fcmInitialized) {
          console.log('Firebase Cloud Messaging initialized successfully');
        } else {
          console.warn(
            'Firebase Cloud Messaging initialization failed or permission denied',
          );
        }

        console.log('Notification services initialized');
      } catch (error) {
        console.error('Failed to set up notification services:', error);
      }
    };

    // Set up notifications when the component mounts
    setupNotifications();

    return () => {
      // Clean up message listener when component unmounts
      try {
        const notificationService =
          require('../service/NotificationService').default;
        notificationService.removeMessageListener();
        notificationService.removeTaskListener();
        notificationService.cleanupFCM();
      } catch (error) {
        console.error('Failed to clean up notification listeners:', error);
      }
    };
  }, [navigation, messaging]);
  const { DeepLinkHandler } = require('shared/navigation/DeepLinkHandler');

  // Handle deep link navigation
  useEffect(() => {
    const handleDeepLink = async () => {
      if (deepLinkUrl && !deepLinkProcessed) {
        console.log('Processing deep link in UserStack:', deepLinkUrl);

        // Mark as processed to prevent multiple attempts
        dispatch(markDeepLinkProcessed());

        // First, check if this is a chat deep link
        const userId = extractUserIdFromChatUrl(deepLinkUrl);
        if (userId) {
          try {
            const currentUser = firebase.currentUser();
            if (!currentUser) {
              throw new Error('You must be signed in to start a conversation');
            }

            // Get user details to show in the chat using UserService
            // Getting complete user document to fetch photoURL as well
            const userDoc = await getDoc(
              doc(collection(getFirestore(), 'users'), userId),
            );

            if (!userDoc.exists()) {
              throw new Error('User not found');
            }

            const userData = userDoc.data() || {};
            const recipientName =
              userData.fullName || userData.username || 'User';
            const recipientPhoto =
              userData.photoURL ||
              userData.profilePicture ||
              userData.image ||
              null;

            console.log('Starting chat with user:', {
              recipientName,
              recipientPhoto,
            });

            // Create or get a conversation between the two users
            const conversation = await messageService.getOrCreateConversation(
              currentUser.uid,
              userId,
            );

            // Set a flag in AsyncStorage to mark this as a QR-initiated conversation
            try {
              const AsyncStorage =
                require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.setItem(
                `qr_conversation_${conversation.id}`,
                'true',
              );
              console.log(
                'Marked conversation as QR-initiated:',
                conversation.id,
              );
            } catch (storageError) {
              console.error('Failed to mark QR conversation:', storageError);
              // Continue even if storage fails
            }

            // Navigate to the chat screen
            (DeepLinkHandler.navigate({
              name: 'Chat',
              params: {
                conversationId: conversation.id,
                recipientId: userId,
                recipientName,
                recipientPhoto,
                isQrInitiated: true, // Pass QR flag to chat screen
              },
            }),
              // Clear the deep link after successful navigation
              setTimeout(() => {
                dispatch(clearDeepLink());
              }, 2000));

            return; // Exit after handling chat link
          } catch (error) {
            console.error('Error processing chat deep link:', error);
            Alert.alert(
              'Error',
              error instanceof Error
                ? error.message
                : 'Unable to start conversation',
            );
            dispatch(clearDeepLink());
            return; // Exit after handling error
          }
        }

        // If not a chat link, check if it's a meeting link
        const roomCode = extractRoomCodeFromUrl(deepLinkUrl);
        if (roomCode) {
          try {
            console.log('Joining meeting with room code:', roomCode);

            // Get meeting by room code
            const meeting = await meetingService.getMeetingByRoomCode(roomCode);

            // Navigate to RoomScreen
            navigation.dispatch(
              CommonActions.navigate({
                name: 'RoomScreen',
                params: {
                  meeting,
                  isHost: false,
                },
              }),
            );

            // Clear the deep link after successful navigation
            setTimeout(() => {
              dispatch(clearDeepLink());
            }, 2000);
          } catch (error) {
            console.error('Error processing meeting deep link:', error);
            Alert.alert(
              'Error',
              error instanceof Error ? error.message : 'Unable to join meeting',
            );
            dispatch(clearDeepLink());
          }
        } else {
          console.log('No valid code found in deep link');
          dispatch(clearDeepLink());
        }
      }
    };

    handleDeepLink();
  }, [deepLinkUrl, deepLinkProcessed, dispatch, navigation]);

  /**
   * Bottom tab navigator configuration
   * Includes Home, Search, Create Post, Trends, and Announcements
   */
  const TabNavigator = () => {
    return (
      <Tab.Navigator
        initialRouteName="Home"
        tabBar={props => <FloatingBottomTabBar {...props} />}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            borderWidth: 0,
            borderColor: isDark ? '#2a2a2a' : '#EDECEC',
            height: Math.min(SCREEN_WIDTH * 0.1375, 55),
            paddingBottom: Math.min(SCREEN_WIDTH * 0.0125, 5),
          },
          // Custom tab bar icons with theme-aware colors
          tabBarIcon: ({ focused, color, size }) => {
            return NavigationIconHelper(
              route,
              focused,
              size + 5,
              color,
              isDark,
            ); // Slightly reduce icon size
          },
          animation: 'fade',
        })}>
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Search" component={Search} />
        <Tab.Screen name="CreatePost" component={CreatePost} />
      </Tab.Navigator>
    );
  };

  return (
    <Drawer.Navigator
      initialRouteName="Tabs"
      drawerContent={props => {
        return <NavigationDrawer {...props} />;
      }}
      screenOptions={{
        headerShown: false, // Hide header for all screens by default
        drawerStyle: {
          backgroundColor: isDark ? '#1a1a1a' : 'white',
          width: Math.min(SCREEN_WIDTH * 0.85, 400),
        },
      }}>
      <Drawer.Screen
        name="Tabs"
        component={TabNavigator}
        options={{
          headerShown: true, // Show header only for the main tabs
          header: ({ navigation }) => (
            <NavigationDrawerButton
              navigation={navigation}
              tintColor={isDark ? 'white' : 'black'}
            />
          ),
          lazy: true,
        }}
      />
      <Drawer.Screen
        name="Room"
        component={Room}
        options={{
          headerShown: false, // Hide header for Room screen
          swipeEnabled: false, // Disable drawer swipe for this screen
          drawerItemStyle: { display: 'none' }, // Hide from drawer if needed
        }}
      />
      <Drawer.Screen
        name="RoomScreen"
        component={RoomScreen}
        options={{
          headerShown: false, // Hide header for RoomScreen
          swipeEnabled: false, // Disable drawer swipe for this screen
          drawerItemStyle: { display: 'none' }, // Hide from drawer
        }}
      />
      <Drawer.Screen
        name="Tasks"
        component={Tasks}
        options={{
          headerShown: false, // Hide header for Tasks screen
          swipeEnabled: false, // Disable drawer swipe for this screen
          drawerItemStyle: { display: 'none' }, // Hide from drawer if needed
        }}
      />
      <Drawer.Screen
        name="EventsAndHackathons"
        component={EventsAndHackathons}
        options={{
          headerShown: false, // Hide header for Events and Hackathons screen
          swipeEnabled: false, // Disable drawer swipe for this screen
          drawerItemStyle: { display: 'none' }, // Hide from drawer if needed
        }}
      />
      <Drawer.Screen
        name="EventDetails"
        component={EventDetails}
        options={{
          headerShown: false, // Hide header for Event Details screen
          swipeEnabled: false, // Disable drawer swipe for this screen
          drawerItemStyle: { display: 'none' }, // Hide from drawer if needed
        }}
      />
      <Drawer.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{
          headerShown: false, // Hide header for Conversations screen
          swipeEnabled: false, // Disable drawer swipe for this screen
        }}
      />
      <Drawer.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: true, // Changed from false to true to show the header
          swipeEnabled: false, // Disable drawer swipe for this screen
          drawerItemStyle: { display: 'none' }, // Hide from drawer
        }}
      />
      <Drawer.Screen
        name="ContactList"
        component={ContactListScreen}
        options={{
          headerShown: false, // Hide header for Contact List screen
          swipeEnabled: false, // Disable drawer swipe for this screen
          drawerItemStyle: { display: 'none' }, // Hide from drawer
        }}
      />
      <Drawer.Screen
        name="QRCode"
        component={QRCode}
        options={{
          headerShown: false, // Hide header for Saved Posts screen
          swipeEnabled: false, // Disable drawer swipe for this screen
          drawerItemStyle: { display: 'none' }, // Hide from drawer
        }}
      />
      <Drawer.Screen
        name="SavedPosts"
        component={SavedPosts}
        options={{
          headerShown: false, // Hide header for Saved Posts screen
          swipeEnabled: false, // Disable drawer swipe for this screen
          drawerItemStyle: { display: 'none' }, // Hide from drawer
        }}
      />
      <Drawer.Screen
        name="LexAI"
        component={LexAI}
        options={{
          headerShown: false, // Hide header for LexAI screen
          drawerItemStyle: { display: 'none' }, // Hide from drawer
        }}
      />
      <Drawer.Screen
        name="DuoTasks"
        component={DuoTasks}
        options={{
          headerShown: false, // Hide header for LexAI screen
          drawerItemStyle: { display: 'none' }, // Hide from drawer
        }}
      />
    </Drawer.Navigator>
  );
};

export default UserStack;
