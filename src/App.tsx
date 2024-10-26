import React, { useEffect } from 'react'
import { Platform } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import Route from './routes/Route';
import { Provider } from 'react-redux';
import { store } from './store/store';
const App = () => {
  useEffect(() => {
    if (Platform.OS === 'android') {
      SplashScreen.hide();
    };
  }, []);
  return (
    <>
      <Provider store={store}>
        <Route />
      </Provider>
    </>
  )
};

export default App;