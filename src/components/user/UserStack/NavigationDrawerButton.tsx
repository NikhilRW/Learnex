import {TouchableOpacity, View, Dimensions} from 'react-native';
import React, {useEffect, useState, useCallback, memo} from 'react';
import {Image} from 'react-native';
import {ParamListBase} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {useTypedSelector} from '../../../hooks/useTypedSelector';
import Icon from 'react-native-vector-icons/Feather';
import {TextInput} from 'react-native-gesture-handler';
import {Avatar} from 'react-native-elements';
import {getUsernameForLogo} from '../../../helpers/stringHelpers';
import {getStyles} from '../../../styles/components/user/UserStack/NavigationDrawerButton.styles';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const NavigationDrawerButton = memo(
  ({navigation}: {navigation: DrawerNavigationProp<ParamListBase>}) => {
    const theme = useTypedSelector(state => state.user.theme);
    const isDark = theme === 'dark';
    const firebase = useTypedSelector(state => state.firebase.firebase);
    const [userData, setUserData] = useState<{
      fullName: string;
      username: string;
    } | null>(null);
    const [photoURL, setPhotoURL] = useState<string | null>(null);
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

    const handleOpenDrawer = useCallback(() => {
      navigation.openDrawer();
    }, [navigation]);

    const handleSearchChange = useCallback((text: string) => {
      setSearchText(text);
      if (searchText.trim().length > 0) {
        navigation.navigate('Tabs', {
          screen: 'Search',
          params: {
            searchText: searchText,
          },
        });
      }
    }, []);

    const styles = getStyles(isDark, profileColor!);

    return (
      <View
        className={`${isDark ? 'bg-[#1a1a1a]' : 'bg-white'} flex-row w-full px-2 py-1 items-center`}>
        <TouchableOpacity onPress={handleOpenDrawer}>
          <Image
            source={require('../../../res/pngs/menu.png')}
            style={styles.menuIcon}
          />
        </TouchableOpacity>
        <View style={styles.header}>
          <View style={styles.searchBar}>
            <Icon
              name="search"
              size={Math.min(SCREEN_WIDTH * 0.05, 20)}
              style={styles.searchIconMarginRight}
              color="#666"
            />
            <TextInput
              style={styles.searchInputStyle}
              onChangeText={handleSearchChange}
              value={searchText}
              placeholder="Search Posts"
              placeholderTextColor={isDark ? '#999' : '#666'}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity onPress={handleOpenDrawer} activeOpacity={0.7}>
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
                titleStyle={styles.avatarTitleStyle}
                title={getUsernameForLogo(userData!?.username || 'Anonymous')}
                containerStyle={[styles.container]}
                activeOpacity={0.7}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);
export default NavigationDrawerButton;