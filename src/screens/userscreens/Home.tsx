import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { useTypedDispatch } from '../../hooks/useTypedDispatch';
import { changeIsLoggedIn } from '../../reducers/User';
import { Avatar } from 'react-native-elements';
import { getUsernameForLogo } from '../../helpers/stringHelpers';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { primaryColor } from '../../res/strings/eng';
import Icon from 'react-native-vector-icons/Feather';
import Post from '../../components/user/UserScreens/Home/Post';


const Home = () => {
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const theme = useTypedSelector(state => state.user.theme);
  const isDark = theme === 'dark';
  const [isLoaded, setIsLoaded] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const dispatch = useTypedDispatch();
  const profileColor = useTypedSelector(state => state.user.userProfileColor);
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
      const { fullName } = await firebase.getNameUsernamestring();
      setUsername(fullName);
    };
    fetchUserData();
  }, []);
  useEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);
    }, 2500);
  }, []);
  const stories = [
    { id: 1, image: require('../../res/pngs/testing/logo.png') },
    { id: 2, image: require('../../res/pngs/testing/logo.png') },
    { id: 3, image: require('../../res/pngs/testing/logo.png') },
    { id: 4, image: require('../../res/pngs/testing/logo.png') },
    { id: 5, image: require('../../res/pngs/testing/logo.png') },
    { id: 6, image: require('../../res/pngs/testing/logo.png') },
  ];

  const tags = ['#ElonMusk', '#Fifa2026', '#Olympics', '#Paris'];

  const posts = [
    {
      id: 1,
      user: 'ellyse.perry',
      userImage: require('../../res/pngs/testing/logo.png'),
      postImage: require('../../res/pngs/testing/logo.png'),
    },
    {
      id: 2,
      user: 'Elon Musk',
      userImage: require('../../res/pngs/testing/elonProfile.jpg'),
      postImage: require('../../res/pngs/testing/elon.jpg'),
    },
  ];
  const HomeSkeleton = ({ width, height }: { width: number, height: number }): JSX.Element => {
    //TODO : Add the skeleton for the home screen
    return (
      <SkeletonPlaceholder borderRadius={4}
        speed={1000}
        highlightColor="#edf6f7"  >
        <View></View>
      </SkeletonPlaceholder>
    );
  };
  return (
    <SafeAreaView className={` justify-start items-center   ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
      {isLoaded ? (
        <>
          <ScrollView style={styles.mainContainer} showsVerticalScrollIndicator={false}>
            {/* Stories */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.storiesContainer}
            >
              {stories.map(story => (
                <View key={story.id} style={styles.storyItem}>
                  <Image source={story.image} style={styles.storyImage} />
                </View>
              ))}
            </ScrollView>

            {/* Tags */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagsContainer}
            >
              {tags.map(tag => (
                <TouchableOpacity key={tag} style={{ ...styles.tagButton, backgroundColor: isDark ? "#2a2a2a" : "#F0F0F0" }}>
                  <Text style={{ ...styles.tagText, color: isDark ? "white" : "black" }}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.postContainer}>
              {posts.map(post => (
                <Post key={post.id} post={post} />
              ))}
            </View>
          </ScrollView>
        </>
      ) : (
        <HomeSkeleton width={100} height={100} />
      )}
    </SafeAreaView>
  );
};

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
  skeletonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileLogoContainer: {
    gap: 10,
    paddingHorizontal: 10,
    height: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    justifyContent: 'space-between',
  },
  storiesContainer: {
    padding: 10,
  },
  storyItem: {
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#0095f6',
    borderRadius: 50,
    padding: 2.6,
    justifyContent: "center",
  },
  storyImage: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    resizeMode: 'cover',
  },
  tagsContainer: {
    padding: 10,
  },
  tagButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  tagText: {
    color: '#000',
  },
  postsContainer: {
    width: "100%",
    height: "80%",
  },
  mainContainer: {
    width: "100%",
    height: "100%",
  },
  postContainer: {
    marginBottom: 15,
    paddingHorizontal: 7,
  },
});

export default Home;