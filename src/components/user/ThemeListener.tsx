import React, {useEffect} from 'react';
import {Appearance, ColorSchemeName} from 'react-native';
import {useDispatch} from 'react-redux';
import {changeThemeColor} from '../../reducers/User';
import {useTypedDispatch} from '../../hooks/useTypedDispatch';
import {useTypedSelector} from '../../hooks/useTypedSelector';

const ThemeListener = () => {
  const dispatch = useTypedDispatch();
  const customColorPreference = useTypedSelector(
    state => state.user.customColorPrefrence,
  );
  useEffect(() => {
    if (!customColorPreference) {
      dispatch(changeThemeColor(Appearance.getColorScheme()!));
      const listener = (preferences: {colorScheme: ColorSchemeName}) => {
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
