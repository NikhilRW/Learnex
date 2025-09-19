import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
  LexAIState,
  LexAIConversation,
  LexAIMessage,
  LexAIPersonality,
  LexAIMode,
  PERSONALITIES,
} from 'lex-ai/types/lexAITypes';
import LexAIService from 'shared/services/LexAIService';
import LexAIFirestoreService from 'lex-ai/services/LexAIFirestoreService';

// Initial state
const initialState: LexAIState = {
  conversations: [],
  activeConversationId: null,
  isLoading: false,
  error: null,
  personality: PERSONALITIES.FRIENDLY_COMPANION,
  mode: LexAIMode.AGENT, // Default to full agent mode
  showSuggestions: true,
};

// Async thunks
export const initializeConversation = createAsyncThunk(
  'lexAI/initializeConversation',
  async (
    {
      title = 'New Conversation',
      mode = LexAIMode.AGENT,
    }: {title?: string; mode?: LexAIMode},
    {rejectWithValue},
  ) => {
    try {
      const conversation = LexAIService.initConversation(title, mode);
      await LexAIService.saveConversation(conversation);
      await LexAIFirestoreService.setActiveConversationId(conversation.id);
      return conversation;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const loadConversations = createAsyncThunk(
  'lexAI/loadConversations',
  async (_, {rejectWithValue}) => {
    try {
      const conversations = await LexAIService.loadConversations();
      const activeConversationId =
        await LexAIFirestoreService.getActiveConversationId();
      return {conversations, activeConversationId};
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const sendMessage = createAsyncThunk(
  'lexAI/sendMessage',
  async (
    {message, conversationId}: {message: string; conversationId: string},
    {getState, rejectWithValue},
  ) => {
    try {
      const state = getState() as {lexAI: LexAIState};
      const conversation = state.lexAI.conversations.find(
        c => c.id === conversationId,
      );

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Add user message
      const userMessage: LexAIMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };

      const updatedConversation: LexAIConversation = {
        ...conversation,
        messages: [...conversation.messages, userMessage],
        updatedAt: Date.now(),
      };

      // Save conversation with user message
      await LexAIService.saveConversation(updatedConversation);

      // Process with AI
      const response = await LexAIService.processMessage(
        message,
        updatedConversation,
      );

      // If we have a response message, add it to the conversation
      if (response.message) {
        const finalConversation: LexAIConversation = {
          ...updatedConversation,
          messages: [...updatedConversation.messages, response.message],
          updatedAt: Date.now(),
        };

        // Save final conversation
        await LexAIService.saveConversation(finalConversation);

        return {
          conversation: finalConversation,
          response,
        };
      }

      return {
        conversation: updatedConversation,
        response,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteConversation = createAsyncThunk(
  'lexAI/deleteConversation',
  async (conversationId: string, {rejectWithValue}) => {
    try {
      await LexAIService.deleteConversation(conversationId);
      return conversationId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const setActiveConversation = createAsyncThunk(
  'lexAI/setActiveConversation',
  async (conversationId: string, {rejectWithValue}) => {
    try {
      await LexAIFirestoreService.setActiveConversationId(conversationId);
      return conversationId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// Slice
const lexAISlice = createSlice({
  name: 'lexAI',
  initialState,
  reducers: {
    setPersonality: (state, action: PayloadAction<LexAIPersonality>) => {
      state.personality = action.payload;
      // Update the service personality
      LexAIService.setPersonality(action.payload);
    },
    setLexAIMode: (state, action: PayloadAction<LexAIMode>) => {
      state.mode = action.payload;
      // Update the service mode
      LexAIService.setMode(action.payload);

      // If there's an active conversation, update its mode as well
      if (state.activeConversationId) {
        const conversationIndex = state.conversations.findIndex(
          c => c.id === state.activeConversationId,
        );
        if (conversationIndex !== -1) {
          state.conversations[conversationIndex].mode = action.payload;
        }
      }
    },
    setShowSuggestions: (state, action: PayloadAction<boolean>) => {
      state.showSuggestions = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Initialize conversation
      .addCase(initializeConversation.pending, state => {
        state.isLoading = true;
      })
      .addCase(initializeConversation.fulfilled, (state, action) => {
        state.conversations.push(action.payload);
        state.activeConversationId = action.payload.id;
        state.isLoading = false;
      })
      .addCase(initializeConversation.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })

      // Load conversations
      .addCase(loadConversations.pending, state => {
        state.isLoading = true;
      })
      .addCase(loadConversations.fulfilled, (state, action) => {
        state.conversations = action.payload.conversations;
        state.activeConversationId = action.payload.activeConversationId;
        state.isLoading = false;
      })
      .addCase(loadConversations.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })

      // Send message
      .addCase(sendMessage.pending, state => {
        state.isLoading = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const {conversation} = action.payload;
        const conversationIndex = state.conversations.findIndex(
          c => c.id === conversation.id,
        );

        if (conversationIndex !== -1) {
          state.conversations[conversationIndex] = conversation;
        }

        state.isLoading = false;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })

      // Delete conversation
      .addCase(deleteConversation.pending, state => {
        state.isLoading = true;
      })
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter(
          c => c.id !== action.payload,
        );

        // If the active conversation was deleted, set the most recent one as active
        if (
          state.activeConversationId === action.payload &&
          state.conversations.length > 0
        ) {
          const sortedConversations = [...state.conversations].sort(
            (a, b) => b.updatedAt - a.updatedAt,
          );
          state.activeConversationId = sortedConversations[0].id;
        } else if (state.conversations.length === 0) {
          state.activeConversationId = null;
        }

        state.isLoading = false;
      })
      .addCase(deleteConversation.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })

      // Set active conversation
      .addCase(setActiveConversation.pending, state => {
        state.isLoading = true;
      })
      .addCase(setActiveConversation.fulfilled, (state, action) => {
        state.activeConversationId = action.payload;
        // Set the mode to match the active conversation's mode
        const conversation = state.conversations.find(
          c => c.id === action.payload,
        );
        if (conversation) {
          state.mode = conversation.mode;
        }
        state.isLoading = false;
      })
      .addCase(setActiveConversation.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });
  },
});

// Export actions and reducer
export const {setPersonality, setLexAIMode, setShowSuggestions, clearError} =
  lexAISlice.actions;

export default lexAISlice.reducer;
