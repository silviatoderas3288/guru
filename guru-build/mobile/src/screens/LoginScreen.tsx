import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { GoogleUser, GoogleAuthService } from '../services/googleAuth';
import { CalendarApiService } from '../services/calendarApi';

interface LoginScreenProps {
  onLoginSuccess: (user: GoogleUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [user, setUser] = React.useState<GoogleUser | null>(null);

  const handleSuccess = async (authenticatedUser: GoogleUser) => {
    console.log('Login successful:', authenticatedUser);
    console.log('Has refresh token:', !!authenticatedUser.refreshToken);

    try {
      // Store session locally so user stays logged in
      await GoogleAuthService.storeUserSession(authenticatedUser);

      // Save Google tokens to backend (including refresh token)
      await CalendarApiService.saveGoogleTokens(authenticatedUser.accessToken, authenticatedUser.refreshToken);
      console.log('Tokens saved to backend successfully');
    } catch (error) {
      console.error('Failed to save tokens to backend:', error);
      // Continue anyway - user can still use the app
    }

    // Navigate immediately to the main app
    onLoginSuccess(authenticatedUser);
  };

  const handleError = (error: Error) => {
    console.error('Login error:', error);
    Alert.alert('Login Failed', error.message);
  };

  const getFirstName = (fullName: string | undefined) => {
    if (!fullName) return 'User';
    return fullName.split(' ')[0];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Guru</Text>
        <Text style={styles.subtitle}>
          Your personal productivity & wellness companion
        </Text>

        <View style={styles.buttonContainer}>
          <GoogleSignInButton
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </View>

        <Text style={styles.disclaimer}>
          By signing in, you agree to share your calendar data to help manage your tasks and schedule.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7E8FF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Margarine',
    marginBottom: 8,
    color: '#4D5AEE',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#FF9D00',
    textAlign: 'center',
    marginBottom: 48,
  },
  buttonContainer: {
    marginVertical: 32,
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: 'Margarine',
    color: '#666',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 32,
  },
  welcomeText: {
    fontSize: 48,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    marginBottom: 16,
    textAlign: 'center',
  },
  userName: {
    fontSize: 36,
    fontFamily: 'Margarine',
    color: '#FF9D00',
    marginBottom: 48,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#4D5AEE',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Margarine',
    fontWeight: '700',
    textAlign: 'center',
  },
});
