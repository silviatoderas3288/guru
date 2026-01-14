/**
 * API service for user preferences
 */

import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export interface UserPreferences {
  // Podcast preferences
  podcast_topics?: string[];
  podcast_length?: string;

  // Workout preferences
  workout_types?: string[];
  workout_duration?: string;
  workout_frequency?: string;
  workout_preferred_time?: string;
  workout_days?: string[];

  // Commute and chore preferences
  commute_start?: string;
  commute_end?: string;
  commute_duration?: string;
  chore_time?: string;
  chore_duration?: string;

  // General preferences
  notifications?: string;
  bed_time?: string;
  focus_time_start?: string;
  focus_time_end?: string;
  blocked_apps?: string[];
}

export interface PreferencesSaveRequest extends UserPreferences {
  email: string;
}

export const PreferencesApiService = {
  /**
   * Get user preferences by email
   */
  async getPreferences(email: string): Promise<UserPreferences> {
    try {
      const response = await axios.get(`${API_URL}/api/preferences/${email}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      throw error;
    }
  },

  /**
   * Save or update user preferences
   */
  async savePreferences(preferences: PreferencesSaveRequest): Promise<{ message: string; preferences: UserPreferences }> {
    try {
      const response = await axios.post(`${API_URL}/api/preferences`, preferences);
      return response.data;
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  },
};
