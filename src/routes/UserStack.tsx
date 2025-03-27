import Home from '../screens/userscreens/Home';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import NavigationDrawer from '../components/user/UserStack/NavigationDrawer';
import NavigationDrawerButton from '../components/user/UserStack/NavigationDrawerButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import HomeIcon from '../components/user/UserStack/HomeIcon';
import Search from '../screens/userscreens/Search';
import CreatePost from '../screens/userscreens/CreatePost';
import Annoucement from '../screens/userscreens/Annoucement';
import AnnouncementIcon from '../components/user/UserStack/AnnouncementIcon';
import HashTrends from '../screens/userscreens/HashTrends';
import Room from '../screens/userscreens/Room';
import RoomScreen from '../screens/userscreens/RoomScreen';
import Tasks from '../screens/userscreens/Tasks';
import EventsAndHackathons from '../screens/userscreens/EventsAndHackathons';
import EventDetails from '../screens/userscreens/EventDetails';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTypedSelector } from '../hooks/useTypedSelector';
import NavigationIconHelper from '../helpers/NavigationIconHelper';
import { Dimensions, Alert } from 'react-native';
import { useEffect, useRef } from 'react';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useTypedDispatch } from '../hooks/useTypedDispatch';
import { clearDeepLink, markDeepLinkProcessed } from '../reducers/DeepLink';
import { MeetingService } from '../service/firebase/MeetingService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Type definitions for navigation parameters
 * Defines the shape of navigation props for each screen
 */
export type UserStackParamList = {
  Search: { searchText?: string };
  Home: undefined;
  CreatePost: undefined;
  HashTrends: undefined;
  Announcements: undefined;
  Room: undefined;
  RoomScreen: {
    meeting: any;
    isHost: boolean;
  };
  Tasks: undefined;
  EventsAndHackathons: undefined;
  EventDetails: {
    id: string;
    source: string;
  };
};

export type UserNavigationProps = BottomTabNavigationProp<UserStackParamList>;

/**
 * Parse room code from a deep link URL
 */
const extractRoomCodeFromUrl = (url: string): string | null => {
  try {
    // Handle both formats: learnex://meeting?roomCode=ABC123 or https://learnex-241f1.web.app/join?code=ABC123
    const urlObj = new URL(url);

    if (urlObj.protocol === 'learnex:') {
      // Mobile deep link format
      const params = new URLSearchParams(urlObj.search);
      return params.get('roomCode');
    } else if (urlObj.hostname.includes('learnex-241f1.web.app')) {
      // Web URL format
      const params = new URLSearchParams(urlObj.search);
      return params.get('code');
    }

    return null;
  } catch (error) {
    console.error('Error parsing deep link URL:', error);
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
  const isDark = useTypedSelector((state) => state.user.theme) === "dark";
  const deepLinkUrl = useTypedSelector(state => state.deepLink.url);
  const deepLinkProcessed = useTypedSelector(state => state.deepLink.processed);
  const navigation = useNavigation();
  const dispatch = useTypedDispatch();
  const meetingService = useRef(new MeetingService()).current;

  // Handle deep link navigation
  useEffect(() => {
    const handleDeepLink = async () => {
      if (deepLinkUrl && !deepLinkProcessed) {
        console.log('Processing deep link in UserStack:', deepLinkUrl);

        const roomCode = extractRoomCodeFromUrl(deepLinkUrl);
        if (roomCode) {
          try {
            // Mark as processed to prevent multiple attempts
            dispatch(markDeepLinkProcessed());

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
              })
            );

            // Clear the deep link after successful navigation
            setTimeout(() => {
              dispatch(clearDeepLink());
            }, 2000);
          } catch (error) {
            console.error('Error processing deep link:', error);
            Alert.alert(
              'Error',
              error instanceof Error ? error.message : 'Unable to join meeting'
            );
            dispatch(clearDeepLink());
          }
        } else {
          console.log('No valid room code found in deep link');
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
        screenOptions={({ route }) => ({
          header: () => <></>,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: isDark ? '#1a1a1a' : 'white',
            borderTopWidth: 1,
            borderTopColor: isDark ? "#2a2a2a" : "#e0e0e0",
            height: Math.min(SCREEN_WIDTH * 0.1375, 55),
            paddingBottom: Math.min(SCREEN_WIDTH * 0.0125, 5),
          },
          // Custom tab bar icons with theme-aware colors
          tabBarIcon: ({ focused, color, size }) => {
            return NavigationIconHelper(route, focused, size + 5, color, isDark); // Slightly reduce icon size
          },
        })}>
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Search" component={Search} />
        <Tab.Screen name="CreatePost" component={CreatePost} />
        <Tab.Screen name="HashTrends" component={HashTrends} />
        <Tab.Screen name="Announcements" component={Annoucement} />
      </Tab.Navigator>
    );
  };

  return (
    <Drawer.Navigator
      initialRouteName="Tabs"
      drawerContent={(props) => <NavigationDrawer {...props} />}
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
            <NavigationDrawerButton navigation={navigation} tintColor={isDark ? 'white' : 'black'} />
          ),
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
    </Drawer.Navigator>
  );
};

export default UserStack;