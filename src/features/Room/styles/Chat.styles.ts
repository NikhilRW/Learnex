import { width } from "@/shared/constants/style";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: width * 0.3,
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
    borderLeftColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  darkText: {
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  messageList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007cb5',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: '#f0f0f0',
    maxWidth: '60%',
    opacity: 0.8,
  },
  darkSystemMessage: {
    backgroundColor: '#2a2a2a',
  },
  darkOwnMessage: {
    backgroundColor: '#0099e5',
  },
  darkOtherMessage: {
    backgroundColor: '#2a2a2a',
  },
  senderName: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#000000',
  },
  systemMessageText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  ownMessageText: {
    color: '#ffffff',
  },
  timestamp: {
    fontSize: 10,
    color: '#666666',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  darkTimestamp: {
    color: '#888888',
  },
  inputArea: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  darkTextInput: {
    borderColor: '#333333',
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007cb5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: '#cccccc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#000000',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    marginTop: 8,
    textAlign: 'center',
  },
  darkErrorText: {
    color: '#ff6b6b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextMenu: {
    width: 200,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  darkContextMenu: {
    backgroundColor: '#333333',
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  deleteMenuItem: {
    borderBottomWidth: 0,
  },
  contextMenuText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333333',
  },
  deleteText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#ff3b30',
  },
  editContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  darkEditContainer: {
    backgroundColor: '#333333',
    borderTopColor: '#444444',
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
    color: '#000000',
  },
  closeEditButton: {
    padding: 4,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#000000',
    minHeight: 60,
    maxHeight: 120,
    backgroundColor: '#f9f9f9',
  },
  darkEditInput: {
    backgroundColor: '#222222',
    color: '#ffffff',
    borderColor: '#444444',
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
    backgroundColor: '#007cb5',
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
