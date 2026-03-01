import {Platform, StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
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
    textShadowOffset: {width: 0, height: 1},
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
    shadowOffset: {width: 0, height: 0},
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
    justifyContent: 'center',
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
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
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
  flex1: {
    flex: 1,
  },
  participantVideoOffBg: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  videoPlaceholderPinned: {
    backgroundColor: '#1f1f1f',
  },
  videoPlaceholderUnpinned: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  textWhite: {
    color: 'white',
  },
  textBlack: {
    color: 'black',
  },
  pinnedZIndex: {
    zIndex: 10,
  },
  unpinnedZIndex: {
    zIndex: 1,
  },
});
