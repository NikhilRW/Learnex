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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTypedSelector } from '../hooks/useTypedSelector';

export type UserStackParamList = {
  Search: { searchText?: string };
  Home: undefined;
  CreatePost: undefined;
  HashTrends: undefined;
  Announcements: undefined;
};
export type UserNavigationProps = BottomTabNavigationProp<UserStackParamList>;
const UserStack = () => {
  const Drawer = createDrawerNavigator();
  const Tab = createBottomTabNavigator<UserStackParamList>();
  const isDark = useTypedSelector((state) => state.user.theme) === "dark";
  const TabNavigator = () => {
    return (
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          header: () => <></>,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: isDark ? '#1a1a1a' : 'white', // Customize colors based on theme
            borderTopWidth: 1, // Optional: removes the top border
            borderTopColor: isDark?"#2a2a2a":"#e0e0e0",
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = '';
            if (route.name === 'Home') {
              return <HomeIcon focused={focused} size={size} color={color} />;
            } else if (route.name === 'Search') {
              return <Ionicons name="search" size={size} color={focused?color:isDark?"white":color} />;
            }
            else if (route.name === 'CreatePost') {
              return <Ionicons name="create" size={size} color={focused?color:isDark?"white":color} />;
            }
            else if (route.name === 'HashTrends') {
              iconName = focused ? 'hashtag' : 'hashtag';
              return <FontAwesome5 name={iconName} size={size} color={color} />;
            }
            else if (route.name === 'Announcements') {
              return <AnnouncementIcon focused={focused} size={size} color={color} />;
            }
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
          <NavigationDrawerButton navigation={navigation} tintColor={'red'} />
        ),
      }}>
      <Drawer.Screen name="Tabs" component={TabNavigator} />
    </Drawer.Navigator>
  );
};

export default UserStack;