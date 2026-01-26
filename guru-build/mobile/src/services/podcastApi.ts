/**
 * Podcast Index API service for podcast recommendations
 * Free, open podcast API with no authentication required from client
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export interface Podcast {
  id: string;
  name: string;
  author: string;
  description: string;
  artwork: string;
  categories: { [key: string]: string };
  url: string;
  website: string;
  episodeCount: number;
  language: string;
  trendScore?: number;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  datePublished: number;
  duration: number;
  enclosureUrl: string;
  enclosureType?: string;
  image: string;
  feedId: string;
  feedTitle?: string;
  link: string;
}

export class PodcastApiService {
  /**
   * Search for podcasts by term
   * @param languages - Single language code or array of language codes (e.g., 'en' or ['en', 'es'])
   */
  static async searchPodcasts(query: string, limit: number = 20, languages: string | string[] = 'en'): Promise<Podcast[]> {
    try {
      const langParam = Array.isArray(languages) ? languages.join(',') : languages;
      const response = await fetch(
        `${API_BASE_URL}/api/v1/podcasts/search?q=${encodeURIComponent(query)}&limit=${limit}&lang=${langParam}`
      );

      if (!response.ok) {
        throw new Error('Failed to search podcasts');
      }

      const data = await response.json();
      return data.feeds || [];
    } catch (error) {
      console.error('Error searching podcasts:', error);
      return [];
    }
  }

  /**
   * Get trending podcasts
   * @param languages - Single language code or array of language codes (e.g., 'en' or ['en', 'es'])
   */
  static async getTrendingPodcasts(limit: number = 20, category?: string, languages: string | string[] = 'en'): Promise<Podcast[]> {
    try {
      const langParam = Array.isArray(languages) ? languages.join(',') : languages;
      let url = `${API_BASE_URL}/api/v1/podcasts/trending?limit=${limit}&lang=${langParam}`;
      if (category) {
        url += `&category=${encodeURIComponent(category)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch trending podcasts');
      }

      const data = await response.json();
      return data.feeds || [];
    } catch (error) {
      console.error('Error fetching trending podcasts:', error);
      return [];
    }
  }

  /**
   * Get a specific podcast by ID
   */
  static async getPodcastById(podcastId: string): Promise<Podcast | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/podcasts/podcast/${podcastId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch podcast');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching podcast:', error);
      return null;
    }
  }

  /**
   * Get episodes from a specific podcast
   */
  static async getPodcastEpisodes(podcastId: string, limit: number = 50): Promise<PodcastEpisode[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/podcasts/podcast/${podcastId}/episodes?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch podcast episodes');
      }

      const data = await response.json();
      return data.episodes || [];
    } catch (error) {
      console.error('Error fetching podcast episodes:', error);
      return [];
    }
  }

  /**
   * Get all podcast categories
   */
  static async getCategories(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/podcasts/categories`);

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      return data.feeds || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get recently published episodes across all podcasts
   */
  static async getRecentEpisodes(limit: number = 20, category?: string): Promise<PodcastEpisode[]> {
    try {
      let url = `${API_BASE_URL}/api/v1/podcasts/recent?limit=${limit}`;
      if (category) {
        url += `&category=${encodeURIComponent(category)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch recent episodes');
      }

      const data = await response.json();
      return data.episodes || [];
    } catch (error) {
      console.error('Error fetching recent episodes:', error);
      return [];
    }
  }

  /**
   * Format duration from seconds to MM:SS or HH:MM:SS
   */
  static formatDuration(seconds: number): string {
    if (!seconds || seconds < 0) return '00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format Unix timestamp to readable date
   */
  static formatDate(timestamp: number): string {
    if (!timestamp) return '';

    const date = new Date(timestamp * 1000);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Get popular wellness & productivity podcasts
   * Predefined list of high-quality podcasts that match your app's theme
   */
  static async getWellnessPodcasts(): Promise<Podcast[]> {
    const wellnessSearchTerms = [
      'mindfulness',
      'productivity',
      'wellness',
      'meditation',
      'self improvement',
      'mental health'
    ];

    try {
      // Search for a wellness-related term (English only)
      const randomTerm = wellnessSearchTerms[Math.floor(Math.random() * wellnessSearchTerms.length)];
      return await this.searchPodcasts(randomTerm, 10, 'en');
    } catch (error) {
      console.error('Error fetching wellness podcasts:', error);
      return [];
    }
  }
}
