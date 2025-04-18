import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Keyboard,
    Linking,
    ScrollView,
    Dimensions,
    SafeAreaView,
    Image,
    Switch,
    StatusBar,
    LogBox,
    Alert,
    useColorScheme,
    Modal,
    Animated,
    Easing
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { UserStackParamList } from '../../routes/UserStack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import LexAIService from '../../service/LexAIService';
import { LexAIMessage, LexAIConversation, LexAIPersonality, LexAIMode } from '../../types/lexAITypes';
import { useSelector, useDispatch } from 'react-redux';
import LexAIFirestoreService from '../../service/firebase/LexAIFirestoreService';
import { setLexAIMode, setActiveConversation } from '../../reducers/LexAI';
import { DispatchType } from '../../store/store';
import axios from 'axios';
import Config from 'react-native-config';

// Define search result interface
interface SearchResult {
    title: string;
    url: string;
    snippet?: string;
}

// Extended LexAIMessage type that includes links
interface LexAIMessageWithLinks extends LexAIMessage {
    links?: SearchResult[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define RootState type for TypeScript
interface RootState {
    lexAI: {
        conversations: Record<string, LexAIConversation>;
        activeConversationId: string | null;
        mode: LexAIMode;
    },
    user: {
        theme: 'light' | 'dark' | 'system';
    }
}

// Define ThemeColors type
interface ThemeColors {
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

// Define colors for light and dark themes
const lightColors: ThemeColors = {
    background: '#F5F9FF',
    cardBackground: '#FFFFFF',
    text: '#1F1F1F',
    subtext: '#6B7280',
    border: '#E0E0E0',
    inputBorder: '#E5E7EB',
    primary: '#3E7BFA',
    secondary: '#6C7A9C',
    accent: '#6A5AE0',
    placeholder: '#9E9E9E',
    button: '#3E7BFA',
    userBubble: '#3E7BFA',
    aiBubble: '#FFFFFF',
    userText: '#FFFFFF',
    aiText: '#1F1F1F',
    inputBackground: '#F3F4F6',
    controlsBackground: 'rgba(255, 255, 255, 0.8)'
};

const darkColors: ThemeColors = {
    background: '#121C2E',
    cardBackground: '#1C2739',
    text: '#F5F5F5',
    subtext: '#ADADAF',
    border: '#252F40',
    inputBorder: '#313E55',
    primary: '#3E7BFA',
    secondary: '#A0A0A0',
    accent: '#9F8FFF',
    placeholder: '#6C6C6C',
    button: '#3E7BFA',
    userBubble: '#3E7BFA',
    aiBubble: '#1C2739',
    userText: '#FFFFFF',
    aiText: '#F5F5F5',
    inputBackground: '#1A2436',
    controlsBackground: 'rgba(28, 39, 57, 0.8)'
};

const { width, height } = Dimensions.get('window');

// Debug function
const logDebug = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[LexAI ${timestamp}] ${message}`;
    console.log(logMessage);
    if (data) {
        console.log('Data:', JSON.stringify(data, null, 2));
    }
};

// Suggestions for common queries
const AGENT_SUGGESTIONS = [
    "What can you help me with?",
    "Find posts about React Native",
    "Search for posts about coding",
    "Look for posts by topic",
    "Can you search the web for latest AI trends?"
];

const CHAT_SUGGESTIONS = [
    "What can you help me with?",
    "Explain how React hooks work",
    "Tell me about machine learning",
    "What's the difference between var, let, and const?",
    "Search the web for latest AI trends"
];

// Custom UUID generator that doesn't rely on crypto.getRandomValues()
const generateUUID = (): string => {
    // Use a timestamp-based prefix to ensure uniqueness
    const timestamp = Date.now().toString(36);

    // Generate random segments
    const randomSegment1 = Math.random().toString(36).substring(2, 15);
    const randomSegment2 = Math.random().toString(36).substring(2, 15);

    // Combine timestamp and random segments to form a UUID-like string
    return `${timestamp}-${randomSegment1}-${randomSegment2}`;
};

// Define a type for the navigation prop that includes nested navigation
type LexAINavigationProp = DrawerNavigationProp<UserStackParamList>;

const LexAI = () => {
    const navigation = useNavigation<LexAINavigationProp>();
    const dispatch = useDispatch<DispatchType>();
    const systemColorScheme = useColorScheme();

    // Get user theme preference from Redux
    const userTheme = useSelector((state: RootState) => state.user.theme);
    const isDarkMode = userTheme === 'dark' || (userTheme === 'system' && systemColorScheme === 'dark');

    // Set theme colors based on dark mode
    const colors: ThemeColors = isDarkMode ? darkColors : lightColors;

    // Access the lexAI state from Redux with proper typing
    const lexAIState = useSelector((state: RootState) => state.lexAI);
    const currentMode = useSelector((state: RootState) => state.lexAI.mode);

    const [conversation, setConversation] = useState<LexAIConversation | null>(null);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [debugMode, setDebugMode] = useState(false);
    const [attemptCount, setAttemptCount] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [allConversations, setAllConversations] = useState<LexAIConversation[]>([]);
    const [historyOpacity] = useState(new Animated.Value(0));
    const [historyTranslateX] = useState(new Animated.Value(300));
    const inputRef = useRef<TextInput>(null);
    const isButtonDisabled = !inputMessage.trim() || isLoading;

    // Get suggestions based on current mode
    const suggestions = currentMode === LexAIMode.AGENT ? AGENT_SUGGESTIONS : CHAT_SUGGESTIONS;

    // Add animation values for header icon
    const [iconRotate] = useState(new Animated.Value(0));
    const [iconScale] = useState(new Animated.Value(1));

    // Create animated icon effect
    const animateIcon = () => {
        Animated.sequence([
            Animated.timing(iconScale, {
                toValue: 1.2,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(iconScale, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(iconRotate, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
            })
        ]).start(() => {
            iconRotate.setValue(0);
        });
    };

    // Create rotation interpolation
    const spin = iconRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    // Add rotation animation value for the send button
    const [sendButtonScale] = useState(new Animated.Value(1));
    const [sendButtonGlow] = useState(new Animated.Value(0));
    const [sendButtonRotate] = useState(new Animated.Value(0));

    // Add animation values for loading dots
    const [dot1Anim] = useState(new Animated.Value(0));
    const [dot2Anim] = useState(new Animated.Value(0));
    const [dot3Anim] = useState(new Animated.Value(0));

    // Create interpolated rotation value
    const sendRotation = sendButtonRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '30deg']
    });

    // Create interpolated values for loading dots
    const dot1Scale = dot1Anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.5, 1]
    });

    const dot2Scale = dot2Anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.5, 1]
    });

    const dot3Scale = dot3Anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.5, 1]
    });

    const dot1Opacity = dot1Anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.5, 1, 0.5]
    });

    const dot2Opacity = dot2Anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.5, 1, 0.5]
    });

    const dot3Opacity = dot3Anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.5, 1, 0.5]
    });

    // Animate loading dots when isLoading is true
    useEffect(() => {
        let dotAnimation: Animated.CompositeAnimation;

        if (isLoading) {
            // Reset animation values
            dot1Anim.setValue(0);
            dot2Anim.setValue(0);
            dot3Anim.setValue(0);

            // Create a staggered sequence animation
            dotAnimation = Animated.loop(
                Animated.stagger(200, [
                    Animated.timing(dot1Anim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease)
                    }),
                    Animated.timing(dot2Anim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease)
                    }),
                    Animated.timing(dot3Anim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease)
                    })
                ])
            );

            // Start the animation
            dotAnimation.start();
        }

        // Clean up animation when component unmounts or isLoading changes
        return () => {
            if (dotAnimation) {
                dotAnimation.stop();
            }
        };
    }, [isLoading, dot1Anim, dot2Anim, dot3Anim]);

    // Add effect to animate button when input changes from empty to filled
    useEffect(() => {
        // Only animate if going from empty to having content
        if (inputMessage.trim().length === 1) {
            // Reset rotation
            sendButtonRotate.setValue(0);

            // Trigger animation
            Animated.sequence([
                Animated.timing(sendButtonScale, {
                    toValue: 1.1,
                    duration: 150,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.back(1.5))
                }),
                Animated.timing(sendButtonScale, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                })
            ]).start();

            // Add subtle rotation
            Animated.sequence([
                Animated.timing(sendButtonRotate, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic)
                }),
                Animated.timing(sendButtonRotate, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.cubic)
                })
            ]).start();
        }
    }, [inputMessage]);

    // Create a more sophisticated animation for the send button
    const animateSendButton = () => {
        // Reset values
        sendButtonGlow.setValue(0);
        sendButtonRotate.setValue(0);

        // Create parallel animations for scale, glow, and rotation
        Animated.parallel([
            // Pulse animation
            Animated.sequence([
                Animated.timing(sendButtonScale, {
                    toValue: 0.92,
                    duration: 80,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease)
                }),
                Animated.timing(sendButtonScale, {
                    toValue: 1,
                    duration: 120,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease)
                })
            ]),
            // Glow animation
            Animated.timing(sendButtonGlow, {
                toValue: 1,
                duration: 400,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease)
            }),
            // Subtle rotation on click
            Animated.sequence([
                Animated.timing(sendButtonRotate, {
                    toValue: 1,
                    duration: 120,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.cubic)
                }),
                Animated.timing(sendButtonRotate, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.cubic)
                })
            ])
        ]).start();
    };

    // Create interpolated values for the glow effect
    const glowOpacity = sendButtonGlow.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.4, 0]
    });

    // Initialize conversation
    useEffect(() => {
        logDebug('Initializing LexAI component');

        const initializeConversation = async () => {
            try {
                logDebug('Loading active conversation ID from Firestore');
                // Check if there's an active conversation in Firestore
                const activeConvId = await LexAIFirestoreService.getActiveConversationId();
                logDebug('Active conversation ID:', activeConvId);

                if (activeConvId) {
                    logDebug('Found active conversation ID, loading conversations');
                    const conversations = await LexAIService.loadConversations();
                    logDebug(`Loaded ${conversations.length} conversations`);

                    const existingConv = conversations.find(c => c.id === activeConvId);

                    if (existingConv) {
                        logDebug('Found existing conversation, setting as active', { id: existingConv.id });
                        setConversation(existingConv);
                        // Set the mode to match the conversation's mode
                        dispatch(setLexAIMode(existingConv.mode));
                        return;
                    } else {
                        logDebug('Conversation not found in loaded conversations');
                    }
                }

                logDebug('Creating new conversation');
                // If no active conversation, create a new one
                const newConversation = LexAIService.initConversation('New Conversation', currentMode);
                logDebug('New conversation created', { id: newConversation.id, mode: newConversation.mode });

                setConversation(newConversation);
                await LexAIService.saveConversation(newConversation);
                dispatch(setActiveConversation(newConversation.id));

                handleInitialMessage(newConversation);
            } catch (error) {
                console.error('Error initializing conversation:', error);
                // Fallback to creating a new conversation if there's an error
                const newConversation = LexAIService.initConversation('New Conversation', currentMode);
                setConversation(newConversation);
                await LexAIService.saveConversation(newConversation);
                dispatch(setActiveConversation(newConversation.id));
            }
        };

        initializeConversation();
    }, []);

    // Load all conversations for history
    useEffect(() => {
        const loadAllConversations = async () => {
            try {
                logDebug('Loading all conversations for history');
                const conversations = await LexAIService.loadConversations().catch(err => {
                    logDebug('Error in loadConversations', { error: String(err) });
                    return []; // Return empty array on error
                });

                if (!Array.isArray(conversations)) {
                    logDebug('Conversations is not an array', { type: typeof conversations });
                    setAllConversations([]);
                    return;
                }

                // Sort by most recent first
                const sortedConversations = conversations.sort((a, b) =>
                    b.updatedAt - a.updatedAt
                );
                setAllConversations(sortedConversations);
                logDebug(`Loaded ${conversations.length} conversations for history`);
            } catch (error: any) {
                logDebug('Error loading conversations history', { error: error?.message || String(error) });
                console.error('Error loading conversations history:', error);
                // Set empty array to prevent UI issues
                setAllConversations([]);
            }
        };

        loadAllConversations();
    }, [conversation]); // Reload when current conversation changes

    // Toggle between agent and simple chat modes
    const toggleMode = async () => {
        const newMode = currentMode === LexAIMode.AGENT ? LexAIMode.SIMPLE_CHAT : LexAIMode.AGENT;
        logDebug(`Toggling mode from ${currentMode} to ${newMode}`);

        dispatch(setLexAIMode(newMode));

        // Create a new conversation with the new mode if no active conversation
        if (!conversation) {
            logDebug('No active conversation, creating new one with new mode');
            const newConversation = LexAIService.initConversation('New Conversation', newMode);
            setConversation(newConversation);
            await LexAIService.saveConversation(newConversation);
            dispatch(setActiveConversation(newConversation.id));
            handleInitialMessage(newConversation);
        } else {
            // Update the existing conversation's mode
            logDebug('Updating existing conversation mode', { id: conversation.id });
            const updatedConversation = {
                ...conversation,
                mode: newMode
            };
            setConversation(updatedConversation);
            await LexAIService.saveConversation(updatedConversation);

            // Add a transition message
            const transitionMessage: LexAIMessage = {
                id: generateUUID(),
                role: 'assistant',
                content: newMode === LexAIMode.AGENT
                    ? "I've switched to Agent Mode. I can now help you with tasks, navigation, and more."
                    : "I've switched to Simple Chat Mode. I'll focus on conversation and answering questions.",
                timestamp: Date.now()
            };

            const finalConversation = {
                ...updatedConversation,
                messages: [...updatedConversation.messages, transitionMessage],
                updatedAt: Date.now()
            };

            setConversation(finalConversation);
            await LexAIService.saveConversation(finalConversation);
            logDebug('Mode transition complete, added transition message');

            // Scroll to bottom to show transition message
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    };

    // Send an initial greeting message
    const handleInitialMessage = async (conv: LexAIConversation) => {
        if (!conv) {
            logDebug('Attempted to send initial message but conversation is null');
            return;
        }

        logDebug('Sending initial greeting message');
        setIsLoading(true);

        try {
            let initialMessage = "";

            if (conv.mode === LexAIMode.AGENT) {
                initialMessage = "Hello! I'm LexAI in Agent Mode. I can help with questions, tasks, navigation, searching posts, and more. How can I assist you today?";
            } else {
                initialMessage = "Hello! I'm LexAI in Simple Chat Mode. I'm here to answer your questions and have a conversation. What would you like to talk about?";
            }

            const assistantMessage: LexAIMessage = {
                id: generateUUID(),
                role: 'assistant',
                content: initialMessage,
                timestamp: Date.now()
            };

            const updatedConversation = {
                ...conv,
                messages: [...conv.messages, assistantMessage],
                updatedAt: Date.now()
            };

            logDebug('Setting initial greeting in conversation', { messageId: assistantMessage.id });
            setConversation(updatedConversation);
            await LexAIService.saveConversation(updatedConversation);
            logDebug('Initial greeting saved to conversation');
        } catch (error) {
            logDebug('Error sending initial message', { error });
            console.error('Error sending initial message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle sending a message
    const handleSendMessage = async () => {
        // More detailed debugging
        logDebug('Attempting to send message', {
            inputMessage: inputMessage.trim(),
            hasConversation: !!conversation,
            conversationId: conversation?.id,
            isLoading: isLoading,
            messageCount: conversation?.messages.length
        });

        // Skip if any of these conditions are true
        if (!inputMessage.trim()) {
            logDebug('Message send skipped - empty message');
            return;
        }

        if (!conversation) {
            logDebug('Message send skipped - no active conversation, creating one');
            // Create a new conversation if one doesn't exist
            const newConversation = LexAIService.initConversation('New Conversation', currentMode);
            setConversation(newConversation);
            await LexAIService.saveConversation(newConversation);
            dispatch(setActiveConversation(newConversation.id));

            // Try sending again after creating conversation
            setTimeout(() => {
                handleSendMessage();
            }, 100);
            return;
        }

        if (isLoading) {
            logDebug('Message send skipped - already loading');
            return;
        }

        logDebug('Proceeding with message send', { messageLength: inputMessage.trim().length });

        // Store message before we clear the input
        const messageToSend = inputMessage.trim();

        // Check if it's a direct search command
        const isDirectSearch = messageToSend.toLowerCase().startsWith('search ') ||
            messageToSend.toLowerCase().startsWith('find ') ||
            messageToSend.toLowerCase().startsWith('look up ') ||
            messageToSend.toLowerCase().match(/^(what|who|how|when|where|why)\s+(is|are|were|was|do|does|can|could)\s+.+/);

        // Check if it's a post search request
        const isPostSearch = messageToSend.toLowerCase().startsWith('find posts ') ||
            messageToSend.toLowerCase().startsWith('search posts ') ||
            messageToSend.toLowerCase().startsWith('look for posts ') ||
            messageToSend.toLowerCase().includes(' posts about ') ||
            messageToSend.toLowerCase().includes('post with ');

        // Create user message
        const messageId = generateUUID();
        const userMessage: LexAIMessage = {
            id: messageId,
            role: 'user',
            content: messageToSend,
            timestamp: Date.now()
        };

        // Clear input and update UI state immediately
        setInputMessage('');
        setShowSuggestions(false);
        Keyboard.dismiss();

        // Set loading state for AI response
        setIsLoading(true);

        logDebug('Created user message', { messageId, content: messageToSend.substring(0, 20) + (messageToSend.length > 20 ? '...' : '') });

        try {
            // Create updated conversation with user message
            const updatedConversation: LexAIConversation = {
                ...conversation,
                messages: [...conversation.messages, userMessage],
                updatedAt: Date.now()
            };

            // Update state immediately to show user message
            setConversation(updatedConversation);

            // Save conversation with user message to persist it
            await LexAIService.saveConversation(updatedConversation);
            logDebug('Saved user message to conversation');

            // Auto-scroll to bottom to show the new message
            setTimeout(() => {
                if (flatListRef.current) {
                    flatListRef.current.scrollToEnd({ animated: true });
                    logDebug('Scrolled to end after user message');
                }
            }, 100);

            // Increase attempt counter for debugging
            setAttemptCount(prev => prev + 1);

            // If it's a direct search command, skip AI processing and immediately execute search
            if (isDirectSearch && currentMode === LexAIMode.AGENT) {
                logDebug('Direct search detected, executing search tool directly');

                // Extract the search query from the message
                let searchQuery = messageToSend;
                if (searchQuery.toLowerCase().startsWith('search ')) {
                    searchQuery = searchQuery.substring(7);
                } else if (searchQuery.toLowerCase().startsWith('find ')) {
                    searchQuery = searchQuery.substring(5);
                } else if (searchQuery.toLowerCase().startsWith('look up ')) {
                    searchQuery = searchQuery.substring(8);
                }

                // Check if it contains post-related keywords, which would indicate a post search
                const postKeywords = ['post', 'posts', 'article', 'articles', 'tutorial', 'content'];
                const isLikelyPostSearch = postKeywords.some(keyword =>
                    searchQuery.toLowerCase().includes(keyword)
                );

                // Choose the appropriate action based on content
                if (isLikelyPostSearch) {
                    // Add an assistant response about searching posts
                    const searchingMessage: LexAIMessage = {
                        id: generateUUID(),
                        role: 'assistant',
                        content: `Searching for posts about "${searchQuery.trim()}". Taking you to the search results...`,
                        timestamp: Date.now()
                    };

                    const searchingConversation: LexAIConversation = {
                        ...updatedConversation,
                        messages: [...updatedConversation.messages, searchingMessage],
                        updatedAt: Date.now()
                    };

                    // Update conversation with the search message
                    setConversation(searchingConversation);
                    await LexAIService.saveConversation(searchingConversation);

                    // Navigate directly to Search screen with the search term
                    setTimeout(() => {
                        navigation.dispatch(
                            CommonActions.navigate({
                                name: 'Tabs',
                                params: {
                                    screen: 'Search',
                                    params: { searchText: searchQuery.trim() }
                                }
                            })
                        );
                    }, 500); // Brief delay to show the message before navigation
                } else {
                    // Create a web search tool call
                    const directSearchToolCall = {
                        id: generateUUID(),
                        toolName: 'webSearch',
                        parameters: { query: searchQuery }
                    };

                    // Execute the web search
                    await handleToolExecution(directSearchToolCall);
                }

                setIsLoading(false);
                return;
            }

            // If it's a post search request, execute post search directly
            if (isPostSearch && currentMode === LexAIMode.AGENT) {
                logDebug('Post search detected, executing direct navigation to Search screen');

                // Extract the search query from the message
                let searchQuery = messageToSend;

                // Extract the actual query by removing the command part
                if (searchQuery.toLowerCase().startsWith('find posts ')) {
                    searchQuery = searchQuery.substring(11);
                } else if (searchQuery.toLowerCase().startsWith('search posts ')) {
                    searchQuery = searchQuery.substring(13);
                } else if (searchQuery.toLowerCase().startsWith('look for posts ')) {
                    searchQuery = searchQuery.substring(15);
                } else if (searchQuery.toLowerCase().includes(' posts about ')) {
                    searchQuery = searchQuery.substring(searchQuery.toLowerCase().indexOf(' posts about ') + 13);
                } else if (searchQuery.toLowerCase().includes('post with ')) {
                    searchQuery = searchQuery.substring(searchQuery.toLowerCase().indexOf('post with ') + 10);
                }

                // Add an assistant response about searching
                const searchingMessage: LexAIMessage = {
                    id: generateUUID(),
                    role: 'assistant',
                    content: `Searching for posts about "${searchQuery.trim()}". Taking you to the search results...`,
                    timestamp: Date.now()
                };

                const searchingConversation: LexAIConversation = {
                    ...updatedConversation,
                    messages: [...updatedConversation.messages, searchingMessage],
                    updatedAt: Date.now()
                };

                // Update conversation with the search message
                setConversation(searchingConversation);
                await LexAIService.saveConversation(searchingConversation);

                // Navigate directly to Search screen with the search term
                setTimeout(() => {
                    navigation.dispatch(
                        CommonActions.navigate({
                            name: 'Tabs',
                            params: {
                                screen: 'Search',
                                params: { searchText: searchQuery.trim() }
                            }
                        })
                    );
                }, 500); // Brief delay to show the message before navigation

                setIsLoading(false);
                return;
            }

            // Process message with LexAI service
            logDebug('Calling LexAI service to process message');

            const response = await LexAIService.processMessage(messageToSend, updatedConversation);

            logDebug('Received response from LexAI service', {
                hasMessage: !!response.message,
                messageId: response.message?.id,
                responseLength: response.message?.content?.length,
                hasToolCalls: !!response.toolCalls && response.toolCalls.length > 0
            });

            // Check if we received a message
            if (response.message) {
                const finalConversation: LexAIConversation = {
                    ...updatedConversation,
                    messages: [...updatedConversation.messages, response.message],
                    updatedAt: Date.now()
                };

                logDebug('Updating conversation with AI response', { responseId: response.message.id });

                // Update state with AI response
                setConversation(finalConversation);

                // Save conversation
                await LexAIService.saveConversation(finalConversation);
                logDebug('AI response saved to conversation');

                // Scroll to bottom to show AI response
                setTimeout(() => {
                    if (flatListRef.current) {
                        flatListRef.current.scrollToEnd({ animated: true });
                        logDebug('Scrolled to end after AI response');
                    }
                }, 100);

                // Check if there are any tool calls that need to be executed in the component
                if (response.toolCalls && response.toolCalls.length > 0) {
                    logDebug('Received tool calls to execute', {
                        count: response.toolCalls.length,
                        tools: response.toolCalls.map(t => t.toolName)
                    });

                    // Execute component-level tool calls
                    for (const toolCall of response.toolCalls) {
                        // Process tools that need direct component access
                        if (['navigate', 'webSearch', 'openUrl'].includes(toolCall.toolName)) {
                            await handleToolExecution(toolCall);
                        }
                    }
                }
            } else {
                logDebug('No message in response from LexAI service, adding fallback');

                // Handle case where no message is returned
                const errorMessage: LexAIMessage = {
                    id: generateUUID(),
                    role: 'assistant',
                    content: 'I processed your request but couldn\'t generate a proper response. Please try again.',
                    timestamp: Date.now()
                };

                const errorConversation: LexAIConversation = {
                    ...updatedConversation,
                    messages: [...updatedConversation.messages, errorMessage],
                    updatedAt: Date.now()
                };

                setConversation(errorConversation);
                await LexAIService.saveConversation(errorConversation);
            }
        } catch (error: any) {
            logDebug('Error processing message', {
                errorMessage: error?.message || 'Unknown error',
                errorString: String(error)
            });
            console.error('Error processing message:', error);

            // Add error message
            const errorMessage: LexAIMessage = {
                id: generateUUID(),
                role: 'assistant',
                content: 'Sorry, I encountered an error processing your request. Please try again.',
                timestamp: Date.now()
            };

            // Make sure we have a valid conversation to update
            if (conversation) {
                const errorConversation: LexAIConversation = {
                    ...conversation,
                    messages: [...conversation.messages, userMessage, errorMessage],
                    updatedAt: Date.now()
                };

                setConversation(errorConversation);
                await LexAIService.saveConversation(errorConversation);
            }
        } finally {
            setIsLoading(false);
            logDebug('Message handling completed');
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: string) => {
        logDebug('Suggestion clicked', { suggestion });
        setInputMessage(suggestion);
        setShowSuggestions(false);

        // We need to use setTimeout to ensure the input is set before sending
        setTimeout(() => {
            handleSendMessage();
        }, 100);
    };

    // Clear conversation
    const handleClearConversation = async () => {
        logDebug('Clearing conversation');
        const newConversation = LexAIService.initConversation('New Conversation', currentMode);
        logDebug('Created new conversation', { id: newConversation.id });

        setConversation(newConversation);
        await LexAIService.saveConversation(newConversation);
        dispatch(setActiveConversation(newConversation.id));
        handleInitialMessage(newConversation);
    };

    // Toggle debug mode
    const toggleDebugMode = () => {
        setDebugMode(!debugMode);
        logDebug(`Debug mode ${!debugMode ? 'enabled' : 'disabled'}`);

        if (!debugMode) {
            Alert.alert(
                'Debug Mode Enabled',
                `Current conversation ID: ${conversation?.id}\nMessage count: ${conversation?.messages.length}\nMode: ${currentMode}\nAttempt count: ${attemptCount}`,
                [{ text: 'OK' }]
            );
        }
    };

    // Show history drawer with animation
    const handleShowHistory = () => {
        setShowHistory(true);
        Animated.parallel([
            Animated.timing(historyOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(historyTranslateX, {
                toValue: 0,
                duration: 300,
                easing: Easing.out(Easing.back(1.1)),
                useNativeDriver: true,
            }),
        ]).start();
    };

    // Hide history drawer with animation
    const handleHideHistory = () => {
        Animated.parallel([
            Animated.timing(historyOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(historyTranslateX, {
                toValue: 300,
                duration: 300,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start(() => {
            setShowHistory(false);
        });
    };

    // Switch to a different conversation
    const handleSelectConversation = async (selectedConversation: LexAIConversation) => {
        if (selectedConversation.id === conversation?.id) {
            handleHideHistory();
            return;
        }

        logDebug('Switching to different conversation', {
            from: conversation?.id,
            to: selectedConversation.id
        });

        // Set the selected conversation as active
        setConversation(selectedConversation);
        dispatch(setActiveConversation(selectedConversation.id));

        // Update the mode to match the selected conversation
        if (selectedConversation.mode !== currentMode) {
            dispatch(setLexAIMode(selectedConversation.mode));
        }

        handleHideHistory();

        // Scroll to bottom of the selected conversation
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
    };

    // Delete a conversation
    const handleDeleteConversation = async (conversationToDelete: LexAIConversation) => {
        // Confirm delete
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
                            logDebug('Deleting conversation', { id: conversationToDelete.id });

                            // Delete from storage
                            await LexAIService.deleteConversation(conversationToDelete.id);

                            // Update history list
                            setAllConversations(prev =>
                                prev.filter(c => c.id !== conversationToDelete.id)
                            );

                            // If deleting active conversation, create a new one
                            if (conversationToDelete.id === conversation?.id) {
                                const newConversation = LexAIService.initConversation();
                                setConversation(newConversation);
                                await LexAIService.saveConversation(newConversation);
                                dispatch(setActiveConversation(newConversation.id));
                                handleInitialMessage(newConversation);
                            }

                            logDebug('Conversation deleted successfully');
                        } catch (error) {
                            logDebug('Error deleting conversation', { error });
                            console.error('Error deleting conversation:', error);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    // Format date for history display
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    // Get conversation preview
    const getConversationPreview = (conv: LexAIConversation) => {
        // Find the last non-system message
        const userMessages = conv.messages.filter(m => m.role === 'user');
        if (userMessages.length > 0) {
            const lastUserMessage = userMessages[userMessages.length - 1];
            return lastUserMessage.content.length > 40
                ? lastUserMessage.content.substring(0, 40) + '...'
                : lastUserMessage.content;
        }

        // If no user messages, return a default
        return 'New conversation';
    };

    // Create a map of animations for list items
    const historyItemAnimations = useMemo(() => {
        const animations = new Map();
        return {
            getAnimation: (id: string) => {
                if (!animations.has(id)) {
                    animations.set(id, {
                        scale: new Animated.Value(1),
                        opacity: new Animated.Value(1),
                        translateX: new Animated.Value(0)
                    });
                }
                return animations.get(id);
            },
            animateItem: (id: string) => {
                const anim = animations.get(id);
                if (anim) {
                    Animated.sequence([
                        Animated.timing(anim.scale, {
                            toValue: 0.97,
                            duration: 100,
                            useNativeDriver: true,
                            easing: Easing.out(Easing.ease)
                        }),
                        Animated.timing(anim.scale, {
                            toValue: 1,
                            duration: 250,
                            useNativeDriver: true,
                            easing: Easing.elastic(1.2)
                        })
                    ]).start();

                    // Add a subtle horizontal animation
                    Animated.sequence([
                        Animated.timing(anim.translateX, {
                            toValue: -5,
                            duration: 100,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim.translateX, {
                            toValue: 0,
                            duration: 250,
                            useNativeDriver: true,
                            easing: Easing.elastic(1.2)
                        })
                    ]).start();
                }
            }
        };
    }, []);

    // Update the renderHistoryDrawer function with enhanced UI
    const renderHistoryDrawer = () => (
        <Modal
            visible={showHistory}
            transparent={true}
            animationType="none"
            onRequestClose={handleHideHistory}
        >
            <View style={styles.historyModalContainer}>
                <TouchableOpacity
                    style={[
                        styles.historyBackdrop,
                        {
                            backgroundColor: isDarkMode
                                ? 'rgba(10, 20, 35, 0.7)'
                                : 'rgba(0, 0, 0, 0.5)'
                        }
                    ]}
                    activeOpacity={1}
                    onPress={handleHideHistory}
                />
                <Animated.View
                    style={[
                        styles.historyDrawer,
                        {
                            backgroundColor: isDarkMode ? '#121C2E' : '#F5F9FF',
                            transform: [{ translateX: historyTranslateX }],
                            opacity: historyOpacity,
                            borderTopLeftRadius: 16,
                            borderBottomLeftRadius: 16,
                        }
                    ]}
                >
                    <LinearGradient
                        colors={isDarkMode ?
                            ['#1A2740', '#15213A'] :
                            ['#E9F2FF', '#DAEAFF']}
                        style={[
                            styles.historyHeader,
                            {
                                borderBottomWidth: 0,
                                paddingVertical: 18,
                                borderTopLeftRadius: 16
                            }
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <LinearGradient
                                colors={isDarkMode ?
                                    ['#4E7CF6', '#6A5AE0'] :
                                    ['#3E7BFA', '#6A5AE0']}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 12
                                }}
                            >
                                <Ionicons name="time-outline" size={18} color="#FFFFFF" />
                            </LinearGradient>
                            <Text style={[styles.historyTitle, {
                                color: isDarkMode ? '#FFFFFF' : '#16213E',
                                fontSize: 20,
                                fontWeight: '600'
                            }]}>Chat History</Text>
                        </View>
                        <TouchableOpacity
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                            onPress={handleHideHistory}
                        >
                            <Ionicons name="close" size={20} color={isDarkMode ? '#FFFFFF' : '#16213E'} />
                        </TouchableOpacity>
                    </LinearGradient>

                    <FlatList
                        data={allConversations}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => {
                            const animation = historyItemAnimations.getAnimation(item.id);
                            const isActive = item.id === conversation?.id;
                            return (
                                <Animated.View
                                    style={[
                                        styles.historyItemContainer,
                                        {
                                            transform: [
                                                { scale: animation.scale },
                                                { translateX: animation.translateX }
                                            ],
                                            borderBottomWidth: isDarkMode ? 1 : 0,
                                            borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.07)' : 'transparent',
                                            marginHorizontal: 8,
                                            marginVertical: 4
                                        }
                                    ]}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.historyItem,
                                            {
                                                backgroundColor: isActive
                                                    ? (isDarkMode ? 'rgba(62, 123, 250, 0.2)' : 'rgba(62, 123, 250, 0.1)')
                                                    : (isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)'),
                                                borderRadius: 12,
                                                padding: 14,
                                                borderLeftWidth: isActive ? 3 : 0,
                                                borderLeftColor: item.mode === LexAIMode.AGENT ? '#3E7BFA' : '#FF375F',
                                                shadowColor: isActive ? '#3E7BFA' : 'transparent',
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: isActive ? 0.2 : 0,
                                                shadowRadius: 4,
                                                elevation: isActive ? 2 : 0,
                                            }
                                        ]}
                                        onPress={() => {
                                            historyItemAnimations.animateItem(item.id);
                                            handleSelectConversation(item);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.historyItemContent}>
                                            <View style={styles.historyItemHeader}>
                                                <Text style={[styles.historyItemDate, {
                                                    color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                                                    fontSize: 12,
                                                    fontWeight: isActive ? '500' : 'normal'
                                                }]}>
                                                    {formatDate(item.updatedAt)}
                                                </Text>
                                                <LinearGradient
                                                    colors={
                                                        item.mode === LexAIMode.AGENT
                                                            ? ['#4E7CF6', '#3E7BFA']
                                                            : ['#FF375F', '#FF2D55']
                                                    }
                                                    style={{
                                                        paddingHorizontal: 8,
                                                        paddingVertical: 4,
                                                        borderRadius: 12,
                                                        flexDirection: 'row',
                                                        alignItems: 'center'
                                                    }}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                >
                                                    <Text style={{
                                                        color: '#FFFFFF',
                                                        fontSize: 11,
                                                        fontWeight: '600'
                                                    }}>
                                                        {item.mode === LexAIMode.AGENT ? 'Agent' : 'Chat'}
                                                    </Text>
                                                </LinearGradient>
                                            </View>
                                            <Text
                                                style={[styles.historyItemPreview, {
                                                    color: isDarkMode ? colors.text : '#16213E',
                                                    fontWeight: isActive ? '500' : 'normal',
                                                    fontSize: 14,
                                                    marginTop: 6,
                                                    opacity: isActive ? 1 : 0.85
                                                }]}
                                                numberOfLines={2}
                                            >
                                                {getConversationPreview(item)}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                                <Ionicons
                                                    name="chatbubble-outline"
                                                    size={12}
                                                    color={isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'}
                                                    style={{ marginRight: 4 }}
                                                />
                                                <Text style={[styles.historyItemCount, {
                                                    color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                                                    fontSize: 12
                                                }]}>
                                                    {item.messages.filter(m => m.role !== 'system').length} messages
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: isDarkMode ? 'rgba(28, 39, 57, 0.8)' : 'rgba(243, 244, 246, 0.8)',
                                            borderRadius: 22,
                                            width: 38,
                                            height: 38,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            margin: 8,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 2,
                                            elevation: 2,
                                        }}
                                        onPress={() => handleDeleteConversation(item)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name="trash-outline"
                                            size={18}
                                            color={isDarkMode ? '#FF375F' : '#FF3B30'}
                                        />
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        }}
                        contentContainerStyle={[styles.historyList, {
                            padding: 12,
                            paddingTop: 16
                        }]}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View style={[styles.emptyHistoryContainer, {
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: 30,
                                marginTop: 30,
                            }]}>
                                <LinearGradient
                                    colors={isDarkMode ?
                                        ['rgba(62, 123, 250, 0.15)', 'rgba(62, 123, 250, 0.05)'] :
                                        ['rgba(62, 123, 250, 0.1)', 'rgba(62, 123, 250, 0.03)']}
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 40,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginBottom: 20,
                                    }}
                                >
                                    <Ionicons
                                        name="chatbubbles-outline"
                                        size={40}
                                        color={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(62,123,250,0.5)'}
                                    />
                                </LinearGradient>
                                <Text style={[styles.emptyHistoryText, {
                                    color: isDarkMode ? 'rgba(255,255,255,0.8)' : '#16213E',
                                    fontSize: 18,
                                    fontWeight: '600',
                                    marginBottom: 8,
                                }]}>
                                    No conversations yet
                                </Text>
                                <Text style={{
                                    color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                                    fontSize: 14,
                                    textAlign: 'center',
                                    lineHeight: 20,
                                    maxWidth: '80%'
                                }}>
                                    Start a new conversation with LexAI to see your chat history here
                                </Text>
                            </View>
                        )}
                    />

                    <LinearGradient
                        colors={['#3E7BFA', '#6A5AE0']}
                        style={{
                            margin: 16,
                            borderRadius: 14,
                            shadowColor: '#3E7BFA',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: isDarkMode ? 0.4 : 0.3,
                            shadowRadius: 8,
                            elevation: 5,
                        }}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <TouchableOpacity
                            style={{
                                width: '100%',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: 16,
                            }}
                            onPress={handleClearConversation}
                            activeOpacity={0.8}
                        >
                            <View style={{
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: 'rgba(255,255,255,0.25)',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 12
                            }}>
                                <Ionicons name="add" size={20} color="#FFFFFF" />
                            </View>
                            <Text style={{
                                color: '#FFFFFF',
                                fontSize: 16,
                                fontWeight: '600'
                            }}>New Conversation</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>
            </View>
        </Modal>
    );

    // Render a message bubble
    const renderMessage = ({ item }: { item: LexAIMessage | LexAIMessageWithLinks }) => {
        const isUser = item.role === 'user';

        // Check if message has links (for search results)
        const hasLinks = 'links' in item && item.links && item.links.length > 0;

        return (
            <View
                style={[
                    styles.messageBubble,
                    isUser ? styles.userMessage : styles.assistantMessage
                ]}
            >
                {!isUser && (
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={['#3E7BFA', '#6A5AE0']}
                            style={styles.avatar}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Image source={require('../../res/pngs/lexai.png')} style={{ width: Math.min(SCREEN_WIDTH * 0.045, 18), height: Math.min(SCREEN_WIDTH * 0.045, 18), tintColor: "white" }}
                            />
                        </LinearGradient>
                    </View>
                )}
                <View style={[
                    styles.messageContent,
                    isUser ?
                        [styles.userMessageContent, { backgroundColor: colors.userBubble }] :
                        [styles.assistantMessageContent, { backgroundColor: isDarkMode ? colors.aiBubble : 'rgba(255, 255, 255, 0.9)' }]
                ]}>
                    {hasLinks ? (
                        // Render message with clickable links
                        <View>
                            <Text style={[
                                styles.messageText,
                                isUser ?
                                    styles.userMessageText :
                                    { color: colors.text }
                            ]}>
                                {item.content.split('\n\n')[0]} {/* Show the header text */}
                            </Text>

                            {/* Render each search result as a clickable link */}
                            {(item as LexAIMessageWithLinks).links?.map((link: SearchResult, index: number) => (
                                <View key={index} style={styles.searchResultItem}>
                                    <Text style={[styles.searchResultIndex, { color: isUser ? 'rgba(255,255,255,0.8)' : colors.primary }]}>
                                        {index + 1}.
                                    </Text>
                                    <View style={styles.searchResultContent}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                logDebug(`Opening URL: ${link.url}`);
                                                Linking.openURL(link.url);
                                            }}
                                        >
                                            <Text style={[styles.searchResultTitle, { color: colors.primary }]}>
                                                {link.title}
                                            </Text>
                                            <Text style={[styles.searchResultUrl, { color: isUser ? 'rgba(255,255,255,0.6)' : colors.subtext }]}>
                                                {link.url}
                                            </Text>
                                            {link.snippet && (
                                                <Text style={[styles.searchResultSnippet, { color: isUser ? 'rgba(255,255,255,0.8)' : colors.text }]}>
                                                    {link.snippet}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        // Render regular message
                        <Text style={[
                            styles.messageText,
                            isUser ?
                                styles.userMessageText :
                                { color: colors.text }
                        ]}>
                            {item.content}
                        </Text>
                    )}
                    <Text style={[styles.timestamp, { color: isUser ? 'rgba(255,255,255,0.7)' : colors.subtext }]}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {debugMode && ` [ID: ${item.id.slice(0, 4)}]`}
                    </Text>
                </View>
            </View>
        );
    };

    // Render suggestion chips
    const renderSuggestions = () => {
        if (!showSuggestions) return null;

        return (
            <View style={[styles.suggestionsContainer, {
                backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderTopColor: isDarkMode ? '#3A3A3C' : '#E5E7EB'
            }]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestionsScrollContent}
                >
                    {suggestions.map((suggestion, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.suggestionChip, {
                                backgroundColor: isDarkMode ? 'rgba(10, 132, 255, 0.2)' : '#EFF6FF',
                                borderColor: isDarkMode ? 'rgba(10, 132, 255, 0.3)' : '#DBEAFE'
                            }]}
                            onPress={() => handleSuggestionClick(suggestion)}
                        >
                            <Text style={[styles.suggestionText, { color: colors.primary }]}>{suggestion}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    // Render a loading indicator
    const renderLoading = () => {
        if (!isLoading) return null;

        return (
            <View style={styles.loadingContainer}>
                <View style={[styles.loadingBubble, { backgroundColor: isDarkMode ? colors.aiBubble : 'rgba(255, 255, 255, 0.9)' }]}>
                    <View style={styles.loadingDots}>
                        <Animated.View
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: colors.primary,
                                    opacity: dot1Opacity,
                                    transform: [{ scale: dot1Scale }]
                                }
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: colors.primary,
                                    opacity: dot2Opacity,
                                    transform: [{ scale: dot2Scale }]
                                }
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: colors.primary,
                                    opacity: dot3Opacity,
                                    transform: [{ scale: dot3Scale }]
                                }
                            ]}
                        />
                    </View>
                </View>
            </View>
        );
    };

    // Extra spacer component to ensure proper spacing at the end of the list
    const renderFooterSpacer = () => {
        return (
            <View style={{ height: 40 }} />
        );
    };

    // Helper functions for suggestions and greetings
    const getGreeting = () => {
        if (currentMode === LexAIMode.AGENT) {
            return "Hello! I'm LexAI in Agent Mode. I can help with questions, tasks, navigation, searching posts, and more. How can I assist you today?";
        } else {
            return "Hello! I'm LexAI in Simple Chat Mode. I'm here to answer your questions and have a conversation. What would you like to talk about?";
        }
    };

    const getSuggestions = () => {
        return currentMode === LexAIMode.AGENT ? AGENT_SUGGESTIONS : CHAT_SUGGESTIONS;
    };

    const handleSuggestionPress = (suggestion: string) => {
        logDebug('Suggestion clicked', { suggestion });
        setInputMessage(suggestion);
        setShowSuggestions(false);

        // We need to use setTimeout to ensure the input is set before sending
        setTimeout(() => {
            handleSendMessage();
        }, 100);
    };

    /**
     * Handle executing tool calls directly within the component
     * 
     * This function handles tools that require direct access to React Native component features
     * like navigation, linking, etc. It works with the LexAIService through two integration points:
     * 
     * 1. Direct calls from handleSendMessage: When a response includes toolCalls, the function
     *    checks if any require component-level execution and passes them here.
     * 
     * 2. Indirect calls from LexAIService: The executeComponentToolCall property is added to the
     *    LexAIService instance, allowing it to trigger component-level actions from service methods.
     * 
     * Currently supported component-level tools:
     * - navigate: Uses React Navigation to navigate to different screens
     * - webSearch: Shows a message in the chat and executes a web search
     * - openUrl: Opens external URLs via the Linking API
     * 
     * Other tools are handled by LexAIService's own executeToolCall method.
     * 
     * @param toolCall An object containing the tool call details (name and parameters)
     */
    const handleToolExecution = async (toolCall: any) => {
        // Skip if no tool call is provided
        if (!toolCall || !toolCall.toolName) {
            logDebug('No tool call to execute');
            return;
        }

        logDebug('Executing tool call', {
            tool: toolCall.toolName,
            params: toolCall.parameters
        });

        try {
            // Execute different tools based on the tool name
            switch (toolCall.toolName) {
                case 'navigate':
                    // Handle navigation to different screens
                    const { screenName, params } = toolCall.parameters;
                    if (screenName) {
                        logDebug(`Navigating to screen: ${screenName}`, { params });

                        // Special handling for screens inside Tab Navigator
                        const tabScreens = ['Home', 'Search', 'CreatePost'];

                        if (tabScreens.includes(screenName)) {
                            // For screens inside Tab Navigator, use CommonActions
                            navigation.dispatch(
                                CommonActions.navigate({
                                    name: 'Tabs',
                                    params: {
                                        screen: screenName,
                                        params: params || {}
                                    }
                                })
                            );
                            logDebug(`Navigated to Tab screen: ${screenName} via Tabs navigator`);
                        } else {
                            // Direct navigation for screens not in Tab Navigator
                            navigation.dispatch(
                                CommonActions.navigate({
                                    name: screenName,
                                    params: params || {}
                                })
                            );
                            logDebug(`Navigated directly to screen: ${screenName}`);
                        }
                    } else {
                        logDebug('Navigation failed: No screen name provided');
                    }
                    break;

                case 'webSearch':
                    // Handle web search requests
                    if (toolCall.parameters?.query) {
                        logDebug(`Performing web search: ${toolCall.parameters.query}`);

                        // Store the original query for reference
                        const searchQuery = toolCall.parameters.query;

                        // Display a message that we're searching
                        const searchingMessage: LexAIMessageWithLinks = {
                            id: generateUUID(),
                            role: 'assistant',
                            content: `Searching the web for: "${searchQuery}"...`,
                            timestamp: Date.now()
                        };

                        if (conversation) {
                            // First, ensure the user's message requesting the search is preserved
                            // Check if the last message is from the user and contains the search request
                            const lastMessage = conversation.messages[conversation.messages.length - 1];
                            const needsUserMessage = lastMessage.role !== 'user' ||
                                !lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase());

                            // If we need to add a user message (in case it was triggered from a different flow)
                            let updatedConvWithUserMsg = conversation;
                            if (needsUserMessage) {
                                const userMessage: LexAIMessage = {
                                    id: generateUUID(),
                                    role: 'user',
                                    content: `Search for "${searchQuery}"`,
                                    timestamp: Date.now() - 1000 // Slightly earlier timestamp
                                };

                                updatedConvWithUserMsg = {
                                    ...conversation,
                                    messages: [...conversation.messages, userMessage],
                                    updatedAt: Date.now()
                                };

                                // Save the conversation with user message first
                                setConversation(updatedConvWithUserMsg);
                                await LexAIService.saveConversation(updatedConvWithUserMsg);
                            }

                            // Now add the searching message
                            const updatedConv = {
                                ...updatedConvWithUserMsg,
                                messages: [...updatedConvWithUserMsg.messages, searchingMessage],
                                updatedAt: Date.now()
                            };

                            setConversation(updatedConv);
                            await LexAIService.saveConversation(updatedConv);

                            // Fetch search results
                            try {
                                // We're already showing loading message
                                const searchResults = await fetchSearchResults(searchQuery);

                                // Format search results as clickable links in the message
                                let resultsContent = `Here are some results for "${searchQuery}":\n\n`;

                                if (searchResults && searchResults.length > 0) {
                                    searchResults.forEach((result: SearchResult, index: number) => {
                                        // Format clickable links in a way React Native can render
                                        resultsContent += `${index + 1}. ${result.title}\n${result.url}\n\n`;
                                    });

                                    // Add a message with the search results
                                    const resultsMessage: LexAIMessageWithLinks = {
                                        id: generateUUID(),
                                        role: 'assistant',
                                        content: resultsContent,
                                        timestamp: Date.now(),
                                        links: searchResults // Store links separately for rendering
                                    };

                                    // Update conversation with search results
                                    const finalConv = {
                                        ...updatedConv,
                                        messages: [...updatedConv.messages, resultsMessage],
                                        updatedAt: Date.now()
                                    };

                                    setConversation(finalConv);
                                    await LexAIService.saveConversation(finalConv);
                                } else {
                                    // If no results or error, show a message
                                    const noResultsMessage: LexAIMessageWithLinks = {
                                        id: generateUUID(),
                                        role: 'assistant',
                                        content: `I couldn't find any results for "${searchQuery}". Please try a different search query.`,
                                        timestamp: Date.now()
                                    };

                                    const finalConv = {
                                        ...updatedConv,
                                        messages: [...updatedConv.messages, noResultsMessage],
                                        updatedAt: Date.now()
                                    };

                                    setConversation(finalConv);
                                    await LexAIService.saveConversation(finalConv);
                                }
                            } catch (error) {
                                logDebug('Error fetching search results', { error: String(error) });

                                // Add error message
                                const errorMessage: LexAIMessageWithLinks = {
                                    id: generateUUID(),
                                    role: 'assistant',
                                    content: `I encountered an error while searching for "${searchQuery}". Please try again later.`,
                                    timestamp: Date.now()
                                };

                                const errorConv = {
                                    ...updatedConv,
                                    messages: [...updatedConv.messages, errorMessage],
                                    updatedAt: Date.now()
                                };

                                setConversation(errorConv);
                                await LexAIService.saveConversation(errorConv);
                            }
                        }
                    }
                    break;

                case 'openUrl':
                    // Handle opening URLs
                    if (toolCall.parameters?.url) {
                        logDebug(`Opening URL: ${toolCall.parameters.url}`);
                        const isValid = await Linking.canOpenURL(toolCall.parameters.url);

                        if (isValid) {
                            await Linking.openURL(toolCall.parameters.url);
                        } else {
                            logDebug('Cannot open URL: Invalid URL format');

                            // Add a message to inform the user
                            const urlErrorMessage: LexAIMessageWithLinks = {
                                id: generateUUID(),
                                role: 'assistant',
                                content: `I couldn't open the URL: ${toolCall.parameters.url}. It appears to be invalid.`,
                                timestamp: Date.now()
                            };

                            if (conversation) {
                                const updatedConv = {
                                    ...conversation,
                                    messages: [...conversation.messages, urlErrorMessage],
                                    updatedAt: Date.now()
                                };
                                setConversation(updatedConv);
                                await LexAIService.saveConversation(updatedConv);
                            }
                        }
                    }
                    break;

                // Add cases for any other tools that need direct component access
                // e.g., camera access, location, etc.

                default:
                    logDebug(`Tool call ${toolCall.toolName} will be handled by LexAIService`);
                    // Let the LexAIService handle other tool calls
                    break;
            }
        } catch (error) {
            logDebug('Error executing tool call', {
                tool: toolCall.toolName,
                error: String(error)
            });
            console.error('Error executing tool call:', error);
        }
    };

    // Expose tool execution function to LexAIService
    useEffect(() => {
        // Using a temporary approach to expose the function
        // In a production app, you might want to use a context or event system
        // @ts-ignore: Adding a property to the service instance
        LexAIService.executeComponentToolCall = handleToolExecution;

        return () => {
            // Clean up when component unmounts
            // @ts-ignore: Removing the property
            LexAIService.executeComponentToolCall = null;
        };
    }, [navigation, conversation]); // Re-create when these dependencies change

    // Function to fetch search results
    const fetchSearchResults = async (query: string): Promise<SearchResult[]> => {
        logDebug(`Fetching search results for: ${query}`);

        try {
            // Using Google Custom Search JSON API
            // To set up:
            // 1. Create a Google Cloud project: https://console.cloud.google.com/
            // 2. Enable the Custom Search API
            // 3. Create API credentials
            // 4. Create a Custom Search Engine: https://cse.google.com/cse/all

            // Get the API keys from environment variables or config
            // Add these to your .env file or configuration
            const apiKey = Config.GOOGLE_SEARCH_API_KEY || 'YOUR_GOOGLE_API_KEY';
            const searchEngineId = Config.GOOGLE_SEARCH_ENGINE_ID || 'YOUR_SEARCH_ENGINE_ID';

            // Check if keys are properly configured
            if (apiKey === 'YOUR_GOOGLE_API_KEY' || searchEngineId === 'YOUR_SEARCH_ENGINE_ID') {
                logDebug('Google Search API keys not configured', {
                    apiKeyConfigured: apiKey !== 'YOUR_GOOGLE_API_KEY',
                    searchEngineIdConfigured: searchEngineId !== 'YOUR_SEARCH_ENGINE_ID'
                });
                // If keys aren't configured, fall back to a direct Google search
                return [{
                    title: `Search results for "${query}"`,
                    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
                    snippet: `Click here to see search results for "${query}"`
                }];
            }

            const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}`;

            const response = await axios.get(url);

            // Check if we got valid results
            if (response.status !== 200 || !response.data.items || !response.data.items.length) {
                logDebug('No search results or invalid response', {
                    status: response.status,
                    hasItems: !!response.data.items
                });
                return [];
            }

            // Map Google's response format to our SearchResult interface
            return response.data.items.map((item: any) => ({
                title: item.title,
                url: item.link,
                snippet: item.snippet
            })).slice(0, 5); // Limit to 5 results for better UX
        } catch (error) {
            logDebug('Error in Google Search API call', { error: String(error) });
            console.error('Google Search API Error:', error);

            // Fallback to direct Google search if API call fails
            return [
                {
                    title: `Search results for "${query}"`,
                    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
                    snippet: `Click here to see search results for "${query}"`
                }
            ];
        }
    };

    // Function to search posts
    const handlePostSearch = async (query: string): Promise<{ success: boolean, posts: any[], error?: string }> => {
        logDebug(`Searching posts for: ${query}`);

        try {
            // Navigate directly to Search screen with the provided query
            navigation.dispatch(
                CommonActions.navigate({
                    name: 'Tabs',
                    params: {
                        screen: 'Search',
                        params: { searchText: query.trim() }
                    }
                })
            );

            // Return a simple success response
            return {
                success: true,
                posts: [] // We don't need to return actual posts anymore
            };
        } catch (error) {
            logDebug('Error in handlePostSearch', { error: String(error) });
            return {
                success: false,
                posts: [],
                error: 'Failed to navigate to search screen'
            };
        }
    };

    return (
        <SafeAreaView style={[styles.container]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            <LinearGradient
                colors={isDarkMode ?
                    ['#121C2E', '#162238', '#192941'] :
                    ['#F5F9FF', '#EDF4FF', '#E5F0FF']}
                style={{ flex: 1 }}
                start={{ x: 0.1, y: 0.1 }}
                end={{ x: 0.9, y: 0.9 }}
            >
                {/* Enhanced header */}
                <LinearGradient
                    colors={isDarkMode ?
                        ['#1A2740', '#15213A'] :
                        ['#E9F2FF', '#DAEAFF']}
                    style={styles.enhancedHeader}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.headerTitleArea}>
                            <Animated.View style={{
                                marginRight: 8,
                                transform: [
                                    { rotate: spin },
                                    { scale: iconScale }
                                ]
                            }}>
                                <LinearGradient
                                    colors={isDarkMode ?
                                        ['#4E7CF6', '#6A5AE0'] :
                                        ['#3E7BFA', '#6A5AE0']}
                                    style={styles.headerIcon}
                                >
                                    <Image source={require('../../res/pngs/lexai.png')} style={{ width: Math.min(SCREEN_WIDTH * 0.045, 18), height: Math.min(SCREEN_WIDTH * 0.045, 18), tintColor: "white" }}
                                    />
                                </LinearGradient>
                            </Animated.View>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>
                                LexAI {currentMode === LexAIMode.AGENT ? 'Assistant' : 'Chat'}
                            </Text>
                        </View>
                        <View style={styles.headerControls}>
                            <TouchableOpacity
                                style={[styles.headerButton, { marginRight: 12 }]}
                                onPress={() => {
                                    animateIcon();
                                    handleShowHistory();
                                }}
                            >
                                <Ionicons name="time-outline" size={22} color={colors.primary} />
                            </TouchableOpacity>
                            <View style={styles.modeToggleContainer}>
                                <Text style={{ color: colors.subtext, fontSize: 14, marginRight: 8 }}>
                                    {currentMode === LexAIMode.AGENT ? 'Agent' : 'Chat'}
                                </Text>
                                <Switch
                                    value={currentMode === LexAIMode.AGENT}
                                    onValueChange={toggleMode}
                                    trackColor={{ false: '#767577', true: colors.primary }}
                                    thumbColor={'#f4f3f4'}
                                    style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
                                />
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                <FlatList
                    style={styles.messageList}
                    data={conversation?.messages.filter(m => m.role !== 'system')}
                    keyExtractor={(item, index) => `message-${index}`}
                    renderItem={renderMessage}
                    ref={flatListRef}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    ListFooterComponent={
                        <>
                            {renderLoading()}
                            {renderFooterSpacer()}
                        </>
                    }
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={15}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.text }]}>
                                {getGreeting()}
                            </Text>
                            <View style={styles.suggestionsContainer}>
                                {getSuggestions().map((suggestion, index) => (
                                    <TouchableOpacity
                                        key={`suggestion-${index}`}
                                        style={[styles.suggestionChip, { borderColor: colors.inputBorder }]}
                                        onPress={() => handleSuggestionPress(suggestion)}
                                    >
                                        <Text style={[styles.suggestionText, { color: colors.primary }]}>
                                            {suggestion}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
                    style={{ marginTop: 10 }}
                >
                    <View style={[styles.inputContainer, {
                        backgroundColor: isDarkMode ? 'rgba(20, 30, 48, 0.85)' : 'rgba(230, 240, 255, 0.85)',
                        borderTopWidth: 1,
                        borderTopColor: isDarkMode ? 'rgba(26, 39, 64, 0.8)' : 'rgba(218, 234, 255, 0.8)'
                    }]}>
                        <View style={styles.inputRow}>
                            <View style={[styles.inputWrapper, {
                                backgroundColor: isDarkMode ? 'rgba(15, 25, 40, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                                borderColor: isDarkMode ? 'rgba(36, 54, 86, 0.7)' : 'rgba(199, 221, 255, 0.7)'
                            }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Ask me anything..."
                                    placeholderTextColor={colors.subtext}
                                    value={inputMessage}
                                    onChangeText={setInputMessage}
                                    multiline
                                    numberOfLines={1}
                                    ref={inputRef}
                                />
                            </View>
                            <View style={{ position: 'relative' }}>
                                <Animated.View
                                    style={{
                                        position: 'absolute',
                                        width: 60,
                                        height: 60,
                                        borderRadius: 30,
                                        backgroundColor: currentMode === LexAIMode.AGENT ? '#3E7BFA' : '#FF375F',
                                        opacity: !isButtonDisabled ? glowOpacity : 0,
                                        transform: [
                                            { translateX: -7.5 },
                                            { translateY: -7.5 }
                                        ],
                                        zIndex: -1
                                    }}
                                />
                                <Animated.View style={{
                                    transform: [
                                        { scale: sendButtonScale },
                                        { rotate: sendRotation }
                                    ]
                                }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            animateSendButton();
                                            handleSendMessage();
                                        }}
                                        disabled={isButtonDisabled}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={
                                                isButtonDisabled
                                                    ? [isDarkMode ? '#3A3A3C' : '#D1D1D6', isDarkMode ? '#2C2C2E' : '#C7C7CC']
                                                    : currentMode === LexAIMode.AGENT
                                                        ? ['#4E7CF6', '#3E7BFA', '#2563EB']
                                                        : ['#FF375F', '#FF2D55', '#E31B60']
                                            }
                                            style={[
                                                styles.sendButton,
                                                {
                                                    shadowColor: isButtonDisabled
                                                        ? 'transparent'
                                                        : currentMode === LexAIMode.AGENT
                                                            ? '#3E7BFA'
                                                            : '#FF375F',
                                                    shadowOffset: { width: 0, height: 3 },
                                                    shadowOpacity: isDarkMode ? 0.5 : 0.4,
                                                    shadowRadius: 8,
                                                    elevation: 5
                                                }
                                            ]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Ionicons
                                                name="send"
                                                size={20}
                                                color="#fff"
                                                style={{
                                                    transform: [{ translateX: -1 }]
                                                }}
                                            />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </LinearGradient>
            {/* Render history drawer */}
            {renderHistoryDrawer()}
        </SafeAreaView>
    );
};

export default LexAI;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mainContainer: {
        flex: 1,
    },
    enhancedHeader: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitleArea: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(62, 123, 250, 0.1)',
    },
    modeToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(62, 123, 250, 0.08)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    messageList: {
        flex: 1,
        padding: 16,
        paddingBottom: 120, // Increased from 100 to provide more space between last message and input area
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
    },
    messageBubble: {
        maxWidth: '85%',
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    userMessage: {
        alignSelf: 'flex-end',
    },
    assistantMessage: {
        alignSelf: 'flex-start',
    },
    avatarContainer: {
        marginRight: 8,
        marginBottom: 4,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    messageContent: {
        borderRadius: 18,
        padding: 12,
        paddingTop: 10,
        paddingBottom: 8,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 2,
        elevation: 2,
    },
    userMessageContent: {
        borderTopRightRadius: 4,
    },
    assistantMessageContent: {
        borderTopLeftRadius: 4,
    },
    userMessageText: {
        color: '#FFFFFF',
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
        letterSpacing: 0.1,
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
        opacity: 0.7,
    },
    inputContainer: {
        padding: 12,
        borderTopWidth: 1,
    },
    modeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    modeIndicatorIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    modeIndicatorText: {
        fontSize: 12,
        fontWeight: '500',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputWrapper: {
        flex: 1,
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 6,
    },
    input: {
        minHeight: 40,
        maxHeight: 120,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 16,
    },
    sendButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        shadowColor: '#3E7BFA',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 5,
    },
    historyModalContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    historyBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    historyDrawer: {
        width: 300,
        maxWidth: '80%',
        height: '100%',
        position: 'absolute',
        right: 0,
        flex: 1,
        flexDirection: 'column',
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 10,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    historyList: {
        flexGrow: 1,
    },
    historyItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    historyItem: {
        flex: 1,
        padding: 12,
    },
    activeHistoryItem: {
        borderLeftWidth: 3,
        borderLeftColor: '#007AFF',
    },
    historyItemContent: {
        flex: 1,
    },
    historyItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    historyItemDate: {
        fontSize: 12,
    },
    historyItemPreview: {
        fontSize: 14,
        marginBottom: 4,
    },
    historyItemCount: {
        fontSize: 12,
    },
    deleteButton: {
        padding: 10,
        marginRight: 10,
        borderRadius: 8,
    },
    emptyHistoryContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 40,
    },
    emptyHistoryText: {
        fontSize: 16,
        textAlign: 'center',
    },
    newConversationButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        margin: 16,
        borderRadius: 8,
    },
    newConversationText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    loadingContainer: {
        marginVertical: 8,
        alignItems: 'flex-start',
    },
    loadingBubble: {
        padding: 12,
        borderRadius: 16,
        borderTopLeftRadius: 4,
        width: 70,
        alignItems: 'center',
    },
    loadingDots: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        margin: 2,
    },
    dot1: {
        opacity: 0.5,
        transform: [{ scale: 1 }],
    },
    dot2: {
        opacity: 0.5,
        transform: [{ scale: 1 }],
    },
    dot3: {
        opacity: 0.5,
        transform: [{ scale: 1 }],
    },
    suggestionsContainer: {
        paddingVertical: 12,
        borderTopWidth: 1,
    },
    suggestionsScrollContent: {
        paddingHorizontal: 12,
    },
    suggestionChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        marginRight: 8,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
    },
    suggestionText: {
        fontSize: 14,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    searchResultIndex: {
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 8,
    },
    searchResultContent: {
        flex: 1,
    },
    searchResultTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    searchResultUrl: {
        fontSize: 12,
        color: 'blue',
    },
    searchResultSnippet: {
        fontSize: 12,
    },
});