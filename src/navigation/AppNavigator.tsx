import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import CreateMeetingScreen from '../screens/CreateMeetingScreen';
import RoomScreen from '../screens/RoomScreen';

export type RootStackParamList = {
    CreateMeeting: undefined;
    Room: {
        meeting: any;
        isHost: boolean;
    };
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="CreateMeeting"
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#007AFF',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                <Stack.Screen
                    name="CreateMeeting"
                    component={CreateMeetingScreen}
                    options={{
                        title: 'Create Meeting',
                    }}
                />
                <Stack.Screen
                    name="Room"
                    component={RoomScreen}
                    options={{
                        title: 'Meeting Room',
                        headerLeft: () => null, // Disable back button
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator; 