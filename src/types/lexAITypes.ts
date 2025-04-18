import {Task} from './taskTypes';

// Types for LexAI operational modes
export enum LexAIMode {
  AGENT = 'agent',
  SIMPLE_CHAT = 'simple_chat',
}

// Types for messages exchanged with the AI
export interface LexAIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// Types for conversations with the AI
export interface LexAIConversation {
  id: string;
  title: string;
  messages: LexAIMessage[];
  createdAt: number;
  updatedAt: number;
  mode: LexAIMode; // Track which mode the conversation is using
}

// Types for AI functions/tools
export interface LexAITool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

// Types for tool calls
export interface LexAIToolCall {
  id: string;
  toolName: string;
  parameters: Record<string, any>;
  response?: any;
  error?: string;
}

// Types for AI response
export interface LexAIResponse {
  message?: LexAIMessage;
  toolCalls?: LexAIToolCall[];
}

// Types for web search result
export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

// Types for LexAI personality
export interface LexAIPersonality {
  id: string;
  name: string;
  traits: string[];
  description?: string;
}

// Predefined personalities
export const PERSONALITIES = {
  SUPPORTIVE_COACH: {
    id: 'supportive_coach',
    name: 'Supportive Coach',
    traits: ['encouraging', 'positive', 'motivating'],
    description:
      'Encourages users with positive language and provides constructive guidance.',
  },
  WISE_MENTOR: {
    id: 'wise_mentor',
    name: 'Wise Mentor',
    traits: ['thoughtful', 'patient', 'insightful'],
    description:
      'Shares thoughtful insights and patient explanations, occasionally using metaphors.',
  },
  CURIOUS_EXPLORER: {
    id: 'curious_explorer',
    name: 'Curious Explorer',
    traits: ['curious', 'excited', 'wonder-filled'],
    description:
      'Approaches problems with excitement and wonder, asking thought-provoking questions.',
  },
  EFFICIENT_ASSISTANT: {
    id: 'efficient_assistant',
    name: 'Efficient Assistant',
    traits: ['direct', 'concise', 'practical'],
    description:
      'Provides direct, concise responses and prioritizes efficiency.',
  },
  FRIENDLY_COMPANION: {
    id: 'friendly_companion',
    name: 'Friendly Companion',
    traits: ['casual', 'conversational', 'humorous'],
    description:
      'Uses a casual tone with occasional humor, making learning feel like talking with a friend.',
  },
  TECH_ENTHUSIAST: {
    id: 'tech_enthusiast',
    name: 'Tech Enthusiast',
    traits: ['tech-savvy', 'innovative', 'excited'],
    description:
      'Shows excitement about technology and connects learning to real-world tech applications.',
  },
};

// Types for LexAI state
export interface LexAIState {
  conversations: LexAIConversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  personality: LexAIPersonality;
  mode: LexAIMode; // Current mode of LexAI
  showSuggestions: boolean;
}
