import React from 'react';
import { Provider } from 'react-redux';
import { persistor, store } from 'shared/store/store';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PersistGate } from 'redux-persist/integration/react';
import ThemeListener from 'shared/helpers/ThemeListener';
import Loader from 'auth/components/Loader';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { styles } from 'shared/styles/App';
import { useNavigationContainerRef } from '@react-navigation/native';
import { useAppPermissions } from 'shared/hooks/common/useAppPermissions';
import { useAppStartup } from 'shared/hooks/common/useAppStartup';
import Navigation from './shared/navigation/components/Navigation';

const App = () => {
  const navigationRef = useNavigationContainerRef();
  const permissionsGranted = useAppPermissions();
  useAppStartup(navigationRef, permissionsGranted);

  return (
    <>
      <GestureHandlerRootView style={styles.flex1}>
        <SafeAreaProvider>
          <Provider store={store}>
            <PersistGate loading={<Loader />} persistor={persistor}>
              <ThemeListener />
              <Navigation />
            </PersistGate>
          </Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </>
  );
};

export default App;
