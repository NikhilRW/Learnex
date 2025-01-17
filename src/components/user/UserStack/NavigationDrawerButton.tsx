import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { ParamListBase } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useTypedSelector } from '../../../hooks/useTypedSelector';
import Icon from 'react-native-vector-icons/Feather';
import { TextInput } from 'react-native-gesture-handler';

const NavigationDrawerButton = ({ tintColor, navigation }: { tintColor: string, navigation: DrawerNavigationProp<ParamListBase, string, undefined> }) => {
  const theme = useTypedSelector((state) => state.user.theme);
  const isDark = theme === "dark";
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const [username, setUsername] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = firebase.currentUser();
      if (currentUser?.photoURL) {
        setPhotoURL(currentUser.photoURL);
      }
    };
  }, []);
  useEffect(() => {
    const fetchUserData = async () => {
      const { fullName } = await firebase.getNameUsernamestring();
      setUsername(fullName);
    };
    fetchUserData();
  }, []);
  return (
    <View
      className={`${isDark ? "bg-[#1a1a1a]" : "bg-white"} flex-row px-2 py-1 items-center`}>
      <TouchableOpacity
        onPress={() => navigation.openDrawer()}
      >
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
        <View style={{...styles.searchBar,backgroundColor:isDark?"#2a2a2a":"#F0F0F0"}}>
          <Icon name="search" size={20} color="#666" />
          <TextInput
            onFocus={() => navigation.navigate('Search')}
            style={{
              color: isDark ? "white" : "black",
              backgroundColor: isDark ? "#2a2a2a" : "#F0F0F0", marginLeft: 10,
              padding: 1,
            }}
            placeholderTextColor={isDark ? "white" : "black"}
            onChangeText={(text) => navigation.navigate('Search', { searchText: text })} placeholder={`👋 Hey ${username.split(' ')[0]}`}></TextInput>
        </View>
        <Image
          source={require('../../../res/pngs/testing/logo.png')}
          style={styles.profilePic}
        />
      </View>
    </View>
  );
};

export default NavigationDrawerButton;
const styles = StyleSheet.create({
  image: {
    height: 20,
    width: 20,
    tintColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 7,
    width: "90%",
    justifyContent: 'space-between',
  },
  profilePic: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginHorizontal: 10,
    padding: 8,
    borderRadius: 20,
  },
});
