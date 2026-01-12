import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/LoginScreen';
import { MainTabs } from './MainTabs';
import { GoogleUser } from '../services/googleAuth';

export type RootStackParamList = {
  Login: undefined;
  Main: { user: GoogleUser };
};

const Stack = createStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  user: GoogleUser | null;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ user: initialUser }) => {
  console.log('=== AppNavigator: Rendering, user:', initialUser ? initialUser.email : 'null', '===');
  const [user, setUser] = useState(initialUser);

  const handleLoginSuccess = (loggedInUser: GoogleUser) => {
    console.log('=== AppNavigator: Login success ===');
    setUser(loggedInUser);
  };

  console.log('=== AppNavigator: About to render NavigationContainer ===');
  console.log('=== AppNavigator: Will show', !user ? 'Login' : 'Main', 'screen', '===');

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={user ? 'Main' : 'Login'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login">
          {() => <LoginScreen onLoginSuccess={handleLoginSuccess} />}
        </Stack.Screen>
        <Stack.Screen name="Main">
          {() => user && <MainTabs user={user} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};
