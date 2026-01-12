import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This is needed for web-based OAuth flow
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_USER_KEY = '@google_user';
const GOOGLE_ACCESS_TOKEN_KEY = '@google_access_token';
const GOOGLE_REFRESH_TOKEN_KEY = '@google_refresh_token';
const GOOGLE_TOKEN_EXPIRY_KEY = '@google_token_expiry';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
  refreshToken?: string;
}

export class GoogleAuthService {
  /**
   * Get the Google OAuth configuration
   * Returns the appropriate client IDs for different platforms
   */
  static getConfig() {
    return {
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      scopes: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
    };
  }

  /**
   * Sign in with Google using Expo AuthSession
   * This works across iOS, Android, and Web
   */
  static async signIn(): Promise<GoogleUser | null> {
    try {
      const config = this.getConfig();

      // Create the auth request
      const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId: config.iosClientId,
        webClientId: config.webClientId,
        androidClientId: config.androidClientId,
        scopes: config.scopes,
      });

      // This will be called from your component
      // For now, return null as this needs to be used in a React component
      return null;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return null;
    }
  }

  /**
   * Get user info from Google using access token
   */
  static async getUserInfo(accessToken: string, refreshToken?: string): Promise<GoogleUser | null> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await response.json();

      const user: GoogleUser = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        accessToken,
        refreshToken,
      };

      // Save user info to AsyncStorage
      await AsyncStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(user));
      await AsyncStorage.setItem(GOOGLE_ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem(GOOGLE_REFRESH_TOKEN_KEY, refreshToken);
      }

      // Set token expiry time (Google tokens typically last 1 hour = 3600 seconds)
      const expiryTime = Date.now() + 3600 * 1000;
      await AsyncStorage.setItem(GOOGLE_TOKEN_EXPIRY_KEY, expiryTime.toString());

      return user;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  /**
   * Store user session data to AsyncStorage
   */
  static async storeUserSession(user: GoogleUser): Promise<void> {
    try {
      await AsyncStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(user));
      await AsyncStorage.setItem(GOOGLE_ACCESS_TOKEN_KEY, user.accessToken);
      if (user.refreshToken) {
        await AsyncStorage.setItem(GOOGLE_REFRESH_TOKEN_KEY, user.refreshToken);
      }
      
      // Set token expiry time (Google tokens typically last 1 hour = 3600 seconds)
      const expiryTime = Date.now() + 3600 * 1000;
      await AsyncStorage.setItem(GOOGLE_TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      console.log('User session stored successfully');
    } catch (error) {
      console.error('Error storing user session:', error);
      throw error;
    }
  }

  /**
   * Get stored user from AsyncStorage
   */
  static async getStoredUser(): Promise<GoogleUser | null> {
    try {
      const userJson = await AsyncStorage.getItem(GOOGLE_USER_KEY);
      if (userJson) {
        return JSON.parse(userJson);
      }
      return null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  /**
   * Get stored access token
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(GOOGLE_ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get stored refresh token
   */
  static async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(GOOGLE_REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Sign out and clear stored data
   */
  static async signOut(): Promise<void> {
    try {
      await AsyncStorage.removeItem(GOOGLE_USER_KEY);
      await AsyncStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(GOOGLE_REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  /**
   * Refresh the access token using the refresh token
   * DEPRECATED: Token refresh is now handled automatically by the backend
   * This method is kept for backward compatibility but will be removed in future versions
   */
  static async refreshAccessToken(): Promise<string | null> {
    console.warn('refreshAccessToken() is deprecated - backend handles token refresh automatically');
    // Return the current access token without refreshing
    // The backend will auto-refresh when needed
    return await this.getAccessToken();
  }

  /**
   * Get a valid access token
   * Note: Token refresh is now handled automatically by the backend
   */
  static async getValidAccessToken(): Promise<string | null> {
    try {
      // Simply return the stored access token
      // The backend will automatically refresh it when making API calls
      const accessToken = await this.getAccessToken();
      return accessToken;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      return null;
    }
  }

  /**
   * Revoke Google access token
   */
  static async revokeAccess(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
        { method: 'POST' }
      );
      return response.ok;
    } catch (error) {
      console.error('Error revoking access:', error);
      return false;
    }
  }
}
