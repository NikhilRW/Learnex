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
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTypedSelector } from '../hooks/useTypedSelector';
import NavigationIconHelper from '../helpers/NavigationIconHelper';

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
};

export type UserNavigationProps = BottomTabNavigationProp<UserStackParamList>;

/**
 * Main navigation stack for authenticated users
 * Combines drawer navigation with bottom tab navigation
 */
const UserStack = () => {
  const Drawer = createDrawerNavigator();
  const Tab = createBottomTabNavigator<UserStackParamList>();
  const isDark = useTypedSelector((state) => state.user.theme) === "dark";

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
            backgroundColor: isDark ? '#1a1a1a' : 'white', // Theme-aware styling
            borderTopWidth: 1,
            borderTopColor: isDark ? "#2a2a2a" : "#e0e0e0",
            height: 55, // Reduced height
            paddingBottom: 5, // Add some padding at bottom
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
      drawerContent={NavigationDrawer}
      screenOptions={{
        header: ({ navigation }) => (
          <NavigationDrawerButton navigation={navigation} tintColor={isDark ? 'white' : 'black'} />
        ),
      }}>
      <Drawer.Screen name="Tabs" component={TabNavigator} />
    </Drawer.Navigator>
  );
};

export default UserStack;