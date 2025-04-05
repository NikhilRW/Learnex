import { Text, TouchableOpacity, View, Dimensions, Animated } from 'react-native';
import React, { useEffect, useState, useCallback, memo, useRef } from 'react';
import { Image } from 'react-native';
import IonIcons from 'react-native-vector-icons/Ionicons';
import { ParamListBase } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useTypedSelector } from '../../../hooks/useTypedSelector';
import Icon from 'react-native-vector-icons/Feather';
import { TextInput } from 'react-native-gesture-handler';
import { styles } from '../../../styles/components/user/UserStack/NavigationDrawerButton.styles';
import { Avatar } from 'react-native-elements';
import { getUsernameForLogo } from '../../../helpers/stringHelpers';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Storage key for previously shown greetings
const SHOWN_GREETINGS_KEY = 'learnex_shown_greetings';
const MAX_UNIQUE_GREETINGS = 10;

// Fallback greetings in case API fails
const FALLBACK_GREETINGS = [
  "👋 Hey",
  "💡 Welcome back",
  "✨ Great to see you",
  "🔍 Ready to explore",
  "🚀 Let's go",
  "🌟 Feeling inspired?",
  "📱 Welcome aboard",
  "⚡ Power up",
  "🎯 Focus today",
  "💪 Stay motivated"
];

// Gemini API service
const fetchGeminiGreeting = async (shownGreetings: string[] = []): Promise<string> => {
  try {
    // Use your Google Gemini API key from env variables
    const GEMINI_API_KEY = Config.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    // Create a prompt that includes previously shown greetings to avoid
    let promptText = "Generate a single short, friendly, and inspirational greeting that would appear in a mobile app search bar. The message should consist of 2 to 3 words only, starting with an emoji. Only give the greeting, nothing more.";

    // Add previously shown greetings to avoid repeating them
    if (shownGreetings.length > 0) {
      promptText += " DO NOT generate any of these previous greetings: " + shownGreetings.join(", ");
    }

    console.log("Prompt to Gemini:", promptText);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptText
          }]
        }],
        generationConfig: {
          temperature: 0.9, // Increased temperature for more variety
          maxOutputTokens: 10,
        }
      }),
    });

    const data = await response.json();

    // Extract the greeting from the response
    const generatedText = data.candidates[0]?.content?.parts[0]?.text?.trim();
    console.log("Generated greeting:", generatedText);

    // Validate the greeting format and length
    if (generatedText && generatedText.length < 30) {
      // Add an emoji if there isn't one
      const hasEmoji = /\p{Emoji}/u.test(generatedText);
      let formattedGreeting = generatedText;

      if (!hasEmoji) {
        // List of positive emojis to randomly choose from
        const emojis = ["👋", "✨", "💡", "🚀", "🌟", "💪", "🔥", "✅", "🎯", "⭐"];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        formattedGreeting = `${randomEmoji} ${formattedGreeting}`;
      }

      // If this greeting has already been shown, try to get a fallback that hasn't been shown
      if (shownGreetings.includes(formattedGreeting)) {
        console.log("Generated greeting was a duplicate, finding alternative");
        // Find a fallback that hasn't been shown yet
        const unusedFallbacks = FALLBACK_GREETINGS.filter(greeting => !shownGreetings.includes(greeting));
        if (unusedFallbacks.length > 0) {
          return unusedFallbacks[Math.floor(Math.random() * unusedFallbacks.length)];
        }
      }

      return formattedGreeting;
    } else {
      // Return a fallback that hasn't been shown yet if possible
      const unusedFallbacks = FALLBACK_GREETINGS.filter(greeting => !shownGreetings.includes(greeting));
      if (unusedFallbacks.length > 0) {
        return unusedFallbacks[Math.floor(Math.random() * unusedFallbacks.length)];
      }

      // If all fallbacks have been shown, just return a random one
      return FALLBACK_GREETINGS[Math.floor(Math.random() * FALLBACK_GREETINGS.length)];
    }
  } catch (error) {
    console.error('Error fetching Gemini greeting:', error);

    // Return a fallback that hasn't been shown yet if possible
    const unusedFallbacks = FALLBACK_GREETINGS.filter(greeting => !shownGreetings.includes(greeting));
    if (unusedFallbacks.length > 0) {
      return unusedFallbacks[Math.floor(Math.random() * unusedFallbacks.length)];
    }

    // If all fallbacks have been shown, just return a random one
    return FALLBACK_GREETINGS[Math.floor(Math.random() * FALLBACK_GREETINGS.length)];
  }
};

// Load previously shown greetings from AsyncStorage
const loadShownGreetings = async (): Promise<string[]> => {
  try {
    const storedGreetings = await AsyncStorage.getItem(SHOWN_GREETINGS_KEY);
    if (storedGreetings) {
      return JSON.parse(storedGreetings);
    }
    return [];
  } catch (error) {
    console.error('Error loading shown greetings:', error);
    return [];
  }
};

// Save a greeting to the shown greetings list
const saveShownGreeting = async (greeting: string) => {
  try {
    // Get current greetings
    const shownGreetings = await loadShownGreetings();

    // Add new greeting if it's not already there
    if (!shownGreetings.includes(greeting)) {
      // Add new greeting and keep only the most recent MAX_UNIQUE_GREETINGS
      const updatedGreetings = [greeting, ...shownGreetings].slice(0, MAX_UNIQUE_GREETINGS);
      await AsyncStorage.setItem(SHOWN_GREETINGS_KEY, JSON.stringify(updatedGreetings));
    }
  } catch (error) {
    console.error('Error saving shown greeting:', error);
  }
};

// Check if we've shown at least MAX_UNIQUE_GREETINGS different greetings
const haveShownEnoughUniqueGreetings = async (): Promise<boolean> => {
  try {
    const shownGreetings = await loadShownGreetings();
    return shownGreetings.length >= MAX_UNIQUE_GREETINGS;
  } catch (error) {
    console.error('Error checking unique greetings count:', error);
    return false;
  }
};

// Reset shown greetings if needed (can be called when app is launched)
const resetShownGreetingsIfNeeded = async () => {
  try {
    const shouldReset = await haveShownEnoughUniqueGreetings();
    if (shouldReset) {
      await AsyncStorage.removeItem(SHOWN_GREETINGS_KEY);
      console.log('Reset shown greetings after reaching maximum unique count');
    }
  } catch (error) {
    console.error('Error resetting shown greetings:', error);
  }
};

const NavigationDrawerButton = memo(({ tintColor, navigation }: { tintColor: string, navigation: DrawerNavigationProp<ParamListBase, string, undefined> }) => {
  const theme = useTypedSelector((state) => state.user.theme);
  const isDark = theme === "dark";
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const [userData, setUserData] = useState<{ fullName: string; username: string } | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [searchText, setSearchText] = useState('');
  const profileColor = useTypedSelector(state => state.user.userProfileColor);

  // Animated value for opacity transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // State for current greeting message
  const [currentGreeting, setCurrentGreeting] = useState<string>(FALLBACK_GREETINGS[0]);

  // Queue of pre-fetched greetings to ensure smooth transitions
  const [greetingsQueue, setGreetingsQueue] = useState<string[]>([]);

  // State to track shown greetings in the current session
  const [shownGreetings, setShownGreetings] = useState<string[]>([]);

  // Reset greeting counter on component mount (app launch)
  useEffect(() => {
    resetShownGreetingsIfNeeded();
  }, []);

  // Load previously shown greetings when component mounts
  useEffect(() => {
    const loadGreetings = async () => {
      const loadedGreetings = await loadShownGreetings();
      setShownGreetings(loadedGreetings);
    };

    loadGreetings();
  }, []);

  // Prefetch greetings
  const prefetchGreetings = useCallback(async () => {
    try {
      const loadedGreetings = await loadShownGreetings();
      const newGreeting = await fetchGeminiGreeting(loadedGreetings);
      setGreetingsQueue(prev => [...prev, newGreeting]);
    } catch (error) {
      console.error('Error prefetching greetings:', error);
    }
  }, []);

  useEffect(() => {
    // Initial prefetch of multiple greetings
    const initialFetch = async () => {
      try {
        // Get previously shown greetings
        const loadedGreetings = await loadShownGreetings();

        const initialGreetings = [];
        for (let i = 0; i < 3; i++) {
          const greeting = await fetchGeminiGreeting(loadedGreetings);
          initialGreetings.push(greeting);
        }
        setGreetingsQueue(initialGreetings);
      } catch (error) {
        console.error('Error in initial greeting fetch:', error);
      }
    };

    initialFetch();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = firebase.currentUser();
        if (!currentUser) {
          console.log('No current user');
          return;
        }

        // Check and log photoURL for debugging
        if (currentUser.photoURL) {
          console.log('User photo URL:', currentUser.photoURL);
          // Validate URL format
          if (typeof currentUser.photoURL === 'string' &&
            (currentUser.photoURL.startsWith('http://') ||
              currentUser.photoURL.startsWith('https://') ||
              currentUser.photoURL.startsWith('data:'))) {
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
        console.log("data : " + data.username);
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
  }, [firebase]);

  // Get first name safely
  const getFirstName = useCallback(() => {
    if (!userData?.fullName) return "There";
    const nameParts = userData.fullName.trim().split(' ');
    return nameParts[0] || "There";
  }, [userData]);

  // Setup interval to change greeting message
  useEffect(() => {
    const changeGreeting = () => {
      // Fade out current message
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Get next greeting from queue
        if (greetingsQueue.length > 0) {
          const nextGreeting = greetingsQueue[0];
          const remainingGreetings = greetingsQueue.slice(1);

          setCurrentGreeting(nextGreeting);
          setGreetingsQueue(remainingGreetings);

          // Save this greeting as shown
          saveShownGreeting(nextGreeting);
          setShownGreetings(prev => {
            if (!prev.includes(nextGreeting)) {
              return [nextGreeting, ...prev].slice(0, MAX_UNIQUE_GREETINGS);
            }
            return prev;
          });

          // Prefetch a new greeting to keep the queue filled
          prefetchGreetings();
        } else {
          // Use a fallback if queue is empty
          const randomFallback = FALLBACK_GREETINGS[Math.floor(Math.random() * FALLBACK_GREETINGS.length)];
          setCurrentGreeting(randomFallback);

          // Save this greeting as shown
          saveShownGreeting(randomFallback);
          setShownGreetings(prev => {
            if (!prev.includes(randomFallback)) {
              return [randomFallback, ...prev].slice(0, MAX_UNIQUE_GREETINGS);
            }
            return prev;
          });

          prefetchGreetings();
        }

        // Fade in new message
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    };

    const intervalId = setInterval(changeGreeting, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [fadeAnim, greetingsQueue, prefetchGreetings]);

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
    // Don't navigate immediately on focus, let the user type first
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
    // Navigate to search with current search text if available
    navigation.navigate('Search', { searchText: searchText });
  }, [navigation, searchText]);

  return (
    <View
    
      className={`${isDark ? "bg-[#1a1a1a]" : "bg-white"} flex-row w-full px-2 py-1 items-center`}>
      <TouchableOpacity onPress={handleOpenDrawer}>
        <Image
          source={require('../../../res/pngs/menu.png')}
          style={{
            width: Math.min(SCREEN_WIDTH * 0.08, 32),
            height: Math.min(SCREEN_WIDTH * 0.08, 32),
            marginVertical: "auto",
            marginLeft: "3%",
            marginTop: "2%",
            tintColor: isDark ? "white" : "black"
          }}
        />
      </TouchableOpacity>
      <View style={styles.header}>
        <View style={{ ...styles.searchBar, backgroundColor: isDark ? "#2a2a2a" : "#F0F0F0" }}>
          <Icon name="search" size={Math.min(SCREEN_WIDTH * 0.05, 20)} style={{ marginRight: "2%" }} color="#666" />
          <TextInput
            onFocus={handleSearchFocus}
            style={{
              color: isDark ? "white" : "black",
              backgroundColor: isDark ? "#2a2a2a" : "#F0F0F0",
              flex: 1,
              padding: 1,
              marginRight: '2%',
              width: "100%",
              fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
            }}
            onChangeText={handleSearchChange}
            value={searchText}
            placeholder="Search Posts"
            placeholderTextColor={isDark ? "#999" : "#666"}
            returnKeyType="search"
            onSubmitEditing={() => {
              if (searchText.trim().length > 0) {
                navigation.navigate('Search', { searchText: searchText });
              }
            }}
          />
    
        </View>
        {
          photoURL ?
            <Image
              source={{ uri: photoURL }}
              style={[styles.container, { borderColor: isDark ? `#2379C2` : `#2379C2` }]}
              onError={(e) => {
                console.log('Profile image loading error:', e.nativeEvent.error);
                setPhotoURL(null); // Reset to use the fallback Avatar on error
              }}
            />
            :
            <Avatar
              size={Math.min(SCREEN_WIDTH * 0.0625, 25)}
              titleStyle={{
                textAlign: 'center',
                fontSize: Math.min(SCREEN_WIDTH * 0.0375, 15),
                fontFamily: 'Kufam-Thin'
              }}
              title={getUsernameForLogo(userData!?.username || 'Anonymous')}
              containerStyle={[styles.container, { borderColor: isDark ? '#2379C2' : '#2379C2', backgroundColor: profileColor! }]}
              activeOpacity={0.7}
            />
        }
      </View>
    </View>
  );
});

export default NavigationDrawerButton;
