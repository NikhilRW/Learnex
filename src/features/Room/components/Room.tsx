import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, TouchableOpacity, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserService } from 'shared/services/UserService';
import { RoomProps } from '../types';
import { useRoomUIState } from '../hooks';
import ParticipantGrid from './ParticipantGrid';
import ControlBar from './ControlBar';
import ChatPanel from './ChatPanel';
import ReactionsMenu from './ReactionsMenu';
import ParticipantsPanel from './ParticipantsPanel';
import EmptyState from './EmptyState';
import QuickMessagesMenu from './QuickMessagesMenu';
import MessageReactionsMenu from './MessageReactionsMenu';
import { styles } from '../styles/RoomComponent.styles';

const Room: React.FC<RoomProps> = ({
  meeting,
  localStream,
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
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const [userInfoCache, setUserInfoCache] = useState<Map<string, { email: string | null; fullName: string | null; username: string | null }>>(new Map());
  const [localIsFrontCamera, setLocalIsFrontCamera] = useState(true);

  const userService = useMemo(() => new UserService(), []);
  const currentIsFrontCamera = propIsFrontCamera !== undefined ? propIsFrontCamera : localIsFrontCamera;

  // Use UI state hook
  const uiState = useRoomUIState();

  // Update local hand raised state when participant states change
  useEffect(() => {
    const myState = participantStates.get(currentUserId);
    if (myState) {
      uiState.setIsHandRaised(myState.isHandRaised);
    }
  }, [participantStates, currentUserId]);

  // Fetch and cache user info
  const getUserInfo = useCallback(
    async (userId: string) => {
      if (userInfoCache.has(userId)) {
        return userInfoCache.get(userId);
      }

      const userInfo = await userService.getUserInfoById(userId);
      setUserInfoCache(prev => {
        const newCache = new Map(prev);
        newCache.set(userId, userInfo);
        return newCache;
      });

      return userInfo;
    },
    [userInfoCache, userService],
  );

  useEffect(() => {
    remoteStreams.forEach(async stream => {
      const participantId = stream.participantId || stream.id;
      if (participantId && !userInfoCache.has(participantId)) {
        await getUserInfo(participantId);
      }
    });
  }, [remoteStreams, getUserInfo, userInfoCache]);

  // Action handlers
  const handleRaiseHand = () => {
    const newRaisedState = !uiState.isHandRaised;
    uiState.setIsHandRaised(newRaisedState);
    onRaiseHand(newRaisedState);
  };

  const handleReaction = (reaction: 'thumbsUp' | 'thumbsDown' | 'clapping' | 'waving' | 'smiling') => {
    onReaction(reaction);
    uiState.toggleReactionsMenu();
  };

  const handleMessageReaction = (reactionType: string) => {
    if (uiState.selectedMessage) {
      onMessageReaction(uiState.selectedMessage, reactionType);
      uiState.closeMessageReactions();
    }
  };

  const handleSendQuickMessage = (text: string) => {
    onSendMessage(text);
    uiState.toggleQuickMessagesMenu();
  };

  const handleFlipCamera = () => {
    if (localStream && onFlipCamera) {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
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

  const handlePinParticipant = (participantId: string) => {
    if (pinnedParticipantId === participantId) {
      setPinnedParticipantId(null);
    } else {
      setPinnedParticipantId(participantId);
    }
  };

  // Get all participants with their info
  const getAllParticipants = () => {
    const participantsMap = new Map();

    participantsMap.set(currentUserId, {
      id: currentUserId,
      name: currentUserName,
      isLocal: true,
      stream: localStream,
    });

    remoteStreams.forEach(stream => {
      const participantId = stream.participantId || stream.id;
      if (participantId) {
        const userInfo = userInfoCache.get(participantId);
        participantsMap.set(participantId, {
          id: participantId,
          name: userInfo?.fullName || userInfo?.username || `User ${participantId.substring(0, 5)}`,
          isLocal: false,
          stream: stream,
        });
      }
    });

    participantStates.forEach((state, id) => {
      if (id !== currentUserId && !participantsMap.has(id)) {
        const userInfo = userInfoCache.get(id);
        participantsMap.set(id, {
          id: id,
          name: userInfo?.fullName || userInfo?.username || `User ${id.substring(0, 5)}`,
          isLocal: false,
          state: state,
        });
      } else if (participantsMap.has(id)) {
        const participant = participantsMap.get(id);
        participantsMap.set(id, {
          ...participant,
          state: state,
        });
      }
    });

    let participantsArray = Array.from(participantsMap.values());

    if (pinnedParticipantId) {
      const pinnedIndex = participantsArray.findIndex(p => p.id === pinnedParticipantId);
      if (pinnedIndex > -1) {
        const [pinnedParticipant] = participantsArray.splice(pinnedIndex, 1);
        participantsArray.unshift(pinnedParticipant);
      }
    }

    return participantsArray;
  };

  const getOrderedParticipantsForList = () => {
    const allParticipants = getAllParticipants();
    const currentUser = allParticipants.find(p => p.id === currentUserId);
    const otherParticipants = allParticipants.filter(p => p.id !== currentUserId);
    return currentUser ? [currentUser, ...otherParticipants] : allParticipants;
  };

  const participants = getAllParticipants();
  const showEmptyState = !localStream || (remoteStreams.length === 0 && participantStates.size <= 1);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}>
        <View style={styles.mainContainer}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.touchableContainer, isDark && styles.darkTouchableContainer]}
            onPress={() => uiState.setIsControlsVisible(true)}>

            <View style={styles.participantsGrid}>
              {localStream && (
                <ParticipantGrid
                  participants={participants}
                  currentUserId={currentUserId}
                  pinnedParticipantId={pinnedParticipantId}
                  participantStates={participantStates}
                  isAudioEnabled={isAudioEnabled}
                  isVideoEnabled={isVideoEnabled}
                  onPinParticipant={handlePinParticipant}
                />
              )}

              {showEmptyState && (
                <EmptyState
                  isConnecting={isConnecting}
                  meetingTitle={meeting.title}
                  roomCode={meeting.roomCode}
                />
              )}
            </View>

            <ControlBar
              isControlsVisible={uiState.isControlsVisible}
              isAudioEnabled={isAudioEnabled}
              isVideoEnabled={isVideoEnabled}
              isHandRaised={uiState.isHandRaised}
              showChat={uiState.showChat}
              showReactions={uiState.showReactions}
              showParticipants={uiState.showParticipants}
              showMoreControls={uiState.showMoreControls}
              isFrontCamera={currentIsFrontCamera}
              meetingTitle={meeting.title}
              roomCode={meeting.roomCode}
              onToggleAudio={onToggleAudio}
              onToggleVideo={onToggleVideo}
              onFlipCamera={handleFlipCamera}
              onRaiseHand={handleRaiseHand}
              onToggleChat={uiState.toggleChat}
              onToggleReactions={uiState.toggleReactionsMenu}
              onToggleParticipants={uiState.toggleParticipantsPanel}
              onToggleMoreControls={uiState.setShowMoreControls}
              onEndCall={onEndCall}
            />
          </TouchableOpacity>

          <ReactionsMenu
            showReactions={uiState.showReactions}
            reactionsMenuOpacity={uiState.reactionsMenuOpacity}
            onReaction={handleReaction}
          />

          <ChatPanel
            messages={messages}
            currentUserId={currentUserId}
            isDark={isDark}
            showChat={uiState.showChat}
            chatPanelOpacity={uiState.chatPanelOpacity}
            onClose={uiState.toggleChat}
            onSendMessage={onSendMessage}
            onLongPressMessage={uiState.handleLongPressMessage}
            onToggleQuickMessages={uiState.toggleQuickMessagesMenu}
          />

          <QuickMessagesMenu
            showQuickMessages={uiState.showQuickMessages}
            quickMessagesMenuOpacity={uiState.quickMessagesMenuOpacity}
            onClose={uiState.toggleQuickMessagesMenu}
            onSendQuickMessage={handleSendQuickMessage}
          />

          <MessageReactionsMenu
            showMessageReactions={uiState.showMessageReactions}
            onClose={uiState.closeMessageReactions}
            onReaction={handleMessageReaction}
          />

          <ParticipantsPanel
            participants={getOrderedParticipantsForList()}
            currentUserId={currentUserId}
            pinnedParticipantId={pinnedParticipantId}
            participantStates={participantStates}
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            isDark={isDark}
            showParticipants={uiState.showParticipants}
            participantsPanelOpacity={uiState.participantsPanelOpacity}
            onClose={uiState.toggleParticipantsPanel}
            onPinParticipant={handlePinParticipant}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Room;