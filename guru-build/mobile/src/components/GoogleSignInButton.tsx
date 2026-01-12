import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleUser } from '../services/googleAuth';

interface GoogleSignInButtonProps {
  onSuccess: (user: GoogleUser) => void;
  onError?: (error: Error) => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
}) => {
  const [isConfigured, setIsConfigured] = React.useState(false);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const configureGoogleSignIn = async () => {
    try {
      // Configure Google Sign-In with offline access to get server auth codes
      // Server auth codes can be exchanged by the backend for refresh tokens
      GoogleSignin.configure({
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // Required for server auth code
        offlineAccess: true, // Request server auth code
        scopes: [
          'profile',
          'email',
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
        ],
      });

      console.log('✅ Google Sign-In configured with offline access');
      console.log('iOS Client ID:', process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
      console.log('Web Client ID:', process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
      setIsConfigured(true);
    } catch (error) {
      console.error('Error configuring Google Sign-In:', error);
      onError?.(error as Error);
    }
  };

  const handlePress = async () => {
    try {
      // Check if device supports Google Play Services (Android only, iOS always returns true)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign in and get user info
      const userInfo = await GoogleSignin.signIn();

      console.log('✅ Sign-in successful');
      console.log('Full userInfo object:', JSON.stringify(userInfo, null, 2));
      console.log('userInfo.user:', userInfo.user);
      console.log('userInfo.data:', userInfo.data);

      // Get access token
      const tokens = await GoogleSignin.getTokens();
      console.log('Access token received:', !!tokens.accessToken);

      // Get server auth code (can be exchanged for refresh token on backend)
      // In v16+, serverAuthCode is inside userInfo.data
      const serverAuthCode = userInfo.data?.serverAuthCode || userInfo.serverAuthCode;
      console.log('Server auth code received:', !!serverAuthCode);
      if (serverAuthCode) {
        console.log('Server auth code preview:', serverAuthCode.substring(0, 20) + '...');
      }

      // Handle different userInfo structures (v16+ returns data.user instead of user)
      const userData = userInfo.data?.user || userInfo.user;

      if (!userData) {
        throw new Error('No user data returned from Google Sign-In');
      }

      // Create GoogleUser object
      const user: GoogleUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name || '',
        picture: userData.photo || undefined,
        accessToken: tokens.accessToken,
        refreshToken: serverAuthCode || undefined, // Backend will exchange this for refresh token
      };

      console.log('Created user object:', { email: user.email, hasToken: !!user.accessToken });
      onSuccess(user);
    } catch (error: any) {
      console.error('❌ Sign-in error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the sign-in flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign-in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        onError?.(new Error('Google Play Services not available'));
      } else {
        onError?.(error);
      }
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      disabled={!isConfigured}
    >
      {!isConfigured ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>Sign in with Google</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
