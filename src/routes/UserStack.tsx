import { Alert, StyleSheet, Text } from 'react-native'
import Home from '../screens/userscreens/Home'
import { createDrawerNavigator } from '@react-navigation/drawer';
import Loader from '../components/auth/Loader';
import CustomDrawer from '../components/user/NavigationDrawerButton';
import { Button } from 'react-native';
import NavigationDrawer from '../components/user/NavigationDrawer';
import NavigationDrawerButton from '../components/user/NavigationDrawerButton';
const UserStack = () => {
  const Drawer = createDrawerNavigator();
  return (
  <Drawer.Navigator initialRouteName='Home' drawerContent={NavigationDrawer}
  screenOptions={{header: ({ navigation }) => (<NavigationDrawerButton navigation={navigation} tintColor={"red"}/>),
  }}>
    <Drawer.Screen name="Home" component={Home} />
    <Drawer.Screen name="Loader" component={Loader} />
  </Drawer.Navigator>
  )
}

export default UserStack;
const styles = StyleSheet.create({})