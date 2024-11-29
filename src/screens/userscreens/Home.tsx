import { Button, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { useTypedDispatch } from '../../hooks/useTypedDispatch';
import { changeIsLoggedIn, changeProfileColor } from '../../reducers/User';
import { Avatar } from 'react-native-elements';
import {getUsernameForLogo } from '../../helpers/stringHelpers';
import Loader from '../../components/auth/Loader';

const Home = () => {
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const theme = useTypedSelector((state)=>state.user.theme);
  const isDark = theme === "dark";
  const [username, setUsername] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const dispatch = useTypedDispatch();
  const profileColor = useTypedSelector(state=>state.user.userProfileColor);
  const handlePress = async () => {
    await firebase.signOut();
    dispatch(changeIsLoggedIn(false));
  };
  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = firebase.currentUser();
      if (currentUser?.photoURL) {
        setPhotoURL(currentUser.photoURL);
      }
      const {fullName} = await firebase.getNameUsernamestring();
      setUsername(fullName);
    };
    fetchUserData();
  }, []);

  const renderAvatar = () => {
    if (photoURL!=null) {
      return (
        <Avatar
          size="large"
          source={{ uri: photoURL }}
          containerStyle={styles.avatar}
          rounded
          onPress={() => console.log('Avatar pressed')}
          activeOpacity={0.7}
        />
      );
    }
    return (
      <Avatar
        size="large"
        title={getUsernameForLogo(username)}
        containerStyle={[styles.avatar, { backgroundColor:profileColor ?? "grey"}]}
        onPress={() => console.log('Avatar pressed')}
        activeOpacity={0.7}
      />
    );
  };
  return (
    <View className={`justify-center items-center flex-1 ${isDark?"bg-[#1a1a1a]":"bg-white"}`}>
      {renderAvatar()}
      <Button title="Sign Out" onPress={handlePress} />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    color: 'black',
    fontSize: 20,
  },
  avatar: {
    borderRadius: 50,
    width: 100,
    height: 100,
  },
});