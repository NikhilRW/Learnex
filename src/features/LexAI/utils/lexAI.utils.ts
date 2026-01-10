import axios from 'axios';
import Config from 'react-native-config';
import {LexAIConversation} from 'lex-ai/types/lexAITypes';
import {SearchResult} from '../types/lexAI.types';
import {logDebug} from 'lex-ai/utils/common';

/**
 * Format date for history display
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Today, ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
  } else {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

/**
 * Get conversation preview - last user message or default text
 */
export const getConversationPreview = (conv: LexAIConversation): string => {
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

/**
 * Get greeting message based on time of day and mode
 */
export const getGreeting = (userName: string, isAgentMode: boolean): string => {
  // Get the current hour to determine time of day
  const currentHour = new Date().getHours();
  // Create time-based greeting
  let timeGreeting = '';
  if (currentHour >= 5 && currentHour < 12) {
    timeGreeting = `Good morning, ${userName}!`;
  } else if (currentHour >= 12 && currentHour < 18) {
    timeGreeting = `Good afternoon, ${userName}!`;
  } else {
    timeGreeting = `Good evening, ${userName}!`;
  }

  // Add mode-specific message after the time greeting
  if (isAgentMode) {
    return `Hi! I'm LexAI in Agent Mode. I can help with tasks, navigation and searches. How can I assist?`;
  } else {
    return `Hi! I'm LexAI in Chat Mode. What would you like to talk about?`;
  }
};

/**
 * Fetch search results from Google Custom Search API
 */
export const fetchSearchResults = async (
  query: string,
): Promise<SearchResult[]> => {
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
    const searchEngineId =
      Config.GOOGLE_SEARCH_ENGINE_ID || 'YOUR_SEARCH_ENGINE_ID';

    // Check if keys are properly configured
    if (
      apiKey === 'YOUR_GOOGLE_API_KEY' ||
      searchEngineId === 'YOUR_SEARCH_ENGINE_ID'
    ) {
      logDebug('Google Search API keys not configured', {
        apiKeyConfigured: apiKey !== 'YOUR_GOOGLE_API_KEY',
        searchEngineIdConfigured: searchEngineId !== 'YOUR_SEARCH_ENGINE_ID',
      });
      // If keys aren't configured, fall back to a direct Google search
      return [
        {
          title: `Search results for "${query}"`,
          url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          snippet: `Click here to see search results for "${query}"`,
        },
      ];
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}`;

    const response = await axios.get(url);

    // Check if we got valid results
    if (
      response.status !== 200 ||
      !response.data.items ||
      !response.data.items.length
    ) {
      logDebug('No search results or invalid response', {
        status: response.status,
        hasItems: !!response.data.items,
      });
      return [];
    }

    // Map Google's response format to our SearchResult interface
    return response.data.items
      .map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
      }))
      .slice(0, 5); // Limit to 5 results for better UX
  } catch (error) {
    logDebug('Error in Google Search API call', {error: String(error)});
    console.error('Google Search API Error:', error);

    // Fallback to direct Google search if API call fails
    return [
      {
        title: `Search results for "${query}"`,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        snippet: `Click here to see search results for "${query}"`,
      },
    ];
  }
};

/**
 * Check if message is a direct search command
 */
export const isDirectSearchCommand = (message: string): boolean => {
  return message.toLowerCase().startsWith('search ');
};

/**
 * Check if message is a post search request
 */
export const isPostSearchRequest = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.startsWith('find posts ') ||
    lowerMessage.startsWith('search posts ') ||
    lowerMessage.startsWith('look for posts ') ||
    lowerMessage.includes(' posts about ') ||
    lowerMessage.includes('post with ')
  );
};

/**
 * Extract search query from a search command
 */
export const extractSearchQuery = (message: string): string => {
  let searchQuery = message;
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.startsWith('search ')) {
    searchQuery = message.substring(7);
  } else if (lowerMessage.startsWith('find ')) {
    searchQuery = message.substring(5);
  } else if (lowerMessage.startsWith('look up ')) {
    searchQuery = message.substring(8);
  }

  return searchQuery.trim();
};

/**
 * Extract post search query from a post search request
 */
export const extractPostSearchQuery = (message: string): string => {
  let searchQuery = message;
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.startsWith('find posts ')) {
    searchQuery = message.substring(11);
  } else if (lowerMessage.startsWith('search posts ')) {
    searchQuery = message.substring(13);
  } else if (lowerMessage.startsWith('look for posts ')) {
    searchQuery = message.substring(15);
  } else if (lowerMessage.includes(' posts about ')) {
    searchQuery = message.substring(lowerMessage.indexOf(' posts about ') + 13);
  } else if (lowerMessage.includes('post with ')) {
    searchQuery = message.substring(lowerMessage.indexOf('post with ') + 10);
  }

  return searchQuery.trim();
};

/**
 * Check if a search query likely refers to posts
 */
export const isLikelyPostSearch = (query: string): boolean => {
  const postKeywords = [
    'post',
    'posts',
    'article',
    'articles',
    'tutorial',
    'content',
  ];
  return postKeywords.some(keyword => query.toLowerCase().includes(keyword));
};
