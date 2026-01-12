import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { NextScreen } from './src/screens/NextScreen';
import { Entries } from './src/screens/Entries';
import { GoogleUser, GoogleAuthService } from './src/services/googleAuth';

type Screen = 'home' | 'next' | 'entries';

export default function App() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  const [fontsLoaded] = useFonts({
    'Margarine': require('./assets/fonts/Margarine-Regular.ttf'),
  });

  useEffect(() => {
    checkStoredUser();
  }, []);

  const checkStoredUser = async () => {
    try {
      const storedUser = await GoogleAuthService.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (error) {
      console.error('Error checking stored user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (loggedInUser: GoogleUser) => {
    setUser(loggedInUser);
  };

  if (loading || !fontsLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
        <StatusBar style="auto" />
      </>
    );
  }

  return (
    <>
      {currentScreen === 'home' ? (
        <HomeScreen
          user={user}
          onNavigateToNext={() => setCurrentScreen('next')}
          onNavigateToEntries={() => setCurrentScreen('entries')}
        />
      ) : currentScreen === 'next' ? (
        <NextScreen onGoBack={() => setCurrentScreen('home')} />
      ) : (
        <Entries />
      )}
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
