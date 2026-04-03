import {TouchableOpacity, View, Dimensions} from 'react-native';
import React, {useEffect, useState, useCallback, memo} from 'react';
import {Image} from 'react-native';
import {ParamListBase} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import {
  selectFirebase,
  selectTheme,
  selectUserPhoto,
  selectUserProfileColor,
} from 'shared/store/selectors';
import {logger} from 'shared/utils/logger';
import Icon from 'react-native-vector-icons/Feather';
import {TextInput} from 'react-native-gesture-handler';
import {Avatar} from 'react-native-elements';
import {getUsernameForLogo} from 'shared/helpers/common/stringHelpers';
import {getStyles} from '../styles/NavigationDrawerButton.styles';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const NavigationDrawerButton = memo(
  ({navigation}: {navigation: DrawerNavigationProp<ParamListBase>}) => {
    const insets = useSafeAreaInsets();
    const theme = useTypedSelector(selectTheme);
    const isDark = theme === 'dark';
    const firebase = useTypedSelector(selectFirebase);
    const [userData, setUserData] = useState<{
      fullName: string;
      username: string;
    } | null>(null);
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const profileColor = useTypedSelector(selectUserProfileColor);
    const reduxPhotoURL = useTypedSelector(selectUserPhoto);

    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const currentUser = firebase.currentUser();
          if (!currentUser) {
            logger.debug(
              'No current user',
              undefined,
              'NavigationDrawerButton',
            );
            return;
          }

          // First check if we have a photo URL in Redux
          if (reduxPhotoURL) {
            setPhotoURL(reduxPhotoURL);
          }
          // If not, check Firebase user photo URL
          else if (currentUser.photoURL) {
            logger.debug(
              'User photo URL',
              currentUser.photoURL,
              'NavigationDrawerButton',
            );
            if (
              typeof currentUser.photoURL === 'string' &&
              (currentUser.photoURL.startsWith('http://') ||
                currentUser.photoURL.startsWith('https://') ||
                currentUser.photoURL.startsWith('data:'))
            ) {
              setPhotoURL(currentUser.photoURL);
            } else {
              logger.warn(
                'Invalid photo URL format',
                currentUser.photoURL,
                'NavigationDrawerButton',
              );
              setPhotoURL(null);
            }
          } else {
            logger.debug(
              'No photo URL available',
              undefined,
              'NavigationDrawerButton',
            );
            setPhotoURL(null);
          }

          const data = await firebase.user.getNameUsernamestring();
          logger.debug('User data fetched', data, 'NavigationDrawerButton');
          if (data) {
            setUserData(data);
          } else {
            logger.debug(
              'No user data found',
              undefined,
              'NavigationDrawerButton',
            );
          }
        } catch (error) {
          logger.error(
            'Error fetching user data',
            error,
            'NavigationDrawerButton',
          );
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

    const handleSearchChange = useCallback(
      (text: string) => {
        setSearchText(text);
        if (searchText.trim().length > 0) {
          navigation.navigate('Tabs', {
            screen: 'Search',
            params: {
              searchText: searchText,
            },
          });
        }
      },
      [searchText, navigation],
    );

    const styles = getStyles(isDark, profileColor!, insets.top);

    return (
      <View
        className={`${isDark ? 'bg-[#1a1a1a]' : 'bg-white'} flex-row w-full px-2 items-center`}
        style={styles.outerContainer}>
        <TouchableOpacity onPress={handleOpenDrawer}>
          <Image
            source={require('shared/res/pngs/menu.png')}
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
                  logger.warn(
                    'Profile image loading error',
                    e.nativeEvent.error,
                    'NavigationDrawerButton',
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
