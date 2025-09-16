import React, { useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { changeThemeColor } from 'shared/reducers/User';
import { useTypedDispatch } from '@/shared/hooks/redux/useTypedDispatch';
import { useTypedSelector } from '@/shared/hooks/redux/useTypedSelector';

const ThemeListener = () => {
  const dispatch = useTypedDispatch();
  const customColorPreference = useTypedSelector(
    state => state.user.customColorPrefrence,
  );
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
  }, [dispatch]);
  return null;
};

export default ThemeListener;
