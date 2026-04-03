import {
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Linking,
  Modal,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  TextInput,
  ScrollView,
} from 'react-native';
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import {
  selectFirebase,
  selectIsDark,
  selectUserPhoto,
  selectUserProfileColor,
} from 'shared/store/selectors';
import {useTypedDispatch} from 'hooks/redux/useTypedDispatch';
import {
  changeIsLoggedIn,
  changeThemeColor,
  updateUserPhoto,
} from 'shared/reducers/User';
import {Avatar} from 'react-native-elements';
import CachedImage from 'shared/components/CachedImage';
import {getUsernameForLogo} from 'shared/helpers/common/stringHelpers';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {createStyles} from '../styles/NavigationDrawer.styles';
import Snackbar from 'react-native-snackbar';
import {DrawerContentComponentProps} from '@react-navigation/drawer';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import {
  launchCamera,
  launchImageLibrary,
  CameraOptions,
} from 'react-native-image-picker';
import Config from 'react-native-superconfig';
import {MessageService} from 'conversations/services/MessageService';
import {deleteOldProfilePhoto} from 'shared/utils/cloudinary';
import {DEFAULT_UPLOAD_PRESET} from 'shared/constants/cloudinary';
import {logger} from 'shared/utils/logger';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

type DrawerSectionProps = {
  title: string;
  options: string[];
  onOptionPress: (option: string) => void;
  renderOptionIcon: (option: string) => React.ReactNode;
  styles: ReturnType<typeof createStyles>;
};

const DrawerSection = memo(
  ({
    title,
    options,
    onOptionPress,
    renderOptionIcon,
    styles,
  }: DrawerSectionProps) => (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {options.map(option => (
        <TouchableOpacity
          key={option}
          style={styles.optionItem}
          onPress={() => onOptionPress(option)}>
          {renderOptionIcon(option)}
          <Text
            style={styles.optionText}
            numberOfLines={2}
            ellipsizeMode="tail">
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  ),
);

DrawerSection.displayName = 'DrawerSection';

type DrawerProfileHeaderProps = {
  renderAvatar: () => React.ReactNode;
  username: string;
  email: string;
  onEditUsername: () => void;
  styles: ReturnType<typeof createStyles>;
};

const DrawerProfileHeader = memo(
  ({
    renderAvatar,
    username,
    email,
    onEditUsername,
    styles,
  }: DrawerProfileHeaderProps) => (
    <View style={styles.profileContainer}>
      {renderAvatar()}

      <View style={styles.usernameContainer}>
        <View className="flex-row items-center">
          <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
            {username}
          </Text>
          <TouchableOpacity
            onPress={onEditUsername}
            style={styles.usernameEditIcon}>
            <AntDesign name="edit" size={20} color="#ffffff80" />
          </TouchableOpacity>
        </View>
        <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">
          {email}
        </Text>
      </View>
    </View>
  ),
);

DrawerProfileHeader.displayName = 'DrawerProfileHeader';

const NavigationDrawer = (props: DrawerContentComponentProps) => {
  const firebase = useTypedSelector(selectFirebase);
  const insets = useSafeAreaInsets();
  const currentUser = firebase.currentUser();
  const isDark = useTypedSelector(selectIsDark);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const dispatch = useTypedDispatch();
  const profileColor = useTypedSelector(selectUserProfileColor);
  const reduxPhotoURL = useTypedSelector(selectUserPhoto);
  const navigation = props.navigation;
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const messageService = useRef(new MessageService()).current;

  // Add state for photo picker modal
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Add state for username edit modal
  const [usernameEditVisible, setUsernameEditVisible] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  // Check for Cloudinary configuration
  useEffect(() => {
    // Check if Cloudinary config values are available
    if (!Config.CLOUDINARY_CLOUD_NAME || !Config.CLOUDINARY_UPLOAD_PRESET) {
      logger.warn(
        'Cloudinary config values missing. Make sure CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET are set in your .env file',
        undefined,
        'NavigationDrawer',
      );
    }
  }, []);

  // Effect to sync the local photoURL with Redux when reduxPhotoURL changes
  useEffect(() => {
    if (reduxPhotoURL !== null) {
      setPhotoURL(reduxPhotoURL);
    }
  }, [reduxPhotoURL]);

  // Group navigation options by category
  const navigationCategories = {
    main: ['Room', 'Tasks', 'Direct Messages'],
    tools: ['Generate QR', 'Events & Hackathons', 'LexAI'],
    account: ['Saved'],
    support: ['About us', 'Toggle Theme'],
  };

  // Map of navigation options to their respective icons
  const optionIcons = {
    Room: 'video-camera',
    Tasks: 'tasks',
    Insights: 'bar-chart',
    'Direct Messages': 'comments',
    'Generate QR': 'qrcode',
    'Feed News': 'newspaper-o',
    'Events & Hackathons': 'calendar',
    Rewards: 'trophy',
    Saved: 'bookmark',
    'Help and FAQs': 'question-circle',
    'Contact us': 'envelope',
    Setting: 'cog',
    'About us': 'info-circle',
    'Toggle Theme': isDark ? 'moon' : 'sun',
    LexAI: 'robot',
  };

  const handleLogOutPress = async () => {
    try {
      const {success, error} = await firebase.auth.signOut();
      if (success) {
        dispatch(changeIsLoggedIn(false));
        navigation.getParent()?.navigate('AuthStack');
      } else {
        Snackbar.show({
          text: 'Failed to sign out: ' + error,
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#007cb5',
        });
      }
    } catch (err) {
      logger.error('Sign out error:', err, 'NavigationDrawer');
      Snackbar.show({
        text: 'An error occurred while signing out',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#007cb5',
      });
    }
  };

  const handleOptionPress = useCallback(
    async (option: string) => {
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
        case 'Direct Messages':
          navigation.navigate('Conversations');
          break;
        case 'Saved':
          navigation.navigate('SavedPosts');
          break;
        case 'Generate QR':
          navigation.navigate('QRCode');
          break;
        case 'About us':
          if (
            await Linking.canOpenURL('https://learnex-web.vercel.app/#about')
          ) {
            await Linking.openURL('https://learnex-web.vercel.app/#about');
          } else {
            Snackbar.show({
              text: 'Cannot open URL',
              duration: Snackbar.LENGTH_SHORT,
            });
          }
          break;
        case 'Toggle Theme':
          dispatch(changeThemeColor(isDark ? 'light' : 'dark'));
          break;
        case 'LexAI':
          navigation.navigate('LexAI');
          break;
        default:
          Snackbar.show({
            text: `${option} feature coming soon!`,
            duration: Snackbar.LENGTH_SHORT,
            textColor: 'white',
            backgroundColor: '#007cb5',
          });
          break;
      }
    },
    [dispatch, isDark, navigation],
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First check if we have a photo URL in Redux
        if (reduxPhotoURL) {
          setPhotoURL(reduxPhotoURL);
        }
        // If not, check Firebase user photo URL
        else if (currentUser?.photoURL) {
          logger.debug(
            'NavigationDrawer: User photo URL:',
            currentUser.photoURL,
            'NavigationDrawer',
          );
          // Validate URL format
          if (
            typeof currentUser.photoURL === 'string' &&
            (currentUser.photoURL.startsWith('http://') ||
              currentUser.photoURL.startsWith('https://') ||
              currentUser.photoURL.startsWith('data:'))
          ) {
            setPhotoURL(currentUser.photoURL);
            // Also update Redux store
            dispatch(updateUserPhoto(currentUser.photoURL));
          } else {
            logger.debug(
              'NavigationDrawer: Invalid photo URL format',
              undefined,
              'NavigationDrawer',
            );
            setPhotoURL(null);
          }
        } else {
          logger.debug(
            'NavigationDrawer: No photo URL available',
            undefined,
            'NavigationDrawer',
          );
          setPhotoURL(null);
        }

        const {username: my_username} =
          await firebase.user.getNameUsernamestring();
        setUsername(my_username);
        setNewUsername(my_username); // Initialize new username

        // Set the user's email
        if (currentUser?.email) {
          setEmail(currentUser.email);
        }
      } catch (err) {
        logger.error('Error fetching user data:', err, 'NavigationDrawer');
        // Set default values in case of error
        setUsername('User');
        setNewUsername('User');
        setPhotoURL(null);
        setEmail('');
      }
    };
    fetchUserData();
  }, [currentUser, dispatch, reduxPhotoURL, firebase.user]);

  // Add functions to handle profile photo changes
  const handleAvatarPress = () => {
    setPhotoPickerVisible(true);
  };

  // Add functions to handle username editing
  const handleEditUsername = () => {
    setNewUsername(username);
    setUsernameEditVisible(true);
  };

  const handleUsernameChange = (text: string) => {
    // Remove spaces and special characters, keep only alphanumeric and underscores
    const cleanedText = text.replace(/[^a-zA-Z0-9_]/g, '');
    setNewUsername(cleanedText);
  };

  const validateUsername = (un: string) => {
    if (un.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    if (un.length > 20) {
      return 'Username must be less than 20 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(un)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
  };

  const checkUsernameAvailability = async (user_name: string) => {
    try {
      // Check if username is available using Firebase
      const {success} = await firebase.user.checkUsernameIsAvailable(user_name);
      return success;
    } catch (err) {
      logger.error(
        'Error checking username availability:',
        err,
        'NavigationDrawer',
      );
      return false;
    }
  };

  const handleUpdateUsername = async () => {
    const validationError = validateUsername(newUsername);
    if (validationError) {
      Snackbar.show({
        text: validationError,
        duration: Snackbar.LENGTH_SHORT,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
      return;
    }

    if (newUsername === username) {
      setUsernameEditVisible(false);
      return;
    }

    try {
      setIsUpdatingUsername(true);

      // Check if username is available
      const isAvailable = await checkUsernameAvailability(newUsername);
      if (!isAvailable) {
        Snackbar.show({
          text: 'Username is already taken. Please choose another one.',
          duration: Snackbar.LENGTH_SHORT,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
        return;
      }

      // Update username
      const result = await firebase.user.updateUsername(newUsername);
      if (result.success) {
        setUsername(newUsername);
        setUsernameEditVisible(false);

        Snackbar.show({
          text: 'Username updated successfully',
          duration: Snackbar.LENGTH_SHORT,
          textColor: 'white',
          backgroundColor: '#4CAF50',
        });
      } else {
        Snackbar.show({
          text: 'Failed to update username: ' + result.error,
          duration: Snackbar.LENGTH_SHORT,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
      }
    } catch (error) {
      logger.error('Error updating username:', error, 'NavigationDrawer');
      Snackbar.show({
        text: 'An error occurred while updating username',
        duration: Snackbar.LENGTH_SHORT,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Platform specific permission handling
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission to take pictures',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Snackbar.show({
            text: 'Camera permission denied',
            duration: Snackbar.LENGTH_SHORT,
          });
          return;
        }
      }
      // Note: iOS permissions are automatically handled by the OS
      // when the app attempts to use the camera

      // Camera is available, proceed with taking photo
      setPhotoPickerVisible(false);

      const options: CameraOptions = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
        saveToPhotos: false,
      };

      const result = await launchCamera(options);

      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        // Successfully got a photo
        updateProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      logger.error('Error taking photo:', error, 'NavigationDrawer');
      Snackbar.show({
        text: 'Failed to take photo',
        duration: Snackbar.LENGTH_SHORT,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    }
  };

  const handleChooseFromLibrary = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      });

      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        setPhotoPickerVisible(false);

        updateProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      logger.error('Error picking photo:', error, 'NavigationDrawer');
      Snackbar.show({
        text: 'Failed to pick photo',
        duration: Snackbar.LENGTH_SHORT,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    }
  };

  const updateProfilePhoto = async (photoUri: string) => {
    try {
      setIsUploading(true);

      // Store the current photo URL to delete it after successful upload
      const oldPhotoUrl = photoURL;

      // Create a FormData object
      const formData = new FormData();

      // Append the file
      formData.append('file', {
        uri: photoUri,
        type: 'image/jpeg',
        name: `profile-photo-${username}-${Date.now()}.jpg`,
      });

      // Add upload preset
      formData.append('upload_preset', DEFAULT_UPLOAD_PRESET);

      // Check if we have the required configuration
      if (!Config.CLOUDINARY_CLOUD_NAME) {
        throw new Error('Cloudinary cloud name is not configured');
      }

      // Upload directly to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${Config.CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const data = await response.json();

      if (data.secure_url) {
        const result = await firebase.user.updateProfilePhoto(data.secure_url);
        if (result.success) {
          // Update local state to reflect the change
          setPhotoURL(data.secure_url);

          // Update Redux state
          dispatch(updateUserPhoto(data.secure_url));

          // Update profile photo in conversations
          if (currentUser) {
            try {
              await messageService.updateParticipantDetails(currentUser.uid, {
                image: data.secure_url,
              });
            } catch (error) {
              logger.error(
                'Error updating conversation participant details:',
                error,
                'NavigationDrawer',
              );
              // Continue even if this fails - the profile photo will still be updated in the system
            }
          }

          // Delete the old profile photo after successful update
          if (oldPhotoUrl) {
            await deleteOldProfilePhoto(oldPhotoUrl);
          }

          Snackbar.show({
            text: 'Profile photo updated successfully',
            duration: Snackbar.LENGTH_SHORT,
            textColor: 'white',
            backgroundColor: '#4CAF50',
          });
        } else {
          Snackbar.show({
            text: 'Failed to update profile photo',
            duration: Snackbar.LENGTH_SHORT,
            textColor: 'white',
            backgroundColor: '#ff3b30',
          });
        }
      } else {
        Snackbar.show({
          text: 'Failed to upload profile photo',
          duration: Snackbar.LENGTH_SHORT,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
      }
    } catch (error) {
      logger.error('Error updating profile photo:', error, 'NavigationDrawer');
      Snackbar.show({
        text: 'An error occurred while updating profile photo',
        duration: Snackbar.LENGTH_SHORT,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const renderAvatar = useCallback(() => {
    return (
      <TouchableOpacity
        onPress={handleAvatarPress}
        disabled={isUploading}
        style={styles.avatarContainer}>
        {isUploading ? (
          <View
            style={[
              styles.avatar,
              styles.activityIndicatorContainer,
              isDark
                ? styles.activityIndicatorBgDark
                : styles.activityIndicatorBgLight,
            ]}>
            <ActivityIndicator color="#2379C2" size="small" />
          </View>
        ) : photoURL && photoURL.length > 0 ? (
          <CachedImage
            source={{uri: photoURL}}
            style={styles.avatar}
            contentFit="cover"
            onError={() => {
              logger.debug(
                'NavigationDrawer: Profile image loading error',
                undefined,
                'NavigationDrawer',
              );
              setPhotoURL(null); // Fallback to initials avatar
            }}
          />
        ) : (
          <Avatar
            size={60}
            title={getUsernameForLogo(username || 'User')}
            titleStyle={styles.avatarTitle}
            containerStyle={[
              styles.avatar,
              styles.avatarContainerStyle,
              {backgroundColor: profileColor || '#2379C2'},
            ]}
            activeOpacity={0.7}
          />
        )}
        <View style={styles.editIconContainer}>
          <FontAwesome name="camera" size={12} color="white" />
        </View>
      </TouchableOpacity>
    );
  }, [
    handleAvatarPress,
    isUploading,
    isDark,
    photoURL,
    profileColor,
    styles,
    username,
  ]);

  const renderOptionIcon = useCallback(
    (option: string) => {
      const iconName =
        optionIcons[option as keyof typeof optionIcons] || 'circle';
      return (
        <View style={styles.iconContainer}>
          {option === 'Toggle Theme' ? (
            <FontAwesome5Icon
              name={iconName}
              color={isDark ? '#2379C2' : '#2379C2'}
              size={Math.min(SCREEN_WIDTH * 0.045, 18)}
            />
          ) : option === 'LexAI' ? (
            <CachedImage
              source={require('shared/res/pngs/lexai.png')}
              style={styles.lexAiIcon}
              contentFit="contain"
            />
          ) : (
            <FontAwesome
              name={iconName}
              color={isDark ? '#2379C2' : '#2379C2'}
              size={Math.min(SCREEN_WIDTH * 0.045, 18)}
            />
          )}
        </View>
      );
    },
    [isDark, styles.iconContainer, styles.lexAiIcon],
  );

  const renderNavigationSection = useCallback(
    (title: string, options: string[]) => (
      <DrawerSection
        title={title}
        options={options}
        onOptionPress={handleOptionPress}
        renderOptionIcon={renderOptionIcon}
        styles={styles}
      />
    ),
    [handleOptionPress, renderOptionIcon, styles],
  );

  return (
    <View
      style={[
        styles.container,
        {paddingTop: insets.top, paddingBottom: insets.bottom},
      ]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <DrawerProfileHeader
            renderAvatar={renderAvatar}
            username={username}
            email={email}
            onEditUsername={handleEditUsername}
            styles={styles}
          />

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
                style={styles.signOutButton}>
                <Ionicons
                  name="exit-outline"
                  color="white"
                  size={Math.min(SCREEN_WIDTH * 0.055, 22)}
                />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Photo Picker Modal */}
      <Modal
        visible={photoPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPhotoPickerVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPhotoPickerVisible(false)}>
          <View
            style={[
              styles.photoPickerContainer,
              isDark
                ? styles.modalPhotoPickerContainerDark
                : styles.modalPhotoPickerContainerLight,
            ]}>
            <Text
              style={[
                styles.photoPickerTitle,
                isDark
                  ? styles.modalPhotoPickerTitleDark
                  : styles.modalPhotoPickerTitleLight,
              ]}>
              Change Profile Photo
            </Text>

            <TouchableOpacity
              style={styles.photoPickerOption}
              onPress={handleTakePhoto}>
              <Ionicons
                name="camera"
                size={24}
                color={isDark ? '#2379C2' : '#2379C2'}
              />
              <Text
                style={[
                  styles.photoPickerOptionText,
                  isDark
                    ? styles.modalPhotoPickerOptionTextDark
                    : styles.modalPhotoPickerOptionTextLight,
                ]}>
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoPickerOption}
              onPress={handleChooseFromLibrary}>
              <MaterialIcons
                name="photo-library"
                size={24}
                color={isDark ? '#2379C2' : '#2379C2'}
              />
              <Text
                style={[
                  styles.photoPickerOptionText,
                  isDark
                    ? styles.modalPhotoPickerOptionTextDark
                    : styles.modalPhotoPickerOptionTextLight,
                ]}>
                Choose from Library
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.photoPickerCancelButton,
                isDark
                  ? styles.modalPhotoPickerCancelButtonDark
                  : styles.modalPhotoPickerCancelButtonLight,
              ]}
              onPress={() => setPhotoPickerVisible(false)}>
              <Text style={[styles.photoPickerCancelText, styles.dangerText]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Username Edit Modal */}
      <Modal
        visible={usernameEditVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setUsernameEditVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setUsernameEditVisible(false)}>
          <View
            style={[
              styles.photoPickerContainer,
              isDark
                ? styles.modalPhotoPickerContainerDark
                : styles.modalPhotoPickerContainerLight,
              styles.modalContentPadding,
            ]}>
            <Text
              style={[
                styles.photoPickerTitle,
                isDark
                  ? styles.modalPhotoPickerTitleDark
                  : styles.modalPhotoPickerTitleLight,
              ]}>
              Change Username
            </Text>

            <TextInput
              style={[
                styles.usernameInput,
                isDark ? styles.usernameInputDark : styles.usernameInputLight,
              ]}
              value={newUsername}
              onChangeText={handleUsernameChange}
              placeholder="Enter new username"
              placeholderTextColor={isDark ? '#999' : '#666'}
              maxLength={20}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text
              style={[
                styles.usernameHint,
                isDark ? styles.usernameHintDark : styles.usernameHintLight,
              ]}>
              Username must be 3-20 characters, letters, numbers, and
              underscores only
            </Text>

            <View style={styles.usernameButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.usernameButton,
                  styles.usernameCancelButton,
                  isDark
                    ? styles.usernameCancelButtonDark
                    : styles.usernameCancelButtonLight,
                ]}
                onPress={() => setUsernameEditVisible(false)}>
                <Text style={[styles.usernameButtonText, styles.dangerText]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.usernameButton,
                  styles.usernameUpdateButton,
                  isUpdatingUsername && styles.usernameButtonDisabled,
                ]}
                onPress={handleUpdateUsername}
                disabled={isUpdatingUsername}>
                {isUpdatingUsername ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.usernameButtonText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default NavigationDrawer;
