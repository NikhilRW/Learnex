import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Platform,
  Share,
  Clipboard,
  ToastAndroid,
  Alert,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MediaStream, RTCView } from 'react-native-webrtc';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Meeting } from 'room/services/MeetingService';
import { ParticipantState } from 'room/services/WebRTCService';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import { UserService } from 'shared/services/UserService';
import ReactionText from 'room/components/common/ReactionText';
import MessageReactionIcon from 'room/components/common/MessageReactionIcon';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isMe: boolean;
  reactions?: {
    [userId: string]: string; // userId: reactionType
  };
}
interface ExtendedMediaStream extends MediaStream {
  participantId?: string; // Add any additional properties you need
}

interface RoomProps {
  meeting: Meeting;
  localStream?: any;
  remoteStreams: any[];
  updateLocalStream: (stream: ExtendedMediaStream | null) => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onSendMessage: (text: string) => void;
  onMessageReaction: (messageId: string, reactionType: string) => void;
  messages: Message[];
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isDark?: boolean;
  currentUserId: string;
  currentUserName: string;
  onRaiseHand: (raised: boolean) => void;
  onReaction: (
    reaction: 'thumbsUp' | 'thumbsDown' | 'clapping' | 'waving' | 'smiling',
  ) => void;
  participantStates: Map<string, ParticipantState>;
  isConnecting: boolean;
  onFlipCamera?: () => void;
  isFrontCamera?: boolean;
}

const Room: React.FC<RoomProps> = ({
  meeting,
  localStream,
  updateLocalStream,
  remoteStreams,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  onSendMessage,
  onMessageReaction,
  messages,
  isAudioEnabled,
  isVideoEnabled,
  isDark = false,
  currentUserId,
  currentUserName,
  onRaiseHand,
  onReaction,
  participantStates,
  isConnecting,
  onFlipCamera,
  isFrontCamera: propIsFrontCamera,
}) => {
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const chatPanelOpacity = useRef(new Animated.Value(0)).current;
  const reactionsMenuOpacity = useRef(new Animated.Value(0)).current;
  const quickMessagesMenuOpacity = useRef(new Animated.Value(0)).current;
  const participantsPanelOpacity = useRef(new Animated.Value(0)).current;
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [showMessageReactions, setShowMessageReactions] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const participantsListRef = useRef<FlatList>(null);
  const { width, height } = Dimensions.get('window');
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(
    null,
  );
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const [userInfoCache, setUserInfoCache] = useState<
    Map<
      string,
      { email: string | null; fullName: string | null; username: string | null }
    >
  >(new Map());
  const userService = useMemo(() => new UserService(), []);
  const [localIsFrontCamera, setLocalIsFrontCamera] = useState(true); // Local state as fallback
  const [showMoreControls, setShowMoreControls] = useState(false);

  // Restore this line if it was removed:
  const currentIsFrontCamera =
    propIsFrontCamera !== undefined ? propIsFrontCamera : localIsFrontCamera;

  // Quick message templates
  const quickMessages = [
    "I'll be right back",
    'Can you hear me?',
    "I can't hear you",
    'Please speak louder',
    "Let's discuss this later",
    'I agree',
    'I disagree',
    'Great idea!',
    'Could you repeat that?',
    'Thanks everyone',
  ];

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isControlsVisible && remoteStreams.length > 0 && !showChat) {
      timeout = setTimeout(() => setIsControlsVisible(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isControlsVisible, remoteStreams.length, showChat]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  useEffect(() => {
    // Animate chat panel
    Animated.timing(chatPanelOpacity, {
      toValue: showChat ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [showChat, chatPanelOpacity]);

  useEffect(() => {
    // Animate reactions menu
    Animated.timing(reactionsMenuOpacity, {
      toValue: showReactions ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showReactions, reactionsMenuOpacity]);

  useEffect(() => {
    // Animate quick messages menu
    Animated.timing(quickMessagesMenuOpacity, {
      toValue: showQuickMessages ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showQuickMessages, quickMessagesMenuOpacity]);

  // Update local state when participant states change
  useEffect(() => {
    // Check if our own state is in the participant states
    const myState = participantStates.get(currentUserId);
    if (myState) {
      // Update local UI state to match the shared state
      setIsHandRaised(myState.isHandRaised);
    }
  }, [participantStates, currentUserId]);

  useEffect(() => {
    // Animate participants panel
    Animated.timing(participantsPanelOpacity, {
      toValue: showParticipants ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [showParticipants, participantsPanelOpacity]);

  // Helper function to get user info by ID
  const getUserInfo = useCallback(
    async (userId: string) => {
      // Check if we already have this user's info in the cache
      if (userInfoCache.has(userId)) {
        return userInfoCache.get(userId);
      }

      // Fetch user info
      const userInfo = await userService.getUserInfoById(userId);

      // Update cache
      setUserInfoCache(prev => {
        const newCache = new Map(prev);
        newCache.set(userId, userInfo);
        return newCache;
      });

      return userInfo;
    },
    [userInfoCache, userService],
  );

  // When a new remote stream is received, fetch user info
  useEffect(() => {
    remoteStreams.forEach(async stream => {
      const participantId = stream.participantId || stream.id;
      if (participantId && !userInfoCache.has(participantId)) {
        await getUserInfo(participantId);
      }
    });
  }, [remoteStreams, getUserInfo]);

  const handleShareInvite = async () => {
    try {
      // Create a shareable link that can be used for deep linking
      // Format: learnex://meeting?roomCode=XXXXX
      const deepLink = `learnex://meeting?roomCode=${meeting.roomCode}`;

      // Create a fallback web URL (for users who don't have the app)
      // Use path-based format instead of query parameter
      const webFallbackUrl = `https://learnex-web.vercel.app/join/${meeting.roomCode}`;

      const shareMessage = Platform.select({
        ios: `Join my Learnex meeting.\n\nMeeting code: ${meeting.roomCode}\n\nTap link to join: ${deepLink}\n\nDon't have the app? ${webFallbackUrl}`,
        android: `Join my Learnex meeting.\n\nMeeting code: ${meeting.roomCode}\n\nTap link to join: ${deepLink}\n\nDon't have the app? Visit: ${webFallbackUrl}`,
        default: `Join my Learnex meeting with code: ${meeting.roomCode}\n\nOpen in app: ${deepLink}\n\nOr visit: ${webFallbackUrl}`,
      });

      await Share.share({
        message: shareMessage,
        title: meeting.title || 'Join my Learnex meeting',
        url: Platform.OS === 'ios' ? deepLink : undefined,
      });

      console.log('Successfully shared invite link');
    } catch (error) {
      console.error('Error sharing invite:', error);
    }
  };

  const copyToClipboard = () => {
    try {
      Clipboard.setString(meeting.roomCode);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Room code copied to clipboard!', ToastAndroid.SHORT);
      } else {
        Alert.alert('Copied', 'Room code copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleSendMessage = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText('');
    }
  };

  const toggleChat = () => {
    setShowChat(!showChat);
    setIsControlsVisible(true);
  };

  const handleRaiseHand = () => {
    const newRaisedState = !isHandRaised;
    setIsHandRaised(newRaisedState);
    onRaiseHand(newRaisedState);
  };

  const toggleReactionsMenu = () => {
    setShowReactions(!showReactions);
    setIsControlsVisible(true);
  };

  const handleReaction = (
    reaction: 'thumbsUp' | 'thumbsDown' | 'clapping' | 'waving' | 'smiling',
  ) => {
    onReaction(reaction);
    setShowReactions(false);
  };

  const handleLongPressMessage = (messageId: string) => {
    setSelectedMessage(messageId);
    setShowMessageReactions(true);
  };

  const handleMessageReaction = (reactionType: string) => {
    if (selectedMessage) {
      onMessageReaction(selectedMessage, reactionType);
      setShowMessageReactions(false);
      setSelectedMessage(null);
    }
  };

  const closeMessageReactions = () => {
    setShowMessageReactions(false);
    setSelectedMessage(null);
  };

  const toggleQuickMessagesMenu = () => {
    setShowQuickMessages(!showQuickMessages);
    setIsControlsVisible(true);
  };

  const sendQuickMessage = (text: string) => {
    onSendMessage(text);
    setShowQuickMessages(false);
  };

  const toggleParticipantsPanel = () => {
    setShowParticipants(!showParticipants);
    setIsControlsVisible(true);
  };

  const getOrderedParticipantsForList = () => {
    const participants = getAllParticipants();

    // Current user should always be first
    const currentUser = participants.find(p => p.id === currentUserId);
    const otherParticipants = participants.filter(p => p.id !== currentUserId);

    return currentUser ? [currentUser, ...otherParticipants] : participants;
  };

  const getAllParticipants = () => {
    const participantsMap = new Map();

    // Add current user with localStream
    participantsMap.set(currentUserId, {
      id: currentUserId,
      name: currentUserName,
      isLocal: true,
      stream: localStream,
    });

    // Add all remote participants with their streams
    remoteStreams.forEach(stream => {
      const participantId = stream.participantId || stream.id;
      if (participantId) {
        const userInfo = userInfoCache.get(participantId);
        participantsMap.set(participantId, {
          id: participantId,
          name:
            userInfo?.fullName ||
            userInfo?.username ||
            `User ${participantId.substring(0, 5)}`,
          isLocal: false,
          stream: stream,
        });
      }
    });

    // Add any participants from participantStates that don't have streams
    participantStates.forEach((state, id) => {
      if (id !== currentUserId && !participantsMap.has(id)) {
        const userInfo = userInfoCache.get(id);
        participantsMap.set(id, {
          id: id,
          name:
            userInfo?.fullName ||
            userInfo?.username ||
            `User ${id.substring(0, 5)}`,
          isLocal: false,
          state: state,
        });
      } else if (participantsMap.has(id)) {
        // Add state to existing participants that have streams
        const participant = participantsMap.get(id);
        participantsMap.set(id, {
          ...participant,
          state: state,
        });
      }
    });

    let participantsArray = Array.from(participantsMap.values());

    // If a participant is pinned, ensure they are the first in the array
    if (pinnedParticipantId) {
      const pinnedIndex = participantsArray.findIndex(
        p => p.id === pinnedParticipantId,
      );
      if (pinnedIndex > -1) {
        const [pinnedParticipant] = participantsArray.splice(pinnedIndex, 1);
        participantsArray.unshift(pinnedParticipant);
      }
    }

    return participantsArray;
  };

  const handlePinParticipant = (participantId: string) => {
    // Toggle pin: if already pinned, unpin it
    if (pinnedParticipantId === participantId) {
      setPinnedParticipantId(null);
    } else {
      setPinnedParticipantId(participantId);
    }
  };

  const renderParticipantItem = ({
    item,
    index,
    isPinned = false,
  }: {
    item: any;
    index: number;
    isPinned?: boolean;
  }) => {
    // Access numColumns and itemHeight from the outer scope (renderParticipantGrid)
    // Note: This relies on renderParticipantItem being called ONLY from within renderParticipantGrid
    // where numColumns and itemHeight are defined.
    const outerScopeNumColumns = (renderParticipantGrid as any).numColumns; // Need a way to access these... this is tricky
    const outerScopeItemHeight = (renderParticipantGrid as any).itemHeight;

    // Corrected renderParticipantItem (doesn't need height/numColumns passed in)
    const participantState = item.state || {};
    const isCurrentUser = item.id === currentUserId;
    const isVideoOn = isCurrentUser
      ? isVideoEnabled
      : (participantState.isVideoEnabled ?? true);
    const isAudioOn = isCurrentUser
      ? isAudioEnabled
      : (participantState.isAudioEnabled ?? true);
    const isParticipantHandRaised = participantState.isHandRaised ?? false;
    const isParticipantSpeaking = participantState.isSpeaking ?? false;
    const hasThumbsUp = participantState.isThumbsUp ?? false;
    const hasThumbsDown = participantState.isThumbsDown ?? false;
    const isClapping = participantState.isClapping ?? false;
    const isWaving = participantState.isWaving ?? false;
    const isSmiling = participantState.isSmiling ?? false;

    const nameParts = item.name.split(' ');
    const firstInitial = nameParts[0]
      ? nameParts[0].charAt(0).toUpperCase()
      : '';
    const lastInitial =
      nameParts.length > 1
        ? nameParts[nameParts.length - 1].charAt(0).toUpperCase()
        : '';
    const initials = lastInitial
      ? `${firstInitial}${lastInitial}`
      : firstInitial;
    const displayName = item.name || initials;
    const avatarColor = getAvatarColor(item.id);
    const avatarHue = Number(item.id.charCodeAt(0)) % 360;
    const avatarTextColor =
      avatarHue > 30 && avatarHue < 190 ? '#202124' : '#ffffff';

    return (
      // Moved layout styles to renderGridItem's wrapper
      <View
        style={[
          styles.participantContainer,
          isParticipantSpeaking && styles.participantSpeakingContainer,
          styles.participantPinnedContainer,
          isCurrentUser && styles.currentUserContainer,
          !isPinned && !isVideoOn && { backgroundColor: 'rgba(0,0,0,0.2)' }, // Adjust to a lighter semi-transparent overlay for unpinned participants without video
        ]}>
        {/* RTCView or Placeholder */}
        {item.stream && isVideoOn ? (
          <RTCView
            streamURL={item.stream.toURL()}
            style={styles.participantVideo}
            objectFit="cover"
            mirror={isCurrentUser}
          />
        ) : (
          <View
            style={[
              styles.videoPlaceholder,
              { backgroundColor: isPinned ? '#1f1f1f' : 'rgba(0,0,0,0.2)' },
            ]}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: avatarColor },
                isParticipantSpeaking && styles.avatarCircleSpeaking,
              ]}>
              <Text style={[styles.avatarText, { color: avatarTextColor }]}>
                {initials}
              </Text>
            </View>
          </View>
        )}
        {/* Indicators */}
        {!isAudioOn && (
          <View style={styles.audioOffIndicator}>
            <Icon name="mic-off" size={20} color="#fff" />
          </View>
        )}
        {isParticipantSpeaking && isAudioOn && (
          <View style={styles.speakingIndicator}>
            <Icon name="volume-up" size={20} color="#fff" />
          </View>
        )}
        {isParticipantHandRaised && (
          <View style={styles.handRaisedIndicator}>
            <ReactionText text="🤚🏻" />
          </View>
        )}
        {hasThumbsUp && (
          <View style={styles.reactionIndicator}>
            <ReactionText text="👍🏻" />
          </View>
        )}
        {hasThumbsDown && (
          <View style={[styles.reactionIndicator, styles.thumbsDownIndicator]}>
            <ReactionText text="👎🏻" />
          </View>
        )}
        {isClapping && (
          <View style={[styles.reactionIndicator, styles.clappingIndicator]}>
            <ReactionText text="👏🏻" />
          </View>
        )}
        {isSmiling && (
          <View style={[styles.reactionIndicator, styles.clappingIndicator]}>
            <ReactionText text="😂" />
          </View>
        )}
        {isWaving && (
          <View style={[styles.reactionIndicator, styles.wavingIndicator]}>
            {/* <MaterialCommunityIcons name="hand-wave" size={20} color="#fff" /> */}
            <Text className="text-2xl font-bold">👋🏻</Text>
          </View>
        )}
        {/* Name Tag */}
        <View
          style={[
            styles.nameTag,
            isCurrentUser && styles.currentUserNameTag,
            isParticipantSpeaking && styles.speakingNameTag,
          ]}>
          <View style={styles.nameTagContent}>
            {isCurrentUser && (
              <View style={styles.youIndicator}>
                <Text style={styles.youIndicatorText}>YOU</Text>
              </View>
            )}
            <Text
              style={[
                styles.nameText,
                isCurrentUser && styles.currentUserNameText,
              ]}>
              {displayName}
            </Text>
            {item.email && (
              <Text
                style={styles.emailText}
                numberOfLines={1}
                ellipsizeMode="middle">
                {item.email}
              </Text>
            )}
          </View>
        </View>
        {/* Pin indicator */}
        {isPinned && (
          <View style={styles.pinnedIndicator}>
            <Icon name="push-pin" size={16} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  const renderParticipantListItem = ({ item }: { item: any }) => {
    const participantState = item.state || {};
    const isCurrentUser = item.id === currentUserId;
    const isVideoOn = isCurrentUser
      ? isVideoEnabled
      : (participantState.isVideoEnabled ?? true);
    const isAudioOn = isCurrentUser
      ? isAudioEnabled
      : (participantState.isAudioEnabled ?? true);
    const isParticipantSpeaking = participantState.isSpeaking ?? false;
    const isMicMuted = !isAudioOn;
    const isVideoMuted = !isVideoOn;

    const nameParts = item.name.split(' ');
    const firstInitial = nameParts[0]
      ? nameParts[0].charAt(0).toUpperCase()
      : '';
    const lastInitial =
      nameParts.length > 1
        ? nameParts[nameParts.length - 1].charAt(0).toUpperCase()
        : '';
    const initials = lastInitial
      ? `${firstInitial}${lastInitial}`
      : firstInitial;
    const displayName = item.name || initials;
    const avatarColor = getAvatarColor(item.id);
    const avatarHue = Number(item.id.charCodeAt(0)) % 360;
    const avatarTextColor =
      avatarHue > 30 && avatarHue < 190 ? '#202124' : '#ffffff';

    return (
      <TouchableOpacity
        style={styles.participantListItem}
        onPress={() => handlePinParticipant(item.id)}>
        <View style={styles.participantListItemAvatarContainer}>
          <View
            style={[
              styles.participantListItemAvatar,
              { backgroundColor: avatarColor },
            ]}>
            <Text
              style={[
                styles.participantListItemAvatarText,
                { color: avatarTextColor },
              ]}>
              {initials}
            </Text>
          </View>
        </View>
        <View style={styles.participantListItemInfo}>
          <Text
            style={[
              styles.participantListItemName,
              { color: isDark ? 'white' : 'black' },
            ]}
            numberOfLines={1}>
            {displayName} {isCurrentUser && '(You)'}
          </Text>
          {item.email && (
            <Text
              style={styles.participantListItemEmail}
              numberOfLines={1}
              ellipsizeMode="middle">
              {item.email}
            </Text>
          )}
        </View>
        <View style={styles.participantListItemActions}>
          {isParticipantSpeaking && (
            <Icon name="volume-up" size={22} color="#4285f4" />
          )}
          {isMicMuted ? (
            <Icon name="mic-off" size={22} color="#d66b6b" />
          ) : (
            <Icon name="mic" size={22} color="#9aa0a6" />
          )}
          {isVideoMuted ? (
            <Icon name="videocam-off" size={22} color="#d66b6b" />
          ) : (
            <Icon name="videocam" size={22} color="#9aa0a6" />
          )}
          <TouchableOpacity
            onPress={() => handlePinParticipant(item.id)}
            style={styles.participantListItemMoreButton}>
            <AntDesign
              name="pushpin"
              size={22}
              color={pinnedParticipantId === item.id ? '#2196f3' : '#9aa0a6'}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const reactionCounts: { [type: string]: number } = {};
    if (item.reactions) {
      Object.values(item.reactions).forEach(type => {
        reactionCounts[type] = (reactionCounts[type] || 0) + 1;
      });
    }
    const myReaction = item.reactions?.[currentUserId];
    const isCurrentUserMessage = item.senderId === currentUserId;

    return (
      <TouchableOpacity
        onLongPress={() => handleLongPressMessage(item.id)}
        activeOpacity={0.8}>
        <View
          style={[
            styles.messageContainer,
            isCurrentUserMessage && styles.myMessageContainer,
          ]}>
          {!isCurrentUserMessage && (
            <Text
              style={[
                styles.messageSender,
                isDark && styles.messageSenderDark,
              ]}>
              {item.senderName || 'Unknown User'}
            </Text>
          )}
          <View
            style={[
              styles.messageBubble,
              isCurrentUserMessage && styles.myMessageBubble,
              isDark && styles.messageBubbleDark,
              isCurrentUserMessage && isDark && styles.myMessageBubbleDark,
            ]}>
            <Text
              style={[
                styles.messageText,
                isCurrentUserMessage && styles.myMessageText,
                isDark && styles.messageTextDark,
              ]}>
              {item.text}
            </Text>
          </View>
          {Object.keys(reactionCounts).length > 0 && (
            <View style={styles.messageReactionsContainer}>
              {Object.entries(reactionCounts).map(([type, count]) => (
                <View
                  key={type}
                  style={[
                    styles.messageReactionBadge,
                    myReaction === type && styles.myMessageReactionBadge,
                  ]}>
                  {type === 'thumbsUp' && <MessageReactionIcon text={'👍🏻'} />}
                  {type === 'thumbsDown' && (
                    <MessageReactionIcon text={'👎🏻'} />
                    // <MaterialCommunityIcons
                    //   name="thumb-down"
                    //   size={14}
                    //   color="#fff"
                    // />
                  )}
                  {type === 'heart' && (
                    <MessageReactionIcon text={'❤️'} />
                    // <MaterialCommunityIcons
                    //   name="heart"
                    //   size={14}
                    //   color="#fff"
                    // />
                  )}
                  {type === 'laugh' && (
                    <MessageReactionIcon text={'😀'} />
                    // <MaterialCommunityIcons
                    //   name="emoticon-excited"
                    //   size={14}
                    //   color="#fff"
                    // />
                  )}
                  <Text style={styles.messageReactionCount}>{count}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={[styles.messageTime, isDark && styles.messageTimeDark]}>
            {isCurrentUserMessage ? 'You' : item.senderName} •{' '}
            {item.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleFlipCamera = () => {
    if (localStream && onFlipCamera) {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        // @ts-ignore
        const Vibration = require('react-native').Vibration;
        Vibration.vibrate(50);
      }

      const animateButtonPress = Animated.sequence([
        Animated.timing(new Animated.Value(1), {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(new Animated.Value(0.8), {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]);
      animateButtonPress.start();

      onFlipCamera();
      setLocalIsFrontCamera(!currentIsFrontCamera);
    } else if (localStream) {
      localStream.getVideoTracks().forEach((track: any) => {
        if (typeof track._switchCamera === 'function') {
          track._switchCamera();
          setLocalIsFrontCamera(!currentIsFrontCamera);
        }
      });
    }
  };

  // Function to generate consistent avatar color based on participant ID
  const getAvatarColor = (id: string) => {
    const colors = [
      '#4285F4', // Google Blue
      '#EA4335', // Google Red
      '#FBBC05', // Google Yellow
      '#34A853', // Google Green
      '#8AB4F8', // Light Blue
      '#F28B82', // Light Red
      '#FDD663', // Light Yellow
      '#81C995', // Light Green
    ];

    // Use the sum of character codes to determine color index
    const charSum = id
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charSum % colors.length];
  };

  const renderParticipantGrid = () => {
    const participantsArray = getAllParticipants();
    const totalParticipants = participantsArray.length;
    let numColumns = 1;
    let itemHeight = height * 0.8;

    // Store these values for renderParticipantItem to access
    (renderParticipantGrid as any).numColumns = numColumns;
    (renderParticipantGrid as any).itemHeight = itemHeight;

    // --- Calculate Layout Values ---
    // Check if any participant is screen sharing
    const screenSharingParticipant = participantsArray.find(
      p => participantStates.get(p.id)?.isScreenSharing,
    );

    if (screenSharingParticipant) {
      // When someone is screen sharing, pin them automatically
      setPinnedParticipantId(screenSharingParticipant.id);
      numColumns = 1;
    } else if (pinnedParticipantId && totalParticipants > 1) {
      numColumns = 1;
    } else if (totalParticipants >= 4) {
      numColumns = 2;
    } else {
      numColumns = 1;
    }

    if (screenSharingParticipant) {
      // When someone is screen sharing, make their video larger
      if (participantsArray[0].id === screenSharingParticipant.id)
        itemHeight = height * 0.7;
      else itemHeight = height * 0.2;
    } else if (pinnedParticipantId && totalParticipants > 1) {
      if (participantsArray[0].id === pinnedParticipantId) {
        itemHeight = height * 0.7;
      } else {
        // For unpinned participants when someone is pinned, make them smaller but still visible
        // Adjust numColumns to accommodate more participants in a smaller view
        numColumns = Math.min(totalParticipants - 1, 3); // Max 3 columns for unpinned
        itemHeight =
          (height * 0.3) / Math.ceil((totalParticipants - 1) / numColumns); // Distribute remaining height
      }
    } else {
      if (numColumns === 1) {
        if (totalParticipants === 1) itemHeight = height * 0.8;
        else if (totalParticipants === 2) itemHeight = height * 0.4;
        else if (totalParticipants === 3) itemHeight = height * 0.3;
      } else {
        const numRows = Math.ceil(totalParticipants / 2);
        itemHeight = (height / numRows) * 0.85;
        itemHeight = Math.max(itemHeight, height * 0.25);
      }
    }
    // --- End Calculation ---

    // Update the stored values for renderParticipantItem to access
    (renderParticipantGrid as any).numColumns = numColumns;
    (renderParticipantGrid as any).itemHeight = itemHeight;

    // Define renderItem directly for FlatList
    const renderGridItem = ({ item, index }: { item: any; index: number }) => {
      // Check if this participant is screen sharing
      const isItemScreenSharing = participantStates.get(
        item.id,
      )?.isScreenSharing;

      const isPinned =
        item.id === pinnedParticipantId ||
        (item.id === currentUserId && isItemScreenSharing);

      // Apply layout styles here in the wrapper
      return (
        <TouchableOpacity
          onLongPress={() =>
            handlePinParticipant(item.participantId || item.id)
          }
          activeOpacity={1}
          style={[
            styles.participantWrapper,
            {
              width: `${100 / numColumns}%`,
              height: itemHeight,
              zIndex: isPinned ? 10 : 1,
            },
          ]}>
          {/* Call the inner content renderer */}
          {renderParticipantItem({ item, index, isPinned })}
        </TouchableOpacity>
      );
    };

    return (
      <FlatList
        ref={participantsListRef}
        data={participantsArray}
        renderItem={renderGridItem} // Use the wrapper function
        keyExtractor={item => item.id}
        style={styles.participantsList}
        contentContainerStyle={styles.participantsListContent}
        showsVerticalScrollIndicator={true}
        numColumns={numColumns}
        key={numColumns}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}>
        <View style={styles.mainContainer}>
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.touchableContainer,
              isDark && styles.darkTouchableContainer,
            ]}
            onPress={() => setIsControlsVisible(true)}>
            <View style={styles.participantsGrid}>
              {localStream && renderParticipantGrid()}

              {/* Modified empty state logic to be more robust */}
              {(!localStream ||
                (remoteStreams.length === 0 &&
                  participantStates.size <= 1)) && (
                  <View style={styles.emptyStateContainer}>
                    {isConnecting ? (
                      <>
                        <ActivityIndicator size="large" color="#4285F4" />
                        <Text style={styles.emptyStateTitle}>
                          Connecting to meeting...
                        </Text>
                        <Text style={styles.emptyStateSubtitle}>
                          Please wait while we connect to the meeting
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.emptyStateTitle}>
                          You're the only one here
                        </Text>
                        <Text style={styles.emptyStateSubtitle}>
                          Share this meeting link with others you want in the
                          meeting
                        </Text>
                        <View style={styles.meetingLinkContainer}>
                          <Text style={styles.meetingLink}>
                            {meeting.roomCode}
                          </Text>
                          <TouchableOpacity
                            style={styles.copyButton}
                            onPress={copyToClipboard}>
                            <Icon name="content-copy" size={24} color="#fff" />
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                          style={styles.shareInviteButton}
                          onPress={handleShareInvite}>
                          <Icon
                            name="share"
                            size={20}
                            color="#fff"
                            style={styles.shareIcon}
                          />
                          <Text style={styles.shareButtonText}>Share invite</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
            </View>

            <View
              style={[
                styles.controlsContainer,
                isControlsVisible
                  ? styles.controlsVisible
                  : styles.controlsHidden,
              ]}>
              <View style={styles.meetingInfo}>
                <Text style={styles.meetingTitle}>
                  {meeting.title || 'Meeting'}
                </Text>
                <Text style={styles.roomCode}>{meeting.roomCode}</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                indicatorStyle="white"
                contentContainerStyle={styles.controls}
                style={styles.controlsScrollView}>
                {!showMoreControls ? (
                  <>
                    {/* Primary Controls (Page 1) */}
                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        !isAudioEnabled && styles.controlButtonDisabled,
                      ]}
                      onPress={onToggleAudio}>
                      <Icon
                        name={isAudioEnabled ? 'mic' : 'mic-off'}
                        size={24}
                        color="white"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        !isVideoEnabled && styles.controlButtonDisabled,
                      ]}
                      onPress={onToggleVideo}>
                      <Icon
                        name={isVideoEnabled ? 'videocam' : 'videocam-off'}
                        size={24}
                        color="white"
                      />
                    </TouchableOpacity>

                    {isVideoEnabled && (
                      <TouchableOpacity
                        style={styles.controlButton}
                        onPress={handleFlipCamera}>
                        <MaterialCommunityIcons
                          name={
                            currentIsFrontCamera
                              ? 'camera-front'
                              : 'camera-rear'
                          }
                          size={24}
                          color="white"
                        />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        isHandRaised && styles.controlButtonActive,
                      ]}
                      onPress={handleRaiseHand}>
                      <MaterialCommunityIcons
                        name="hand-wave"
                        size={24}
                        color="white"
                      />
                    </TouchableOpacity>

                    {/* More Controls Button */}
                    <TouchableOpacity
                      style={[styles.controlButton, styles.moreControlsButton]}
                      onPress={() => setShowMoreControls(true)}>
                      <Icon name="more-horiz" size={24} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.controlButton, styles.endCallButton]}
                      onPress={onEndCall}>
                      <Icon name="call-end" size={24} color="white" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/* Secondary Controls (Page 2) */}
                    <TouchableOpacity
                      style={[styles.controlButton, styles.backControlsButton]}
                      onPress={() => setShowMoreControls(false)}>
                      <Icon name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        showReactions && styles.controlButtonActive,
                      ]}
                      onPress={toggleReactionsMenu}>
                      <MaterialCommunityIcons
                        name="emoticon-outline"
                        size={24}
                        color="white"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        showParticipants && styles.controlButtonActive,
                      ]}
                      onPress={toggleParticipantsPanel}>
                      <Icon name="people" size={24} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.controlButton,
                        showChat && styles.controlButtonActive,
                      ]}
                      onPress={toggleChat}>
                      <Icon name="chat" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.controlButton, styles.endCallButton]}
                      onPress={onEndCall}>
                      <Icon name="call-end" size={24} color="white" />
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>

          {/* Reactions Menu */}
          {showReactions && (
            <Animated.View
              style={[styles.reactionsMenu, { opacity: reactionsMenuOpacity }]}>
              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => handleReaction('thumbsUp')}>
                <Text className="text-2xl font-bold">👍🏻</Text>
                {/* <MaterialCommunityIcons
                  name="thumb-up"
                  size={28}
                  color="#4285F4"
                /> */}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => handleReaction('thumbsDown')}>
                <Text className="text-2xl font-bold">👎🏻</Text>
                {/* <MaterialCommunityIcons
                  name="thumb-down"
                  size={28}
                  color="#EA4335"
                /> */}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => handleReaction('clapping')}>
                <Text className="text-2xl font-bold">👏🏻</Text>
                {/* <MaterialCommunityIcons
                  name="hand-clap"
                  size={28}
                  color="#FBBC05"
                /> */}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => handleReaction('smiling')}>
                <Text className="text-2xl font-bold">😂</Text>
                {/* <MaterialCommunityIcons
                  name="hand-wave"
                  size={28}
                  color="#34A853"
                /> */}
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Full Screen Chat Panel */}
          {showChat && (
            <Animated.View
              style={[
                styles.fullScreenChatPanel,
                isDark
                  ? styles.fullScreenChatPanelDark
                  : styles.fullScreenChatPanelLight,
                { opacity: chatPanelOpacity },
              ]}>
              <View
                style={[styles.chatHeader, isDark && styles.chatHeaderDark]}>
                <TouchableOpacity
                  onPress={toggleChat}
                  style={styles.backButton}>
                  <Icon
                    name="arrow-back"
                    size={24}
                    color={isDark ? '#fff' : '#000'}
                  />
                </TouchableOpacity>
                <Text
                  style={[styles.chatTitle, isDark && styles.chatTitleDark]}>
                  In call messages
                </Text>
              </View>

              {messages.length === 0 ? (
                <View style={styles.emptyMessagesContainer}>
                  <Text
                    style={[
                      styles.emptyMessagesText,
                      isDark && styles.emptyMessagesTextDark,
                    ]}>
                    No messages yet
                  </Text>
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  renderItem={renderMessageItem}
                  keyExtractor={item => item.id}
                  style={[
                    styles.messagesList,
                    isDark && styles.messagesListDark,
                  ]}
                  contentContainerStyle={styles.messagesContent}
                />
              )}

              <View
                style={[
                  styles.messageInfoBanner,
                  isDark && styles.messageInfoBannerDark,
                ]}>
                <Text
                  style={[
                    styles.messageInfoText,
                    isDark && styles.messageInfoTextDark,
                  ]}>
                  Messages can be seen only during the call by people in the
                  call
                </Text>
              </View>

              <View
                style={[
                  styles.chatInputContainer,
                  isDark && styles.chatInputContainerDark,
                ]}>
                <TouchableOpacity
                  style={styles.quickMessagesButton}
                  onPress={toggleQuickMessagesMenu}>
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={24}
                    color={isDark ? '#8ab4f8' : '#1a73e8'}
                  />
                </TouchableOpacity>
                <TextInput
                  style={[styles.chatInput, isDark && styles.chatInputDark]}
                  placeholder="Send message"
                  placeholderTextColor={isDark ? '#9aa0a6' : '#5f6368'}
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !messageText.trim() && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSendMessage}
                  disabled={!messageText.trim()}>
                  <Icon
                    name="send"
                    size={24}
                    color={
                      messageText.trim()
                        ? isDark
                          ? '#8ab4f8'
                          : '#1a73e8'
                        : isDark
                          ? '#5f6368'
                          : '#9aa0a6'
                    }
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Quick Messages Menu */}
          {showQuickMessages && (
            <Animated.View
              style={[
                styles.quickMessagesMenu,
                { opacity: quickMessagesMenuOpacity },
              ]}>
              <View style={styles.quickMessagesHeader}>
                <Text style={styles.quickMessagesTitle}>Quick messages</Text>
                <TouchableOpacity onPress={() => setShowQuickMessages(false)}>
                  <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={quickMessages}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.quickMessageItem}
                    onPress={() => sendQuickMessage(item)}>
                    <Text style={styles.quickMessageText}>{item}</Text>
                  </TouchableOpacity>
                )}
                style={styles.quickMessagesList}
              />
            </Animated.View>
          )}

          {/* Message Reactions Menu */}
          {showMessageReactions && (
            <View style={styles.messageReactionsMenu}>
              <View style={styles.messageReactionsHeader}>
                <Text style={styles.messageReactionsTitle}>Add reaction</Text>
                <TouchableOpacity onPress={closeMessageReactions}>
                  <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.messageReactionsButtons}>
                <TouchableOpacity
                  style={styles.messageReactionButton}
                  onPress={() => handleMessageReaction('thumbsUp')}>
                  <Text className="text-sm font-bold">👍🏻</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.messageReactionButton}
                  onPress={() => handleMessageReaction('thumbsDown')}>
                  <Text className="text-sm font-bold">👎🏻</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.messageReactionButton}
                  onPress={() => handleMessageReaction('heart')}>
                  <Text className="text-sm font-bold">❤️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.messageReactionButton}
                  onPress={() => handleMessageReaction('laugh')}>
                  <Text className="text-sm font-bold">😀</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Participants Panel */}
          {showParticipants && (
            <Animated.View
              style={[
                styles.fullScreenPanel,
                isDark
                  ? styles.fullScreenPanelDark
                  : styles.fullScreenPanelLight,
                { opacity: participantsPanelOpacity },
              ]}>
              <View
                style={[styles.panelHeader, isDark && styles.panelHeaderDark]}>
                <TouchableOpacity
                  onPress={toggleParticipantsPanel}
                  style={styles.backButton}>
                  <Icon
                    name="arrow-back"
                    size={24}
                    color={isDark ? '#fff' : '#000'}
                  />
                </TouchableOpacity>
                <Text
                  style={[styles.panelTitle, isDark && styles.panelTitleDark]}>
                  Participants ({getAllParticipants().length})
                </Text>
              </View>

              <FlatList
                data={getOrderedParticipantsForList()}
                renderItem={renderParticipantListItem}
                keyExtractor={item => item.id}
                style={[
                  styles.participantsList,
                  isDark && styles.participantsListDark,
                ]}
              />
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202124',
  },
  darkContainer: {
    backgroundColor: '#202124',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  touchableContainer: {
    flex: 1,
    position: 'relative',
  },
  darkTouchableContainer: {
    backgroundColor: '#202124',
  },
  participantsGrid: {
    flex: 1,
  },
  participantsList: {
    flex: 1,
  },
  participantsListContent: {
    padding: 8,
  },
  participantContainer: {
    flex: 1,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#3c4043',
    position: 'relative',
  },
  participantVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  nameTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  nameTagContent: {
    flex: 1,
    flexDirection: 'column',
  },
  currentUserNameTag: {
    backgroundColor: 'rgba(66, 133, 244, 0.8)', // Google Blue with opacity
  },
  speakingNameTag: {
    backgroundColor: 'rgba(52, 168, 83, 0.8)', // Google Green with opacity
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  currentUserNameText: {
    color: '#FFFFFF',
  },
  emailText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  youIndicator: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  youIndicatorText: {
    color: 'rgba(66, 133, 244, 1)', // Google Blue
    fontSize: 10,
    fontWeight: 'bold',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarCircleSpeaking: {
    borderColor: '#4285f4',
    borderWidth: 3,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  currentUserContainer: {
    borderWidth: 2,
    borderColor: 'rgba(66, 133, 244, 0.8)', // Google Blue with opacity
  },
  participantSpeakingContainer: {
    borderWidth: 2,
    borderColor: 'rgba(52, 168, 83, 0.8)', // Google Green with opacity
  },
  emptyStateContainer: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    color: '#9aa0a6',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  meetingLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3c4043',
    borderRadius: 4,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '80%',
  },
  meetingLink: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  copyButton: {
    padding: 8,
  },
  shareInviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8ab4f8',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  shareIcon: {
    marginRight: 8,
  },
  shareButtonText: {
    color: '#202124',
    fontSize: 16,
    fontWeight: '500',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(32, 33, 36, 0.9)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  controlsVisible: {
    opacity: 1,
  },
  controlsHidden: {
    opacity: 0,
  },
  meetingInfo: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meetingTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  roomCode: {
    color: '#9aa0a6',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexWrap: 'nowrap',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3c4043',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  controlButtonDisabled: {
    backgroundColor: '#ea4335',
  },
  controlButtonActive: {
    backgroundColor: '#8ab4f8',
  },
  endCallButton: {
    backgroundColor: '#ea4335',
  },
  fullScreenChatPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    flexDirection: 'column',
  },
  fullScreenChatPanelLight: {
    backgroundColor: '#ffffff',
  },
  fullScreenChatPanelDark: {
    backgroundColor: '#202124',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  chatHeaderDark: {
    borderBottomColor: '#3c4043',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  chatTitle: {
    color: '#202124',
    fontSize: 18,
    fontWeight: '500',
  },
  chatTitleDark: {
    color: '#ffffff',
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  messagesListDark: {
    backgroundColor: '#202124',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessagesText: {
    color: '#5f6368',
    fontSize: 16,
  },
  emptyMessagesTextDark: {
    color: '#9aa0a6',
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
    alignSelf: 'flex-start',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  messageSender: {
    color: '#5f6368',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  messageSenderDark: {
    color: '#9aa0a6',
  },
  messageBubble: {
    backgroundColor: '#f1f3f4',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageBubbleDark: {
    backgroundColor: '#3c4043',
  },
  myMessageBubble: {
    backgroundColor: '#e8f0fe',
  },
  myMessageBubbleDark: {
    backgroundColor: '#174ea6',
  },
  messageText: {
    color: '#202124',
    fontSize: 14,
  },
  messageTextDark: {
    color: '#ffffff',
  },
  myMessageText: {
    color: '#202124',
  },
  messageTime: {
    color: '#5f6368',
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeDark: {
    color: '#9aa0a6',
  },
  messageInfoBanner: {
    backgroundColor: '#f1f3f4',
    padding: 12,
    alignItems: 'center',
  },
  messageInfoBannerDark: {
    backgroundColor: '#3c4043',
  },
  messageInfoText: {
    color: '#5f6368',
    fontSize: 12,
    textAlign: 'center',
  },
  messageInfoTextDark: {
    color: '#9aa0a6',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  chatInputContainerDark: {
    borderTopColor: '#3c4043',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#f1f3f4',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#202124',
    fontSize: 14,
    maxHeight: 100,
  },
  chatInputDark: {
    backgroundColor: '#3c4043',
    color: '#ffffff',
  },
  sendButton: {
    marginLeft: 8,
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000', // Solid black background
  },
  videoPlaceholderDark: {
    backgroundColor: '#000000', // Also black in dark mode
  },
  videoPlaceholderLight: {
    backgroundColor: '#000000', // Also black in light mode
  },
  audioOffIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(234, 67, 53, 0.8)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  handRaisedIndicator: {
    position: 'absolute',
    top: 86,
    right: 16,
    // backgroundColor: 'rgba(251, 188, 5, 0.8)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  reactionIndicator: {
    position: 'absolute',
    top: 15,
    right: 16,
    // backgroundColor: 'rgba(66, 133, 244, 0.8)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  thumbsDownIndicator: {
    // backgroundColor: 'rgba(234, 67, 53, 0.8)',
    top: 15,
  },
  clappingIndicator: {
    // backgroundColor: 'rgba(251, 188, 5, 0.8)',
    top: 15,
  },
  wavingIndicator: {
    // backgroundColor: 'rgba(52, 168, 83, 0.8)',
    top: 15,
  },
  reactionsMenu: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(32, 33, 36, 0.9)',
    borderRadius: 16,
    margin: 16,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 100,
  },
  reactionButton: {
    padding: 12,
    backgroundColor: 'rgba(60, 64, 67, 0.8)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
  },
  messageReactionsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 2,
  },
  messageReactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(60, 64, 67, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
  },
  myMessageReactionBadge: {
    backgroundColor: 'rgba(66, 133, 244, 0.8)',
  },
  messageReactionCount: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  messageReactionsMenu: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(32, 33, 36, 0.95)',
    borderRadius: 16,
    margin: 16,
    padding: 16,
    zIndex: 200,
  },
  messageReactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  messageReactionsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  messageReactionsButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  messageReactionButton: {
    padding: 12,
    backgroundColor: 'rgba(60, 64, 67, 0.8)',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickMessagesButton: {
    padding: 8,
    marginRight: 8,
  },
  quickMessagesMenu: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(32, 33, 36, 0.95)',
    borderRadius: 16,
    margin: 16,
    padding: 16,
    maxHeight: 300,
    zIndex: 200,
  },
  quickMessagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickMessagesTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  quickMessagesList: {
    maxHeight: 240,
  },
  quickMessageItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(60, 64, 67, 0.8)',
  },
  quickMessageText: {
    color: '#fff',
    fontSize: 14,
  },
  participantListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderColor: '#f1f3f410',
    margin: 10,
    borderRadius: 10,
    borderBottomWidth: 1,
  },
  participantListItemDark: {
    borderBottomColor: '#3c4043',
  },
  participantListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantListItemAvatarContainer: {
    marginRight: 12,
  },
  participantListItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantListItemAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantListItemVideo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
  },
  participantListItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  participantListItemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  participantListItemEmail: {
    color: '#5f6368',
    fontSize: 12,
  },
  participantListItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  participantListItemMoreButton: {
    marginLeft: 12,
    padding: 4,
  },

  participantListAvatarSpeaking: {
    borderWidth: 2,
    borderColor: '#4285f4',
  },
  participantListAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  participantListName: {
    fontSize: 16,
    color: '#202124',
  },
  participantListNameDark: {
    color: '#ffffff',
  },
  participantListItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantListIcon: {
    marginLeft: 8,
  },
  participantsListDark: {
    backgroundColor: '#202124',
  },
  participantPinnedContainer: {
    borderWidth: 2,
    borderColor: '#4285f4',
  },
  pinnedIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(66, 133, 244, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 4,
  },
  participantListItemPinned: {
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
  },
  participantListPinnedText: {
    fontSize: 12,
    color: '#4285f4',
    marginTop: 2,
  },
  speakingIndicator: {
    position: 'absolute',
    top: 60, // Position below hand raised indicator
    left: 16,
    backgroundColor: 'rgba(66, 133, 244, 0.8)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  fullScreenPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    flexDirection: 'column',
  },
  fullScreenPanelLight: {
    backgroundColor: '#ffffff',
  },
  fullScreenPanelDark: {
    backgroundColor: '#202124',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  panelHeaderDark: {
    borderBottomColor: '#3c4043',
  },
  panelTitle: {
    color: '#202124',
    fontSize: 18,
    fontWeight: '500',
  },
  panelTitleDark: {
    color: '#ffffff',
  },
  controlsScrollView: {
    paddingBottom: 8,
  },
  moreControlsButton: {
    backgroundColor: '#8ab4f8',
  },
  backControlsButton: {
    backgroundColor: '#4285f4',
    borderColor: '#ffffff',
    borderWidth: 1,
  },
  participantInfoBar: {
    flex: 1,
    padding: 8,
  },
  participantName: {
    fontSize: 16,
    color: '#202124',
  },
  participantWrapper: {
    flex: 1,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#3c4043',
    position: 'relative',
  },
});

export default Room;
