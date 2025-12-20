import React, { useEffect } from 'react';
import { Appearance, ColorSchemeName, Platform } from 'react-native';
import { changeThemeColor } from 'shared/reducers/User';
import { useTypedDispatch } from 'hooks/redux/useTypedDispatch';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import * as NavigationBar from 'expo-navigation-bar';

const ThemeListener = () => {
  const dispatch = useTypedDispatch();
  const customColorPreference = useTypedSelector(
    state => state.user.customColorPrefrence,
  );
  const theme = useTypedSelector(state => state.user.theme);

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
          console.log('Failed to set navigation bar style:', error);
        }
      }
    };

    updateNavigationBar();
  }, [theme]);

  useEffect(() => {
    if (!customColorPreference) {
      dispatch(changeThemeColor(Appearance.getColorScheme()!));
      const listener = (preferences: { colorScheme: ColorSchemeName }) => {
        const theme = preferences.colorScheme || 'light';
        dispatch(changeThemeColor(theme));
      };
      const subscription = Appearance.addChangeListener(listener);
      return () => subscription.remove();
    }
  }, [dispatch, customColorPreference]);

  return null;
};

export default ThemeListener;
