import lexAIReducer, {
  setPersonality,
  setLexAIMode,
  setShowSuggestions,
  clearError,
  initializeConversation,
  loadConversations,
  sendMessage,
  deleteConversation,
  setActiveConversation,
} from '../../../../src/features/LexAI/reducers/LexAI';
import {
  LexAIMode,
  PERSONALITIES,
} from '../../../../src/features/LexAI/types/lexAITypes';
import {configureStore} from '@reduxjs/toolkit';

// Mock services
jest.mock('../../../../src/shared/services/LexAIService', () => ({
  __esModule: true,
  default: {
    initConversation: jest.fn(),
    saveConversation: jest.fn(),
    loadConversations: jest.fn(),
    processMessage: jest.fn(),
    deleteConversation: jest.fn(),
    setPersonality: jest.fn(),
    setMode: jest.fn(),
  },
}));

jest.mock(
  '../../../../src/features/LexAI/services/LexAIFirestoreService',
  () => ({
    __esModule: true,
    default: {
      setActiveConversationId: jest.fn(),
      getActiveConversationId: jest.fn(),
    },
  }),
);

const initialState = {
  conversations: [],
  activeConversationId: null,
  isLoading: false,
  error: null,
  personality: PERSONALITIES.FRIENDLY_COMPANION,
  mode: LexAIMode.AGENT,
  showSuggestions: true,
};

import LexAIService from '../../../../src/shared/services/LexAIService';
import LexAIFirestoreService from '../../../../src/features/LexAI/services/LexAIFirestoreService';

describe('LexAI Reducer', () => {
  const initialState = {
    conversations: [],
    activeConversationId: null,
    isLoading: false,
    error: null,
    personality: PERSONALITIES.FRIENDLY_COMPANION,
    mode: LexAIMode.AGENT,
    showSuggestions: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial state', () => {
    expect(lexAIReducer(undefined, {type: 'unknown'})).toEqual(initialState);
  });

  describe('Synchronous Actions', () => {
    it('should handle setPersonality', () => {
      const newPersonality = PERSONALITIES.PROFESSIONAL_MENTOR;
      const actual = lexAIReducer(initialState, setPersonality(newPersonality));

      expect(actual.personality).toEqual(newPersonality);
      expect(LexAIService.setPersonality).toHaveBeenCalledWith(newPersonality);
    });

    it('should handle setLexAIMode', () => {
      const actual = lexAIReducer(
        initialState,
        setLexAIMode(LexAIMode.SIMPLE_CHAT),
      );

      expect(actual.mode).toEqual(LexAIMode.SIMPLE_CHAT);
      expect(LexAIService.setMode).toHaveBeenCalledWith(LexAIMode.SIMPLE_CHAT);
    });

    it('should update conversation mode when setting mode with active conversation', () => {
      const stateWithConversation = {
        ...initialState,
        conversations: [
          {
            id: 'conv1',
            mode: LexAIMode.AGENT,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            title: 'Test',
          },
        ],
        activeConversationId: 'conv1',
      };

      const actual = lexAIReducer(
        stateWithConversation,
        setLexAIMode(LexAIMode.SIMPLE_CHAT),
      );

      expect(actual.conversations[0].mode).toEqual(LexAIMode.SIMPLE_CHAT);
    });

    it('should not update mode when no active conversation exists', () => {
      const actual = lexAIReducer(
        initialState,
        setLexAIMode(LexAIMode.SIMPLE_CHAT),
      );

      expect(actual.mode).toEqual(LexAIMode.SIMPLE_CHAT);
      expect(actual.conversations).toHaveLength(0);
    });

    it('should not update non-active conversation modes', () => {
      const stateWithMultipleConversations = {
        ...initialState,
        conversations: [
          {
            id: 'conv1',
            mode: LexAIMode.AGENT,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            title: 'Test 1',
          },
          {
            id: 'conv2',
            mode: LexAIMode.SIMPLE_CHAT,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            title: 'Test 2',
          },
        ],
        activeConversationId: 'conv1',
      };

      const actual = lexAIReducer(
        stateWithMultipleConversations,
        setLexAIMode(LexAIMode.SIMPLE_CHAT),
      );

      expect(actual.conversations[0].mode).toEqual(LexAIMode.SIMPLE_CHAT); // Active one updated
      expect(actual.conversations[1].mode).toEqual(LexAIMode.SIMPLE_CHAT); // Inactive unchanged
    });

    it('should handle setShowSuggestions', () => {
      const actual = lexAIReducer(initialState, setShowSuggestions(false));
      expect(actual.showSuggestions).toBe(false);
    });

    it('should toggle showSuggestions correctly', () => {
      let state = lexAIReducer(initialState, setShowSuggestions(false));
      expect(state.showSuggestions).toBe(false);

      state = lexAIReducer(state, setShowSuggestions(true));
      expect(state.showSuggestions).toBe(true);
    });

    it('should handle clearError', () => {
      const stateWithError = {...initialState, error: 'Test error'};
      const actual = lexAIReducer(stateWithError, clearError());
      expect(actual.error).toBeNull();
    });
  });

  describe('initializeConversation', () => {
    it('should handle pending state', () => {
      const action = {type: initializeConversation.pending.type};
      const actual = lexAIReducer(initialState, action);

      expect(actual.isLoading).toBe(true);
    });

    it('should handle fulfilled state', () => {
      const mockConversation = {
        id: 'conv1',
        title: 'New SIMPLE_CHAT',
        mode: LexAIMode.AGENT,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const action = {
        type: initializeConversation.fulfilled.type,
        payload: mockConversation,
      };

      const actual = lexAIReducer(initialState, action);

      expect(actual.isLoading).toBe(false);
      expect(actual.conversations).toHaveLength(1);
      expect(actual.conversations[0]).toEqual(mockConversation);
      expect(actual.activeConversationId).toBe('conv1');
    });

    it('should handle rejected state', () => {
      const action = {
        type: initializeConversation.rejected.type,
        payload: 'Failed to initialize',
      };
      const actual = lexAIReducer(initialState, action);
      expect(actual.isLoading).toBe(false);
      expect(actual.error).toBe('Failed to initialize');
    });

    it('should handle initialization with default parameters', async () => {
      const mockConversation = {
        id: 'conv1',
        title: 'New Conversation',
        mode: LexAIMode.AGENT,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (LexAIService.initConversation as jest.Mock).mockReturnValue(
        mockConversation,
      );
      (LexAIService.saveConversation as jest.Mock).mockResolvedValue(undefined);
      (
        LexAIFirestoreService.setActiveConversationId as jest.Mock
      ).mockResolvedValue(undefined);

      const store = configureStore({reducer: {lexAI: lexAIReducer}});

      await store.dispatch(initializeConversation({}));

      expect(LexAIService.initConversation).toHaveBeenCalled();
    });

    it('should handle save failure during initialization', async () => {
      (LexAIService.initConversation as jest.Mock).mockReturnValue({
        id: 'conv1',
        title: 'Test',
        mode: LexAIMode.AGENT,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      (LexAIService.saveConversation as jest.Mock).mockRejectedValue(
        new Error('Save failed'),
      );

      const store = configureStore({reducer: {lexAI: lexAIReducer}});

      const result = await store.dispatch(
        initializeConversation({title: 'Test'}),
      );

      expect(result.type).toContain('rejected');
      expect(result.payload).toBe('Save failed');
    });
  });

  it('should initialize conversation with custom title and mode', async () => {
    const mockConversation = {
      id: 'conv1',
      title: 'Custom Title',
      mode: LexAIMode.SIMPLE_CHAT,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    (LexAIService.initConversation as jest.Mock).mockReturnValue(
      mockConversation,
    );
    (LexAIService.saveConversation as jest.Mock).mockResolvedValue(undefined);
    (
      LexAIFirestoreService.setActiveConversationId as jest.Mock
    ).mockResolvedValue(undefined);

    const store = configureStore({reducer: {lexAI: lexAIReducer}});

    await store.dispatch(
      initializeConversation({
        title: 'Custom Title',
        mode: LexAIMode.SIMPLE_CHAT,
      }),
    );

    const state = store.getState().lexAI;
    expect(state.activeConversationId).toBe('conv1');
  });

  it('should load conversations with empty list', async () => {
    (LexAIService.loadConversations as jest.Mock).mockResolvedValue([]);
    (
      LexAIFirestoreService.getActiveConversationId as jest.Mock
    ).mockResolvedValue(null);

    const store = configureStore({reducer: {lexAI: lexAIReducer}});

    await store.dispatch(loadConversations());

    const state = store.getState().lexAI;
    expect(state.conversations).toEqual([]);
    expect(state.activeConversationId).toBeNull();
  });

  it('should handle Firestore failure during load', async () => {
    (LexAIService.loadConversations as jest.Mock).mockResolvedValue([]);
    (
      LexAIFirestoreService.getActiveConversationId as jest.Mock
    ).mockRejectedValue(new Error('Firestore error'));

    const store = configureStore({reducer: {lexAI: lexAIReducer}});

    const result = await store.dispatch(loadConversations());

    expect(result.type).toContain('rejected');
  });
});

describe('loadConversations', () => {
  it('should handle pending state', () => {
    const action = {type: loadConversations.pending.type};
    const actual = lexAIReducer(initialState, action);

    expect(actual.isLoading).toBe(true);
  });

  it('should handle fulfilled state', () => {
    const mockConversations = [
      {
        id: 'conv1',
        title: 'SIMPLE_CHAT 1',
        mode: LexAIMode.AGENT,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'conv2',
        title: 'SIMPLE_CHAT 2',
        mode: LexAIMode.SIMPLE_CHAT,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const action = {
      type: loadConversations.fulfilled.type,
      payload: {
        conversations: mockConversations,
        activeConversationId: 'conv1',
      },
    };

    const actual = lexAIReducer(initialState, action);

    expect(actual.isLoading).toBe(false);
    expect(actual.conversations).toEqual(mockConversations);
    expect(actual.activeConversationId).toBe('conv1');
  });

  it('should handle rejected state', () => {
    const action = {
      type: loadConversations.rejected.type,
      payload: 'Failed to load',
    };

    const actual = lexAIReducer(initialState, action);

    expect(actual.isLoading).toBe(false);
    expect(actual.error).toBe('Failed to load');
  });
});

describe('sendMessage', () => {
  it('should reject when conversation not found', async () => {
    const store = configureStore({
      reducer: {lexAI: lexAIReducer},
      preloadedState: {
        lexAI: {
          ...initialState,
          conversations: [
            {
              id: 'conv1',
              title: 'Test',
              mode: LexAIMode.AGENT,
              messages: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        },
      },
    });

    const result = await store.dispatch(
      sendMessage({message: 'Hello', conversationId: 'non-existent'}),
    );

    expect(result.type).toContain('rejected');
    expect(result.payload).toBe('Conversation not found');
  });

  it('should handle message without AI response', async () => {
    const initialConversation = {
      id: 'conv1',
      title: 'Test',
      mode: LexAIMode.AGENT,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    (LexAIService.processMessage as jest.Mock).mockResolvedValue({
      message: null, // No AI response
    });
    (LexAIService.saveConversation as jest.Mock).mockResolvedValue(undefined);

    const store = configureStore({
      reducer: {lexAI: lexAIReducer},
      preloadedState: {
        lexAI: {
          ...initialState,
          conversations: [initialConversation],
        },
      },
    });

    await store.dispatch(
      sendMessage({message: 'Hello', conversationId: 'conv1'}),
    );

    const state = store.getState().lexAI;
    // Should have user message but no AI response
    expect(state.conversations[0].messages.length).toBeGreaterThan(0);
  });

  it('should handle AI processing error', async () => {
    (LexAIService.processMessage as jest.Mock).mockRejectedValue(
      new Error('AI service down'),
    );
    (LexAIService.saveConversation as jest.Mock).mockResolvedValue(undefined);

    const store = configureStore({
      reducer: {lexAI: lexAIReducer},
      preloadedState: {
        lexAI: {
          ...initialState,
          conversations: [
            {
              id: 'conv1',
              title: 'Test',
              mode: LexAIMode.AGENT,
              messages: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        },
      },
    });

    const result = await store.dispatch(
      sendMessage({message: 'Hello', conversationId: 'conv1'}),
    );

    expect(result.type).toContain('rejected');
    expect(result.payload).toBe('AI service down');
  });
});

describe('deleteConversation', () => {
  it('should handle pending state', () => {
    const action = {type: deleteConversation.pending.type};
    const actual = lexAIReducer(initialState, action);

    expect(actual.isLoading).toBe(true);
  });

  it('should handle rejected state', () => {
    const action = {
      type: deleteConversation.rejected.type,
      payload: 'Failed to delete',
    };
    const actual = lexAIReducer(initialState, action);

    expect(actual.isLoading).toBe(false);
    expect(actual.error).toBe('Failed to delete');
  });

  it('should not change active conversation when deleting inactive conversation', () => {
    const stateWithConversations = {
      ...initialState,
      conversations: [
        {
          id: 'conv1',
          title: 'SIMPLE_CHAT 1',
          mode: LexAIMode.AGENT,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'conv2',
          title: 'SIMPLE_CHAT 2',
          mode: LexAIMode.SIMPLE_CHAT,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeConversationId: 'conv1',
    };

    const action = {
      type: deleteConversation.fulfilled.type,
      payload: 'conv2',
    };

    const actual = lexAIReducer(stateWithConversations, action);

    expect(actual.conversations).toHaveLength(1);
    expect(actual.conversations[0].id).toBe('conv1');
    expect(actual.activeConversationId).toBe('conv1'); // Should remain unchanged
  });

  it('should handle deletion of all conversations', () => {
    const stateWithOneConversation = {
      ...initialState,
      conversations: [
        {
          id: 'conv1',
          title: 'Only SIMPLE_CHAT',
          mode: LexAIMode.AGENT,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeConversationId: 'conv1',
    };

    const action = {
      type: deleteConversation.fulfilled.type,
      payload: 'conv1',
    };

    const actual = lexAIReducer(stateWithOneConversation, action);

    expect(actual.conversations).toHaveLength(0);
    expect(actual.activeConversationId).toBeNull();
    expect(actual.isLoading).toBe(false);
    expect(actual.error).toBeNull();
  });

  it('should not update mode when conversation not found', () => {
    const stateWithConversations = {
      ...initialState,
      conversations: [
        {
          id: 'conv1',
          title: 'SIMPLE_CHAT 1',
          mode: LexAIMode.AGENT,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeConversationId: 'conv1',
      mode: LexAIMode.AGENT,
    };

    const action = {
      type: setActiveConversation.fulfilled.type,
      payload: 'non-existent',
    };

    const actual = lexAIReducer(stateWithConversations, action);

    expect(actual.activeConversationId).toBe('non-existent');
    expect(actual.mode).toBe(LexAIMode.AGENT); // Mode should remain unchanged
  });

  it('should sync mode with conversation mode', () => {
    const stateWithConversations = {
      ...initialState,
      conversations: [
        {
          id: 'conv1',
          title: 'Agent SIMPLE_CHAT',
          mode: LexAIMode.AGENT,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'conv2',
          title: 'Simple SIMPLE_CHAT',
          mode: LexAIMode.SIMPLE_CHAT,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeConversationId: 'conv1',
      mode: LexAIMode.AGENT,
    };

    const action = {
      type: setActiveConversation.fulfilled.type,
      payload: 'conv2',
    };

    const actual = lexAIReducer(stateWithConversations, action);

    expect(actual.activeConversationId).toBe('conv2');
    expect(actual.mode).toBe(LexAIMode.SIMPLE_CHAT); // Mode synced with new active conversation
  });
});

describe('Edge Cases & State Integrity', () => {
  it('should handle multiple consecutive actions', () => {
    let state = lexAIReducer(
      initialState,
      setPersonality(PERSONALITIES.PROFESSIONAL_MENTOR),
    );
    state = lexAIReducer(state, setLexAIMode(LexAIMode.SIMPLE_CHAT));
    state = lexAIReducer(state, setShowSuggestions(false));

    expect(state.personality).toEqual(PERSONALITIES.PROFESSIONAL_MENTOR);
    expect(state.mode).toEqual(LexAIMode.SIMPLE_CHAT);
    expect(state.showSuggestions).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should clear error independently of other state', () => {
    const stateWithError = {
      ...initialState,
      error: 'Something went wrong',
      conversations: [
        {
          id: 'conv1',
          title: 'Test',
          mode: LexAIMode.AGENT,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeConversationId: 'conv1',
    };

    const actual = lexAIReducer(stateWithError, clearError());

    expect(actual.error).toBeNull();
    expect(actual.conversations).toHaveLength(1); // Other state unchanged
    expect(actual.activeConversationId).toBe('conv1');
  });

  it('should maintain conversation order during operations', () => {
    const now = Date.now();
    const stateWithConversations = {
      ...initialState,
      conversations: [
        {
          id: 'conv1',
          title: 'First',
          mode: LexAIMode.AGENT,
          messages: [],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'conv2',
          title: 'Second',
          mode: LexAIMode.SIMPLE_CHAT,
          messages: [],
          createdAt: now + 1000,
          updatedAt: now + 1000,
        },
        {
          id: 'conv3',
          title: 'Third',
          mode: LexAIMode.AGENT,
          messages: [],
          createdAt: now + 2000,
          updatedAt: now + 2000,
        },
      ],
    };

    const actual = lexAIReducer(
      stateWithConversations,
      setLexAIMode(LexAIMode.SIMPLE_CHAT),
    );

    expect(actual.conversations[0].title).toBe('First');
    expect(actual.conversations[1].title).toBe('Second');
    expect(actual.conversations[2].title).toBe('Third');
  });

  it('should preserve message history during state updates', () => {
    const stateWithMessages = {
      ...initialState,
      conversations: [
        {
          id: 'conv1',
          title: 'Test',
          mode: LexAIMode.AGENT,
          messages: [
            {
              id: '1',
              role: 'user' as const,
              content: 'Hello',
              timestamp: Date.now(),
            },
            {
              id: '2',
              role: 'assistant' as const,
              content: 'Hi there!',
              timestamp: Date.now(),
            },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      activeConversationId: 'conv1',
    };

    const actual1 = lexAIReducer(
      stateWithMessages,
      setPersonality(PERSONALITIES.CURIOUS_EXPLORER),
    );

    expect(actual1.conversations[0].messages).toHaveLength(2);
    expect(actual1.conversations[0].messages[0].content).toBe('Hello');
    const now = Date.now();
    const stateWithMultipleConversations = {
      ...initialState,
      conversations: [
        {
          id: 'conv1',
          title: 'Old',
          mode: LexAIMode.AGENT,
          messages: [],
          createdAt: now - 3000,
          updatedAt: now - 3000,
        },
        {
          id: 'conv2',
          title: 'Recent',
          mode: LexAIMode.SIMPLE_CHAT,
          messages: [],
          createdAt: now - 1000,
          updatedAt: now - 1000,
        },
        {
          id: 'conv3',
          title: 'Oldest',
          mode: LexAIMode.AGENT,
          messages: [],
          createdAt: now - 5000,
          updatedAt: now - 5000,
        },
      ],
      activeConversationId: 'conv1',
    };

    const action = {
      type: deleteConversation.fulfilled.type,
      payload: 'conv1',
    };

    const actual2 = lexAIReducer(stateWithMultipleConversations, action);

    expect(actual2.conversations).toHaveLength(2);
    expect(actual2.activeConversationId).toBe('conv2'); // Most recent
  });

  describe('sendMessage Edge Cases', () => {
    it('should handle fulfilled state with AI response', () => {
      const stateWithConversation = {
        ...initialState,
        conversations: [
          {
            id: 'conv1',
            title: 'Test',
            mode: LexAIMode.AGENT,
            messages: [{role: 'user', content: 'Hello', timestamp: Date.now()}],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      };

      const updatedConversation = {
        id: 'conv1',
        title: 'Test',
        mode: LexAIMode.AGENT,
        messages: [
          {role: 'user', content: 'Hello', timestamp: Date.now()},
          {role: 'ai', content: 'Hi there!', timestamp: Date.now()},
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const action = {
        type: sendMessage.fulfilled.type,
        payload: {
          conversation: updatedConversation,
          response: {message: updatedConversation.messages[1]},
        },
      };

      const actual = lexAIReducer(stateWithConversation, action);

      expect(actual.isLoading).toBe(false);
      expect(actual.conversations[0].messages).toHaveLength(2);
      expect(actual.conversations[0].messages[0].content).toBe('Hello');
      expect(actual.conversations[0].messages[1].content).toBe('Hi there!');
    });

    it('should handle rejected state', () => {
      const action = {
        type: sendMessage.rejected.type,
        payload: 'Failed to send message',
      };

      const actual = lexAIReducer(initialState, action);

      expect(actual.isLoading).toBe(false);
      expect(actual.error).toBe('Failed to send message');
    });
  });

  describe('deleteConversation', () => {
    it('should handle pending state', () => {
      const action = {type: deleteConversation.pending.type};
      const actual = lexAIReducer(initialState, action);

      expect(actual.isLoading).toBe(true);
    });

    it('should remove conversation and set new active', () => {
      const now = Date.now();
      const stateWithConversations = {
        ...initialState,
        conversations: [
          {
            id: 'conv1',
            title: 'SIMPLE_CHAT 1',
            mode: LexAIMode.AGENT,
            messages: [],
            createdAt: now - 2000,
            updatedAt: now - 2000,
          },
          {
            id: 'conv2',
            title: 'SIMPLE_CHAT 2',
            mode: LexAIMode.SIMPLE_CHAT,
            messages: [],
            createdAt: now - 1000,
            updatedAt: now - 1000,
          },
        ],
        activeConversationId: 'conv1',
      };

      const action = {
        type: deleteConversation.fulfilled.type,
        payload: 'conv1',
      };

      const actual = lexAIReducer(stateWithConversations, action);

      expect(actual.isLoading).toBe(false);
      expect(actual.conversations).toHaveLength(1);
      expect(actual.conversations[0].id).toBe('conv2');
      expect(actual.activeConversationId).toBe('conv2'); // Most recent becomes active
    });

    it('should set activeConversationId to null when deleting last conversation', () => {
      const stateWithOneConversation = {
        ...initialState,
        conversations: [
          {
            id: 'conv1',
            title: 'SIMPLE_CHAT 1',
            mode: LexAIMode.AGENT,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        activeConversationId: 'conv1',
      };

      const action = {
        type: deleteConversation.fulfilled.type,
        payload: 'conv1',
      };

      const actual = lexAIReducer(stateWithOneConversation, action);

      expect(actual.conversations).toHaveLength(0);
      expect(actual.activeConversationId).toBeNull();
    });

    it('should handle rejected state', () => {
      const action = {
        type: deleteConversation.rejected.type,
        payload: 'Failed to delete',
      };

      const actual = lexAIReducer(initialState, action);

      expect(actual.isLoading).toBe(false);
      expect(actual.error).toBe('Failed to delete');
    });
  });

  describe('setActiveConversation', () => {
    it('should handle pending state', () => {
      const action = {type: setActiveConversation.pending.type};
      const actual = lexAIReducer(initialState, action);

      expect(actual.isLoading).toBe(true);
    });

    it('should set active conversation and update mode', () => {
      const stateWithConversations = {
        ...initialState,
        conversations: [
          {
            id: 'conv1',
            title: 'SIMPLE_CHAT 1',
            mode: LexAIMode.AGENT,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: 'conv2',
            title: 'SIMPLE_CHAT 2',
            mode: LexAIMode.SIMPLE_CHAT,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        activeConversationId: 'conv1',
        mode: LexAIMode.AGENT,
      };

      const action = {
        type: setActiveConversation.fulfilled.type,
        payload: 'conv2',
      };

      const actual = lexAIReducer(stateWithConversations, action);

      expect(actual.isLoading).toBe(false);
      expect(actual.activeConversationId).toBe('conv2');
      expect(actual.mode).toBe(LexAIMode.SIMPLE_CHAT); // Mode updated to match conversation
    });

    it('should handle rejected state', () => {
      const action = {
        type: setActiveConversation.rejected.type,
        payload: 'Failed to set active',
      };

      const actual = lexAIReducer(initialState, action);

      expect(actual.isLoading).toBe(false);
      expect(actual.error).toBe('Failed to set active');
    });
  });
});
