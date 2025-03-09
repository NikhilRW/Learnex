import { ScrollView } from 'react-native-gesture-handler';
import { Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTypedSelector } from '../../../hooks/useTypedSelector';
import { useTypedDispatch } from '../../../hooks/useTypedDispatch';
import { changeIsLoggedIn } from '../../../reducers/User';
import { Avatar } from 'react-native-elements';
import { getUsernameForLogo } from '../../../helpers/stringHelpers';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { navigationDrawerOptions } from '../../../constants/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../../../styles/components/user/UserStack/NavigationDrawer.styles';
import Snackbar from 'react-native-snackbar';
import { DrawerContentComponentProps } from '@react-navigation/drawer';

const NavigationDrawer = (props: DrawerContentComponentProps) => {
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const insets = useSafeAreaInsets();
  const currentUser = firebase.auth.currentUser();
  const isDark = useTypedSelector((state) => state.user.theme) === "dark";
  const [fullName, setFullName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const dispatch = useTypedDispatch();
  const profileColor = useTypedSelector(state => state.user.userProfileColor);
  const navigation = props.navigation;

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
    console.log("navigation", navigation);

    // Navigate based on the selected option
    switch (option) {
      case 'Room':
        navigation.navigate('Room');
        console.log("Room");
        break;
      case 'Tasks':
        navigation.navigate('Tasks');
        console.log("Tasks");
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
        if (currentUser?.photoURL) {
          setPhotoURL(currentUser.photoURL);
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
    if (photoURL?.length! > 0) {
      return (
        <Avatar
          size={20}
          source={{ uri: photoURL! }}
          containerStyle={styles.avatar}
          rounded
          activeOpacity={0.7}
        />
      );
    }
    return (
      <Avatar
        size={40}
        title={getUsernameForLogo(username)}
        containerStyle={[styles.avatar, { backgroundColor: profileColor! }]}
        activeOpacity={0.7}
      />
    );
  };

  return (
    <ScrollView style={{
      paddingBottom: `${insets.bottom}%`,
      paddingTop: `${insets.top}%`,
      flexGrow: 1,
      backgroundColor: isDark ? "#1a1a1a" : "white"
    }}>
      <View
        className={`w-screen  px-[10%] pt-[10%] flex-col gap-y-[4vw] ${isDark ? "bg-[#1a1a1a]" : "bg-white"}`}>
        <View className="border-[1.5px]  flex-col justify-center items-start border-gray-300 rounded-xl w-[56%] h-[18vh] px-[3%] py-[6%]  ">
          {renderAvatar()}
          <View className="flex-col mt-[3%] justify-center">
            <Text className={`font-semibold text-[3.8vw] ${isDark ? 'white' : 'text-gray-700'}`}>
              {username}
            </Text>
          </View>
        </View>
        <View className="flex-col justify-between items-start w-[56%] py-[5%] gap-5">
          <View className="space-y-[10%]">
            {navigationDrawerOptions.map((ele, index) => (
              <TouchableOpacity key={index} className="flex-row items-center " onPress={() => handleOptionPress(ele)}>
                <FontAwesome name="user-circle-o" color={isDark ? '#e0e0e0' : 'black'} size={30} />
                <Text className={`${isDark ? "text-white" : "text-black"} font-semibold text-[4vw] ml-[7%]`}>
                  {ele}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="h-[7vh]">
            <TouchableOpacity
              onPress={handleLogOutPress}
              className="bg-[#2379C2] h-full px-[7%] py-[5%] rounded-xl justify-center items-center flex-row ">
              <Ionicons name="exit-outline" color={`white`} size={30} />
              <Text className="text-white ml-[8%]">SignOut</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default NavigationDrawer;
