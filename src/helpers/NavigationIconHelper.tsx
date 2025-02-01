import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeIcon from '../components/user/UserStack/HomeIcon';
import AnnouncementIcon from '../components/user/UserStack/AnnouncementIcon';

export default function navigationIconHelper(
  route: any,
  focused: boolean,
  size: number,
  color: string,
  isDark: boolean,
): JSX.Element {
  let iconName = '';
  if (route.name === 'Home') {
    return <HomeIcon focused={focused} size={size} color={color} />;
  } else if (route.name === 'Search') {
    return (
      <Ionicons
        name="search"
        size={size}
        color={focused ? color : isDark ? 'white' : color}
      />
    );
  } else if (route.name === 'CreatePost') {
    return (
      <Ionicons
        name="create"
        size={size}
        color={focused ? color : isDark ? 'white' : color}
      />
    );
  } else if (route.name === 'HashTrends') {
    iconName = focused ? 'hashtag' : 'hashtag';
    return <FontAwesome5 name={iconName} size={size} color={color} />;
  } else if (route.name === 'Announcements') {
    return <AnnouncementIcon focused={focused} size={size} color={color} />;
  }
  return <></>;
}
