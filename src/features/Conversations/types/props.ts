import {Message} from '../models/Message';
import {MessageService} from '../services/MessageService';
import {ChatNavigationObjectType} from './main';

export interface ChatHeaderLeftProps {
  isDark: boolean;
  currentRecipientPhoto: string;
  recipientName: string;
  navigation: ChatNavigationObjectType;
}

export interface ChatHeaderRightProps {
  isMuted: boolean;
  isDark: boolean;
  toggleNotifications: () => void;
  navigation: ChatNavigationObjectType;
  messageService: MessageService;
  conversationId: string;
}

export interface ContactUser {
  id: string;
  username: string;
  fullName: string;
  image?: string;
  lastSeen?: number;
}

export interface MessageItemProps {
  item: Message;
  isDark: boolean;
  currentUserId: string;
  onLongPress: (message: Message) => void;
}

export interface ChatInputBarProps {
  isDark: boolean;
  newMessage: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  sending: boolean;
  showSuggestions: boolean;
  onRequestSuggestions: () => void;
  hasMessages: boolean;
}

export interface EditMessageInputProps {
  isDark: boolean;
  editText: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export interface MessageSuggestionsProps {
  isDark: boolean;
  suggestions: string[];
  isFetchingSuggestions: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

export interface LoadingOverlayProps {
  isDark: boolean;
}

export interface MessageContextMenuProps {
  visible: boolean;
  isDark: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
