import {ThemeColors} from '../types/lexAI.types';

/**
 * Light theme colors
 */
export const lightColors: ThemeColors = {
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
  controlsBackground: 'rgba(255, 255, 255, 0.8)',
};

/**
 * Dark theme colors
 */
export const darkColors: ThemeColors = {
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
  controlsBackground: 'rgba(28, 39, 57, 0.8)',
};

/**
 * Get theme colors based on dark mode
 */
export const getThemeColors = (isDarkMode: boolean): ThemeColors => {
  return isDarkMode ? darkColors : lightColors;
};

/**
 * Agent mode suggestions
 */
export const AGENT_SUGGESTIONS = [
  'What can you help me with?',
  'Find posts about React Native',
  'Search for posts about coding',
  'Look for posts by topic',
  'Can you search the web for latest AI trends?',
];

/**
 * Simple chat mode suggestions
 */
export const CHAT_SUGGESTIONS = [
  'What can you help me with?',
  'Explain how React hooks work',
  'Tell me about machine learning',
  "What's the difference between var, let, and const?",
  'Search the web for latest AI trends',
];

/**
 * Tab screens for navigation
 */
export const TAB_SCREENS = ['Home', 'Search', 'CreatePost'];

/**
 * Component-level tools that require direct access to React Native features
 */
export const COMPONENT_TOOLS = [
  'navigate',
  'webSearch',
  'openUrl',
  'createRoom',
  'joinRoom',
  'toggleTheme',
];
