import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
  },
  mainContainer: {
    flex: 1,
  },
  enhancedHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(62, 123, 250, 0.1)',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(62, 123, 250, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  messageList: {
    flex: 1,
    padding: 16,
    paddingBottom: 120, // Increased from 100 to provide more space between last message and input area
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60, // Reduced from 100 to allow more screen space for content
    padding: 20,
  },
  emptyText: {
    fontSize: 24, // Increased from 16 to make greetings more prominent
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30, // Added spacing between greeting and suggestions
    lineHeight: 32, // Added line height for better readability
  },
  messageBubble: {
    maxWidth: '85%',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageContent: {
    borderRadius: 18,
    padding: 12,
    paddingTop: 10,
    paddingBottom: 8,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 15,
  },
  userMessageContent: {
    borderTopRightRadius: 4,
  },
  assistantMessageContent: {
    borderTopLeftRadius: 4,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
    opacity: 0.7,
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeIndicatorIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  modeIndicatorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 6,
  },
  input: {
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#3E7BFA',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  historyModalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  historyBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  historyDrawer: {
    width: 300,
    maxWidth: '80%',
    height: '100%',
    position: 'absolute',
    right: 0,
    flex: 1,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: {width: -2, height: 0},
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyList: {
    flexGrow: 1,
  },
  historyItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  historyItem: {
    flex: 1,
    padding: 12,
  },
  activeHistoryItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyItemDate: {
    fontSize: 12,
  },
  historyItemPreview: {
    fontSize: 14,
    marginBottom: 4,
  },
  historyItemCount: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 10,
    marginRight: 10,
    borderRadius: 8,
  },
  emptyHistoryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyHistoryText: {
    fontSize: 16,
    textAlign: 'center',
  },
  newConversationButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  newConversationText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    marginVertical: 10,
    alignItems: 'flex-start',
    width: '100%',
  },
  loadingBubble: {
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    width: 70,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    margin: 3,
  },
  dot1: {
    opacity: 0.5,
    transform: [{scale: 1}],
  },
  dot2: {
    opacity: 0.5,
    transform: [{scale: 1}],
  },
  dot3: {
    opacity: 0.5,
    transform: [{scale: 1}],
  },
  suggestionsContainer: {
    paddingVertical: 16, // Increased from 12 for more space
    marginTop: 10,
    width: '100%',
    flexDirection: 'row', // Changed from default to allow flex wrap
    flexWrap: 'wrap', // Allow wrapping to multiple lines
    justifyContent: 'center', // Center the suggestions
    alignItems: 'center',
    borderTopWidth: 1,
  },
  suggestionsScrollContent: {
    paddingHorizontal: 16, // Increased from 12
  },
  suggestionChip: {
    paddingHorizontal: 16, // Increased from 12
    paddingVertical: 12, // Increased from 8
    borderRadius: 20, // Increased from 16
    marginRight: 12,
    marginBottom: 12, // Added bottom margin for vertical spacing between rows
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2}, // Slightly more pronounced shadow
    shadowOpacity: 0.1, // Increased from 0.05
    shadowRadius: 4, // Increased from 1
    elevation: 2, // Increased from 1
  },
  suggestionText: {
    fontSize: 16, // Increased from 14
    fontWeight: '500', // Added font weight for better visibility
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  searchResultIndex: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchResultUrl: {
    fontSize: 12,
    color: 'blue',
  },
  searchResultSnippet: {
    fontSize: 12,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    margin: 3,
  },
  loadingBubbleBorder: {
    borderWidth: 1,
  },
  footerSpacer: {
    height: 40,
  },
  headerAnimatedWrapper: {
    marginRight: 8,
  },
  headerIconImage: {
    width: 18,
    height: 18,
    tintColor: 'white',
  },
  headerButtonMargin: {
    marginRight: 12,
  },
  modeToggleText: {
    fontSize: 14,
    marginRight: 8,
  },
  inputMarginTop: {
    marginTop: 10,
  },
  inputBorderTop: {
    borderTopWidth: 1,
  },
  positionRelative: {
    position: 'relative',
  },
  sendGlowEffect: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    transform: [{translateX: -7.5}, {translateY: -7.5}],
    zIndex: -1,
  },
  sendIconOffset: {
    transform: [{translateX: -1}],
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  flexRow: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  taskSelectedTextDark: {
    color: 'white',
  },
  taskSelectedTextLight: {
    color: 'black',
  },
  taskPlaceholderTextDark: {
    color: '#888888',
  },
  taskPlaceholderTextLight: {
    color: '#666666',
  },
  userSearchResultIndex: {
    color: 'rgba(255,255,255,0.8)',
  },
  userSearchResultUrl: {
    color: 'rgba(255,255,255,0.6)',
  },
  userSearchResultSnippet: {
    color: 'rgba(255,255,255,0.8)',
  },
  inputContainerDark: {
    backgroundColor: 'rgba(20, 30, 48, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 39, 64, 0.8)',
  },
  inputContainerLight: {
    backgroundColor: 'rgba(230, 240, 255, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(218, 234, 255, 0.8)',
  },
  inputWrapperDark: {
    backgroundColor: 'rgba(15, 25, 40, 0.7)',
    borderColor: 'rgba(36, 54, 86, 0.7)',
  },
  inputWrapperLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderColor: 'rgba(199, 221, 255, 0.7)',
  },
  glowAgent: {
    backgroundColor: '#3E7BFA',
  },
  glowChat: {
    backgroundColor: '#FF375F',
  },
  sendButtonShadowBase: {
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 8,
    elevation: 5,
  },
  // HistoryDrawer styles
  historyBackdropDark: {
    backgroundColor: 'rgba(10, 20, 35, 0.7)',
  },
  historyBackdropLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  historyDrawerDark: {
    backgroundColor: '#121C2E',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  historyDrawerLight: {
    backgroundColor: '#F5F9FF',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  historyHeaderCustom: {
    borderBottomWidth: 0,
    paddingVertical: 18,
    borderTopLeftRadius: 16,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyTitleCustom: {
    fontSize: 20,
    fontWeight: '600',
  },
  historyTitleDark: {
    color: '#FFFFFF',
  },
  historyTitleLight: {
    color: '#16213E',
  },
  historyCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyCloseButtonDark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  historyCloseButtonLight: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  historyItemSpacing: {
    marginHorizontal: 8,
    marginVertical: 4,
  },
  historyItemBorderDark: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  historyItemActiveDark: {
    backgroundColor: 'rgba(62, 123, 250, 0.2)',
    borderRadius: 12,
    padding: 14,
  },
  historyItemActiveLight: {
    backgroundColor: 'rgba(62, 123, 250, 0.1)',
    borderRadius: 12,
    padding: 14,
  },
  historyItemInactiveDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 14,
  },
  historyItemInactiveLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 14,
  },
  historyItemActiveBorder: {
    borderLeftWidth: 3,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowColor: '#3E7BFA',
  },
  historyItemInactiveBorder: {
    borderLeftWidth: 0,
    shadowColor: 'transparent',
  },
  historyItemBorderAgent: {
    borderLeftColor: '#3E7BFA',
  },
  historyItemBorderChat: {
    borderLeftColor: '#FF375F',
  },
  historyItemDateDark: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  historyItemDateLight: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 12,
  },
  historyItemDateActive: {
    fontWeight: '500',
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  historyItemPreviewCustom: {
    fontSize: 14,
    marginTop: 6,
  },
  historyPreviewDark: {
    color: '#E0E0E0',
  },
  historyPreviewLight: {
    color: '#16213E',
  },
  historyPreviewActive: {
    fontWeight: '500',
    opacity: 1,
  },
  historyPreviewInactive: {
    fontWeight: 'normal',
    opacity: 0.85,
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  historyIconMargin: {
    marginRight: 4,
  },
  historyItemCountDark: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  historyItemCountLight: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 12,
  },
  deleteButton: {
    borderRadius: 22,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  deleteButtonDark: {
    backgroundColor: 'rgba(28, 39, 57, 0.8)',
  },
  deleteButtonLight: {
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
  },
  historyListPadding: {
    padding: 12,
    paddingTop: 16,
  },
  emptyHistoryCustom: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 30,
  },
  emptyHistoryIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyHistoryTitleDark: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyHistoryTitleLight: {
    color: '#16213E',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyHistorySubtextDark: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: '80%',
  },
  emptyHistorySubtextLight: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: '80%',
  },
  newConversationGradient: {
    margin: 16,
    borderRadius: 14,
    shadowColor: '#3E7BFA',
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 8,
    elevation: 5,
  },
  newConversationShadowDark: {
    shadowOpacity: 0.4,
  },
  newConversationShadowLight: {
    shadowOpacity: 0.3,
  },
  newConversationButton: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  newConversationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  newConversationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 20,
  },
  suggestionsContainerBorderDark: {
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  suggestionsContainerBorderLight: {
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  suggestionChipDark: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    borderColor: 'rgba(62, 123, 250, 0.3)',
  },
  suggestionChipLight: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
});
