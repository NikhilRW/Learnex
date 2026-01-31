import {useState, useRef, useEffect} from 'react';
import {Animated, Keyboard} from 'react-native';
import {ANIMATION_DURATION} from '../constants/common';

/**
 * Custom hook for managing Room UI state
 * Handles visibility of panels, menus, and UI elements
 */
export const useRoomUIState = () => {
  // Visibility states
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showMessageReactions, setShowMessageReactions] = useState(false);
  const [showMoreControls, setShowMoreControls] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  // Animated values
  const chatPanelOpacity = useRef(new Animated.Value(0)).current;
  const reactionsMenuOpacity = useRef(new Animated.Value(0)).current;
  const quickMessagesMenuOpacity = useRef(new Animated.Value(0)).current;
  const participantsPanelOpacity = useRef(new Animated.Value(0)).current;

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Animate chat panel
  useEffect(() => {
    Animated.timing(chatPanelOpacity, {
      toValue: showChat ? 1 : 0,
      duration: ANIMATION_DURATION.panel,
      useNativeDriver: true,
    }).start();
  }, [showChat, chatPanelOpacity]);

  // Animate reactions menu
  useEffect(() => {
    Animated.timing(reactionsMenuOpacity, {
      toValue: showReactions ? 1 : 0,
      duration: ANIMATION_DURATION.menu,
      useNativeDriver: true,
    }).start();
  }, [showReactions, reactionsMenuOpacity]);

  // Animate quick messages menu
  useEffect(() => {
    Animated.timing(quickMessagesMenuOpacity, {
      toValue: showQuickMessages ? 1 : 0,
      duration: ANIMATION_DURATION.menu,
      useNativeDriver: true,
    }).start();
  }, [showQuickMessages, quickMessagesMenuOpacity]);

  // Animate participants panel
  useEffect(() => {
    Animated.timing(participantsPanelOpacity, {
      toValue: showParticipants ? 1 : 0,
      duration: ANIMATION_DURATION.panel,
      useNativeDriver: true,
    }).start();
  }, [showParticipants, participantsPanelOpacity]);

  const toggleChat = () => {
    setShowChat(!showChat);
    setIsControlsVisible(true);
  };

  const toggleReactionsMenu = () => {
    setShowReactions(!showReactions);
    setIsControlsVisible(true);
  };

  const toggleQuickMessagesMenu = () => {
    setShowQuickMessages(!showQuickMessages);
    setIsControlsVisible(true);
  };

  const toggleParticipantsPanel = () => {
    setShowParticipants(!showParticipants);
    setIsControlsVisible(true);
  };

  const handleLongPressMessage = (messageId: string) => {
    setSelectedMessage(messageId);
    setShowMessageReactions(true);
  };

  const closeMessageReactions = () => {
    setShowMessageReactions(false);
    setSelectedMessage(null);
  };

  return {
    // States
    isControlsVisible,
    setIsControlsVisible,
    isHandRaised,
    setIsHandRaised,
    showChat,
    showReactions,
    showQuickMessages,
    showParticipants,
    showMessageReactions,
    showMoreControls,
    setShowMoreControls,
    keyboardVisible,
    selectedMessage,

    // Animated values
    chatPanelOpacity,
    reactionsMenuOpacity,
    quickMessagesMenuOpacity,
    participantsPanelOpacity,

    // Actions
    toggleChat,
    toggleReactionsMenu,
    toggleQuickMessagesMenu,
    toggleParticipantsPanel,
    handleLongPressMessage,
    closeMessageReactions,
  };
};
