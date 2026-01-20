import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { PodcastApiService, Podcast as ApiPodcast, PodcastEpisode as ApiEpisode } from '../services/podcastApi';
import { usePreferencesStore } from '../store/usePreferencesStore';
import schedulingAgentApi, { PodcastScheduleResponse, ScheduledPodcastEpisode } from '../services/schedulingAgentApi';
import { CalendarApiService } from '../services/calendarApi';
import { ListItemApiService, ListItemType } from '../services/listItemApi';

const SettingsIcon = () => (
  <Svg width="19" height="20" viewBox="0 0 19 20" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.54259 1.90589C8.77765 1.88545 9.01579 1.875 9.25659 1.875C9.49739 1.875 9.73553 1.88545 9.97059 1.90589C10.015 1.90974 10.1057 1.95186 10.1415 2.08866L10.5029 3.47028C10.6861 4.17095 11.1893 4.67846 11.7495 4.95591C11.9663 5.06334 12.1755 5.18441 12.3756 5.31804C12.8963 5.66576 13.5881 5.84795 14.287 5.65621L15.6656 5.27794C15.8017 5.24058 15.8837 5.29789 15.9095 5.33448C16.1826 5.7231 16.4223 6.13655 16.6248 6.57067C16.6433 6.6105 16.6525 6.7099 16.5518 6.80933L15.5333 7.81573C15.019 8.32401 14.8305 9.0126 14.8701 9.63647C14.8777 9.75655 14.8816 9.87775 14.8816 10C14.8816 10.1222 14.8777 10.2435 14.8701 10.3635C14.8305 10.9874 15.019 11.676 15.5333 12.1843L16.5518 13.1906C16.6525 13.2901 16.6433 13.3895 16.6248 13.4294C16.4223 13.8635 16.1826 14.2769 15.9095 14.6655C15.8837 14.7021 15.8017 14.7594 15.6656 14.7221L14.287 14.3438C13.5881 14.152 12.8963 14.3342 12.3756 14.682C12.1755 14.8156 11.9663 14.9366 11.7495 15.0441C11.1893 15.3215 10.6861 15.829 10.5029 16.5297L10.1415 17.9114C10.1057 18.0481 10.015 18.0903 9.97059 18.0941C9.73553 18.1145 9.49739 18.125 9.25659 18.125C9.01579 18.125 8.77765 18.1145 8.54259 18.0941C8.49822 18.0903 8.40743 18.0481 8.37165 17.9114L8.01029 16.5296C7.82704 15.829 7.32388 15.3215 6.76374 15.0441C6.54685 14.9366 6.33779 14.8156 6.13768 14.682C5.6169 14.3342 4.9251 14.152 4.2263 14.3438L2.84757 14.7221C2.71143 14.7594 2.62942 14.7021 2.60369 14.6655C2.3306 14.2769 2.09082 13.8635 1.88838 13.4294C1.8698 13.3895 1.86069 13.2901 1.9613 13.1906L2.9799 12.1842C3.4943 11.6759 3.68284 10.9873 3.64314 10.3635C3.63552 10.2434 3.63163 10.1222 3.63163 10C3.63163 9.87778 3.63552 9.75657 3.64314 9.63653C3.68284 9.01266 3.4943 8.32407 2.9799 7.8158L1.9613 6.80933C1.86069 6.70991 1.8698 6.61051 1.88838 6.57069C2.09082 6.13655 2.3306 5.7231 2.6037 5.33448C2.62942 5.29789 2.71143 5.24059 2.84757 5.27794L4.2263 5.65623C4.9251 5.84796 5.6169 5.66577 6.13768 5.31805C6.33779 5.18444 6.54685 5.06336 6.76374 4.95594C7.32387 4.67849 7.82704 4.17097 8.01029 3.47031L8.37165 2.08866C8.40743 1.95186 8.49822 1.90974 8.54259 1.90589ZM9.25659 0C8.96152 0 8.6692 0.0128063 8.3802 0.0379294C7.45173 0.118643 6.76898 0.806303 6.55767 1.61423L6.1963 2.99589C6.17448 3.07936 6.09768 3.19345 5.9315 3.27576C5.64199 3.41916 5.36317 3.58065 5.09649 3.75871C4.94277 3.86135 4.80575 3.87092 4.72243 3.84806L3.34369 3.46976C2.53964 3.24915 1.60443 3.49536 1.0696 4.25644C0.733692 4.73446 0.438462 5.24341 0.18905 5.77828C-0.204659 6.6226 0.0501206 7.55681 0.643442 8.14307L1.66204 9.14954C1.72347 9.21024 1.78364 9.33346 1.77193 9.51749C1.76178 9.67714 1.75663 9.83804 1.75663 10C1.75663 10.162 1.76178 10.3229 1.77193 10.4825C1.78364 10.6665 1.72347 10.7898 1.66204 10.8505L0.643442 11.8569C0.0501193 12.4432 -0.204659 13.3774 0.18905 14.2218C0.43846 14.7566 0.733692 15.2655 1.0696 15.7435C1.60443 16.5046 2.53964 16.7509 3.34369 16.5303L4.72243 16.152C4.80575 16.1291 4.94278 16.1386 5.09649 16.2412C5.36317 16.4194 5.64199 16.5809 5.9315 16.7243C6.09768 16.8065 6.17448 16.9206 6.1963 17.0041L6.55767 18.3857C6.76898 19.1938 7.45173 19.8814 8.3802 19.9621C8.6692 19.9872 8.96152 20 9.25659 20C9.55167 20 9.84398 19.9872 10.133 19.9621C11.0614 19.8814 11.7442 19.1938 11.9555 18.3857L12.3168 17.0041C12.3387 16.9206 12.4155 16.8066 12.5817 16.7243C12.8712 16.5809 13.1501 16.4194 13.4167 16.2412C13.5705 16.1386 13.7075 16.1291 13.7908 16.152L15.1695 16.5303C15.9736 16.7509 16.9087 16.5046 17.4436 15.7436C17.7795 15.2655 18.0747 14.7566 18.3241 14.2218C18.7178 13.3774 18.4631 12.4432 17.8697 11.8569L16.8512 10.8505C16.7897 10.7898 16.7296 10.6666 16.7413 10.4826C16.7515 10.3229 16.7566 10.162 16.7566 10C16.7566 9.83801 16.7515 9.6771 16.7413 9.51742C16.7296 9.3334 16.7897 9.21016 16.8512 9.14948L17.8697 8.14306C18.4631 7.5568 18.7178 6.62259 18.3241 5.77826C18.0747 5.2434 17.7795 4.73445 17.4436 4.25644C16.9087 3.49535 15.9736 3.24915 15.1695 3.46976L13.7908 3.84804C13.7075 3.8709 13.5705 3.86134 13.4167 3.7587C13.1501 3.58062 12.8712 3.41912 12.5817 3.27571C12.4155 3.19341 12.3387 3.07933 12.3168 2.99584L11.9555 1.61423C11.7442 0.8063 11.0614 0.118641 10.133 0.0379282C9.84398 0.0128059 9.55167 0 9.25659 0ZM11.1316 10C11.1316 11.0355 10.2921 11.875 9.25659 11.875C8.22105 11.875 7.38159 11.0355 7.38159 10C7.38159 8.96446 8.22105 8.125 9.25659 8.125C10.2921 8.125 11.1316 8.96446 11.1316 10ZM13.0066 10C13.0066 12.0711 11.3277 13.75 9.25659 13.75C7.18553 13.75 5.50659 12.0711 5.50659 10C5.50659 7.92894 7.18553 6.25 9.25659 6.25C11.3277 6.25 13.0066 7.92894 13.0066 10Z"
      fill="white"
    />
  </Svg>
);

const PlayButtonIcon = () => (
  <Svg width="58" height="58" viewBox="0 0 58 58" fill="none">
    <Circle cx="29" cy="29" r="25" fill="white" fillOpacity="0.2" />
    <Path d="M46.0986 29.4245L19.7631 43.3021L19.9352 15.2252L46.0986 29.4245Z" fill="#FF9D00"/>
  </Svg>
);

interface Podcast {
  id: string;
  title: string;
  artist: string;
  duration: string;
  artwork: string;
  url?: string; // RSS feed URL or podcast website
  website?: string; // Podcast website
}

interface Episode {
  id: string;
  title: string;
  podcast: string;
  duration: string;
  artwork: string;
  podcastArtwork?: string; // Fallback if episode has no image
  link?: string; // Link to episode page
  enclosureUrl?: string; // Direct audio file URL
}

interface PageThreeProps {
  onNavigateToCalendar?: (podcastData: { title: string; link?: string; description?: string }) => void;
}

export const PageThree: React.FC<PageThreeProps> = ({ onNavigateToCalendar }) => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScheduleOptionsModal, setShowScheduleOptionsModal] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [loading, setLoading] = useState(true);
  const { toggleSettingsModal } = usePreferencesStore();

  // AI Scheduling states
  const [showEpisodeSelectionModal, setShowEpisodeSelectionModal] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showAIResultModal, setShowAIResultModal] = useState(false);
  const [showManualOptionsModal, setShowManualOptionsModal] = useState(false);
  const [podcastEpisodes, setPodcastEpisodes] = useState<Episode[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [aiScheduleLoading, setAiScheduleLoading] = useState(false);
  const [aiScheduleResult, setAiScheduleResult] = useState<PodcastScheduleResponse | null>(null);
  const [weekStartDate, setWeekStartDate] = useState(new Date());
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);

  // Saved episodes state
  const [showSavedEpisodesModal, setShowSavedEpisodesModal] = useState(false);
  const [selectedSavedPodcast, setSelectedSavedPodcast] = useState<Podcast | null>(null);
  const [savedEpisodes, setSavedEpisodes] = useState<Episode[]>([]);
  const [loadingSavedEpisodes, setLoadingSavedEpisodes] = useState(false);
  const [isExploringEpisodes, setIsExploringEpisodes] = useState(false);

  // State for podcast data
  const [currentFavorites, setCurrentFavorites] = useState<Podcast[]>([]);
  const [recentEpisodes, setRecentEpisodes] = useState<Episode[]>([]);
  const [recommendations, setRecommendations] = useState<Podcast[]>([]);
  const [savedPodcasts, setSavedPodcasts] = useState<Podcast[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Podcast[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Library API base URL
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

  // Define favorite podcasts (name or ID)
  const FAVORITE_PODCASTS = [
    { type: 'name', value: 'Philosophize This' },
    { type: 'name', value: 'Evil Genius with Russell Kane' },
    { type: 'name', value: 'The Happiness Lab: Getting Unstuck' },
    { type: 'id', value: '646788' }, // You're Dead to Me
    { type: 'name', value: 'Up First NPR' },
    { type: 'name', value: 'The New Yorker Radio Hour' }
  ];

  useEffect(() => {
    loadPodcastData();
  }, []);

  const loadPodcastData = async () => {
    try {
      setLoading(true);

      // Load current favorites by searching for names or fetching by ID
      const favoritesPromises = FAVORITE_PODCASTS.map(async (podcast) => {
        try {
          if (podcast.type === 'id') {
            // Fetch by ID directly
            const result = await PodcastApiService.getPodcastById(podcast.value);
            return result;
          } else {
            // Search by name
            const results = await PodcastApiService.searchPodcasts(podcast.value, 1);
            if (results.length > 0) {
              return results[0];
            }
            return null;
          }
        } catch (error) {
          console.log(`Could not find podcast: ${podcast.value}`);
          return null;
        }
      });

      const favoritePodcasts = (await Promise.all(favoritesPromises)).filter(p => p !== null) as ApiPodcast[];
      const formattedFavorites = favoritePodcasts.map((podcast: ApiPodcast) => {
        console.log(`Podcast: ${podcast.name}, Artwork: ${podcast.artwork}`);
        return {
          id: podcast.id,
          title: podcast.name,
          artist: podcast.author,
          duration: `${Math.floor(Math.random() * 60) + 15} min`,
          artwork: podcast.artwork || 'https://via.placeholder.com/300',
          url: podcast.url,
          website: podcast.website,
        };
      });
      setCurrentFavorites(formattedFavorites);

      // Load recent episodes from favorite podcasts only
      const allEpisodes: any[] = [];
      for (const podcast of favoritePodcasts) {
        try {
          const episodes = await PodcastApiService.getPodcastEpisodes(podcast.id, 3);
          const episodesWithPodcastInfo = episodes.map((episode: ApiEpisode) => ({
            ...episode,
            podcastArtwork: podcast.artwork,
            podcastName: podcast.name,
          }));
          allEpisodes.push(...episodesWithPodcastInfo);
        } catch (error) {
          console.log(`Could not load episodes for podcast: ${podcast.name}`);
        }
      }

      // Sort by date published and take the most recent ones
      allEpisodes.sort((a, b) => b.datePublished - a.datePublished);
      const formattedEpisodes = allEpisodes.slice(0, 10).map((episode: any) => ({
        id: episode.id,
        title: episode.title,
        podcast: episode.podcastName || episode.feedTitle || 'Unknown Podcast',
        duration: PodcastApiService.formatDuration(episode.duration),
        artwork: episode.image || episode.podcastArtwork || 'https://via.placeholder.com/300',
        podcastArtwork: episode.podcastArtwork,
        link: episode.link,
        enclosureUrl: episode.enclosureUrl,
      }));
      setRecentEpisodes(formattedEpisodes);

      // Load recommendations (trending podcasts)
      const trending = await PodcastApiService.getTrendingPodcasts(10);
      const formattedRecommendations = trending.slice(0, 5).map((podcast: ApiPodcast) => ({
        id: podcast.id,
        title: podcast.name,
        artist: podcast.author,
        duration: `${Math.floor(Math.random() * 90) + 20} min`,
        artwork: podcast.artwork || 'https://via.placeholder.com/300',
        url: podcast.url,
        website: podcast.website,
      }));
      setRecommendations(formattedRecommendations);

    } catch (error) {
      console.error('Error loading podcast data:', error);
      Alert.alert('Error', 'Failed to load podcasts. Using sample data.');

      // Fallback to sample data
      setCurrentFavorites([
        { id: '1', title: 'The Daily', artist: 'The New York Times', duration: '30 min', artwork: 'https://via.placeholder.com/300' },
        { id: '2', title: 'How I Built This', artist: 'Guy Raz', duration: '45 min', artwork: 'https://via.placeholder.com/300' },
        { id: '3', title: 'Radiolab', artist: 'WNYC Studios', duration: '60 min', artwork: 'https://via.placeholder.com/300' },
        { id: '4', title: 'Serial', artist: 'This American Life', duration: '40 min', artwork: 'https://via.placeholder.com/300' },
        { id: '5', title: 'TED Talks Daily', artist: 'TED', duration: '15 min', artwork: 'https://via.placeholder.com/300' },
        { id: '6', title: 'Planet Money', artist: 'NPR', duration: '25 min', artwork: 'https://via.placeholder.com/300' },
      ]);
      setRecentEpisodes([
        { id: 'e1', title: 'The Future of AI', podcast: 'TED Talks Daily', duration: '12 min', artwork: 'https://via.placeholder.com/300' },
        { id: 'e2', title: 'Building Airbnb', podcast: 'How I Built This', duration: '48 min', artwork: 'https://via.placeholder.com/300' },
        { id: 'e3', title: 'Climate Crisis', podcast: 'The Daily', duration: '28 min', artwork: 'https://via.placeholder.com/300' },
        { id: 'e4', title: 'Space Exploration', podcast: 'Radiolab', duration: '55 min', artwork: 'https://via.placeholder.com/300' },
        { id: 'e5', title: 'Economic Trends', podcast: 'Planet Money', duration: '22 min', artwork: 'https://via.placeholder.com/300' },
      ]);
      setRecommendations([
        { id: 'r1', title: 'Stuff You Should Know', artist: 'iHeartRadio', duration: '45 min', artwork: 'https://via.placeholder.com/300' },
        { id: 'r2', title: 'The Joe Rogan Experience', artist: 'Joe Rogan', duration: '120 min', artwork: 'https://via.placeholder.com/300' },
        { id: 'r3', title: 'Freakonomics', artist: 'Stephen Dubner', duration: '40 min', artwork: 'https://via.placeholder.com/300' },
        { id: 'r4', title: 'SmartLess', artist: 'Jason Bateman', duration: '50 min', artwork: 'https://via.placeholder.com/300' },
        { id: 'r5', title: 'The Tim Ferriss Show', artist: 'Tim Ferriss', duration: '90 min', artwork: 'https://via.placeholder.com/300' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load saved podcasts from library
  const loadSavedPodcasts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/library/podcasts`);
      if (response.ok) {
        const data = await response.json();
        const formatted = data.map((p: any) => ({
          id: p.external_id,
          title: p.title,
          artist: p.author || 'Unknown',
          duration: '',
          artwork: p.image_url || 'https://via.placeholder.com/300',
          url: p.feed_url,
        }));
        setSavedPodcasts(formatted);
      }
    } catch (error) {
      console.log('Could not load saved podcasts:', error);
    }
  };

  useEffect(() => {
    loadSavedPodcasts();
  }, []);

  // Load saved episodes for a podcast
  const loadSavedEpisodes = async (podcastId: string) => {
    setLoadingSavedEpisodes(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/library/podcasts/${podcastId}/episodes`);
      if (response.ok) {
        const data = await response.json();
        const formatted = data.map((episode: any) => ({
          id: episode.id || episode.external_id,
          title: episode.title,
          podcast: episode.podcast_title || selectedSavedPodcast?.title || 'Unknown',
          duration: episode.duration || 'Unknown',
          artwork: episode.image_url || selectedSavedPodcast?.artwork || 'https://via.placeholder.com/300',
          podcastArtwork: selectedSavedPodcast?.artwork,
          link: episode.link,
          enclosureUrl: episode.enclosure_url,
        }));
        setSavedEpisodes(formatted);
      } else {
        setSavedEpisodes([]);
      }
    } catch (error) {
      console.log('Could not load saved episodes:', error);
      setSavedEpisodes([]);
    } finally {
      setLoadingSavedEpisodes(false);
    }
  };

  // Handle saved podcast click to show episodes
  const handleSavedPodcastClick = async (podcast: Podcast) => {
    setSelectedSavedPodcast(podcast);
    setShowSavedEpisodesModal(true);
    await loadSavedEpisodes(podcast.id);
  };

  // Handle exploring episodes from a saved podcast
  const handleExploreEpisodes = async () => {
    if (!selectedSavedPodcast) return;

    setIsExploringEpisodes(true);
    setLoadingEpisodes(true);
    setShowSavedEpisodesModal(false);
    
    // Set the selected podcast for the episode selection modal
    setSelectedPodcast(selectedSavedPodcast);
    setShowEpisodeSelectionModal(true);

    try {
      const episodes = await PodcastApiService.getPodcastEpisodes(selectedSavedPodcast.id, 20);
      const formatted = episodes.map((episode: ApiEpisode) => ({
        id: String(episode.id),
        title: episode.title,
        podcast: selectedSavedPodcast.title,
        duration: PodcastApiService.formatDuration(episode.duration),
        artwork: episode.image || selectedSavedPodcast.artwork || 'https://via.placeholder.com/300',
        podcastArtwork: selectedSavedPodcast.artwork,
        link: episode.link,
        enclosureUrl: episode.enclosureUrl,
      }));
      setPodcastEpisodes(formatted);
    } catch (error) {
      console.error('Error loading episodes:', error);
      Alert.alert('Error', 'Failed to load episodes');
      setShowEpisodeSelectionModal(false);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  // Search for podcasts
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await PodcastApiService.searchPodcasts(searchQuery, 10);
      const formatted = results.map((podcast: ApiPodcast) => ({
        id: podcast.id,
        title: podcast.name,
        artist: podcast.author,
        duration: '',
        artwork: podcast.artwork || 'https://via.placeholder.com/300',
        url: podcast.url,
        website: podcast.website,
      }));
      setSearchResults(formatted);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search podcasts');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // Save podcast to library
  const handleSavePodcast = async (podcast: Podcast) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/library/podcasts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          external_id: podcast.id,
          title: podcast.title,
          image_url: podcast.artwork,
          author: podcast.artist,
          feed_url: podcast.url,
        }),
      });

      if (response.ok) {
        await loadSavedPodcasts();
      } else {
        const errorData = await response.text();
        console.error('Save error response:', errorData);
        Alert.alert('Error', 'Failed to save podcast. Please try again.');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save podcast. Check your connection and try again.');
    }
  };

  // Remove saved podcast
  const handleRemoveSavedPodcast = (podcast: Podcast) => {
    Alert.alert(
      'Remove Podcast',
      `Remove "${podcast.title}" from your saved list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/v1/library/podcasts/${podcast.id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                loadSavedPodcasts();
              }
            } catch (error) {
              console.error('Remove error:', error);
            }
          },
        },
      ]
    );
  };

  // Check if podcast is saved
  const isPodcastSaved = (podcastId: string) => {
    return savedPodcasts.some(p => p.id === podcastId);
  };

  const handleSchedule = async (podcast: Podcast | Episode) => {
    setSelectedPodcast(podcast as Podcast);
    
    // Load episodes and show episode selection modal directly
    setLoadingEpisodes(true);
    setShowEpisodeSelectionModal(true);

    try {
      const episodes = await PodcastApiService.getPodcastEpisodes((podcast as Podcast).id, 20);
      const formattedEpisodes = episodes.map((episode: ApiEpisode) => ({
        id: String(episode.id),
        title: episode.title,
        podcast: (podcast as Podcast).title,
        duration: PodcastApiService.formatDuration(episode.duration),
        artwork: episode.image || (podcast as Podcast).artwork,
        podcastArtwork: (podcast as Podcast).artwork,
        link: episode.link,
        enclosureUrl: episode.enclosureUrl,
      }));
      setPodcastEpisodes(formattedEpisodes);
    } catch (error) {
      console.error('Error loading episodes:', error);
      Alert.alert('Error', 'Failed to load podcast episodes');
      setShowEpisodeSelectionModal(false);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const handleOpenScheduleOptions = () => {
    setShowScheduleModal(false);
    setShowScheduleOptionsModal(true);
  };

  const handleManualSchedule = () => {
    setShowScheduleOptionsModal(false);
    setShowManualOptionsModal(true);
  };

  const handleManualToday = async () => {
    setShowManualOptionsModal(false);
    if (!selectedPodcast) return;

    try {
      const item = selectedEpisode || selectedPodcast;
      const podcastLink = (item as any).enclosureUrl || (item as any).link || (item as any).website || (item as any).url || '';
      const title = selectedEpisode ? `${selectedEpisode.title} - ${selectedPodcast.title}` : selectedPodcast.title;

      await ListItemApiService.createListItem({
        text: `Listen: ${title}`,
        completed: false,
        item_type: ListItemType.TODO,
        notes: podcastLink ? `Link: ${podcastLink}` : undefined,
      });

      Alert.alert('Added to Today', `"${title}" has been added to your today's todos!`);
    } catch (error) {
      console.error('Error adding to today:', error);
      Alert.alert('Error', 'Failed to add to today\'s list');
    }
  };

  const handleManualWeek = async () => {
    setShowManualOptionsModal(false);
    if (!selectedPodcast) return;

    try {
      const item = selectedEpisode || selectedPodcast;
      const podcastLink = (item as any).enclosureUrl || (item as any).link || (item as any).website || (item as any).url || '';
      const title = selectedEpisode ? `${selectedEpisode.title} - ${selectedPodcast.title}` : selectedPodcast.title;

      await ListItemApiService.createListItem({
        text: `Listen: ${title}`,
        completed: false,
        item_type: ListItemType.WEEKLY_GOAL,
        notes: podcastLink ? `Link: ${podcastLink}` : undefined,
      });

      Alert.alert('Added to Weekly Goals', `"${title}" has been added to your weekly goals!`);
    } catch (error) {
      console.error('Error adding to weekly goals:', error);
      Alert.alert('Error', 'Failed to add to weekly goals');
    }
  };

  const handleManualCalendar = () => {
    setShowManualOptionsModal(false);
    if (!selectedPodcast) return;

    const item = selectedEpisode || selectedPodcast;
    const podcastLink = (item as any).enclosureUrl || (item as any).link || (item as any).website || (item as any).url || '';
    const title = selectedEpisode ? `${selectedEpisode.title} - ${selectedPodcast.title}` : selectedPodcast.title;
    const description = podcastLink ? `Listen: ${podcastLink}` : '';

    if (onNavigateToCalendar) {
      onNavigateToCalendar({
        title: title,
        link: podcastLink,
        description: description,
      });
    } else {
      Alert.alert('Manual Schedule', `Manually scheduling "${title}" to calendar...`);
    }
  };

  const handleAISchedule = async () => {
    setShowScheduleOptionsModal(false);

    if (!selectedPodcast) return;

    // Load episodes for this podcast
    setLoadingEpisodes(true);
    setShowEpisodeSelectionModal(true);

    try {
      const episodes = await PodcastApiService.getPodcastEpisodes(selectedPodcast.id, 10);
      const formattedEpisodes = episodes.map((episode: ApiEpisode) => ({
        id: String(episode.id),
        title: episode.title,
        podcast: selectedPodcast.title,
        duration: PodcastApiService.formatDuration(episode.duration),
        artwork: episode.image || selectedPodcast.artwork,
        podcastArtwork: selectedPodcast.artwork,
        link: episode.link,
        enclosureUrl: episode.enclosureUrl,
      }));
      setPodcastEpisodes(formattedEpisodes);
    } catch (error) {
      console.error('Error loading episodes:', error);
      Alert.alert('Error', 'Failed to load podcast episodes');
      setShowEpisodeSelectionModal(false);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const handleSelectEpisode = (episode: Episode | null) => {
    setSelectedEpisode(episode);
    setShowEpisodeSelectionModal(false);
    setShowDatePickerModal(true);
  };

  const handleSelectAIChoose = () => {
    setSelectedEpisode(null);
    setShowEpisodeSelectionModal(false);
    setShowDatePickerModal(true);
  };

  const handleEpisodeManualSchedule = (episode: Episode) => {
    setSelectedEpisode(episode);
    setShowEpisodeSelectionModal(false);
    setShowManualOptionsModal(true);
  };

  const getWeekStartDate = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setWeekStartDate(getWeekStartDate(newDate));
  };

  const handleGenerateAISchedule = async () => {
    if (!selectedPodcast) return;

    setShowDatePickerModal(false);
    setAiScheduleLoading(true);
    setShowAIResultModal(true);

    try {
      const dateString = weekStartDate.toISOString().split('T')[0];

      const result = await schedulingAgentApi.schedulePodcast({
        weekStartDate: dateString,
        podcastId: selectedPodcast.id,
        podcastTitle: selectedPodcast.title,
        podcastImage: selectedPodcast.artwork,
        selectedEpisodeId: selectedEpisode?.id || undefined,
        scheduleType: 'ai',
      });

      setAiScheduleResult(result);
    } catch (error) {
      console.error('AI scheduling error:', error);
      Alert.alert('Error', 'Failed to generate AI schedule. Please try again.');
      setShowAIResultModal(false);
    } finally {
      setAiScheduleLoading(false);
    }
  };

  const handleAcceptAISchedule = async () => {
    if (!aiScheduleResult?.scheduledEpisodes?.length) return;

    setIsAddingToCalendar(true);

    try {
      let addedCount = 0;

      for (const episode of aiScheduleResult.scheduledEpisodes) {
        if (episode.is_already_scheduled) continue;

        // Create calendar event
        try {
          await CalendarApiService.createCalendarEvent({
            summary: `🎧 ${episode.episode_title}`,
            description: `Podcast: ${episode.podcast_title}\n\nScheduled by AI`,
            start_time: episode.start_time,
            end_time: episode.end_time,
          });
          addedCount++;
        } catch (calError) {
          console.error('Failed to create calendar event:', calError);
        }
      }

      setShowAIResultModal(false);
      setAiScheduleResult(null);

      if (addedCount > 0) {
        Alert.alert('Success', `Added ${addedCount} podcast episode(s) to your calendar!`);
      } else {
        Alert.alert('Info', 'All episodes were already scheduled.');
      }
    } catch (error) {
      console.error('Error accepting schedule:', error);
      Alert.alert('Error', 'Failed to add episodes to calendar.');
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  const formatScheduleTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const handlePlayPodcast = async () => {
    if (!selectedPodcast) return;

    // Determine the best URL to open based on what's available
    let urlToOpen: string | null = null;

    // Check if it's an episode (has 'podcast' property or episode-specific URLs)
    const item = selectedPodcast as any;

    // For episodes, prefer the episode link or audio URL
    if (item.enclosureUrl) {
      urlToOpen = item.enclosureUrl;
    } else if (item.link) {
      urlToOpen = item.link;
    }
    // For podcasts, use the website or RSS feed URL
    else if (item.website) {
      urlToOpen = item.website;
    } else if (item.url) {
      urlToOpen = item.url;
    }

    if (urlToOpen) {
      try {
        const supported = await Linking.canOpenURL(urlToOpen);
        if (supported) {
          await Linking.openURL(urlToOpen);
        } else {
          Alert.alert('Error', 'Cannot open this podcast link');
        }
      } catch (error) {
        console.error('Error opening URL:', error);
        Alert.alert('Error', 'Failed to open podcast');
      }
    } else {
      Alert.alert('Not Available', 'No playback link available for this podcast');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4D5AEE" />
          <Text style={styles.loadingText}>Loading podcasts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with Settings Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.settingsButtonWrapper} onPress={() => toggleSettingsModal(true)}>
          <LinearGradient
                colors={['#FF9D00', '#4D5AEE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.settingsButton}
              >
                <SettingsIcon />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Podcasts</Text>
            <Image
              source={require('../../assets/under_pref.png')}
              style={styles.titleUnderline}
              resizeMode="contain"
            />
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
                <Path
                  d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                  stroke="#999"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <TextInput
                style={styles.searchInput}
                placeholder="Search podcasts..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {searchQuery.length > 0 && (
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results Section */}
          {searchResults.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Search Results</Text>
              <Image
                source={require('../../assets/under_pref.png')}
                style={styles.sectionUnderline}
                resizeMode="contain"
              />
              {isSearching ? (
                <ActivityIndicator size="small" color="#4D5AEE" />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {searchResults.map((podcast, index) => (
                    <TouchableOpacity
                      key={podcast.id}
                      style={styles.recommendationItemWrapper}
                      onPress={() => handleSchedule(podcast)}
                    >
                      <ImageBackground
                        source={require('../../assets/sq.png')}
                        style={styles.squareContainer}
                        resizeMode="stretch"
                        tintColor={index % 2 === 0 ? '#4D5AEE' : '#FF9D00'}
                      >
                        <Image
                          source={{ uri: podcast.artwork }}
                          style={styles.innerSquareImage}
                          resizeMode="cover"
                        />
                      </ImageBackground>
                      <Text style={styles.searchResultTitle} numberOfLines={2}>{podcast.title}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          

          {/* Current Favorites Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Current Favorites</Text>
            <Image
              source={require('../../assets/under_pref.png')}
              style={styles.sectionUnderlineOrange}
              resizeMode="contain"
            />
            <View style={styles.favoritesGrid}>
              {currentFavorites.map((podcast, index) => (
                <TouchableOpacity
                  key={podcast.id}
                  style={styles.favoriteItemWrapper}
                  onPress={() => handleSchedule(podcast)}
                >
                  <ImageBackground
                    source={require('../../assets/sq.png')}
                    style={styles.squareContainer}
                    resizeMode="stretch"
                    tintColor={index % 2 === 0 ? '#FF9D00' : '#4D5AEE'}
                  >
                    <Image
                      source={{ uri: podcast.artwork }}
                      style={styles.innerSquareImage}
                      resizeMode="cover"
                    />
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Episodes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Episodes</Text>
            <Image
              source={require('../../assets/under_pref.png')}
              style={styles.sectionUnderlineOrange}
              resizeMode="contain"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {recentEpisodes.map((episode, index) => (
                <TouchableOpacity
                  key={episode.id}
                  style={styles.episodeItemWrapper}
                  onPress={() => handleSchedule(episode)}
                >
                  <View>
                    <ImageBackground
                      source={require('../../assets/rect.png')}
                      style={styles.rectContainer}
                      resizeMode="stretch"
                      tintColor={index % 2 === 0 ? '#FF3B30' : '#4D5AEE'}
                    >
                      <Image
                        source={{ uri: episode.artwork }}
                        style={styles.innerRectImage}
                        resizeMode="cover"
                      />
                    </ImageBackground>
                    <View style={styles.episodeTitleContainer}>
                      <Text style={styles.episodeTitle} numberOfLines={2}>
                        {episode.title}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {/* Saved Podcasts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Saved Podcasts</Text>
            <Image
              source={require('../../assets/under_pref.png')}
              style={styles.sectionUnderlineOrange}
              resizeMode="contain"
            />
            {savedPodcasts.length > 0 ? (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {savedPodcasts.map((podcast, index) => (
                    <TouchableOpacity
                      key={podcast.id}
                      style={styles.recommendationItemWrapper}
                      onPress={() => handleSavedPodcastClick(podcast)}
                      onLongPress={() => handleRemoveSavedPodcast(podcast)}
                    >
                      <ImageBackground
                        source={require('../../assets/sq.png')}
                        style={styles.squareContainer}
                        resizeMode="stretch"
                        tintColor={index % 2 === 0 ? '#FF3B30' : '#4D5AEE'}
                      >
                        <Image
                          source={{ uri: podcast.artwork }}
                          style={styles.innerSquareImage}
                          resizeMode="cover"
                        />
                      </ImageBackground>
                      <Text style={styles.searchResultTitle} numberOfLines={2}>{podcast.title}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.savedHint}>Tap to view episodes • Long press to remove</Text>
              </>
            ) : (
              <Text style={styles.emptyStateText}>No saved podcasts yet</Text>
            )}
          </View>

          {/* Podcasts You Might Like Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Podcasts You Might Like</Text>
            <Image
              source={require('../../assets/under_pref.png')}
              style={styles.sectionUnderlineOrange}
              resizeMode="contain"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {recommendations.map((podcast, index) => (
                <TouchableOpacity
                  key={podcast.id}
                  style={styles.recommendationItemWrapper}
                  onPress={() => handleSchedule(podcast)}
                >
                  <ImageBackground
                    source={require('../../assets/sq.png')}
                    style={styles.squareContainer}
                    resizeMode="stretch"
                    tintColor={index % 2 === 0 ? '#FF9D00' : '#4D5AEE'}
                  >
                    <Image
                      source={{ uri: podcast.artwork }}
                      style={styles.innerSquareImage}
                      resizeMode="cover"
                    />
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

         

      {/* Main Podcast Modal */}
      <Modal
        visible={showScheduleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowScheduleModal(false)}
        >
          <Pressable style={styles.modalContent}>
            {/* Close X Button in top left */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowScheduleModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Podcast Image with square border */}
            <View style={styles.modalImageContainer}>
              <ImageBackground
                source={require('../../assets/sq.png')}
                style={styles.modalSquareContainer}
                resizeMode="stretch"
                tintColor="#FF9D00"
              >
                <Image
                  source={{ uri: selectedPodcast?.artwork || 'https://via.placeholder.com/300' }}
                  style={styles.modalInnerSquareImage}
                  resizeMode="cover"
                />
              </ImageBackground>
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>{selectedPodcast?.title || 'Select a podcast'}</Text>

            {/* Play Button */}
            <TouchableOpacity
              style={styles.modalPlayButtonContainer}
              onPress={handlePlayPodcast}
            >
              <PlayButtonIcon />
            </TouchableOpacity>

            {/* Schedule Button */}
            <TouchableOpacity
              style={styles.modalScheduleButton}
              onPress={handleOpenScheduleOptions}
            >
              <Text style={styles.modalScheduleButtonText}>Schedule</Text>
            </TouchableOpacity>

            {/* Save Button */}
            {selectedPodcast && (
              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  isPodcastSaved(selectedPodcast.id) && styles.modalSaveButtonSaved
                ]}
                onPress={() => {
                  if (isPodcastSaved(selectedPodcast.id)) {
                    handleRemoveSavedPodcast(selectedPodcast);
                  } else {
                    handleSavePodcast(selectedPodcast);
                  }
                }}
              >
                <Text style={styles.modalSaveButtonText}>
                  {isPodcastSaved(selectedPodcast.id) ? '♥ Saved' : '♡ Save to Library'}
                </Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Schedule Options Modal (AI or Manual) */}
      <Modal
        visible={showScheduleOptionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScheduleOptionsModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowScheduleOptionsModal(false)}
        >
          <Pressable style={styles.scheduleOptionsContent}>
            {/* Close X Button in top left */}
            <TouchableOpacity
              style={styles.scheduleCloseButton}
              onPress={() => setShowScheduleOptionsModal(false)}
            >
              <Text style={styles.scheduleCloseButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.scheduleOptionsTitle}>How would you like to schedule?</Text>

            <TouchableOpacity
              style={styles.aiScheduleButton}
              onPress={handleAISchedule}
            >
              <LinearGradient
                colors={['#FF9D00', '#4D5AEE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aiScheduleGradient}
              >
                <Image
                  source={require('../../assets/ai.png')}
                  style={styles.aiScheduleIcon}
                  resizeMode="contain"
                />
                <Text style={styles.aiScheduleText}>AI Schedule</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manualScheduleButton}
              onPress={handleManualSchedule}
            >
              <Text style={styles.manualScheduleText}>Manual Schedule</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Manual Schedule Options Modal (Today/Week/Calendar) */}
      <Modal
        visible={showManualOptionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowManualOptionsModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowManualOptionsModal(false)}
        >
          <Pressable style={styles.scheduleOptionsContent}>
            <TouchableOpacity
              style={styles.scheduleCloseButton}
              onPress={() => setShowManualOptionsModal(false)}
            >
              <Text style={styles.scheduleCloseButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.scheduleOptionsTitle}>Schedule as...</Text>

            <TouchableOpacity
              style={styles.manualOptionButton}
              onPress={handleManualToday}
            >
              <Text style={styles.manualOptionText}>📋 Add to Today's Todos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manualOptionButton}
              onPress={handleManualWeek}
            >
              <Text style={styles.manualOptionText}>🎯 Add to Weekly Goals</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manualOptionButton}
              onPress={handleManualCalendar}
            >
              <Text style={styles.manualOptionText}>📅 Add to Calendar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Episode Selection Modal */}
      <Modal
        visible={showEpisodeSelectionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEpisodeSelectionModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowEpisodeSelectionModal(false)}
        >
          <Pressable style={styles.episodeSelectionContent}>
            <TouchableOpacity
              style={styles.scheduleCloseButton}
              onPress={() => setShowEpisodeSelectionModal(false)}
            >
              <Text style={styles.scheduleCloseButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.scheduleOptionsTitle}>Select an Episode</Text>
            <Text style={styles.episodeSubtitle}>Choose a specific episode or let AI pick the best one</Text>

            {loadingEpisodes ? (
              <View style={styles.loadingEpisodesContainer}>
                <ActivityIndicator size="large" color="#4D5AEE" />
                <Text style={styles.loadingEpisodesText}>Loading episodes...</Text>
              </View>
            ) : (
              <ScrollView style={styles.episodesList} showsVerticalScrollIndicator={false}>
                {/* AI Choose Option */}
                <TouchableOpacity
                  style={styles.aiChooseButton}
                  onPress={handleSelectAIChoose}
                >
                  <LinearGradient
                    colors={['#FF9D00', '#4D5AEE']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.aiChooseGradient}
                  >
                    <Text style={styles.aiChooseText}>✨ Let AI Choose</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Manual Schedule Option */}
                <TouchableOpacity
                  style={styles.manualScheduleButton}
                  onPress={() => {
                    setShowEpisodeSelectionModal(false);
                    setShowScheduleOptionsModal(true);
                  }}
                >
                  <LinearGradient
                    colors={['#4D5AEE', '#FF9D00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.manualScheduleGradient}
                  >
                    <Text style={styles.manualScheduleText}>📋 Manual Schedule</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Episode List */}
                {podcastEpisodes.map((episode) => (
                  <View key={episode.id} style={styles.episodeItemContainer}>
                    <TouchableOpacity
                      style={styles.episodeItem}
                      onPress={() => handleSelectEpisode(episode)}
                    >
                      <Image
                        source={{ uri: episode.artwork }}
                        style={styles.episodeItemImage}
                      />
                      <View style={styles.episodeItemInfo}>
                        <Text style={styles.episodeItemTitle} numberOfLines={2}>
                          {episode.title}
                        </Text>
                        <Text style={styles.episodeItemDuration}>{episode.duration}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.episodeManualButton}
                      onPress={() => handleEpisodeManualSchedule(episode)}
                    >
                      <Text style={styles.episodeManualButtonText}>+ Add Manually</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDatePickerModal(false)}
        >
          <Pressable style={styles.datePickerContent}>
            <TouchableOpacity
              style={styles.scheduleCloseButton}
              onPress={() => setShowDatePickerModal(false)}
            >
              <Text style={styles.scheduleCloseButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.scheduleOptionsTitle}>Select Week</Text>
            <Text style={styles.episodeSubtitle}>
              {selectedEpisode ? `Scheduling: ${selectedEpisode.title}` : 'AI will choose the best episode'}
            </Text>

            {/* Week Navigation */}
            <View style={styles.weekNavigator}>
              <TouchableOpacity onPress={() => navigateWeek('prev')} style={styles.weekNavButton}>
                <Text style={styles.weekNavText}>◀</Text>
              </TouchableOpacity>

              <View style={styles.weekDisplay}>
                <Text style={styles.weekText}>
                  Week of {weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>

              <TouchableOpacity onPress={() => navigateWeek('next')} style={styles.weekNavButton}>
                <Text style={styles.weekNavText}>▶</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Select Buttons */}
            <View style={styles.quickSelectContainer}>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => setWeekStartDate(getWeekStartDate(new Date()))}
              >
                <Text style={styles.quickSelectText}>This Week</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setWeekStartDate(getWeekStartDate(nextWeek));
                }}
              >
                <Text style={styles.quickSelectText}>Next Week</Text>
              </TouchableOpacity>
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateAISchedule}
            >
              <LinearGradient
                colors={['#FF9D00', '#4D5AEE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.generateGradient}
              >
                <Text style={styles.generateText}>Generate Schedule</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Saved Episodes Modal */}
      <Modal
        visible={showSavedEpisodesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSavedEpisodesModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSavedEpisodesModal(false)}
        >
          <Pressable style={styles.episodeSelectionContent}>
            <TouchableOpacity
              style={styles.scheduleCloseButton}
              onPress={() => setShowSavedEpisodesModal(false)}
            >
              <Text style={styles.scheduleCloseButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.scheduleOptionsTitle}>
              {selectedSavedPodcast?.title}
            </Text>
            <Text style={styles.episodeSubtitle}>
              {savedEpisodes.length === 0 ? 'No saved episodes' : `${savedEpisodes.length} saved episode${savedEpisodes.length !== 1 ? 's' : ''}`}
            </Text>

            {loadingSavedEpisodes ? (
              <View style={styles.loadingEpisodesContainer}>
                <ActivityIndicator size="large" color="#4D5AEE" />
                <Text style={styles.loadingEpisodesText}>Loading episodes...</Text>
              </View>
            ) : savedEpisodes.length > 0 ? (
              <ScrollView style={styles.episodesList} showsVerticalScrollIndicator={false}>
                {savedEpisodes.map((episode) => (
                  <TouchableOpacity
                    key={episode.id}
                    style={styles.episodeItem}
                    onPress={() => handleSchedule(episode)}
                  >
                    <Image
                      source={{ uri: episode.artwork }}
                      style={styles.episodeItemImage}
                    />
                    <View style={styles.episodeItemInfo}>
                      <Text style={styles.episodeItemTitle} numberOfLines={2}>
                        {episode.title}
                      </Text>
                      <Text style={styles.episodeItemDuration}>{episode.duration}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.loadingEpisodesContainer}>
                <Text style={styles.loadingEpisodesText}>No episodes saved yet</Text>
                <TouchableOpacity
                  style={styles.exploreEpisodesButton}
                  onPress={handleExploreEpisodes}
                  disabled={loadingEpisodes}
                >
                  <LinearGradient
                    colors={['#FF9D00', '#4D5AEE']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.exploreEpisodesGradient}
                  >
                    <Text style={styles.exploreEpisodesText}>🔍 Explore Episodes</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* AI Schedule Result Modal */}
      <Modal
        visible={showAIResultModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAIResultModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !aiScheduleLoading && setShowAIResultModal(false)}
        >
          <Pressable style={styles.aiResultContent}>
            {!aiScheduleLoading && (
              <TouchableOpacity
                style={styles.scheduleCloseButton}
                onPress={() => setShowAIResultModal(false)}
              >
                <Text style={styles.scheduleCloseButtonText}>✕</Text>
              </TouchableOpacity>
            )}

            {aiScheduleLoading ? (
              <View style={styles.aiLoadingContainer}>
                <ActivityIndicator size="large" color="#4D5AEE" />
                <Text style={styles.aiLoadingText}>Finding the best time...</Text>
                <Text style={styles.aiLoadingSubtext}>AI is analyzing your calendar</Text>
              </View>
            ) : aiScheduleResult ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.scheduleOptionsTitle}>AI Schedule</Text>

                {aiScheduleResult.scheduledEpisodes.length > 0 ? (
                  <>
                    {/* Scheduled Episodes */}
                    {aiScheduleResult.scheduledEpisodes.map((episode, index) => (
                      <View key={index} style={styles.scheduledEpisodeCard}>
                        <View style={styles.scheduledEpisodeHeader}>
                          <Text style={styles.scheduledDay}>{episode.day}</Text>
                          <Text style={styles.scheduledTime}>
                            {formatScheduleTime(episode.start_time)} - {formatScheduleTime(episode.end_time)}
                          </Text>
                        </View>
                        <Text style={styles.scheduledEpisodeTitle} numberOfLines={2}>
                          {episode.episode_title}
                        </Text>
                        {episode.duration_minutes && (
                          <Text style={styles.scheduledDuration}>{episode.duration_minutes} min</Text>
                        )}
                        {episode.is_already_scheduled && (
                          <Text style={styles.alreadyScheduledBadge}>Already Scheduled</Text>
                        )}
                      </View>
                    ))}

                    

                    {/* Action Buttons */}
                    <View style={styles.aiResultActions}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={handleAcceptAISchedule}
                        disabled={isAddingToCalendar}
                      >
                        <LinearGradient
                          colors={['#4CAF50', '#45a049']}
                          style={styles.acceptGradient}
                        >
                          {isAddingToCalendar ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Text style={styles.acceptText}>Add to Calendar</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.regenerateButton}
                        onPress={handleGenerateAISchedule}
                      >
                        <Text style={styles.regenerateText}>Regenerate</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={styles.noScheduleContainer}>
                    <Text style={styles.noScheduleText}>No episodes could be scheduled</Text>
                    <Text style={styles.noScheduleSubtext}>
                      {aiScheduleResult.reasoning || 'Try a different week or episode'}
                    </Text>
                  </View>
                )}
              </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7E8FF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
  },
  header: {
    width: '100%',
    alignItems: 'flex-end',
    paddingTop: 20,
    marginBottom: 20,
  },
  settingsButtonWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderRadius: 50,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Margarine',
    color: '#FF9D00',
    marginBottom: 4,
  },
  titleUnderline: {
    width: 200,
    height: 15,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#333',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 5,
  },
  clearButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchButton: {
    backgroundColor: '#4D5AEE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#4D5AEE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Margarine',
    fontWeight: '600',
  },
  searchResultTitle: {
    width: 100,
    fontSize: 11,
    fontFamily: 'Margarine',
    color: '#000',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 14,
  },
  savedHint: {
    fontSize: 11,
    fontFamily: 'Margarine',
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    alignItems: 'center',
    fontSize: 20,
    fontFamily: 'Margarine',
    color: '#4D5AEE',
    marginBottom: 5,
  },
  sectionUnderline: {
    width: 180,
    height: 12,
    marginBottom: 15,
  },
  sectionUnderlineOrange: {
    width: 180,
    height: 12,
    marginBottom: 15,
    tintColor: '#FF9D00',
  },
  favoritesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  favoriteItemWrapper: {
    width: '31%',
    marginBottom: 15,
  },
  horizontalScroll: {
    marginTop: 10,
  },
  episodeItemWrapper: {
    marginRight: 15,
  },
  recommendationItemWrapper: {
    marginRight: 15,
  },
  episodeTitleContainer: {
    width: 100,
    marginTop: 8,
    paddingHorizontal: 5,
  },
  episodeTitle: {
    fontSize: 11,
    fontFamily: 'Margarine',
    color: '#000',
    textAlign: 'center',
    lineHeight: 14,
  },
  squareContainer: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  innerSquareImage: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 8,
  },
  rectContainer: {
    width: 100,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  innerRectImage: {
    position: 'absolute',
    width: 76,
    height: 130,
    borderRadius: 8,
    top: 25,
  },
  scheduleButton: {
    backgroundColor: '#4D5AEE',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    shadowColor: '#4D5AEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  scheduleButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Margarine',
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(77, 90, 238, 0.85)',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Margarine',
    color: '#FF9D00',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'Margarine',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  scheduleOptions: {
    marginBottom: 20,
  },
  playButton: {
    backgroundColor: '#4D5AEE',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  playButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  manualScheduleButton: {
    backgroundColor: '#4D5AEE',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  manualScheduleText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  modalCloseButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
    width: 120,
  },
  modalCloseText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  aiButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderRadius: 50,
  },
  aiButtonGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  aiIcon: {
    width: 24,
    height: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalImageContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  modalSquareContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalInnerSquareImage: {
    position: 'absolute',
    width: 164,
    height: 164,
    borderRadius: 12,
  },
  modalPlayButtonContainer: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  modalScheduleButton: {
    backgroundColor: '#FF9D00',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FF9D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  modalScheduleButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  modalSaveButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 12,
  },
  modalSaveButtonSaved: {
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
    borderColor: '#FF3B30',
  },
  modalSaveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Margarine',
    fontWeight: '600',
  },
  scheduleOptionsContent: {
    backgroundColor: 'rgba(255, 157, 0, 0.85)',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scheduleCloseButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scheduleCloseButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scheduleOptionsTitle: {
    fontSize: 20,
    fontFamily: 'Margarine',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 25,
    marginTop: 15,
  },
  aiScheduleButton: {
    borderRadius: 25,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  aiScheduleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  aiScheduleGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiScheduleText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  cancelScheduleButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelScheduleText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Margarine',
    fontWeight: '600',
  },
  // Manual schedule options
  manualOptionButton: {
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  manualOptionText: {
    color: '#4D5AEE',
    fontSize: 16,
    fontFamily: 'Margarine',
    fontWeight: '600',
  },
  // Episode selection modal
  episodeSelectionContent: {
    backgroundColor: 'rgba(77, 90, 238, 0.95)',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  episodeSubtitle: {
    fontSize: 14,
    fontFamily: 'Margarine',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingEpisodesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingEpisodesText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Margarine',
    marginTop: 16,
  },
  episodesList: {
    maxHeight: 400,
  },
  aiChooseButton: {
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
  },
  aiChooseGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  aiChooseText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  episodeItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  episodeItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  episodeItemInfo: {
    flex: 1,
  },
  episodeItemTitle: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Margarine',
    marginBottom: 4,
  },
  episodeItemDuration: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontFamily: 'Margarine',
  },
  // Date picker modal
  datePickerContent: {
    backgroundColor: 'rgba(255, 157, 0, 0.95)',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  weekNavButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  weekDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  weekText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Margarine',
    fontWeight: '600',
  },
  quickSelectContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  quickSelectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  quickSelectText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Margarine',
    fontWeight: '600',
  },
  generateButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 10,
  },
  generateGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  generateText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  // AI Result modal
  aiResultContent: {
    backgroundColor: 'rgba(77, 90, 238, 0.95)',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  aiLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  aiLoadingText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Margarine',
    marginTop: 20,
  },
  aiLoadingSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: 'Margarine',
    marginTop: 8,
  },
  scheduledEpisodeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  scheduledEpisodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduledDay: {
    color: '#FF9D00',
    fontSize: 16,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  scheduledTime: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontFamily: 'Margarine',
  },
  scheduledEpisodeTitle: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Margarine',
    marginBottom: 6,
  },
  scheduledDuration: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontFamily: 'Margarine',
  },
  alreadyScheduledBadge: {
    color: '#4CAF50',
    fontSize: 12,
    fontFamily: 'Margarine',
    marginTop: 6,
    fontStyle: 'italic',
  },
  reasoningContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  reasoningTitle: {
    color: '#FF9D00',
    fontSize: 14,
    fontFamily: 'Margarine',
    fontWeight: '700',
    marginBottom: 8,
  },
  reasoningText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontFamily: 'Margarine',
    lineHeight: 20,
  },
  aiResultActions: {
    marginTop: 10,
  },
  acceptButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 12,
  },
  acceptGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderRadius: 25,
  },
  acceptText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  regenerateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
  },
  regenerateText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Margarine',
    fontWeight: '600',
  },
  noScheduleContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noScheduleText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Margarine',
    marginBottom: 10,
  },
  noScheduleSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: 'Margarine',
    textAlign: 'center',
  },
  exploreEpisodesButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 20,
  },
  exploreEpisodesGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderRadius: 25,
  },
  exploreEpisodesText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  manualScheduleButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
  },
  manualScheduleGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 12,
  },
  manualScheduleText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Margarine',
    fontWeight: '700',
  },
  episodeItemContainer: {
    marginBottom: 12,
  },
  episodeManualButton: {
    backgroundColor: 'rgba(77, 90, 238, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4D5AEE',
  },
  episodeManualButtonText: {
    color: '#4D5AEE',
    fontSize: 12,
    fontFamily: 'Margarine',
    fontWeight: '600',
  },
});
