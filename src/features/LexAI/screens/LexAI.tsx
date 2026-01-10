import {LegendList} from '@legendapp/list';
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {TextInput, useColorScheme} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {LexAIMessage, LexAIMode} from 'lex-ai/types/lexAITypes';
import {useSelector} from 'react-redux';
import {styles} from 'lex-ai/styles/LexAI.styles';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';

// Import types
import {RootState, LexAIMessageWithLinks} from '../types/lexAI.types';
import {
  lightColors,
  darkColors,
  AGENT_SUGGESTIONS,
  CHAT_SUGGESTIONS,
} from '../constants/lexAI.constants';

// Import hooks
import {
  useLexAIAnimations,
  useLexAIConversation,
  useLexAIToolExecution,
  useLexAIMessaging,
} from '../hooks';

// Import utils
import {getGreeting} from '../utils/lexAI.utils';

// Import components
import {
  MessageBubble,
  HistoryDrawer,
  ChatHeader,
  ChatInput,
  EmptyState,
  LoadingBubble,
  FooterSpacer,
} from '../components';

const LexAI = () => {
  const systemColorScheme = useColorScheme();

  // Get user theme preference from Redux
  const userTheme = useSelector((state: RootState) => state.user.theme);
  const isDarkMode =
    userTheme === 'dark' ||
    (userTheme === 'system' && systemColorScheme === 'dark');

  // Set theme colors based on dark mode
  const colors = isDarkMode ? darkColors : lightColors;

  // Access the lexAI state from Redux with proper typing
  const currentMode = useSelector((state: RootState) => state.lexAI.mode);

  const [debugMode] = useState(false);
  const flatListRef = useRef<any>(null);
  const inputRef = useRef<TextInput>(null);

  const firebase = useTypedSelector(state => state.firebase.firebase);
  const currentUser = firebase.currentUser();
  const [userName, setUserName] = useState<string>('');

  // Get suggestions based on current mode
  const suggestions =
    currentMode === LexAIMode.AGENT ? AGENT_SUGGESTIONS : CHAT_SUGGESTIONS;

  // Use the animations hook
  const animations = useLexAIAnimations(false, false, '');

  // Use conversation management hook
  const {
    conversation,
    setConversation,
    allConversations,
    showHistory,
    toggleMode,
    handleClearConversation,
    handleSelectConversation,
    handleDeleteConversation,
    handleShowHistory,
    handleHideHistory,
  } = useLexAIConversation({
    currentMode,
    animations,
    flatListRef,
  });

  // Scroll to end helper
  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({animated: true});
      }
    }, 100);
  }, []);

  // Use tool execution hook
  const {handleToolExecution} = useLexAIToolExecution({
    conversation,
    setConversation,
    currentMode,
    isDarkMode,
  });

  // Use messaging hook
  const {
    inputMessage,
    setInputMessage,
    isLoading,
    isStreaming,
    isButtonDisabled,
    handleSendMessage,
    handleSuggestionClick,
  } = useLexAIMessaging({
    conversation,
    setConversation,
    currentMode,
    handleToolExecution,
    scrollToEnd,
  });

  // Fetch user's name when component loads
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        if (currentUser) {
          const {fullName} = await firebase.user.getNameUsernamestring();
          setUserName(fullName || 'User');
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
        setUserName('User');
      }
    };

    fetchUserName();
  }, [currentUser, firebase]);

  // Render message item
  const renderMessage = ({
    item,
  }: {
    item: LexAIMessage | LexAIMessageWithLinks;
  }) => (
    <MessageBubble
      item={item}
      colors={colors}
      isDarkMode={isDarkMode}
      debugMode={debugMode}
    />
  );

  const emptyComponent = useCallback(
    () => (
      <EmptyState
        colors={colors}
        isDarkMode={isDarkMode}
        greeting={getGreeting(userName, currentMode === LexAIMode.AGENT)}
        suggestions={suggestions}
        onSuggestionPress={handleSuggestionClick}
      />
    ),
    [
      isDarkMode,
      suggestions,
      userName,
      currentMode,
      colors,
      handleSuggestionClick,
    ],
  );

  return (
    <SafeAreaView style={[styles.container]}>
      <LinearGradient
        colors={
          isDarkMode
            ? ['#121C2E', '#162238', '#192941']
            : ['#F5F9FF', '#EDF4FF', '#E5F0FF']
        }
        style={styles.mainContainer}
        start={{x: 0.1, y: 0.1}}
        end={{x: 0.9, y: 0.9}}>
        {/* Enhanced header */}
        <ChatHeader
          colors={colors}
          isDarkMode={isDarkMode}
          currentMode={currentMode}
          spin={animations.spin}
          iconScale={animations.iconScale}
          onHistoryPress={() => {
            animations.animateIcon();
            handleShowHistory();
          }}
          onToggleMode={toggleMode}
        />
        <LegendList
          style={styles.messageList}
          data={conversation?.messages.filter(m => m.role !== 'system') || []}
          keyExtractor={(item, index) => `message-${index}`}
          renderItem={renderMessage}
          ref={flatListRef}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({animated: true})
          }
          onLayout={() => flatListRef.current?.scrollToEnd({animated: true})}
          ListFooterComponent={
            <>
              <LoadingBubble
                isLoading={isLoading}
                isStreaming={isStreaming}
                colors={colors}
                dot1Opacity={animations.dot1Opacity}
                dot1Scale={animations.dot1Scale}
                dot1TranslateY={animations.dot1TranslateY}
                dot2Opacity={animations.dot2Opacity}
                dot2Scale={animations.dot2Scale}
                dot2TranslateY={animations.dot2TranslateY}
                dot3Opacity={animations.dot3Opacity}
                dot3Scale={animations.dot3Scale}
                dot3TranslateY={animations.dot3TranslateY}
              />
              <FooterSpacer />
            </>
          }
          showsVerticalScrollIndicator={false}
          estimatedItemSize={100}
          recycleItems={true}
          ListEmptyComponent={emptyComponent}
        />

        <ChatInput
          colors={colors}
          isDarkMode={isDarkMode}
          currentMode={currentMode}
          inputMessage={inputMessage}
          isButtonDisabled={isButtonDisabled}
          inputRef={inputRef}
          sendButtonScale={animations.sendButtonScale}
          sendRotation={animations.sendRotation}
          glowOpacity={animations.glowOpacity}
          onChangeText={setInputMessage}
          onSendPress={() => {
            animations.animateSendButton();
            handleSendMessage();
          }}
        />
      </LinearGradient>

      {/* Render history drawer */}
      <HistoryDrawer
        showHistory={showHistory}
        isDarkMode={isDarkMode}
        colors={colors}
        historyTranslateX={animations.historyTranslateX}
        historyOpacity={animations.historyOpacity}
        allConversations={allConversations}
        currentConversationId={conversation?.id}
        historyItemAnimations={animations.historyItemAnimations}
        onHideHistory={handleHideHistory}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onNewConversation={handleClearConversation}
      />
    </SafeAreaView>
  );
};

export default LexAI;
