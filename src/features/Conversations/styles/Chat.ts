import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#2379C2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextMenu: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  deleteMenuItem: {
    borderBottomWidth: 0,
  },
  contextMenuText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  editContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeEditButton: {
    padding: 4,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
    maxHeight: 120,
    backgroundColor: '#f9f9f9',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#2379C2',
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    padding: 8,
    overflow: 'scroll',
    flexWrap: 'wrap',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#f5f5f5',
    width: '100%',
  },
  darkSuggestionsContainer: {
    backgroundColor: '#222',
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  suggestionButton: {
    backgroundColor: '#e1efff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 4,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#c7e0ff',
  },
  darkSuggestionButton: {
    backgroundColor: '#293b59',
    borderColor: '#3c5075',
  },
  suggestionText: {
    color: '#2379C2',
    fontSize: 14,
  },
  darkSuggestionText: {
    color: '#8ab4f8',
  },
  disabledSendButton: {
    backgroundColor: '#e0e0e0',
  },
  suggestionsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    justifyContent: 'center',
  },
  suggestionsLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2379C2',
  },
  suggestionToggleButton: {
    padding: 8,
    borderRadius: 20,
    marginRight: 4,
    backgroundColor: '#f0f0f0',
  },
  darkSuggestionToggleButton: {
    backgroundColor: '#444',
  },
  suggestionToggleButtonActive: {
    backgroundColor: '#e1efff',
  },
  darkSuggestionToggleButtonActive: {
    backgroundColor: '#293b59',
  },

  // ─── MessageItem themed variants ───────────────────────────────────────────
  myMessageBubble: {
    backgroundColor: '#2379C2',
  },
  darkTheirMessageBubble: {
    backgroundColor: '#333',
  },
  lightTheirMessageBubble: {
    backgroundColor: '#f0f0f0',
  },
  myAvatarBg: {
    backgroundColor: '#2379C2',
  },
  myMessageText: {
    color: 'white',
  },
  darkTheirMessageText: {
    color: 'white',
  },
  lightTheirMessageText: {
    color: 'black',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  darkTheirMessageTime: {
    color: 'rgba(255,255,255,0.5)',
  },
  lightTheirMessageTime: {
    color: 'rgba(0,0,0,0.5)',
  },

  // ─── ChatInputBar themed variants ──────────────────────────────────────────
  darkInputContainer: {
    backgroundColor: '#333',
  },
  darkInput: {
    backgroundColor: '#222',
    color: 'white',
    borderColor: '#444',
  },
  darkInactiveSendButton: {
    backgroundColor: '#333',
  },
  lightInactiveSendButton: {
    backgroundColor: '#e0e0e0',
  },

  // ─── EditMessageInput themed variants ──────────────────────────────────────
  darkEditContainer: {
    backgroundColor: '#333',
  },
  darkEditHeaderText: {
    color: 'white',
  },
  darkEditInput: {
    backgroundColor: '#222',
    color: 'white',
    borderColor: '#444',
  },

  // ─── MessageContextMenu themed variants ────────────────────────────────────
  darkContextMenu: {
    backgroundColor: '#333',
  },
  darkContextMenuText: {
    color: '#fff',
  },
  deleteMenuText: {
    color: '#ff3b30',
  },

  // ─── MessageSuggestions themed variant ─────────────────────────────────────
  darkSuggestionsLoadingText: {
    color: '#8ab4f8',
  },

  // ─── Chat screen container themed variants ─────────────────────────────────
  darkChatContainer: {
    backgroundColor: '#1a1a1a',
  },
  lightChatContainer: {
    backgroundColor: '#f9f9f9',
  },
});
