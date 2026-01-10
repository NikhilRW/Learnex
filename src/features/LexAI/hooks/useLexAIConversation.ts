import {useState, useEffect, useCallback, RefObject} from 'react';
import {Alert} from 'react-native';
import {useDispatch} from 'react-redux';
import {
  LexAIConversation,
  LexAIMessage,
  LexAIMode,
} from 'lex-ai/types/lexAITypes';
import LexAIService from 'shared/services/LexAIService';
import LexAIFirestoreService from 'lex-ai/services/LexAIFirestoreService';
import {setLexAIMode, setActiveConversation} from 'lex-ai/reducers/LexAI';
import {DispatchType} from 'shared/store/store';
import {generateUUID, logDebug} from 'lex-ai/utils/common';
import {UseLexAIAnimationsReturn} from './useLexAIAnimations';

export interface UseLexAIConversationParams {
  currentMode: LexAIMode;
  animations: UseLexAIAnimationsReturn;
  flatListRef: RefObject<any>;
}

export interface UseLexAIConversationReturn {
  conversation: LexAIConversation | null;
  setConversation: React.Dispatch<
    React.SetStateAction<LexAIConversation | null>
  >;
  allConversations: LexAIConversation[];
  setAllConversations: React.Dispatch<
    React.SetStateAction<LexAIConversation[]>
  >;
  showHistory: boolean;
  toggleMode: () => Promise<void>;
  handleClearConversation: () => Promise<void>;
  handleSelectConversation: (
    selectedConversation: LexAIConversation,
  ) => Promise<void>;
  handleDeleteConversation: (
    conversationToDelete: LexAIConversation,
  ) => Promise<void>;
  handleShowHistory: () => void;
  handleHideHistory: () => void;
}

export const useLexAIConversation = ({
  currentMode,
  animations,
  flatListRef,
}: UseLexAIConversationParams): UseLexAIConversationReturn => {
  const dispatch = useDispatch<DispatchType>();

  const [conversation, setConversation] = useState<LexAIConversation | null>(
    null,
  );
  const [allConversations, setAllConversations] = useState<LexAIConversation[]>(
    [],
  );
  const [showHistory, setShowHistory] = useState(false);

  // Local scroll to end helper
  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      flatListRef?.current?.scrollToEnd({animated: true});
    }, 100);
  }, [flatListRef]);

  // Initialize conversation
  useEffect(() => {
    logDebug('Initializing LexAI component');

    const initializeConversation = async () => {
      try {
        logDebug('Loading active conversation ID from Firestore');
        const activeConvId =
          await LexAIFirestoreService.getActiveConversationId();
        logDebug('Active conversation ID:', activeConvId);

        if (activeConvId) {
          logDebug('Found active conversation ID, trying to load it directly');
          const existingConv = await LexAIService.getConversation(activeConvId);

          if (existingConv) {
            logDebug('Found existing conversation, setting as active', {
              id: existingConv.id,
            });
            setConversation(existingConv);
            dispatch(setLexAIMode(existingConv.mode));
            return;
          } else {
            logDebug('Active conversation not found in Firestore');
          }
        }

        logDebug('Loading all conversations to find most recent');
        const conversations = await LexAIService.loadConversations();

        if (conversations.length > 0) {
          const mostRecent = conversations[0];
          logDebug('Found recent conversation, setting as active', {
            id: mostRecent.id,
          });
          setConversation(mostRecent);
          dispatch(setLexAIMode(mostRecent.mode));
          dispatch(setActiveConversation(mostRecent.id));
          return;
        }

        logDebug('Creating new conversation');
        const newConversation = LexAIService.initConversation(
          'New Conversation',
          currentMode,
        );
        logDebug('New conversation created', {
          id: newConversation.id,
          mode: newConversation.mode,
        });

        setConversation(newConversation);
        await LexAIService.saveConversation(newConversation);
        dispatch(setActiveConversation(newConversation.id));
      } catch (error) {
        console.error('Error initializing conversation:', error);
        const newConversation = LexAIService.initConversation(
          'New Conversation',
          currentMode,
        );
        setConversation(newConversation);
        await LexAIService.saveConversation(newConversation);
        dispatch(setActiveConversation(newConversation.id));
      }
    };

    initializeConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Load all conversations for history
  useEffect(() => {
    const loadAllConversations = async () => {
      try {
        logDebug('Loading all conversations for history');
        const conversations = await LexAIService.loadConversations().catch(
          err => {
            logDebug('Error in loadConversations', {error: String(err)});
            return [];
          },
        );

        if (!Array.isArray(conversations)) {
          logDebug('Conversations is not an array', {
            type: typeof conversations,
          });
          setAllConversations([]);
          return;
        }

        const sortedConversations = conversations.sort(
          (a, b) => b.updatedAt - a.updatedAt,
        );
        setAllConversations(sortedConversations);
        logDebug(`Loaded ${conversations.length} conversations for history`);
      } catch (error: any) {
        logDebug('Error loading conversations history', {
          error: error?.message || String(error),
        });
        console.error('Error loading conversations history:', error);
        setAllConversations([]);
      }
    };

    loadAllConversations();
  }, [conversation]);

  // Toggle between agent and simple chat modes
  const toggleMode = useCallback(async () => {
    const newMode =
      currentMode === LexAIMode.AGENT ? LexAIMode.SIMPLE_CHAT : LexAIMode.AGENT;
    logDebug(`Toggling mode from ${currentMode} to ${newMode}`);

    dispatch(setLexAIMode(newMode));

    if (!conversation) {
      logDebug('No active conversation, creating new one with new mode');
      const newConversation = LexAIService.initConversation(
        'New Conversation',
        newMode,
      );
      setConversation(newConversation);
      await LexAIService.saveConversation(newConversation);
      dispatch(setActiveConversation(newConversation.id));
    } else {
      logDebug('Updating existing conversation mode', {id: conversation.id});
      const updatedConversation = {
        ...conversation,
        mode: newMode,
      };
      setConversation(updatedConversation);
      await LexAIService.saveConversation(updatedConversation);

      const transitionMessage: LexAIMessage = {
        id: generateUUID(),
        role: 'assistant',
        content:
          newMode === LexAIMode.AGENT
            ? "I've switched to Agent Mode. I can now help you with tasks, navigation, and more."
            : "I've switched to Simple Chat Mode. I'll focus on conversation and answering questions.",
        timestamp: Date.now(),
      };

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, transitionMessage],
        updatedAt: Date.now(),
      };

      setConversation(finalConversation);
      await LexAIService.saveConversation(finalConversation);
      logDebug('Mode transition complete, added transition message');

      scrollToEnd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation, currentMode, dispatch, scrollToEnd]);

  // Show history drawer with animation
  const handleShowHistory = useCallback(() => {
    animations.handleShowHistory(setShowHistory);
  }, [animations]);

  // Hide history drawer with animation
  const handleHideHistory = useCallback(() => {
    animations.handleHideHistory(setShowHistory);
  }, [animations]);

  // Clear conversation
  const handleClearConversation = useCallback(async () => {
    logDebug('Clearing conversation');
    const newConversation = LexAIService.initConversation(
      'New Conversation',
      currentMode,
    );
    logDebug('Created new conversation', {id: newConversation.id});

    setConversation(newConversation);
    await LexAIService.saveConversation(newConversation);
    dispatch(setActiveConversation(newConversation.id));
  }, [currentMode, dispatch]);

  // Switch to a different conversation
  const handleSelectConversation = useCallback(
    async (selectedConversation: LexAIConversation) => {
      if (selectedConversation.id === conversation?.id) {
        handleHideHistory();
        return;
      }

      logDebug('Switching to different conversation', {
        from: conversation?.id,
        to: selectedConversation.id,
      });

      setConversation(selectedConversation);
      dispatch(setActiveConversation(selectedConversation.id));

      if (selectedConversation.mode !== currentMode) {
        dispatch(setLexAIMode(selectedConversation.mode));
      }

      handleHideHistory();

      setTimeout(() => {
        flatListRef?.current?.scrollToEnd({animated: false});
      }, 100);
    },
    [conversation?.id, currentMode, dispatch, flatListRef, handleHideHistory],
  );

  // Delete a conversation
  const handleDeleteConversation = useCallback(
    async (conversationToDelete: LexAIConversation) => {
      Alert.alert(
        'Delete Conversation',
        'Are you sure you want to delete this conversation?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                logDebug('Deleting conversation', {
                  id: conversationToDelete.id,
                });

                await LexAIService.deleteConversation(conversationToDelete.id);

                setAllConversations(prev =>
                  prev.filter(c => c.id !== conversationToDelete.id),
                );

                if (conversationToDelete.id === conversation?.id) {
                  const newConversation = LexAIService.initConversation();
                  setConversation(newConversation);
                  await LexAIService.saveConversation(newConversation);
                  dispatch(setActiveConversation(newConversation.id));
                }

                logDebug('Conversation deleted successfully');
              } catch (error) {
                logDebug('Error deleting conversation', {error});
                console.error('Error deleting conversation:', error);
              }
            },
          },
        ],
        {cancelable: true},
      );
    },
    [conversation?.id, dispatch],
  );

  return {
    conversation,
    setConversation,
    allConversations,
    setAllConversations,
    showHistory,
    toggleMode,
    handleClearConversation,
    handleSelectConversation,
    handleDeleteConversation,
    handleShowHistory,
    handleHideHistory,
  };
};
