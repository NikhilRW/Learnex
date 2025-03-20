import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeIcon from '../components/user/UserStack/HomeIcon';
import AnnouncementIcon from '../components/user/UserStack/AnnouncementIcon';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function navigationIconHelper(
  route: any,
  focused: boolean,
  size: number,
  color: string,
  isDark: boolean,
): JSX.Element {
  const iconSize = Math.min(SCREEN_WIDTH * 0.06, size);

  if (route.name === 'Home') {
    return <HomeIcon focused={focused} size={iconSize} color={color} />;
  } else if (route.name === 'Search') {
    return (
      <Ionicons
        name="search"
        size={iconSize}
        color={focused ? color : isDark ? 'white' : color}
      />
    );
  } else if (route.name === 'CreatePost') {
    return (
      <Ionicons
        name="create"
        size={iconSize}
        color={focused ? color : isDark ? 'white' : color}
      />
    );
  } else if (route.name === 'HashTrends') {
    return <FontAwesome5 name="hashtag" size={iconSize} color={color} />;
  } else if (route.name === 'Announcements') {
    return <AnnouncementIcon focused={focused} size={iconSize} color={color} />;
  }
  return <></>;
}
