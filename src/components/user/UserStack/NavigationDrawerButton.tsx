import {Text, TouchableOpacity, View, Dimensions} from 'react-native';
import React, {useEffect, useState, useCallback, memo} from 'react';
import {Image} from 'react-native';
import {ParamListBase} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {useTypedSelector} from '../../../hooks/useTypedSelector';
import Icon from 'react-native-vector-icons/Feather';
import {TextInput} from 'react-native-gesture-handler';
import {styles} from '../../../styles/components/user/UserStack/NavigationDrawerButton.styles';
import {Avatar} from 'react-native-elements';
import {getUsernameForLogo} from '../../../helpers/stringHelpers';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const NavigationDrawerButton = memo(
  ({
    tintColor,
    navigation,
  }: {
    tintColor: string;
    navigation: DrawerNavigationProp<ParamListBase, string, undefined>;
  }) => {
    const theme = useTypedSelector(state => state.user.theme);
    const isDark = theme === 'dark';
    const firebase = useTypedSelector(state => state.firebase.firebase);
    const [userData, setUserData] = useState<{
      fullName: string;
      username: string;
    } | null>(null);
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [searchText, setSearchText] = useState('');
    const profileColor = useTypedSelector(state => state.user.userProfileColor);
    const reduxPhotoURL = useTypedSelector(state => state.user.userPhoto);

    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const currentUser = firebase.currentUser();
          if (!currentUser) {
            console.log('No current user');
            return;
          }

          // First check if we have a photo URL in Redux
          if (reduxPhotoURL) {
            setPhotoURL(reduxPhotoURL);
          }
          // If not, check Firebase user photo URL
          else if (currentUser.photoURL) {
            console.log('User photo URL:', currentUser.photoURL);
            if (
              typeof currentUser.photoURL === 'string' &&
              (currentUser.photoURL.startsWith('http://') ||
                currentUser.photoURL.startsWith('https://') ||
                currentUser.photoURL.startsWith('data:'))
            ) {
              setPhotoURL(currentUser.photoURL);
            } else {
              console.log('Invalid photo URL format:', currentUser.photoURL);
              setPhotoURL(null);
            }
          } else {
            console.log('No photo URL available');
            setPhotoURL(null);
          }

          const data = await firebase.user.getNameUsernamestring();
          console.log('data : ' + data.username);
          if (data) {
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
    }, [firebase, reduxPhotoURL]);

    // Effect to update photoURL when reduxPhotoURL changes
    useEffect(() => {
      if (reduxPhotoURL !== null) {
        setPhotoURL(reduxPhotoURL);
      }
    }, [reduxPhotoURL]);

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
    }, []);

    const handleSearchChange = useCallback((text: string) => {
      setSearchText(text);
      if (text.length > 0) {
        setIsTyping(true);
      } else {
        setIsTyping(false);
      }
    }, []);

    const handleSearchPress = useCallback(() => {
      setIsTyping(true);
      navigation.navigate('Search', {searchText: searchText});
    }, [navigation, searchText]);

    return (
      <View
        className={`${isDark ? 'bg-[#1a1a1a]' : 'bg-white'} flex-row w-full px-2 py-1 items-center`}>
        <TouchableOpacity onPress={handleOpenDrawer}>
          <Image
            source={require('../../../res/pngs/menu.png')}
            style={{
              width: Math.min(SCREEN_WIDTH * 0.08, 32),
              height: Math.min(SCREEN_WIDTH * 0.08, 32),
              marginVertical: 'auto',
              marginLeft: '3%',
              marginTop: '2%',
              tintColor: isDark ? 'white' : 'black',
            }}
          />
        </TouchableOpacity>
        <View style={styles.header}>
          <View
            style={{
              ...styles.searchBar,
              backgroundColor: isDark ? '#2a2a2a' : '#F0F0F0',
            }}>
            <Icon
              name="search"
              size={Math.min(SCREEN_WIDTH * 0.05, 20)}
              style={{marginRight: '2%'}}
              color="#666"
            />
            <TextInput
              onFocus={handleSearchFocus}
              style={{
                color: isDark ? 'white' : 'black',
                backgroundColor: isDark ? '#2a2a2a' : '#F0F0F0',
                flex: 1,
                padding: 1,
                marginRight: '2%',
                width: '100%',
                fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
              }}
              onChangeText={handleSearchChange}
              value={searchText}
              placeholder="Search Posts"
              placeholderTextColor={isDark ? '#999' : '#666'}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (searchText.trim().length > 0) {
                  navigation.navigate('Tabs', {
                    screen: 'Search',
                    params: {
                      searchText: searchText,
                    },
                  });
                }
              }}
            />
          </View>
          {photoURL ? (
            <Image
              source={{uri: photoURL}}
              style={[
                styles.container,
                {borderColor: isDark ? `#2379C2` : `#2379C2`},
              ]}
              onError={e => {
                console.log(
                  'Profile image loading error:',
                  e.nativeEvent.error,
                );
                setPhotoURL(null);
              }}
            />
          ) : (
            <Avatar
              size={Math.min(SCREEN_WIDTH * 0.0625, 25)}
              titleStyle={{
                textAlign: 'center',
                fontSize: Math.min(SCREEN_WIDTH * 0.0375, 15),
                fontFamily: 'Kufam-Thin',
              }}
              title={getUsernameForLogo(userData!?.username || 'Anonymous')}
              containerStyle={[
                styles.container,
                {
                  borderColor: isDark ? '#2379C2' : '#2379C2',
                  backgroundColor: profileColor!,
                },
              ]}
              activeOpacity={0.7}
            />
          )}
        </View>
      </View>
    );
  },
);

export default NavigationDrawerButton;
