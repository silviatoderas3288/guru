import { create } from 'zustand';
import { UserPreferences } from '../types/UserPreferences';
import { GoogleAuthService } from '../services/googleAuth';

// Use localhost for iOS simulator, or specific IP for Android/Device
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

interface PreferencesState {
  preferences: UserPreferences;
  isModalVisible: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  toggleSettingsModal: (visible?: boolean) => void;
  updatePreference: (key: keyof UserPreferences, value: string[]) => void;
  fetchPreferences: () => Promise<void>;
  savePreferences: () => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: {
    podcastTopics: [],
    podcastLength: [],
    notifications: [],
    workoutTypes: [],
    workoutDuration: [],
    workoutFrequency: [],
    bedTime: [],
    focusTimeStart: [],
    focusTimeEnd: [],
    blockedApps: [],
    commuteStartTime: [],
    commuteEndTime: [],
    commuteMethod: [],
    choreTime: [],
    choreDuration: [],
  },
  isModalVisible: false,
  loading: false,
  error: null,

  toggleSettingsModal: (visible) => {
    set((state) => ({
      isModalVisible: visible !== undefined ? visible : !state.isModalVisible,
    }));
  },

  updatePreference: (key, value) => {
    set((state) => ({
      preferences: { ...state.preferences, [key]: value },
    }));
    // Debounce or save immediately? Let's save immediately for now.
    get().savePreferences();
  },

  fetchPreferences: async () => {
    set({ loading: true, error: null });
    try {
      const storedUser = await GoogleAuthService.getStoredUser();
      if (!storedUser?.email) {
        set({ loading: false });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/preferences/${storedUser.email}`);
      if (response.ok) {
        const data = await response.json();
        set({
          preferences: {
            podcastTopics: data.podcast_topics || [],
            podcastLength: data.podcast_length ? [data.podcast_length] : [],
            notifications: data.notifications ? [data.notifications] : [],
            workoutTypes: data.workout_types || [],
            workoutDuration: data.workout_duration ? [data.workout_duration] : [],
            workoutFrequency: data.workout_frequency ? [data.workout_frequency] : [],
            bedTime: data.bed_time ? [data.bed_time] : [],
            focusTimeStart: data.focus_time_start ? [data.focus_time_start] : [],
            focusTimeEnd: data.focus_time_end ? [data.focus_time_end] : [],
            blockedApps: data.blocked_apps || [],
            commuteStartTime: data.commute_start_time ? [data.commute_start_time] : [],
            commuteEndTime: data.commute_end_time ? [data.commute_end_time] : [],
            commuteMethod: data.commute_method ? [data.commute_method] : [],
            choreTime: data.chore_time ? [data.chore_time] : [],
            choreDuration: data.chore_duration ? [data.chore_duration] : [],
          },
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      set({ loading: false, error: 'Failed to fetch preferences' });
    }
  },

  savePreferences: async () => {
    const { preferences } = get();
    try {
      const storedUser = await GoogleAuthService.getStoredUser();
      if (!storedUser?.email) return;

      const response = await fetch(`${API_BASE_URL}/api/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: storedUser.email,
          podcast_topics: preferences.podcastTopics,
          podcast_length: preferences.podcastLength[0] || null,
          notifications: preferences.notifications[0] || null,
          workout_types: preferences.workoutTypes,
          workout_duration: preferences.workoutDuration[0] || null,
          workout_frequency: preferences.workoutFrequency[0] || null,
          bed_time: preferences.bedTime[0] || null,
          focus_time_start: preferences.focusTimeStart[0] || null,
          focus_time_end: preferences.focusTimeEnd[0] || null,
          blocked_apps: preferences.blockedApps,
          commute_start_time: preferences.commuteStartTime[0] || null,
          commute_end_time: preferences.commuteEndTime[0] || null,
          commute_method: preferences.commuteMethod[0] || null,
          chore_time: preferences.choreTime[0] || null,
          chore_duration: preferences.choreDuration[0] || null,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  },
}));
