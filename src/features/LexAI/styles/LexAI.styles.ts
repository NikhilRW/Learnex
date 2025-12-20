import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    width:"100%",
    height:"100%",
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
});
