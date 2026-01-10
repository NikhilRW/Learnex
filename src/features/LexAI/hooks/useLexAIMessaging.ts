import {useState, useCallback, useEffect} from 'react';
import {Keyboard} from 'react-native';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {useDispatch} from 'react-redux';
import {
  LexAIMessage,
  LexAIConversation,
  LexAIMode,
} from 'lex-ai/types/lexAITypes';
import LexAIService from 'shared/services/LexAIService';
import {setActiveConversation} from 'lex-ai/reducers/LexAI';
import {DispatchType} from 'shared/store/store';
import {generateUUID, logDebug} from 'lex-ai/utils/common';
import {UserStackParamList} from 'shared/navigation/routes/UserStack';
import {
  isDirectSearchCommand,
  isPostSearchRequest,
  extractSearchQuery,
  extractPostSearchQuery,
  isLikelyPostSearch,
} from '../utils/lexAI.utils';

type LexAINavigationProp = DrawerNavigationProp<UserStackParamList>;

export interface UseLexAIMessagingParams {
  conversation: LexAIConversation | null;
  setConversation: React.Dispatch<
    React.SetStateAction<LexAIConversation | null>
  >;
  currentMode: LexAIMode;
  handleToolExecution: (toolCall: any) => Promise<void>;
  scrollToEnd: () => void;
}

export interface UseLexAIMessagingReturn {
  inputMessage: string;
  setInputMessage: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  isStreaming: boolean;
  showSuggestions: boolean;
  isButtonDisabled: boolean;
  handleSendMessage: () => Promise<void>;
  handleSuggestionClick: (suggestion: string) => void;
}

export const useLexAIMessaging = ({
  conversation,
  setConversation,
  currentMode,
  handleToolExecution,
  scrollToEnd,
}: UseLexAIMessagingParams): UseLexAIMessagingReturn => {
  const navigation = useNavigation<LexAINavigationProp>();
  const dispatch = useDispatch<DispatchType>();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [, setAttemptCount] = useState(0);

  const isButtonDisabled = !inputMessage.trim() || isLoading;

  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    logDebug('Attempting to send message', {
      inputMessage: inputMessage.trim(),
      hasConversation: !!conversation,
      conversationId: conversation?.id,
      isLoading: isLoading,
      messageCount: conversation?.messages.length,
    });

    if (!inputMessage.trim()) {
      logDebug('Message send skipped - empty message');
      return;
    }

    if (!conversation) {
      logDebug('Message send skipped - no active conversation, creating one');
      const newConversation = LexAIService.initConversation(
        'New Conversation',
        currentMode,
      );
      setConversation(newConversation);
      await LexAIService.saveConversation(newConversation);
      dispatch(setActiveConversation(newConversation.id));

      setTimeout(() => {
        handleSendMessage();
      }, 100);
      return;
    }

    if (isLoading) {
      logDebug('Message send skipped - already loading');
      return;
    }

    logDebug('Proceeding with message send', {
      messageLength: inputMessage.trim().length,
    });

    const messageToSend = inputMessage.trim();
    const isDirectSearch = isDirectSearchCommand(messageToSend);
    const isPostSearch = isPostSearchRequest(messageToSend);

    const messageId = generateUUID();
    const userMessage: LexAIMessage = {
      id: messageId,
      role: 'user',
      content: messageToSend,
      timestamp: Date.now(),
    };

    setInputMessage('');
    setShowSuggestions(false);
    Keyboard.dismiss();

    setIsLoading(true);
    logDebug('Loading state activated', {isLoading: true});

    logDebug('Created user message', {
      messageId,
      content:
        messageToSend.substring(0, 20) +
        (messageToSend.length > 20 ? '...' : ''),
    });

    try {
      const updatedConversation: LexAIConversation = {
        ...conversation,
        messages: [...conversation.messages, userMessage],
        updatedAt: Date.now(),
      };

      setConversation(updatedConversation);
      await LexAIService.saveConversation(updatedConversation);
      logDebug('Saved user message to conversation');

      scrollToEnd();
      setAttemptCount(prev => prev + 1);

      // If it's a direct search command
      if (isDirectSearch && currentMode === LexAIMode.AGENT) {
        logDebug('Direct search detected, executing search tool directly');

        let searchQuery = extractSearchQuery(messageToSend);
        const isLikelyPost = isLikelyPostSearch(searchQuery);

        if (isLikelyPost) {
          const searchingMessage: LexAIMessage = {
            id: generateUUID(),
            role: 'assistant',
            content: `Searching for posts about "${searchQuery.trim()}". Taking you to the search results...`,
            timestamp: Date.now(),
          };

          const searchingConversation: LexAIConversation = {
            ...updatedConversation,
            messages: [...updatedConversation.messages, searchingMessage],
            updatedAt: Date.now(),
          };

          setConversation(searchingConversation);
          await LexAIService.saveConversation(searchingConversation);

          setTimeout(() => {
            navigation.dispatch(
              CommonActions.navigate({
                name: 'Tabs',
                params: {
                  screen: 'Search',
                  params: {searchText: searchQuery.trim()},
                },
              }),
            );
          }, 500);
        } else {
          const directSearchToolCall = {
            id: generateUUID(),
            toolName: 'webSearch',
            parameters: {query: searchQuery},
          };

          await handleToolExecution(directSearchToolCall);
        }

        setIsStreaming(true);
        setIsLoading(false);
        return;
      }

      // If it's a post search request
      if (isPostSearch && currentMode === LexAIMode.AGENT) {
        logDebug(
          'Post search detected, executing direct navigation to Search screen',
        );

        const searchQuery = extractPostSearchQuery(messageToSend);

        const searchingMessage: LexAIMessage = {
          id: generateUUID(),
          role: 'assistant',
          content: `Searching for posts about "${searchQuery.trim()}". Taking you to the search results...`,
          timestamp: Date.now(),
        };

        const searchingConversation: LexAIConversation = {
          ...updatedConversation,
          messages: [...updatedConversation.messages, searchingMessage],
          updatedAt: Date.now(),
        };

        setConversation(searchingConversation);
        await LexAIService.saveConversation(searchingConversation);

        setTimeout(() => {
          navigation.dispatch(
            CommonActions.navigate({
              name: 'Tabs',
              params: {
                screen: 'Search',
                params: {searchText: searchQuery.trim()},
              },
            }),
          );
        }, 500);

        setIsStreaming(true);
        setIsLoading(false);
        return;
      }

      // Process message with LexAI service
      logDebug('Calling LexAI service to process message');

      setIsStreaming(true);
      setIsLoading(false);
      logDebug('Switched to streaming state', {
        isLoading: false,
        isStreaming: true,
      });

      const response = await LexAIService.processMessage(
        messageToSend,
        updatedConversation,
      );

      logDebug('Received response from LexAI service', {
        hasMessage: !!response.message,
        messageId: response.message?.id,
        responseLength: response.message?.content?.length,
        hasToolCalls: !!response.toolCalls && response.toolCalls.length > 0,
      });

      if (response.message) {
        const finalConversation: LexAIConversation = {
          ...updatedConversation,
          messages: [...updatedConversation.messages, response.message],
          updatedAt: Date.now(),
        };

        logDebug('Updating conversation with AI response', {
          responseId: response.message.id,
        });

        setConversation(finalConversation);
        await LexAIService.saveConversation(finalConversation);
        logDebug('AI response saved to conversation');

        scrollToEnd();

        if (response.toolCalls && response.toolCalls.length > 0) {
          logDebug('Received tool calls to execute', {
            count: response.toolCalls.length,
            tools: response.toolCalls.map(t => t.toolName),
          });

          for (const toolCall of response.toolCalls) {
            if (
              [
                'navigate',
                'webSearch',
                'openUrl',
                'createRoom',
                'joinRoom',
                'toggleTheme',
              ].includes(toolCall.toolName)
            ) {
              await handleToolExecution(toolCall);
            }
          }
        }
      } else {
        logDebug('No message in response from LexAI service, adding fallback');

        const errorMessage: LexAIMessage = {
          id: generateUUID(),
          role: 'assistant',
          content:
            "I processed your request but couldn't generate a proper response. Please try again.",
          timestamp: Date.now(),
        };

        const errorConversation: LexAIConversation = {
          ...updatedConversation,
          messages: [...updatedConversation.messages, errorMessage],
          updatedAt: Date.now(),
        };

        setConversation(errorConversation);
        await LexAIService.saveConversation(errorConversation);
      }
    } catch (error: any) {
      logDebug('Error processing message', {
        errorMessage: error?.message || 'Unknown error',
        errorString: String(error),
      });
      console.error('Error processing message:', error);

      const errorMessage: LexAIMessage = {
        id: generateUUID(),
        role: 'assistant',
        content:
          'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: Date.now(),
      };

      if (conversation) {
        const errorConversation: LexAIConversation = {
          ...conversation,
          messages: [...conversation.messages, userMessage, errorMessage],
          updatedAt: Date.now(),
        };

        setConversation(errorConversation);
        await LexAIService.saveConversation(errorConversation);
      }
    } finally {
      setIsStreaming(false);
      setIsLoading(false);
      logDebug('Animation states reset', {
        isLoading: false,
        isStreaming: false,
      });
      logDebug('Message handling completed');
    }
  }, [
    inputMessage,
    conversation,
    currentMode,
    isLoading,
    dispatch,
    setConversation,
    handleToolExecution,
    scrollToEnd,
    navigation,
  ]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      logDebug('Suggestion clicked', {suggestion});
      setInputMessage(suggestion);
      setShowSuggestions(false);

      setTimeout(() => {
        handleSendMessage();
      }, 100);
    },
    [handleSendMessage],
  );

  // Expose tool execution function to LexAIService
  useEffect(() => {
    // @ts-ignore: Adding a property to the service instance
    LexAIService.executeComponentToolCall = handleToolExecution;

    return () => {
      // @ts-ignore: Removing the property
      LexAIService.executeComponentToolCall = null;
    };
  }, [handleToolExecution]);

  return {
    inputMessage,
    setInputMessage,
    isLoading,
    isStreaming,
    showSuggestions,
    isButtonDisabled,
    handleSendMessage,
    handleSuggestionClick,
  };
};
