import {LexAIMessage, LexAIConversation, LexAIMode} from 'lex-ai/types/lexAITypes';

/**
 * Search result from web search
 */
export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
}

/**
 * Extended LexAIMessage type that includes links for search results
 */
export interface LexAIMessageWithLinks extends LexAIMessage {
  links?: SearchResult[];
}

/**
 * Root state type for Redux store
 */
export interface RootState {
  lexAI: {
    conversations: Record<string, LexAIConversation>;
    activeConversationId: string | null;
    mode: LexAIMode;
  };
  user: {
    theme: 'light' | 'dark' | 'system';
  };
}

/**
 * Theme colors interface
 */
export interface ThemeColors {
  background: string;
  cardBackground: string;
  text: string;
  subtext: string;
  border: string;
  inputBorder: string;
  primary: string;
  secondary: string;
  accent: string;
  placeholder: string;
  button: string;
  userBubble: string;
  aiBubble: string;
  userText: string;
  aiText: string;
  inputBackground: string;
  controlsBackground: string;
}

/**
 * Tool call interface
 */
export interface ToolCall {
  id?: string;
  toolName: string;
  parameters: Record<string, any>;
}

/**
 * History item animation state
 */
export interface HistoryItemAnimation {
  scale: any; // Animated.Value
  opacity: any; // Animated.Value
  translateX: any; // Animated.Value
}

/**
 * Chat state interface
 */
export interface ChatState {
  conversation: LexAIConversation | null;
  inputMessage: string;
  isLoading: boolean;
  isStreaming: boolean;
  showSuggestions: boolean;
  showHistory: boolean;
  allConversations: LexAIConversation[];
  userName: string;
}
