import { Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState, useCallback, memo } from 'react';
import { Image } from 'react-native';
import IonIcons from 'react-native-vector-icons/Ionicons';
import { ParamListBase } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useTypedSelector } from '../../../hooks/useTypedSelector';
import Icon from 'react-native-vector-icons/Feather';
import { TextInput } from 'react-native-gesture-handler';
import { styles } from '../../../styles/components/user/UserStack/NavigationDrawerButton.styles';

const NavigationDrawerButton = memo(({ tintColor, navigation }: { tintColor: string, navigation: DrawerNavigationProp<ParamListBase, string, undefined> }) => {
  const theme = useTypedSelector((state) => state.user.theme);
  const isDark = theme === "dark";
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const [userData, setUserData] = useState<{ fullName: string; username: string } | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = firebase.currentUser();
        if (!currentUser) {
          console.log('No current user');
          return;
        }
        if (currentUser.photoURL) {
          setPhotoURL(currentUser.photoURL);
        }
        const data = await firebase.user.getNameUsernamestring();
        if (data && data.fullName) {
          setUserData(data);
        } else {
          console.log('No user data found');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserData(null);
      }
    };

    fetchUserData();
  }, [firebase]);

  // Get first name safely
  const getFirstName = useCallback(() => {
    if (!userData?.fullName) return "There";
    const nameParts = userData.fullName.trim().split(' ');
    return nameParts[0] || null;
  }, [userData]);

  useEffect(() => {
    if (searchText.length > 0) {
      setIsTyping(true);
    }
  }, [searchText]);

  const handleOpenDrawer = useCallback(() => {
    navigation.openDrawer();
  }, [navigation]);

  const handleSearchFocus = useCallback(() => {
    setIsTyping(true);
    setSearchText('');
    navigation.navigate('Search');
  }, [navigation]);

  const handleSearchChange = useCallback((text: string) => {
    if (text.length > 0) {
      setIsTyping(true);
      setSearchText(text);
      navigation.navigate('Search', { searchText: text });
    } else {
      setIsTyping(false);
    }
  }, [navigation]);

  const handleSearchPress = useCallback(() => {
    setIsTyping(true);
    navigation.navigate('Search');
  }, [navigation]);

  return (
    <View
      className={`${isDark ? "bg-[#1a1a1a]" : "bg-white"} flex-row px-2 py-1 items-center`}>
      <TouchableOpacity onPress={handleOpenDrawer}>
        <Image
          source={require('../../../res/pngs/menu.png')}
          style={{
            width: 32,
            height: 32,
            marginVertical: "auto",
            marginLeft: "3%",
            marginTop: "2%",
            tintColor: isDark ? "white" : "black"
          }}
        />
      </TouchableOpacity>
      <View style={styles.header}>
        <View style={{ ...styles.searchBar, backgroundColor: isDark ? "#2a2a2a" : "#F0F0F0" }}>
          <Icon name="search" size={20} style={{ marginRight: "2%" }} color="#666" />
          <TextInput
            onFocus={handleSearchFocus}
            style={{
              color: isDark ? "white" : "black",
              backgroundColor: isDark ? "#2a2a2a" : "#F0F0F0",
              flex: 1,
              padding: 1,
              marginRight: "10%",
              width: "100%",
            }}
            onChangeText={handleSearchChange}
          />
          <TouchableOpacity
            className="absolute left-[35%] top-[40%]"
            onPress={handleSearchPress}>
            <Text className={`${isTyping ? 'opacity-0' : 'opacity-100'} ${isDark ? "text-white" : "text-black"}`}>
              {`👋 Hey ${getFirstName()}`}
            </Text>
          </TouchableOpacity>
        </View>
        <Image
          source={require('../../../res/pngs/testing/logo.png')}
          style={styles.profilePic}
        />
      </View>
    </View>
  );
});

export default NavigationDrawerButton;