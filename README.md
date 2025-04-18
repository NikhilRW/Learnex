# ![Learnex Logo](/images/logo.jpg) Learnex Mobile App

Learnex is a versatile social media and educational platform designed to enhance learning and foster community interaction. With Learnex, users can explore and participate in various courses, stay updated on upcoming hackathons, and share their experiences through posts, feedback, and discussions. The app allows users to create private rooms for group discussions, chat with friends, and exchange ideas. Trending educational topics can be tracked using hashtags, while users can also share stories, earn rewards, and stay informed about the latest in education and fashion trends. This mobile app project marks the beginning of an exciting journey to create a vibrant, interactive platform for learners worldwide. With a vision of fostering a collaborative environment where individuals can connect, share knowledge, and grow together, Learnex aims to enhance the learning experience through meaningful engagement. Our focus is on building a community-driven app that empowers users to achieve their goals by learning from one another. This is just the start, and we are eager to see Learnex evolve into a tool that truly transforms the way people learn, collaborate, and connect.

# LexAI Tool Execution Implementation

This document explains how tool executions (like navigation, web search, etc.) are integrated in the LexAI application.

## Overview

The LexAI application is designed to handle various tool calls (like navigation, web searches, URL opening) directly from the UI component. This is implemented using a component-level function that executes specific tools requiring direct access to React Native component features.

## Implementation Details

### 1. Tool Execution Handler

The core of this implementation is the `handleToolExecution` function which processes tool calls based on their type:

```javascript
const handleToolExecution = async toolCall => {
  if (!toolCall || !toolCall.toolName) {
    logDebug('No tool call to execute');
    return;
  }

  logDebug('Executing tool call', {
    tool: toolCall.toolName,
    params: toolCall.parameters,
  });

  try {
    // Execute different tools based on the tool name
    switch (toolCall.toolName) {
      case 'navigate':
        // Handle navigation to different screens
        const {screenName, params} = toolCall.parameters;
        if (screenName) {
          // Use React Navigation
          navigation.navigate(screenName, params || {});
        }
        break;

      case 'webSearch':
        // Handle web search requests
        if (toolCall.parameters?.query) {
          // Show message that we're searching
          const searchingMessage = {
            id: generateUUID(),
            role: 'assistant',
            content: `Searching the web for: "${toolCall.parameters.query}"...`,
            timestamp: Date.now(),
          };

          // Update conversation with the searching message
          if (conversation) {
            const updatedConv = {
              ...conversation,
              messages: [...conversation.messages, searchingMessage],
              updatedAt: Date.now(),
            };
            setConversation(updatedConv);
            await LexAIService.saveConversation(updatedConv);
          }
        }
        break;

      case 'openUrl':
        // Handle opening URLs
        if (toolCall.parameters?.url) {
          const isValid = await Linking.canOpenURL(toolCall.parameters.url);

          if (isValid) {
            await Linking.openURL(toolCall.parameters.url);
          } else {
            // Add a message to inform the user of invalid URL
            const urlErrorMessage = {
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

      default:
        // Let the LexAIService handle other tool calls
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
  }
};
```

### 2. Integration with LexAIService

The `handleToolExecution` function is integrated with the LexAIService through two mechanisms:

1. **Direct Calls from handleSendMessage**: When a response from `LexAIService.processMessage()` includes tool calls, the `handleSendMessage` function checks if any require component-level execution:

```javascript
// Inside handleSendMessage
if (response.toolCalls && response.toolCalls.length > 0) {
  // Execute component-level tool calls
  for (const toolCall of response.toolCalls) {
    if (['navigate', 'webSearch', 'openUrl'].includes(toolCall.toolName)) {
      await handleToolExecution(toolCall);
    }
  }
}
```

2. **Service Access via useEffect**: We expose the `handleToolExecution` function to the LexAIService:

```javascript
// Expose tool execution function to LexAIService
useEffect(() => {
  // Add the function to the service instance
  LexAIService.executeComponentToolCall = handleToolExecution;

  return () => {
    // Clean up when component unmounts
    LexAIService.executeComponentToolCall = null;
  };
}, [navigation, conversation]);
```

## Web Search with Google API

The `webSearch` tool now includes full Google Search API integration to provide real search results directly in the conversation.

### Environment Setup

The app uses [react-native-config](https://github.com/luggit/react-native-config) to manage environment variables. To set up the Google Search API:

1. Create a Google Cloud project at https://console.cloud.google.com/
2. Enable the Custom Search API for your project
3. Create API credentials (API Key)
4. Create a Custom Search Engine at https://cse.google.com/cse/all
5. Add the following to your `.env` file in the project root:
   ```
   GOOGLE_SEARCH_API_KEY=your_api_key_here
   GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
   ```

### Installation Steps

1. If not already installed, add react-native-config to your project:

   ```bash
   npm install react-native-config --save
   # or with yarn
   yarn add react-native-config
   ```

2. Link the native modules:

   ```bash
   npx react-native link react-native-config
   ```

3. For Android, add the following to your `android/app/build.gradle` file:

   ```gradle
   apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"
   ```

4. For iOS, run `pod install` in the `ios` directory

### Features

- **Real Search Results**: Fetches actual search results from Google using their Custom Search API
- **Clickable Links**: Results are displayed as clickable links directly in the conversation
- **Rich Result Display**: Each result includes a title, URL, and snippet
- **Fallback Mechanism**: Falls back to direct Google search if API keys aren't configured or if an error occurs
- **Error Handling**: Robust error handling prevents crashes even when API calls fail

### Implementation

```typescript
import Config from 'react-native-config';

// Search Result interface
interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
}

// Function that performs the search
const fetchSearchResults = async (query: string): Promise<SearchResult[]> => {
  // Implementation details
  const apiKey = Config.GOOGLE_SEARCH_API_KEY || 'YOUR_GOOGLE_API_KEY';
  const searchEngineId =
    Config.GOOGLE_SEARCH_ENGINE_ID || 'YOUR_SEARCH_ENGINE_ID';

  // Make API call and process results
  // ...
};
```

Search results are displayed as interactive UI elements that users can tap to open the corresponding web pages.

## Benefits of This Approach

1. **Direct Component Access**: Allows tool execution to access React Native features like navigation and linking that are only available within components.

2. **Controlled API Calls**: Ensures API calls are only made when required, preventing redundant calls.

3. **Separation of Concerns**: Service layer handles backend communication while UI components handle user interface operations.

4. **Clean Implementation**: No need for complex state management libraries just to handle component-specific operations.

5. **Environment Variable Management**: Using react-native-config allows for secure management of API keys across different environments.

## Supported Component-Level Tools

Currently, the following tools are handled at the component level:

- **navigate**: Uses React Navigation to navigate to different screens
- **webSearch**: Shows real Google search results with clickable links in the chat
- **openUrl**: Opens external URLs via the React Native Linking API

All other tools are handled by the LexAIService's own executeToolCall method.

## Usage Example

When a user asks to search for information:

1. The AI generates a `webSearch` tool call with the search query
2. The component executes the search using the Google API
3. Search results appear as clickable links in the conversation
4. User can tap any result to open the corresponding webpage

This provides a seamless in-app search experience without leaving the conversation.
