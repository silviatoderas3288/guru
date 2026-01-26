/**
 * Podcast Recommendation API Service
 *
 * Handles personalized recommendations and listening event tracking
 * for the ML-powered recommendation system.
 */

import { API_URL } from './apiConfig';

// === Types ===

export interface PodcastRecommendation {
  podcast_id: string;
  title: string;
  author?: string;
  description?: string;
  categories?: { [key: string]: string };
  artwork?: string;
  score: number;
  reason: string;
}

export interface RecommendationsResponse {
  recommendations: PodcastRecommendation[];
  generated_at: string;
  is_cached: boolean;
  user_profile_age_hours?: number;
  total_interactions?: number;
}

export interface UserProfile {
  has_profile: boolean;
  total_interactions: number;
  total_listening_hours: number;
  profile_version: number;
  last_updated_at?: string;
  preferred_duration_min?: number;
  preferred_duration_max?: number;
  top_categories: string[];
}

export interface ListeningSession {
  session_id: string;
}

export interface SessionProgress {
  status: string;
  completion_rate: number;
}

export interface SessionEnd {
  status: string;
  completion_rate: number;
  listened_minutes: number;
}

export interface ListeningHistoryItem {
  id: string;
  episode_id: string;
  podcast_id: string;
  started_at: string;
  ended_at?: string;
  completion_rate: number;
  listened_duration_seconds: number;
  pause_count: number;
  seek_backward_count: number;
  context?: string;
}

export interface InteractionHistoryItem {
  id: string;
  podcast_id: string;
  episode_id?: string;
  interaction_type: string;
  timestamp: string;
}

export type ListeningContext = 'commute' | 'chore' | 'workout' | 'relaxing' | 'other';

export type InteractionType = 'like' | 'dislike' | 'save' | 'unsave' | 'share';

// === API Service ===

class RecommendationApiService {
  private baseUrl = `${API_URL}/api/v1/recommendations`;

  /**
   * Get personalized podcast recommendations
   *
   * @param limit Number of recommendations (1-50)
   * @param context Listening context for contextual boosting
   * @param forceRefresh Force recomputation instead of using cache
   */
  async getRecommendations(
    limit: number = 20,
    context?: ListeningContext,
    forceRefresh: boolean = false
  ): Promise<PodcastRecommendation[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        refresh: forceRefresh.toString(),
      });
      if (context) {
        params.append('context', context);
      }

      const response = await fetch(`${this.baseUrl}/podcasts?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch recommendations:', response.status);
        return [];
      }

      const data: RecommendationsResponse = await response.json();
      return data.recommendations;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }

  /**
   * Get the user's recommendation profile
   */
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Refresh the user's recommendation profile
   */
  async refreshProfile(): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${this.baseUrl}/profile/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error refreshing profile:', error);
      return null;
    }
  }

  // === Listening Session Tracking ===

  /**
   * Start a listening session
   *
   * Call this when the user starts playing an episode.
   */
  async startListeningSession(
    episodeId: string,
    podcastId: string,
    episodeDurationSeconds: number,
    context?: ListeningContext
  ): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/listening/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episode_id: episodeId,
          podcast_id: podcastId,
          episode_duration_seconds: episodeDurationSeconds,
          context,
        }),
      });

      if (!response.ok) {
        console.error('Failed to start session:', response.status);
        return null;
      }

      const data: ListeningSession = await response.json();
      return data.session_id;
    } catch (error) {
      console.error('Error starting listening session:', error);
      return null;
    }
  }

  /**
   * Update listening progress
   *
   * Call this periodically (e.g., every 30 seconds) while playing.
   */
  async updateListeningSession(
    sessionId: string,
    listenedDurationSeconds: number,
    stats?: {
      pauseCount?: number;
      seekForwardCount?: number;
      seekBackwardCount?: number;
      playbackSpeed?: number;
    }
  ): Promise<SessionProgress | null> {
    try {
      const response = await fetch(`${this.baseUrl}/listening/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listened_duration_seconds: listenedDurationSeconds,
          pause_count: stats?.pauseCount,
          seek_forward_count: stats?.seekForwardCount,
          seek_backward_count: stats?.seekBackwardCount,
          playback_speed: stats?.playbackSpeed,
        }),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating listening session:', error);
      return null;
    }
  }

  /**
   * End a listening session
   *
   * Call this when the user stops playing or the episode ends.
   */
  async endListeningSession(sessionId: string): Promise<SessionEnd | null> {
    try {
      const response = await fetch(`${this.baseUrl}/listening/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error ending listening session:', error);
      return null;
    }
  }

  /**
   * Get listening history
   */
  async getListeningHistory(
    limit: number = 20,
    podcastId?: string
  ): Promise<ListeningHistoryItem[]> {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (podcastId) {
        params.append('podcast_id', podcastId);
      }

      const response = await fetch(`${this.baseUrl}/listening/history?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching listening history:', error);
      return [];
    }
  }

  // === Interaction Tracking ===

  /**
   * Record a user interaction (like, dislike, save, etc.)
   *
   * These signals strongly influence recommendations:
   * - like: Strong positive signal
   * - dislike: Podcast excluded from recommendations
   * - save: Positive signal
   */
  async recordInteraction(
    podcastId: string,
    interactionType: InteractionType,
    episodeId?: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          podcast_id: podcastId,
          episode_id: episodeId,
          interaction_type: interactionType,
        }),
      });

      return response.ok;
    } catch {
      // Silently fail - interaction tracking is non-critical
      return false;
    }
  }

  /**
   * Get interaction history
   */
  async getInteractionHistory(
    limit: number = 50,
    podcastId?: string,
    interactionType?: InteractionType
  ): Promise<InteractionHistoryItem[]> {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (podcastId) {
        params.append('podcast_id', podcastId);
      }
      if (interactionType) {
        params.append('interaction_type', interactionType);
      }

      const response = await fetch(`${this.baseUrl}/interactions?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.interactions || [];
    } catch (error) {
      console.error('Error fetching interaction history:', error);
      return [];
    }
  }

  // === Convenience Methods ===

  /**
   * Like a podcast (strong positive signal)
   */
  async likePodcast(podcastId: string): Promise<boolean> {
    return this.recordInteraction(podcastId, 'like');
  }

  /**
   * Dislike a podcast (will be excluded from recommendations)
   */
  async dislikePodcast(podcastId: string): Promise<boolean> {
    return this.recordInteraction(podcastId, 'dislike');
  }

  /**
   * Record that a podcast was saved
   */
  async recordSave(podcastId: string): Promise<boolean> {
    return this.recordInteraction(podcastId, 'save');
  }

  /**
   * Record that a podcast was shared
   */
  async recordShare(podcastId: string, episodeId?: string): Promise<boolean> {
    return this.recordInteraction(podcastId, 'share', episodeId);
  }
}

// Export singleton instance
export const recommendationApi = new RecommendationApiService();
export default recommendationApi;
