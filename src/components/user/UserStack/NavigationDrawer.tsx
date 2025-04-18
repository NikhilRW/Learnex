import { ScrollView } from 'react-native-gesture-handler';
import { Text, TouchableOpacity, View, Dimensions, Linking, Modal, ActivityIndicator, Platform, PermissionsAndroid } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTypedSelector } from '../../../hooks/useTypedSelector';
import { useTypedDispatch } from '../../../hooks/useTypedDispatch';
import { changeIsLoggedIn, changeThemeColor, changeProfileColor, updateUserPhoto } from '../../../reducers/User';
import { Avatar, Image } from 'react-native-elements';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getUsernameForLogo } from '../../../helpers/stringHelpers';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { navigationDrawerOptions } from '../../../constants/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createStyles } from '../../../styles/components/user/UserStack/NavigationDrawer.styles';
import Snackbar from 'react-native-snackbar';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import { launchCamera, launchImageLibrary, CameraOptions } from 'react-native-image-picker';
import Config from 'react-native-config';
import { MessageService } from '../../../service/firebase/MessageService';
import { deleteOldProfilePhoto } from '../../../utils/Cloudinary';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NavigationDrawer = (props: DrawerContentComponentProps) => {
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const insets = useSafeAreaInsets();
  const currentUser = firebase.currentUser();
  const isDark = useTypedSelector((state) => state.user.theme) === "dark";
  const [fullName, setFullName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const dispatch = useTypedDispatch();
  const profileColor = useTypedSelector(state => state.user.userProfileColor);
  const reduxPhotoURL = useTypedSelector(state => state.user.userPhoto);
  const navigation = props.navigation;
  const styles = createStyles(isDark);
  const messageService = new MessageService();

  // Add state for photo picker modal
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Check for Cloudinary configuration
  useEffect(() => {
    // Check if Cloudinary config values are available
    if (!Config.CLOUDINARY_CLOUD_NAME || !Config.CLOUDINARY_UPLOAD_PRESET) {
      console.warn('Cloudinary config values missing. Make sure CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET are set in your .env file');
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
    support: ['About us', 'Toggle Theme']
  };

  // Map of navigation options to their respective icons
  const optionIcons = {
    'Room': 'video-camera',
    'Tasks': 'tasks',
    'Insights': 'bar-chart',
    'Direct Messages': 'comments',
    'Generate QR': 'qrcode',
    'Feed News': 'newspaper-o',
    'Events & Hackathons': 'calendar',
    'Rewards': 'trophy',
    'Saved': 'bookmark',
    'Help and FAQs': 'question-circle',
    'Contact us': 'envelope',
    'Setting': 'cog',
    'About us': 'info-circle',
    'Toggle Theme': isDark ? 'moon' : 'sun',
    'LexAI': 'robot'
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

  const handleOptionPress = async (option: string) => {
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
        if (await Linking.canOpenURL('https://learnex-web.vercel.app/#about')) {
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
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First check if we have a photo URL in Redux
        if (reduxPhotoURL) {
          setPhotoURL(reduxPhotoURL);
        }
        // If not, check Firebase user photo URL
        else if (currentUser?.photoURL) {
          console.log('NavigationDrawer: User photo URL:', currentUser.photoURL);
          // Validate URL format
          if (typeof currentUser.photoURL === 'string' &&
            (currentUser.photoURL.startsWith('http://') ||
              currentUser.photoURL.startsWith('https://') ||
              currentUser.photoURL.startsWith('data:'))) {
            setPhotoURL(currentUser.photoURL);
            // Also update Redux store
            dispatch(updateUserPhoto(currentUser.photoURL));
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

        // Set the user's email
        if (currentUser?.email) {
          setEmail(currentUser.email);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        // Set default values in case of error
        setUsername('User');
        setFullName('User');
        setPhotoURL(null);
        setEmail('');
      }
    };
    fetchUserData();
  }, [currentUser, dispatch, reduxPhotoURL]);

  // Add functions to handle profile photo changes
  const handleAvatarPress = () => {
    setPhotoPickerVisible(true);
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
      console.error('Error taking photo:', error);
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
      console.error('Error picking photo:', error);
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
        name: `profile-photo-${username}-${Date.now()}.jpg`
      });

      // Add upload preset
      formData.append('upload_preset', Config.CLOUDINARY_UPLOAD_PRESET || 'default_preset');

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
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        }
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
                image: data.secure_url
              });
            } catch (error) {
              console.error('Error updating conversation participant details:', error);
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
      console.error('Error updating profile photo:', error);
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

  const renderAvatar = () => {
    return (
      <TouchableOpacity
        onPress={handleAvatarPress}
        disabled={isUploading}
        style={styles.avatarContainer}
      >
        {isUploading ? (
          <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#333' : '#eee' }]}>
            <ActivityIndicator color="#2379C2" size="small" />
          </View>
        ) : photoURL && photoURL.length > 0 ? (
          <Image
            source={{ uri: photoURL }}
            containerStyle={styles.avatar}
            onError={() => {
              console.log('NavigationDrawer: Profile image loading error');
              setPhotoURL(null); // Fallback to initials avatar
            }}
          />
        ) : (
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
        )}
        <View style={styles.editIconContainer}>
          <FontAwesome name="camera" size={12} color="white" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderOptionIcon = (option: string) => {
    const iconName = optionIcons[option as keyof typeof optionIcons] || 'circle';
    return (
      <View style={styles.iconContainer}>
        {option === 'Toggle Theme' ? (
          <FontAwesome5Icon name={iconName} color={isDark ? '#2379C2' : '#2379C2'} size={Math.min(SCREEN_WIDTH * 0.045, 18)} />
        )
         : option === 'LexAI' ? (
          <Image source={require('../../../res/pngs/lexai.png')} style={{ width: Math.min(SCREEN_WIDTH * 0.045, 18), height: Math.min(SCREEN_WIDTH * 0.045, 18), tintColor: isDark ? '#2379C2' : '#2379C2' }} />
        ) : (
          <FontAwesome name={iconName} color={isDark ? '#2379C2' : '#2379C2'} size={Math.min(SCREEN_WIDTH * 0.045, 18)} />
        )}
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
              <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">
                {email}
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

      {/* Photo Picker Modal */}
      <Modal
        visible={photoPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPhotoPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPhotoPickerVisible(false)}
        >
          <View style={[
            styles.photoPickerContainer,
            { backgroundColor: isDark ? '#222' : 'white' }
          ]}>
            <Text style={[
              styles.photoPickerTitle,
              { color: isDark ? 'white' : '#333' }
            ]}>
              Change Profile Photo
            </Text>

            <TouchableOpacity
              style={styles.photoPickerOption}
              onPress={handleTakePhoto}
            >
              <Ionicons
                name="camera"
                size={24}
                color={isDark ? '#2379C2' : '#2379C2'}
              />
              <Text style={[
                styles.photoPickerOptionText,
                { color: isDark ? 'white' : '#333' }
              ]}>
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoPickerOption}
              onPress={handleChooseFromLibrary}
            >
              <MaterialIcons
                name="photo-library"
                size={24}
                color={isDark ? '#2379C2' : '#2379C2'}
              />
              <Text style={[
                styles.photoPickerOptionText,
                { color: isDark ? 'white' : '#333' }
              ]}>
                Choose from Library
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.photoPickerCancelButton, { borderTopColor: isDark ? '#444' : '#eee' }]}
              onPress={() => setPhotoPickerVisible(false)}
            >
              <Text style={[
                styles.photoPickerCancelText,
                { color: '#FF3B30' }
              ]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default NavigationDrawer;
