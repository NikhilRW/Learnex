import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import Route from './routes/Route';
import { Provider } from 'react-redux';
import { persistor, store } from './store/store';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PersistGate } from 'redux-persist/integration/react';
import ThemeListener from './components/user/ThemeListener';
import Loader from './components/auth/Loader';
import { SafeAreaProvider } from "react-native-safe-area-context";
const App = () => {
  useEffect(() => {
    if (Platform.OS === 'android') {
      SplashScreen.hide();
    }
  }, []);
  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Provider store={store}>
            <PersistGate loading={<Loader />} persistor={persistor}>
              <ThemeListener />
              <Route />
            </PersistGate>
          </Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </>
  );
};

export default App;
