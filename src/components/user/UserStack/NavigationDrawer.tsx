import { ScrollView } from 'react-native-gesture-handler';
import { Text, TouchableOpacity, View, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTypedSelector } from '../../../hooks/useTypedSelector';
import { useTypedDispatch } from '../../../hooks/useTypedDispatch';
import { changeIsLoggedIn } from '../../../reducers/User';
import { Avatar, Image } from 'react-native-elements';
import { getUsernameForLogo } from '../../../helpers/stringHelpers';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { navigationDrawerOptions } from '../../../constants/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createStyles } from '../../../styles/components/user/UserStack/NavigationDrawer.styles';
import Snackbar from 'react-native-snackbar';
import { DrawerContentComponentProps } from '@react-navigation/drawer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NavigationDrawer = (props: DrawerContentComponentProps) => {
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const insets = useSafeAreaInsets();
  const currentUser = firebase.currentUser();
  const isDark = useTypedSelector((state) => state.user.theme) === "dark";
  const [fullName, setFullName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const dispatch = useTypedDispatch();
  const profileColor = useTypedSelector(state => state.user.userProfileColor);
  const navigation = props.navigation;
  const styles = createStyles(isDark);

  // Group navigation options by category
  const navigationCategories = {
    main: ['Room', 'Tasks', 'Insights'],
    tools: ['Scan or Generate QR', 'Feed News', 'Events & Hackathons'],
    account: ['Rewards', 'Saved', 'Invite'],
    support: ['Help and FAQs', 'Contact us', 'Setting', 'About']
  };

  // Map of navigation options to their respective icons
  const optionIcons = {
    'Room': 'video-camera',
    'Tasks': 'tasks',
    'Insights': 'bar-chart',
    'Scan or Generate QR': 'qrcode',
    'Feed News': 'newspaper-o',
    'Events & Hackathons': 'calendar',
    'Rewards': 'trophy',
    'Saved': 'bookmark',
    'Help and FAQs': 'question-circle',
    'Contact us': 'envelope',
    'Invite': 'user-plus',
    'Setting': 'cog',
    'About': 'info-circle'
  };

  const handleLogOutPress = async () => {
    try {
      const { success, error } = await firebase.auth.signOut();
      if (success) {
        dispatch(changeIsLoggedIn(false));
      } else {
        Snackbar.show({
          text: 'Failed to sign out: ' + error,
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#007cb5',
        });
      }
    } catch (err) {
      console.error('Sign out error:', err);
      Snackbar.show({
        text: 'An error occurred while signing out',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#007cb5',
      });
    }
  };

  const handleOptionPress = (option: string) => {
    // Close the drawer
    navigation.closeDrawer();

    // Navigate based on the selected option
    switch (option) {
      case 'Room':
        navigation.navigate('Room');
        break;
      case 'Tasks':
        navigation.navigate('Tasks');
        break;
      case 'Events & Hackathons':
        navigation.navigate('EventsAndHackathons');
        break;
      // Add other cases for other menu options as needed
      default:
        // For options not yet implemented
        Snackbar.show({
          text: `${option} feature coming soon!`,
          duration: Snackbar.LENGTH_SHORT,
          textColor: 'white',
          backgroundColor: '#007cb5',
        });
        break;
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check and log photoURL for debugging
        if (currentUser?.photoURL) {
          console.log('NavigationDrawer: User photo URL:', currentUser.photoURL);
          // Validate URL format
          if (typeof currentUser.photoURL === 'string' &&
            (currentUser.photoURL.startsWith('http://') ||
              currentUser.photoURL.startsWith('https://') ||
              currentUser.photoURL.startsWith('data:'))) {
            setPhotoURL(currentUser.photoURL);
          } else {
            console.log('NavigationDrawer: Invalid photo URL format');
            setPhotoURL(null);
          }
        } else {
          console.log('NavigationDrawer: No photo URL available');
          setPhotoURL(null);
        }

        const { fullName, username } = await firebase.user.getNameUsernamestring();
        setUsername(username);
        setFullName(fullName);
      } catch (err) {
        console.error('Error fetching user data:', err);
        // Set default values in case of error
        setUsername('User');
        setFullName('User');
        setPhotoURL(null);
      }
    };
    fetchUserData();
  }, [currentUser]);

  const renderAvatar = () => {
    if (photoURL && photoURL.length > 0) {
      return (
        <Image
          source={{ uri: photoURL }}
          containerStyle={styles.avatar}
          onError={() => {
            console.log('NavigationDrawer: Profile image loading error');
            setPhotoURL(null); // Fallback to initials avatar
          }}
        />
      );
    }
    return (
      <Avatar
        size={60}
        title={getUsernameForLogo(username || 'User')}
        titleStyle={{
          fontSize: Math.min(SCREEN_WIDTH * 0.06, 24),
          fontFamily: 'Kufam-Thin'
        }}
        containerStyle={[styles.avatar, { backgroundColor: profileColor || '#2379C2' }]}
        activeOpacity={0.7}
      />
    );
  };

  const renderOptionIcon = (option: string) => {
    const iconName = optionIcons[option as keyof typeof optionIcons] || 'circle';
    return (
      <View style={styles.iconContainer}>
        <FontAwesome name={iconName} color={isDark ? '#2379C2' : '#2379C2'} size={Math.min(SCREEN_WIDTH * 0.045, 18)} />
      </View>
    );
  };

  const renderNavigationSection = (title: string, options: string[]) => {
    return (
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionItem}
            onPress={() => handleOptionPress(option)}
          >
            {renderOptionIcon(option)}
            <Text style={styles.optionText} numberOfLines={2} ellipsizeMode="tail">
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <View style={styles.profileContainer}>
            {renderAvatar()}
            <View style={styles.usernameContainer}>
              <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
                {username}
              </Text>
            </View>
          </View>

          <View style={styles.optionsContainer}>
            {renderNavigationSection('Main', navigationCategories.main)}
            <View style={styles.divider} />
            {renderNavigationSection('Tools', navigationCategories.tools)}
            <View style={styles.divider} />
            {renderNavigationSection('Account', navigationCategories.account)}
            <View style={styles.divider} />
            {renderNavigationSection('Support', navigationCategories.support)}

            <View style={styles.signOutButtonContainer}>
              <TouchableOpacity
                onPress={handleLogOutPress}
                style={styles.signOutButton}
              >
                <Ionicons name="exit-outline" color="white" size={Math.min(SCREEN_WIDTH * 0.055, 22)} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default NavigationDrawer;
