import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { useTypedDispatch } from '../../hooks/useTypedDispatch';
import { changeIsLoggedIn } from '../../reducers/User';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import Post from '../../components/user/UserScreens/Home/Post';
import { PostType } from '../../types/post';
import { styles } from '../../styles/screens/userscreens/Home.styles';

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

  const posts: PostType[] = [
    {
      id: "1",
      user: {
        id: 'ellyse123',
        username: 'ellyse.perry',
        image: require('../../res/pngs/testing/logo.png')
      },
      postImages: [
        require('../../res/pngs/testing/logo.png'),
        require('../../res/pngs/testing/logo.png'),
        require('../../res/pngs/testing/logo.png')
      ],
      description: "Multiple images in this post!",
      likes: 1234,
      comments: 56,
      timestamp: "2h ago"
    },
    {
      id: "2",
      user: {
        id: 'elon123',
        username: 'Elon Musk',
        image: require('../../res/pngs/testing/elonProfile.jpg')
      },
      postVideo: require('../../res/mp4s/example.mp4'),
      isVideo: true,
      postImages: [
        require('../../res/pngs/testing/elon.jpg'),
        require('../../res/pngs/testing/logo.png')
      ],
      description: "Check out my video and some photos! 🎥📸",
      likes: 5678,
      comments: 90,
      timestamp: "4h ago"
    },
    {
      id: "3",
      user: {
        id: 'ellyse123',
        username: 'ellyse.perry',
        image: require('../../res/pngs/testing/logo.png')
      },
      postImages: [
        require('../../res/pngs/testing/logo.png'),
        require('../../res/pngs/testing/logo.png'),
        require('../../res/pngs/testing/logo.png')
      ],
      description: "Multiple images in this post! 📸",
      likes: 2468,
      comments: 123,
      timestamp: "5h ago"
    }
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

export default Home;