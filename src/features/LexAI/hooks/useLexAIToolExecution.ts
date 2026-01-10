import {useCallback} from 'react';
import {Linking} from 'react-native';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {useDispatch} from 'react-redux';
import {
  LexAIMessage,
  LexAIConversation,
  LexAIMode,
} from 'lex-ai/types/lexAITypes';
import LexAIService from 'shared/services/LexAIService';
import {DispatchType} from 'shared/store/store';
import {generateUUID, logDebug} from 'lex-ai/utils/common';
import {changeThemeColor} from '@/shared/reducers/User';
import {UserStackParamList} from 'shared/navigation/routes/UserStack';
import {LexAIMessageWithLinks} from '../types/lexAI.types';
import {fetchSearchResults} from '../utils/lexAI.utils';

type LexAINavigationProp = DrawerNavigationProp<UserStackParamList>;

export interface UseLexAIToolExecutionParams {
  conversation: LexAIConversation | null;
  setConversation: React.Dispatch<
    React.SetStateAction<LexAIConversation | null>
  >;
  currentMode: LexAIMode;
  isDarkMode: boolean;
}

export interface UseLexAIToolExecutionReturn {
  handleToolExecution: (toolCall: any) => Promise<void>;
}

export const useLexAIToolExecution = ({
  conversation,
  setConversation,
  currentMode,
  isDarkMode,
}: UseLexAIToolExecutionParams): UseLexAIToolExecutionReturn => {
  const navigation = useNavigation<LexAINavigationProp>();
  const dispatch = useDispatch<DispatchType>();

  const handleToolExecution = useCallback(
    async (toolCall: any) => {
      if (!toolCall || !toolCall.toolName) {
        logDebug('No tool call to execute');
        return;
      }

      logDebug('Executing tool call', {
        tool: toolCall.toolName,
        params: toolCall.parameters,
      });

      try {
        switch (toolCall.toolName) {
          case 'navigate':
            const {screenName, params} = toolCall.parameters;
            if (screenName) {
              logDebug(`Navigating to screen: ${screenName}`, {params});

              const tabScreens = ['Home', 'Search', 'CreatePost'];

              if (tabScreens.includes(screenName)) {
                navigation.dispatch(
                  CommonActions.navigate({
                    name: 'Tabs',
                    params: {
                      screen: screenName,
                      params: params || {},
                    },
                  }),
                );
                logDebug(
                  `Navigated to Tab screen: ${screenName} via Tabs navigator`,
                );
              } else {
                navigation.dispatch(
                  CommonActions.navigate({
                    name: screenName,
                    params: params || {},
                  }),
                );
                logDebug(`Navigated directly to screen: ${screenName}`);
              }
            } else {
              logDebug('Navigation failed: No screen name provided');
            }
            break;

          case 'webSearch':
            if (toolCall.parameters?.query && currentMode === LexAIMode.AGENT) {
              logDebug(`Performing web search: ${toolCall.parameters.query}`);

              const searchQuery = toolCall.parameters.query;

              const searchingMessage: LexAIMessageWithLinks = {
                id: generateUUID(),
                role: 'assistant',
                content: `Searching the web for: "${searchQuery}"...`,
                timestamp: Date.now(),
              };

              if (conversation) {
                const lastMessage =
                  conversation.messages[conversation.messages.length - 1];
                const needsUserMessage =
                  lastMessage.role !== 'user' ||
                  !lastMessage.content
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());

                let updatedConvWithUserMsg = conversation;
                if (needsUserMessage) {
                  const userMessage: LexAIMessage = {
                    id: generateUUID(),
                    role: 'user',
                    content: `Search for "${searchQuery}"`,
                    timestamp: Date.now() - 1000,
                  };

                  updatedConvWithUserMsg = {
                    ...conversation,
                    messages: [...conversation.messages, userMessage],
                    updatedAt: Date.now(),
                  };

                  setConversation(updatedConvWithUserMsg);
                  await LexAIService.saveConversation(updatedConvWithUserMsg);
                }

                const updatedConv = {
                  ...updatedConvWithUserMsg,
                  messages: [
                    ...updatedConvWithUserMsg.messages,
                    searchingMessage,
                  ],
                  updatedAt: Date.now(),
                };

                setConversation(updatedConv);
                await LexAIService.saveConversation(updatedConv);

                try {
                  const searchResults = await fetchSearchResults(searchQuery);

                  let resultsContent = `Here are some results for "${searchQuery}":\n\n`;

                  if (searchResults && searchResults.length > 0) {
                    searchResults.forEach((result, index) => {
                      resultsContent += `${index + 1}. ${result.title}\n${result.url}\n\n`;
                    });

                    const resultsMessage: LexAIMessageWithLinks = {
                      id: generateUUID(),
                      role: 'assistant',
                      content: resultsContent,
                      timestamp: Date.now(),
                      links: searchResults,
                    };

                    const finalConv = {
                      ...updatedConv,
                      messages: [...updatedConv.messages, resultsMessage],
                      updatedAt: Date.now(),
                    };

                    setConversation(finalConv);
                    await LexAIService.saveConversation(finalConv);
                  } else {
                    const noResultsMessage: LexAIMessageWithLinks = {
                      id: generateUUID(),
                      role: 'assistant',
                      content: `I couldn't find any results for "${searchQuery}". Please try a different search query.`,
                      timestamp: Date.now(),
                    };

                    const finalConv = {
                      ...updatedConv,
                      messages: [...updatedConv.messages, noResultsMessage],
                      updatedAt: Date.now(),
                    };

                    setConversation(finalConv);
                    await LexAIService.saveConversation(finalConv);
                  }
                } catch (error) {
                  logDebug('Error fetching search results', {
                    error: String(error),
                  });

                  const errorMessage: LexAIMessageWithLinks = {
                    id: generateUUID(),
                    role: 'assistant',
                    content: `I encountered an error while searching for "${searchQuery}". Please try again later.`,
                    timestamp: Date.now(),
                  };

                  const errorConv = {
                    ...updatedConv,
                    messages: [...updatedConv.messages, errorMessage],
                    updatedAt: Date.now(),
                  };

                  setConversation(errorConv);
                  await LexAIService.saveConversation(errorConv);
                }
              }
            } else if (currentMode === LexAIMode.SIMPLE_CHAT && conversation) {
              const infoMessage: LexAIMessage = {
                id: generateUUID(),
                role: 'assistant',
                content: `I'll do my best to answer your question based on my built-in knowledge. I don't have the ability to search the web in Simple Chat mode, but I'll share what I know about this topic.`,
                timestamp: Date.now(),
              };

              const updatedConv = {
                ...conversation,
                messages: [...conversation.messages, infoMessage],
                updatedAt: Date.now(),
              };

              setConversation(updatedConv);
              await LexAIService.saveConversation(updatedConv);
            }
            break;

          case 'openUrl':
            if (toolCall.parameters?.url) {
              logDebug(`Opening URL: ${toolCall.parameters.url}`);
              const isValid = await Linking.canOpenURL(toolCall.parameters.url);

              if (isValid) {
                await Linking.openURL(toolCall.parameters.url);
              } else {
                logDebug('Cannot open URL: Invalid URL format');

                const urlErrorMessage: LexAIMessageWithLinks = {
                  id: generateUUID(),
                  role: 'assistant',
                  content: `I couldn't open the URL: ${toolCall.parameters.url}. It appears to be invalid.`,
                  timestamp: Date.now(),
                };

                if (conversation) {
                  const updatedConv = {
                    ...conversation,
                    messages: [...conversation.messages, urlErrorMessage],
                    updatedAt: Date.now(),
                  };
                  setConversation(updatedConv);
                  await LexAIService.saveConversation(updatedConv);
                }
              }
            }
            break;

          case 'createRoom':
            logDebug('Creating meeting room', {params: toolCall.parameters});

            try {
              const {
                title,
                description = '',
                duration = 60,
                capacity = 10,
                isPrivate = false,
                taskId = '',
              } = toolCall.parameters;

              if (!title) {
                const errorMessage: LexAIMessage = {
                  id: generateUUID(),
                  role: 'assistant',
                  content: 'I need a title to create a meeting room.',
                  timestamp: Date.now(),
                };

                if (conversation) {
                  const updatedConv = {
                    ...conversation,
                    messages: [...conversation.messages, errorMessage],
                    updatedAt: Date.now(),
                  };

                  setConversation(updatedConv);
                  await LexAIService.saveConversation(updatedConv);
                }
                break;
              }

              const creatingMessage: LexAIMessage = {
                id: generateUUID(),
                role: 'assistant',
                content: `Preparing meeting room: "${title}"...`,
                timestamp: Date.now(),
              };

              if (conversation) {
                const updatedConv = {
                  ...conversation,
                  messages: [...conversation.messages, creatingMessage],
                  updatedAt: Date.now(),
                };

                setConversation(updatedConv);
                await LexAIService.saveConversation(updatedConv);
              }

              const meetingData = {
                id: generateUUID(),
                title,
                description,
                duration: parseInt(duration, 10) || 60,
                isPrivate: Boolean(isPrivate),
                maxParticipants: parseInt(capacity, 10) || 10,
                taskId: taskId || undefined,
                host: '',
                status: 'scheduled',
                participants: [],
                roomCode: Math.random()
                  .toString(36)
                  .substring(2, 8)
                  .toUpperCase(),
                settings: {
                  muteOnEntry: true,
                  allowChat: true,
                  allowScreenShare: true,
                  recordingEnabled: false,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              const successMessage: LexAIMessage = {
                id: generateUUID(),
                role: 'assistant',
                content: taskId
                  ? `Taking you to the meeting room "${title}" linked with your team task...`
                  : `Taking you to the meeting room "${title}"...`,
                timestamp: Date.now(),
                metadata: {
                  navigationType: 'createRoom',
                  navigationId: meetingData.id,
                  isNavigationMessage: true,
                },
              };

              if (conversation) {
                const updatedConv = {
                  ...conversation,
                  messages: [...conversation.messages, successMessage],
                  updatedAt: Date.now(),
                };

                setConversation(updatedConv);
                await LexAIService.saveConversation(updatedConv);
              }

              setTimeout(() => {
                navigation.navigate('Room', {meetingData});
                logDebug('Navigated to Room with meeting data', {meetingData});
              }, 500);
            } catch (error) {
              logDebug('Error preparing meeting room', {error: String(error)});

              const errorMessage: LexAIMessage = {
                id: generateUUID(),
                role: 'assistant',
                content: `I encountered an error while preparing the meeting room: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: Date.now(),
              };

              if (conversation) {
                const updatedConv = {
                  ...conversation,
                  messages: [...conversation.messages, errorMessage],
                  updatedAt: Date.now(),
                };

                setConversation(updatedConv);
                await LexAIService.saveConversation(updatedConv);
              }
            }
            break;

          case 'joinRoom':
            logDebug('Joining meeting room', {params: toolCall.parameters});

            try {
              const {roomCode} = toolCall.parameters;

              if (!roomCode) {
                const errorMessage: LexAIMessage = {
                  id: generateUUID(),
                  role: 'assistant',
                  content: 'I need a room code to join a meeting room.',
                  timestamp: Date.now(),
                };

                if (conversation) {
                  const updatedConv = {
                    ...conversation,
                    messages: [...conversation.messages, errorMessage],
                    updatedAt: Date.now(),
                  };

                  setConversation(updatedConv);
                  await LexAIService.saveConversation(updatedConv);
                }
                break;
              }

              const joiningMessage: LexAIMessage = {
                id: generateUUID(),
                role: 'assistant',
                content: `Joining meeting room with code: "${roomCode}"...`,
                timestamp: Date.now(),
              };

              if (conversation) {
                const updatedConv = {
                  ...conversation,
                  messages: [...conversation.messages, joiningMessage],
                  updatedAt: Date.now(),
                };

                setConversation(updatedConv);
                await LexAIService.saveConversation(updatedConv);
              }

              setTimeout(() => {
                navigation.navigate('Room', {
                  joinMode: true,
                  roomCode: roomCode,
                });
                logDebug('Navigated to Room with join mode and room code', {
                  roomCode,
                });
              }, 500);
            } catch (error) {
              logDebug('Error joining meeting room', {error: String(error)});

              const errorMessage: LexAIMessage = {
                id: generateUUID(),
                role: 'assistant',
                content: `I encountered an error while joining the meeting room: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: Date.now(),
              };

              if (conversation) {
                const updatedConv = {
                  ...conversation,
                  messages: [...conversation.messages, errorMessage],
                  updatedAt: Date.now(),
                };

                setConversation(updatedConv);
                await LexAIService.saveConversation(updatedConv);
              }
            }
            break;

          case 'toggleTheme':
            dispatch(changeThemeColor(isDarkMode ? 'light' : 'dark'));

            const toggledTheme: LexAIMessage = {
              id: generateUUID(),
              role: 'assistant',
              content: `Toggling app theme...`,
              timestamp: Date.now(),
            };

            if (conversation) {
              const updatedConv = {
                ...conversation,
                messages: [...conversation.messages, toggledTheme],
                updatedAt: Date.now(),
              };

              setConversation(updatedConv);
              await LexAIService.saveConversation(updatedConv);
            }
            break;

          default:
            logDebug(
              `Tool call ${toolCall.toolName} will be handled by LexAIService`,
            );
            break;
        }
      } catch (error) {
        logDebug('Error executing tool call', {
          tool: toolCall.toolName,
          error: String(error),
        });
        console.error('Error executing tool call:', error);
      }
    },
    [
      conversation,
      currentMode,
      navigation,
      isDarkMode,
      dispatch,
      setConversation,
    ],
  );

  return {
    handleToolExecution,
  };
};
