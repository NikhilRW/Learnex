# ![Learnex Logo](/images/logo.jpg) Learnex Mobile App

Learnex is a versatile social media and educational platform designed to enhance learning and foster community interaction. With Learnex, users can explore and participate in various courses, stay updated on upcoming hackathons, and share their experiences through posts, feedback, and discussions. The app allows users to create private rooms for group discussions, chat with friends, and exchange ideas. Trending educational topics can be tracked using hashtags, while users can also share stories, earn rewards, and stay informed about the latest in education and fashion trends. This mobile app project marks the beginning of an exciting journey to create a vibrant, interactive platform for learners worldwide. With a vision of fostering a collaborative environment where individuals can connect, share knowledge, and grow together, Learnex aims to enhance the learning experience through meaningful engagement. Our focus is on building a community-driven app that empowers users to achieve their goals by learning from one another. This is just the start, and we are eager to see Learnex evolve into a tool that truly transforms the way people learn, collaborate, and connect.

# LexAI Tool Execution Implementation

This document explains how tool executions (like navigation, web search, etc.) are integrated in the LexAI application.

## Overview

The LexAI application is designed to handle various tool calls (like navigation, web searches, URL opening) directly from the UI component. This is implemented using a component-level function that executes specific tools requiring direct access to React Native component features.

## Implementation Details

### 1. Tool Execution Handler

The core of this implementation is the `handleToolExecution` function which processes tool calls based on their type:

```javascript
const handleToolExecution = async toolCall => {
  if (!toolCall || !toolCall.toolName) {
    logDebug('No tool call to execute');
    return;
  }

  logDebug('Executing tool call', {
    tool: toolCall.toolName,
    params: toolCall.parameters,
  });

  try {
    // Execute different tools based on the tool name
    switch (toolCall.toolName) {
      case 'navigate':
        // Handle navigation to different screens
        const {screenName, params} = toolCall.parameters;
        if (screenName) {
          // Use React Navigation
          navigation.navigate(screenName, params || {});
        }
        break;

      case 'webSearch':
        // Handle web search requests
        if (toolCall.parameters?.query) {
          // Show message that we're searching
          const searchingMessage = {
            id: generateUUID(),
            role: 'assistant',
            content: `Searching the web for: "${toolCall.parameters.query}"...`,
            timestamp: Date.now(),
          };

          // Update conversation with the searching message
          if (conversation) {
            const updatedConv = {
              ...conversation,
              messages: [...conversation.messages, searchingMessage],
              updatedAt: Date.now(),
            };
            setConversation(updatedConv);
            await LexAIService.saveConversation(updatedConv);
          }
        }
        break;

      case 'openUrl':
        // Handle opening URLs
        if (toolCall.parameters?.url) {
          const isValid = await Linking.canOpenURL(toolCall.parameters.url);

          if (isValid) {
            await Linking.openURL(toolCall.parameters.url);
          } else {
            // Add a message to inform the user of invalid URL
            const urlErrorMessage = {
              id: generateUUID(),
              role: 'assistant',
              content: `I couldn't open the URL: ${toolCall.parameters.url}. It appears to be invalid.`,
              timestamp: Date.now(),
            };

            if (conversation) {
              const updatedConv = {
                ...conversation,
                messages: [...conversation.messages, urlErrorMessage],
                updatedAt: Date.now(),
              };
              setConversation(updatedConv);
              await LexAIService.saveConversation(updatedConv);
            }
          }
        }
        break;

      default:
        // Let the LexAIService handle other tool calls
        logDebug(
          `Tool call ${toolCall.toolName} will be handled by LexAIService`,
        );
        break;
    }
  } catch (error) {
    logDebug('Error executing tool call', {
      tool: toolCall.toolName,
      error: String(error),
    });
  }
};
```

### 2. Integration with LexAIService

The `handleToolExecution` function is integrated with the LexAIService through two mechanisms:

1. **Direct Calls from handleSendMessage**: When a response from `LexAIService.processMessage()` includes tool calls, the `handleSendMessage` function checks if any require component-level execution:

```javascript
// Inside handleSendMessage
if (response.toolCalls && response.toolCalls.length > 0) {
  // Execute component-level tool calls
  for (const toolCall of response.toolCalls) {
    if (['navigate', 'webSearch', 'openUrl'].includes(toolCall.toolName)) {
      await handleToolExecution(toolCall);
    }
  }
}
```

2. **Service Access via useEffect**: We expose the `handleToolExecution` function to the LexAIService:

```javascript
// Expose tool execution function to LexAIService
useEffect(() => {
  // Add the function to the service instance
  LexAIService.executeComponentToolCall = handleToolExecution;

  return () => {
    // Clean up when component unmounts
    LexAIService.executeComponentToolCall = null;
  };
}, [navigation, conversation]);
```

## Web Search with Google API

The `webSearch` tool now includes full Google Search API integration to provide real search results directly in the conversation.

### Environment Setup

The app uses [react-native-config](https://github.com/luggit/react-native-config) to manage environment variables. To set up the Google Search API:

1. Create a Google Cloud project at https://console.cloud.google.com/
2. Enable the Custom Search API for your project
3. Create API credentials (API Key)
4. Create a Custom Search Engine at https://cse.google.com/cse/all
5. Add the following to your `.env` file in the project root:
   ```
   GOOGLE_SEARCH_API_KEY=your_api_key_here
   GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
   ```

### Installation Steps

1. If not already installed, add react-native-config to your project:

   ```bash
   npm install react-native-config --save
   # or with yarn
   yarn add react-native-config
   ```

2. Link the native modules:

   ```bash
   npx react-native link react-native-config
   ```

3. For Android, add the following to your `android/app/build.gradle` file:

   ```gradle
   apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"
   ```

4. For iOS, run `pod install` in the `ios` directory

### Features

- **Real Search Results**: Fetches actual search results from Google using their Custom Search API
- **Clickable Links**: Results are displayed as clickable links directly in the conversation
- **Rich Result Display**: Each result includes a title, URL, and snippet
- **Fallback Mechanism**: Falls back to direct Google search if API keys aren't configured or if an error occurs
- **Error Handling**: Robust error handling prevents crashes even when API calls fail

### Implementation

```typescript
import Config from 'react-native-config';

// Search Result interface
interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
}

// Function that performs the search
const fetchSearchResults = async (query: string): Promise<SearchResult[]> => {
  // Implementation details
  const apiKey = Config.GOOGLE_SEARCH_API_KEY || 'YOUR_GOOGLE_API_KEY';
  const searchEngineId =
    Config.GOOGLE_SEARCH_ENGINE_ID || 'YOUR_SEARCH_ENGINE_ID';

  // Make API call and process results
  // ...
};
```

Search results are displayed as interactive UI elements that users can tap to open the corresponding web pages.

## Benefits of This Approach

1. **Direct Component Access**: Allows tool execution to access React Native features like navigation and linking that are only available within components.

2. **Controlled API Calls**: Ensures API calls are only made when required, preventing redundant calls.

3. **Separation of Concerns**: Service layer handles backend communication while UI components handle user interface operations.

4. **Clean Implementation**: No need for complex state management libraries just to handle component-specific operations.

5. **Environment Variable Management**: Using react-native-config allows for secure management of API keys across different environments.

## Supported Component-Level Tools

Currently, the following tools are handled at the component level:

- **navigate**: Uses React Navigation to navigate to different screens
- **webSearch**: Shows real Google search results with clickable links in the chat
- **openUrl**: Opens external URLs via the React Native Linking API

All other tools are handled by the LexAIService's own executeToolCall method.

## Usage Example

When a user asks to search for information:

1. The AI generates a `webSearch` tool call with the search query
2. The component executes the search using the Google API
3. Search results appear as clickable links in the conversation
4. User can tap any result to open the corresponding webpage

This provides a seamless in-app search experience without leaving the conversation.

New Post.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
View,
Image,
TouchableOpacity,
TouchableWithoutFeedback,
Dimensions,
Animated,
Text,
ImageURISource,
ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Video, { VideoRef } from 'react-native-video';
import { PostType } from '../../../../types/post';
import { useTypedSelector } from '../../../../hooks/useTypedSelector';
import { primaryColor } from '../../../../res/strings/eng';
import CommentModal from './CommentModal';
import { getUsernameForLogo } from '../../../../helpers/stringHelpers';
import { Avatar } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { MessageService } from '../../../../service/firebase/MessageService';
import Snackbar from 'react-native-snackbar';
import { UserStackParamList } from '../../../../routes/UserStack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import firestore from '@react-native-firebase/firestore';
import PostOptionsModal from './PostOptionsModal';
import { FullPostModal } from './FullPostModal';
import { createStyles } from '../../../../styles/components/user/UserScreens/Home/Post.styles';

/\*\*

- Post component that displays a social media post with images
- Features a beautiful carousel with spring-animated pagination dots
  \*/

interface PostProps {
post: PostType;
isVisible?: boolean;
}

interface VideoProgress {
currentTime: number;
playableDuration: number;
seekableDuration: number;
}

type UserNavigation = NativeStackNavigationProp<UserStackParamList>;

const Post: React.FC<PostProps> = ({ post, isVisible = false }) => {
post;
const isDark = useTypedSelector(state => state.user.theme) === 'dark';
const screenWidth = Dimensions.get('window').width;
const [isLiked, setIsLiked] = useState(post.isLiked || false);
const [imageHeight, setImageHeight] = useState(300);
const [currentImageIndex] = useState(0);
const [showOptions, setShowOptions] = useState(false);
const [isPaused, setIsPaused] = useState(!isVisible);
const [showDots, setShowDots] = useState(true);
const [showComments, setShowComments] = useState(false);
const [newComment, setNewComment] = useState('');
const [isAddingComment, setIsAddingComment] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
const videoRef = useRef<VideoRef>(null);
const fadeAnim = useRef(new Animated.Value(0)).current;
const dotsAnim = useRef(new Animated.Value(0)).current;
const controlsTimeout = useRef<NodeJS.Timeout>(null);
const dotsTimeout = useRef<NodeJS.Timeout>(null);
const lastPosition = useRef(0);
const firebase = useTypedSelector(state => state.firebase.firebase);
const navigation = useNavigation<UserNavigation>();
const messageService = new MessageService();
const [isHiding, setIsHiding] = useState(false);
const [isSaved, setIsSaved] = useState(post.isSaved === true);
const [isSaving, setIsSaving] = useState(false);
const [isCurrentUserPost, setIsCurrentUserPost] = useState(false);
const [formattedDescription, setFormattedDescription] =
useState<React.ReactNode>(null);
const [userProfileImage, setUserProfileImage] = useState<string | null>(
post.user.image,
);

// Add new state for mixed media navigation
const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

// Combine all media (images and video) into a single array for navigation
const allMedia = React.useMemo(() => {
const mediaArray = [];

    // Add video if it exists
    if (post.postVideo) {
      mediaArray.push({
        type: 'video',
        source: post.postVideo,
      });
    }

    // Add images if they exist
    if (post.postImages && post.postImages.length > 0) {
      post.postImages.forEach(image => {
        mediaArray.push({
          type: 'image',
          source: image,
        });
      });
    }

    return mediaArray;

}, [post.postVideo, post.postImages]);

// Navigation handlers
const goToPreviousMedia = () => {
if (currentMediaIndex > 0) {
setCurrentMediaIndex(currentMediaIndex - 1);
}
};

const goToNextMedia = () => {
if (currentMediaIndex < allMedia.length - 1) {
setCurrentMediaIndex(currentMediaIndex + 1);
}
};

useEffect(() => {
// Check if the current user is the post creator
const checkCurrentUser = async () => {
const currentUser = firebase.currentUser();
if (currentUser && post.user.id === currentUser.uid) {
setIsCurrentUserPost(true);
}
};

    checkCurrentUser();

}, [firebase, post.user.id]);

// Listen for profile image updates
useEffect(() => {
if (!post.user.id) return;

    const unsubscribe = firestore()
      .collection('users')
      .doc(post.user.id)
      .onSnapshot(snapshot => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          if (userData?.image && userData.image !== userProfileImage) {
            setUserProfileImage(userData.image);
          }
        }
      });

    return () => unsubscribe();

}, [post.user.id, userProfileImage]);

useEffect(() => {
// Handle video visibility changes
if (post.isVideo) {
setIsPaused(!isVisible);
}
}, [isVisible, post.isVideo]);

// Keep isLiked state synchronized with post prop
useEffect(() => {
setIsLiked(post.isLiked || false);
}, [post.isLiked]);

useEffect(() => {
// Fade in animation for post
Animated.timing(fadeAnim, {
toValue: 1,
duration: 500,
useNativeDriver: true,
}).start();

    // Start dots animation
    Animated.spring(dotsAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Set default image height based on orientation
    if (post.isVertical) {
      // For vertical images, use a taller container
      setImageHeight(Math.min(480, screenWidth * 1.5));
    } else {
      // For horizontal images, use a shorter container
      setImageHeight(Math.min(300, screenWidth * 0.6));
    }

    // If we have a specific first image, try to calculate its exact dimensions
    const firstImage = post.postImages?.[0] || post.postImage;
    if (firstImage) {
      if (typeof firstImage === 'number') {
        // Local image
        const imageSource = Image.resolveAssetSource(firstImage);
        if (imageSource) {
          const { width, height } = imageSource;
          const actualScreenWidth = Dimensions.get('window').width - 24;
          const scaledHeight = (height / width) * actualScreenWidth;
          setImageHeight(scaledHeight || (post.isVertical ? 480 : 300));
        }
      } else {
        // Remote image
        const imageUri =
          typeof firstImage === 'string'
            ? firstImage
            : (firstImage as ImageURISource).uri;
        if (imageUri) {
          Image.getSize(
            imageUri,
            (width, height) => {
              const scaledHeight =
                (height / width) * Dimensions.get('window').width;
              setImageHeight(scaledHeight || (post.isVertical ? 480 : 300));
            },
            error => {
              console.error('Error getting image size:', error);
              // Fallback to orientation-based height
              setImageHeight(post.isVertical ? 480 : 300);
            },
          );
        }
      }
    }

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      if (dotsTimeout.current) clearTimeout(dotsTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps

}, [post.postImages, post.postImage, post.isVertical, fadeAnim, screenWidth]);

const handleVideoProgress = useCallback((progress: VideoProgress) => {
lastPosition.current = progress.currentTime;
}, []);

const handleVideoPress = () => {
setIsPaused(prevState => !prevState);
handleMediaTouch();
};

// const handleScroll = useCallback(
// (event: NativeSyntheticEvent<NativeScrollEvent>) => {
// const contentOffset = event.nativeEvent.contentOffset.x;
// const index = Math.round(contentOffset / (screenWidth - 14));
// setCurrentImageIndex(index);
// },
// [screenWidth],
// );

const handleMediaTouch = () => {
setShowDots(true);
if (dotsTimeout.current) {
clearTimeout(dotsTimeout.current);
}
dotsTimeout.current = setTimeout(() => {
setShowDots(false);
}, 3000);
};

const renderMedia = () => {
// If there's no media, return null
if (!post.postVideo && (!post.postImages || post.postImages.length === 0)) {
return null;
}

    // If there's only one media item (just a video or a single image)
    if (allMedia.length === 1) {
      if (post.isVideo && post.postVideo) {
        // Render just the video
        return renderVideoContent(post.postVideo);
      } else if (post.postImages && post.postImages.length === 1) {
        // Render just the single image
        return renderImageContent(post.postImages[0]);
      }
    }

    // For multiple media items (either multiple images or video + images)
    return (
      <View style={[styles.mediaContainer]}>
        {/* Current media item (video or image) */}
        {allMedia[currentMediaIndex].type === 'video'
          ? renderVideoContent(allMedia[currentMediaIndex].source)
          : renderImageContent(allMedia[currentMediaIndex].source)}

        {/* Navigation buttons */}
        {showDots && allMedia.length > 1 && (
          <>
            {/* Previous button */}
            {currentMediaIndex > 0 && (
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={goToPreviousMedia}>
                <Icon name="chevron-left" size={30} color="white" />
              </TouchableOpacity>
            )}

            {/* Next button */}
            {currentMediaIndex < allMedia.length - 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={goToNextMedia}>
                <Icon name="chevron-right" size={30} color="white" />
              </TouchableOpacity>
            )}

            {/* Pagination dots */}
            <View style={styles.paginationDots}>
              {allMedia.map((_, index) => {
                const bgColor =
                  index === currentMediaIndex
                    ? '#fff'
                    : 'rgba(255, 255, 255, 0.5)';
                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: bgColor,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </>
        )}
      </View>
    );

};

// Helper function to render video content
const renderVideoContent = (videoSource: any) => {
let source;
if (typeof videoSource === 'number') {
source = videoSource as unknown as NodeRequire;
} else if (typeof videoSource === 'string') {
source = videoSource;
} else if (videoSource && typeof videoSource === 'object') {
const videoObject = videoSource as { uri?: string };
if (videoObject.uri) {
source = videoObject.uri;
} else {
console.error('Video object has no URI property:', videoSource);
return (
<View style={styles.errorContainer}>
<Text>Invalid video format</Text>
</View>
);
}
} else {
console.error('Video has invalid format:', videoSource);
return (
<View style={styles.errorContainer}>
<Text>Invalid video format</Text>
</View>
);
}

    return (
      <TouchableWithoutFeedback onPress={handleVideoPress}>
        <View
          style={[
            styles.videoContainer,
            { width: screenWidth - 24, height: imageHeight },
          ]}>
          <Video
            ref={videoRef}
            source={{ uri: source }}
            style={styles.postImage}
            resizeMode={post.isVertical ? 'cover' : 'contain'}
            paused={isPaused}
            repeat
            onProgress={handleVideoProgress}
            onError={error => console.error('Video loading error:', error)}
          />
          {isPaused && <View style={styles.pausedOverlay} />}
        </View>
      </TouchableWithoutFeedback>
    );

};

// Helper function to render image content
const renderImageContent = (imageSource: any) => {
let source;
if (typeof imageSource === 'number') {
source = imageSource;
} else if (typeof imageSource === 'string') {
source = { uri: imageSource };
} else if (
imageSource &&
typeof imageSource === 'object' &&
'uri' in imageSource
) {
source = { uri: imageSource.uri };
} else {
return null; // Skip invalid images
}

    return (
      <TouchableWithoutFeedback onPress={handleMediaTouch}>
        <Image
          source={source}
          style={[
            styles.postImage,
            {
              height: imageHeight || (post.isVertical ? 480 : 300),
            },
          ]}
          resizeMode={post.isVertical ? 'cover' : 'contain'}
          onError={error =>
            console.error(
              'Image loading error for source',
              source,
              ':',
              error.nativeEvent.error,
            )
          }
        />
      </TouchableWithoutFeedback>
    );

};

const handleMessageUser = async () => {
try {
const currentUser = firebase.currentUser();
if (!currentUser) {
Snackbar.show({
text: 'You must be logged in to message users',
duration: Snackbar.LENGTH_LONG,
textColor: 'white',
backgroundColor: '#ff3b30',
});
return;
}

      Snackbar.show({
        text: 'Setting up conversation...',
        duration: Snackbar.LENGTH_INDEFINITE,
        textColor: 'white',
        backgroundColor: '#2379C2',
      });

      // Create or get conversation
      const conversation = await messageService.getOrCreateConversation(
        currentUser.uid,
        post.user.id,
      );

      // Dismiss loading indicator
      Snackbar.dismiss();
      // Navigate to chat with proper typing
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        recipientId: post.user.id,
        recipientName: post.user.username,
        recipientPhoto: post.user.image,
        isQrInitiated: false,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      Snackbar.show({
        text: 'Failed to start conversation',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    }

};

const handleAddComment = async () => {
if (!newComment.trim()) return;

    try {
      setIsAddingComment(true);

      const currentUser = firebase.currentUser();
      if (!currentUser) {
        Snackbar.show({
          text: 'You must be logged in to comment',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
        return;
      }

      // Call firebase service to add comment
      const result = await firebase.posts.addComment(
        post.id,
        newComment.trim(),
      );

      if (result.success) {
        // Update UI immediately with the new comment
        if (result.comment) {
          // Add the new comment to the post's comment list
          const updatedCommentsList = [
            ...(post.commentsList || []),
            result.comment,
          ];

          // Update the post object to include the new comment
          post.commentsList = updatedCommentsList;
          post.comments = (post.comments || 0) + 1;
        }

        setNewComment('');

        // Show feedback
        Snackbar.show({
          text: 'Comment added successfully',
          duration: Snackbar.LENGTH_SHORT,
          textColor: 'white',
          backgroundColor: '#2379C2',
        });

        // Show comments modal with updated comments
        setShowComments(true);
      } else {
        Snackbar.show({
          text: result.error || 'Failed to add comment',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Snackbar.show({
        text: 'An error occurred while adding your comment',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    } finally {
      setIsAddingComment(false);
    }

};

const handleHidePost = async () => {
try {
setIsHiding(true);
setShowOptions(false);

      const result = await firebase.posts.hidePost(post.id);

      if (result.success) {
        Snackbar.show({
          text: 'Post hidden successfully',
          duration: Snackbar.LENGTH_SHORT,
          textColor: 'white',
          backgroundColor: '#2379C2',
        });
      } else {
        Snackbar.show({
          text: result.error || 'Failed to hide post',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
      }
    } catch (error) {
      console.error('Error hiding post:', error);
      Snackbar.show({
        text: 'Failed to hide post',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    } finally {
      setIsHiding(false);
    }

};

const handleSavePost = async () => {
if (isSaving) return;

    setIsSaving(true);
    try {
      // Call Firebase service to save/unsave the post
      const result = await firebase.posts.savePost(post.id);

      if (result.success) {
        setIsSaved(result.saved === true);

        // Show feedback to user
        Snackbar.show({
          text: result.saved ? 'Post saved' : 'Post unsaved',
          duration: Snackbar.LENGTH_SHORT,
          textColor: 'white',
          backgroundColor: '#2379C2',
        });
      } else {
        Snackbar.show({
          text: result.error || 'Failed to save post',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
      }
    } catch (error) {
      console.error('Error saving post:', error);
      Snackbar.show({
        text: 'An error occurred while saving the post',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    } finally {
      setIsSaving(false);
    }

};

const handleDeletePost = async () => {
// Close the options modal
setShowOptions(false);

    const currentUser = firebase.currentUser();
    if (!currentUser || !post.id) {
      Snackbar.show({
        text: 'Unable to delete post at this time',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
      return;
    }

    // Confirm the user wants to delete
    setIsDeleting(true);

    try {
      // Show loading indicator
      Snackbar.show({
        text: 'Deleting post...',
        duration: Snackbar.LENGTH_INDEFINITE,
        textColor: 'white',
        backgroundColor: '#2379C2',
      });

      // Delete the post using the firebase posts module
      const result = await firebase.posts.deletePost(post.id);

      // Dismiss loading indicator and show success/error message
      Snackbar.dismiss();

      if (result.success) {
        Snackbar.show({
          text: 'Post deleted successfully',
          duration: Snackbar.LENGTH_SHORT,
          textColor: 'white',
          backgroundColor: '#4CAF50',
        });

        // You could add a callback here to refresh the feed
        // If you have a refresh function passed as prop, call it here
      } else {
        Snackbar.show({
          text: result.error || 'Failed to delete post',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      Snackbar.dismiss();
      Snackbar.show({
        text: 'Failed to delete post',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    } finally {
      setIsDeleting(false);
    }

};

useEffect(() => {
const checkPostSavedStatus = async () => {
try {
// We need to fetch the actual saved status from Firestore
const currentUser = firebase.currentUser();
if (!currentUser) return;

        const userRef = firestore().collection('users').doc(currentUser.uid);
        const userDoc = await userRef.get();

        if (userDoc.exists()){
          const userData = userDoc.data();
          const savedPosts = userData?.savedPosts || [];
          const saved = savedPosts.includes(post.id);
          setIsSaved(saved);
        } else {
          setIsSaved(false);
        }
      } catch (error) {
        console.error('Error checking post saved status:', error);
        setIsSaved(false);
      }
    };

    // Only check saved status if it's not explicitly set in the post prop
    if (post.isSaved === undefined) {
      checkPostSavedStatus();
    }

}, [firebase, post.id, post.isSaved]);

const handleLikePost = async () => {
try {
// Optimistically update UI immediately
const newIsLiked = !isLiked;
setIsLiked(newIsLiked);

      // Update the likes count locally
      const likesChange = newIsLiked ? 1 : -1;
      post.likes += likesChange;

      // Send request to backend
      const result = await firebase.posts.likePost(post.id);

      if (!result.success) {
        // Revert UI changes if request failed
        setIsLiked(!newIsLiked);
        post.likes -= likesChange;

        // Show error to user
        Snackbar.show({
          text: result.error || 'Failed to update like status',
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#ff3b30',
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);

      // Revert UI changes in case of error
      setIsLiked(!isLiked);

      // Show error to user
      Snackbar.show({
        text: 'Failed to update like status',
        duration: Snackbar.LENGTH_LONG,
        textColor: 'white',
        backgroundColor: '#ff3b30',
      });
    }

};

// Function to extract hashtags from description
const extractHashtags = (text: string): string[] => {
// Regex to match hashtags
const hashtagRegex = /#[\w]+/g;
const matches = text.match(hashtagRegex) || [];

    // Remove the # symbol and filter out empty strings
    return matches
      .map(tag => tag.replace('#', '').trim())
      .filter(tag => tag.length > 0);

};

// Process description and hashtags
useEffect(() => {
// Extract hashtags from description
const extractedTags = extractHashtags(post.description || '');

    // Get existing hashtags array (if any)
    const existingTags = post.hashtags || [];

    // Combine both sets of hashtags and remove duplicates
    const allTags = [...new Set([...existingTags, ...extractedTags])];

    // Store combined tags back to post object for filtering
    post.hashtags = allTags;

    // Format the description with clickable hashtags
    formatDescriptionWithHashtags();
    // eslint-disable-next-line react-hooks/exhaustive-deps

}, [post.description]);

// Format description with clickable hashtags
const formatDescriptionWithHashtags = () => {
if (!post.description) {
setFormattedDescription(null);
return;
}

    const parts = post.description.split(/(#\w+)/g);
    const formattedParts = parts.map((part, index) => {
      if (part.startsWith('#')) {
        // Remove the # character
        return (
          <Text key={index} style={styles.hashtag} onPress={() => { }}>
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });

    setFormattedDescription(formattedParts);

};

// Handle hashtag press
// const handleHashtagPress = (tag: string) => {};

const [showFullPostModal, setShowFullPostModal] = useState(false);

// Function to handle opening the full post details modal
const handleOpenFullPost = () => {
setShowFullPostModal(true);
};
const styles = createStyles(isDark);

return (
<Animated.View
key={post.id}
style={[styles.postContainer, { opacity: fadeAnim }]}>
<View style={styles.header}>
<View style={styles.userInfo}>
{userProfileImage ? (
<Image
source={
typeof userProfileImage === 'string'
? { uri: userProfileImage }
: userProfileImage
}
style={styles.avatar}
onError={e =>
console.log('Avatar loading error:', e.nativeEvent.error)
}
/>
) : (
<Avatar
titleStyle={styles.titleStyle}
title={getUsernameForLogo(post.user.username || 'Anonymous')}
activeOpacity={0.7}
/>
)}
<Text style={[styles.username]}>{post.user.username}</Text>
</View>
<TouchableOpacity onPress={() => setShowOptions(true)}>
<Icon
name="more-horizontal"
size={24}
color={isDark ? 'white' : 'black'}
/>
</TouchableOpacity>
</View>
{/_ Make the post content clickable to open the full post modal _/}
<TouchableWithoutFeedback onPress={handleOpenFullPost}>
<View>{renderMedia()}</View>
</TouchableWithoutFeedback>
<View style={styles.postActions}>
<View style={styles.leftActions}>
<TouchableOpacity
            onPress={handleLikePost}
            style={styles.actionButton}>
<AntDesign
name={isLiked ? 'heart' : 'hearto'}
size={24}
color={isLiked ? 'red' : isDark ? 'white' : 'black'}
/>
</TouchableOpacity>
<TouchableOpacity
style={styles.actionButton}
onPress={() => setShowComments(true)}>
<MaterialIcons
name="comment"
size={24}
color={isDark ? 'white' : 'black'}
/>
</TouchableOpacity>
<TouchableOpacity
            style={styles.actionButton}
            onPress={handleMessageUser}>
<Icon name="send" size={24} color={isDark ? 'white' : 'black'} />
</TouchableOpacity>
</View>
<TouchableOpacity onPress={handleSavePost} disabled={isSaving}>
{isSaving ? (
<ActivityIndicator
size="small"
color={isDark ? 'white' : '#2379C2'}
/>
) : (
<MaterialIcons
name={isSaved ? 'bookmark' : 'bookmark-outline'}
size={26}
color={isSaved ? primaryColor : isDark ? 'white' : 'black'}
/>
)}
</TouchableOpacity>
</View>

      <View style={styles.postFooter}>
        <Text style={[styles.likes]}>{post.likes} likes</Text>
        <TouchableWithoutFeedback onPress={handleOpenFullPost}>
          <View style={styles.captionContainer}>
            <Text
              style={[styles.caption]}
              numberOfLines={3}
              ellipsizeMode="tail">
              <Text style={[styles.username]} numberOfLines={1}>
                {post.user.username + ' '.repeat(2)}
              </Text>
              {formattedDescription || post.description}
            </Text>
          </View>
        </TouchableWithoutFeedback>

        {post.commentsList && post.commentsList.length > 0 && (
          <TouchableOpacity
            style={styles.viewCommentsButton}
            onPress={() => setShowComments(true)}>
            <Text style={styles.viewAllComments}>
              View all {post.comments} comments
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.timestamp}>{post.timestamp}</Text>
      </View>

      <CommentModal
        visible={showComments}
        onClose={() => setShowComments(false)}
        comments={post.commentsList || []}
        isDark={isDark}
        onAddComment={handleAddComment}
        newComment={newComment}
        setNewComment={setNewComment}
        isAddingComment={isAddingComment}
        postId={post.id}
      />
      <PostOptionsModal
        setShowOptions={setShowOptions}
        showOptions={showOptions}
        handleDeletePost={handleDeletePost}
        handleHidePost={handleHidePost}
        handleMessageUser={handleMessageUser}
        isCurrentUserPost={isCurrentUserPost}
        isDeleting={isDeleting}
        isHiding={isHiding}
        post={post}
      />
      <FullPostModal
        allMedia={allMedia}
        currentMediaIndex={currentImageIndex}
        handleLikePost={handleLikePost}
        handleMessageUser={handleMessageUser}
        handleSavePost={handleSavePost}
        imageHeight={imageHeight}
        isLiked={isLiked}
        isSaved={isSaved}
        isSaving={isSaving}
        post={post}
        renderImageContent={renderImageContent}
        renderVideoContent={renderVideoContent}
        screenWidth={screenWidth}
        setShowComments={setShowComments}
        setShowFullPostModal={setShowFullPostModal}
        showFullPostModal={showFullPostModal}
        formattedDescription={formattedDescription}
        userProfileImage={post.user.image}
      />
    </Animated.View>

);
};

export default Post;
