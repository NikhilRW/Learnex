import React, {forwardRef, useMemo} from 'react';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import Route, {RootStackParamList} from '../routes/Route';
import {DeepLinkHandler} from '@/shared/services/DeepLinkHandler';
import {useTypedSelector} from '@/shared/hooks/redux/useTypedSelector';
import {getDefaultTheme} from '../utils/theme';

const Navigation = forwardRef(
  (_, ref: any & NavigationContainerRef<RootStackParamList>) => {
    const user = useTypedSelector(state => state.user);
    const isDark = user.theme === 'dark';

    const theme = useMemo(
      () => getDefaultTheme({backgroundColor: isDark ? '#1a1a1a' : 'white'}),
      [isDark],
    );
    return (
      <NavigationContainer
        ref={ref}
        theme={theme}
        onReady={() => {
          DeepLinkHandler.checkPendingNavigation();
        }}>
        <Route />
      </NavigationContainer>
    );
  },
);

export default Navigation;
