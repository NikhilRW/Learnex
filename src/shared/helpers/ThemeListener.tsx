import {useEffect} from 'react';
import {Appearance, ColorSchemeName, Platform} from 'react-native';
import {changeThemeColor} from 'shared/reducers/User';
import {useTypedDispatch} from 'hooks/redux/useTypedDispatch';
import {useTypedSelector} from 'hooks/redux/useTypedSelector';
import {
  selectTheme,
  selectUserCustomColorPreference,
} from 'shared/store/selectors';
import {logger} from 'shared/utils/logger';
import * as NavigationBar from 'expo-navigation-bar';

const ThemeListener = () => {
  const dispatch = useTypedDispatch();
  const customColorPreference = useTypedSelector(
    selectUserCustomColorPreference,
  );
  const theme = useTypedSelector(selectTheme);

  // Effect to update system navigation bar style based on theme
  useEffect(() => {
    const updateNavigationBar = async () => {
      if (Platform.OS === 'android') {
        const isDark = theme === 'dark';
        try {
          // Set the background color of the navigation bar
          await NavigationBar.setBackgroundColorAsync(
            isDark ? '#1a1a1a' : '#ffffff',
          );
          // Set the icon style (light icons on dark bg, dark icons on light bg)
          await NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
        } catch (error) {
          logger.error(
            'Failed to set navigation bar style',
            error,
            'ThemeListener',
          );
        }
      }
    };

    updateNavigationBar();
  }, [theme]);

  useEffect(() => {
    if (!customColorPreference) {
      dispatch(changeThemeColor(Appearance.getColorScheme()!));
      const listener = (preferences: {colorScheme: ColorSchemeName}) => {
          const newTheme = preferences.colorScheme || 'light';
        dispatch(changeThemeColor(newTheme));
      };
      const subscription = Appearance.addChangeListener(listener);
      return () => subscription.remove();
    }
  }, [dispatch, customColorPreference]);

  return null;
};

export default ThemeListener;
