import {SCREEN_WIDTH} from 'shared/constants/common';
import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: Math.min(SCREEN_WIDTH * 0.075, 28),
    fontWeight: '700',
  },
  newMessageButtonSmall: {
    backgroundColor: '#2379C2',
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newMessageButton: {
    backgroundColor: '#2379C2',
    width: 200,
    height: 40,
    padding: 5,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newMessageButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  searchContainer: {
    paddingTop: 5,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  searchInputContainer: {
    borderRadius: 25,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  avatar: {
    marginRight: 12,
  },
  conversationDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    marginLeft: 8,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessageText: {
    fontSize: 14,
    flex: 1,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: '#2379C2',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
  },
  // Add new styles for swipe delete feature
  rowBack: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 15,
    borderRadius: 12,
    marginTop: 8,
    height: '100%',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 75,
    height: '85%',
    backgroundColor: '#F44336',
    borderRadius: 12,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },

  // ─── Themed variants for dynamic styling ───────────────────────────────────
  darkContainer: {
    backgroundColor: '#1a1a1a',
    paddingTop: 10,
  },
  lightContainer: {
    backgroundColor: 'white',
    paddingTop: 10,
  },
  darkText: {
    color: 'white',
  },
  lightText: {
    color: 'black',
  },
  darkSearchBackground: {
    backgroundColor: '#1a1a1a',
  },
  lightSearchBackground: {
    backgroundColor: 'white',
  },
  darkSearchInputBackground: {
    backgroundColor: '#333',
  },
  lightSearchInputBackground: {
    backgroundColor: '#f5f5f5',
  },
  darkEmptyText: {
    color: '#aaa',
  },
  lightEmptyText: {
    color: '#888',
  },
  darkEmptySubText: {
    color: '#888',
  },
  lightEmptySubText: {
    color: '#aaa',
  },
  emptyButtonMarginTop: {
    marginTop: 20,
  },
  avatarPlaceholderBg: {
    backgroundColor: '#2379C2',
  },
  darkConversationItem: {
    backgroundColor: '#1a1a1a',
  },
  lightConversationItem: {
    backgroundColor: 'white',
  },
  darkUnreadConversationItem: {
    backgroundColor: '#293b59',
  },
  lightUnreadConversationItem: {
    backgroundColor: '#f0f7ff',
  },
  darkParticipantName: {
    color: 'white',
  },
  lightParticipantName: {
    color: 'black',
  },
  unreadParticipantName: {
    fontWeight: '700',
  },
  darkTimeText: {
    color: '#aaa',
  },
  lightTimeText: {
    color: '#777',
  },
  typingHighlight: {
    color: '#2379C2',
  },
  darkUnreadMessageText: {
    color: 'white',
    fontWeight: '600',
  },
  darkReadMessageText: {
    color: '#bbb',
  },
  lightUnreadMessageText: {
    color: 'black',
    fontWeight: '600',
  },
  lightReadMessageText: {
    color: '#777',
  },
  darkRowBack: {
    backgroundColor: '#331111',
  },
  lightRowBack: {
    backgroundColor: '#ffebee',
  },
});
