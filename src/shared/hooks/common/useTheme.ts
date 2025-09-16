import {useTypedSelector} from '../redux/useTypedSelector';

interface ThemeColors {
  primary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  accent: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

export const useTheme = () => {
  const userTheme = useTypedSelector(state => state.user.theme);
  const isDark = userTheme === 'dark';

  const lightColors: ThemeColors = {
    primary: '#007AFF',
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#333333',
    border: '#e0e0e0',
    notification: '#ff3b30',
    accent: '#5856d6',
    error: '#ff3b30',
    success: '#34c759',
    warning: '#ffcc00',
    info: '#5ac8fa',
  };

  const darkColors: ThemeColors = {
    primary: '#0A84FF',
    background: '#121212',
    card: '#1e1e1e',
    text: '#f5f5f5',
    border: '#2a2a2a',
    notification: '#ff453a',
    accent: '#5e5ce6',
    error: '#ff453a',
    success: '#30d158',
    warning: '#ffd60a',
    info: '#64d2ff',
  };

  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
  };
};
