/**
 * Spotify API service for podcast recommendations and playback
 */

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const SPOTIFY_TOKEN_KEY = '@spotify_access_token';
const SPOTIFY_REFRESH_TOKEN_KEY = '@spotify_refresh_token';
const SPOTIFY_TOKEN_EXPIRY_KEY = '@spotify_token_expiry';

// Spotify OAuth scopes
const SCOPES = [
  'user-library-read',
  'user-read-playback-state',
  'user-read-currently-playing',
  'user-modify-playback-state',
].join(' ');

export interface SpotifyShow {
  id: string;
  name: string;
  publisher: string;
  description: string;
  images: { url: string; height: number; width: number }[];
  total_episodes: number;
  external_urls: { spotify: string };
}

export interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  duration_ms: number;
  release_date: string;
  images: { url: string; height: number; width: number }[];
  external_urls: { spotify: string };
}

export class SpotifyApiService {
  /**
   * Initiate Spotify OAuth flow
   */
  static async signIn(): Promise<string | null> {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'guru',
        path: 'spotify-auth',
      });

      const authUrl = `https://accounts.spotify.com/authorize?` +
        `client_id=${SPOTIFY_CLIENT_ID}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(SCOPES)}`;

      console.log('Spotify Auth URL:', authUrl);
      console.log('Redirect URI:', redirectUri);

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success') {
        const url = result.url;
        const code = new URL(url).searchParams.get('code');

        if (code) {
          // Exchange code for access token via backend
          const response = await fetch(`${API_BASE_URL}/api/v1/spotify/exchange-code`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              redirect_uri: redirectUri,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to exchange code for token');
          }

          const data = await response.json();

          // Save tokens
          await AsyncStorage.setItem(SPOTIFY_TOKEN_KEY, data.access_token);
          if (data.refresh_token) {
            await AsyncStorage.setItem(SPOTIFY_REFRESH_TOKEN_KEY, data.refresh_token);
          }

          const expiryTime = Date.now() + (data.expires_in || 3600) * 1000;
          await AsyncStorage.setItem(SPOTIFY_TOKEN_EXPIRY_KEY, expiryTime.toString());

          return data.access_token;
        }
      }

      return null;
    } catch (error) {
      console.error('Error signing in with Spotify:', error);
      return null;
    }
  }

  /**
   * Get stored access token
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(SPOTIFY_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      return null;
    }
  }

  /**
   * Refresh the access token
   */
  static async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(SPOTIFY_REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        console.error('No refresh token available');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/spotify/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        console.error('Failed to refresh token:', await response.text());
        return null;
      }

      const data = await response.json();
      const newAccessToken = data.access_token;

      // Update stored access token
      await AsyncStorage.setItem(SPOTIFY_TOKEN_KEY, newAccessToken);

      // Update expiry time
      const expiryTime = Date.now() + (data.expires_in || 3600) * 1000;
      await AsyncStorage.setItem(SPOTIFY_TOKEN_EXPIRY_KEY, expiryTime.toString());

      console.log('Spotify access token refreshed successfully');
      return newAccessToken;
    } catch (error) {
      console.error('Error refreshing Spotify access token:', error);
      return null;
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  static async getValidAccessToken(): Promise<string | null> {
    try {
      const accessToken = await this.getAccessToken();
      const expiryTime = await AsyncStorage.getItem(SPOTIFY_TOKEN_EXPIRY_KEY);

      if (!accessToken) {
        return null;
      }

      // Check if token is expired or about to expire (within 5 minutes)
      const now = Date.now();
      const expiry = expiryTime ? parseInt(expiryTime, 10) : 0;
      const isExpiringSoon = expiry - now < 5 * 60 * 1000;

      if (isExpiringSoon) {
        console.log('Token expired or expiring soon, refreshing...');
        return await this.refreshAccessToken();
      }

      return accessToken;
    } catch (error) {
      console.error('Error getting valid Spotify access token:', error);
      return null;
    }
  }

  /**
   * Get user's saved podcast shows
   */
  static async getUserShows(): Promise<SpotifyShow[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/spotify/user-shows`);

      if (!response.ok) {
        throw new Error('Failed to fetch user shows');
      }

      const data = await response.json();
      return data.shows || [];
    } catch (error) {
      console.error('Error fetching user shows:', error);
      return [];
    }
  }

  /**
   * Search for podcasts
   */
  static async searchPodcasts(query: string): Promise<SpotifyShow[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/spotify/search?q=${encodeURIComponent(query)}&type=show`
      );

      if (!response.ok) {
        throw new Error('Failed to search podcasts');
      }

      const data = await response.json();
      return data.shows || [];
    } catch (error) {
      console.error('Error searching podcasts:', error);
      return [];
    }
  }

  /**
   * Get episodes from a show
   */
  static async getShowEpisodes(showId: string): Promise<SpotifyEpisode[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/spotify/shows/${showId}/episodes`);

      if (!response.ok) {
        throw new Error('Failed to fetch show episodes');
      }

      const data = await response.json();
      return data.episodes || [];
    } catch (error) {
      console.error('Error fetching show episodes:', error);
      return [];
    }
  }

  /**
   * Sign out and clear stored data
   */
  static async signOut(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SPOTIFY_TOKEN_KEY);
      await AsyncStorage.removeItem(SPOTIFY_REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(SPOTIFY_TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.error('Error signing out from Spotify:', error);
    }
  }
}
