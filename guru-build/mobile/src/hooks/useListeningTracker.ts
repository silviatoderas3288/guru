/**
 * Hook for tracking listening sessions
 *
 * Automatically tracks podcast listening progress for the ML recommendation system.
 * Integrates with audio player to capture:
 * - Session start/end
 * - Progress updates (every 30 seconds)
 * - Pause/seek events
 * - App backgrounding
 */

import { useRef, useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { recommendationApi, ListeningContext } from '../services/recommendationApi';

interface ListeningTrackerState {
  sessionId: string | null;
  episodeId: string;
  podcastId: string;
  episodeDuration: number;
  startTime: number;
  currentPosition: number;
  pauseCount: number;
  seekForwardCount: number;
  seekBackwardCount: number;
  playbackSpeed: number;
  isPlaying: boolean;
}

interface UseListeningTrackerReturn {
  /** Start tracking a new listening session */
  startSession: (
    episodeId: string,
    podcastId: string,
    durationSeconds: number,
    context?: ListeningContext
  ) => Promise<string | null>;
  /** End the current listening session */
  endSession: () => Promise<void>;
  /** Update current playback position (call on progress updates) */
  updatePosition: (positionSeconds: number) => void;
  /** Record a pause event */
  recordPause: () => void;
  /** Record a resume event */
  recordResume: () => void;
  /** Record a forward seek */
  recordSeekForward: () => void;
  /** Record a backward seek (engagement signal) */
  recordSeekBackward: () => void;
  /** Update playback speed */
  setPlaybackSpeed: (speed: number) => void;
  /** Check if a session is active */
  isSessionActive: () => boolean;
  /** Get current session ID */
  getSessionId: () => string | null;
}

const UPDATE_INTERVAL_MS = 30000; // Send progress every 30 seconds

export function useListeningTracker(): UseListeningTrackerReturn {
  const state = useRef<ListeningTrackerState | null>(null);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTime = useRef<number>(0);

  // Track app state to handle backgrounding
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && state.current?.sessionId) {
        // Send final update before backgrounding
        sendProgressUpdate(false);
      } else if (nextAppState === 'active' && state.current?.sessionId) {
        // Resume tracking when coming back to foreground
        startProgressUpdates();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      // Clean up interval on unmount
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, []);

  const sendProgressUpdate = useCallback(async (isFinal: boolean) => {
    if (!state.current?.sessionId) return;

    const now = Date.now();
    // Throttle updates to avoid too many API calls
    if (!isFinal && now - lastUpdateTime.current < 5000) {
      return;
    }
    lastUpdateTime.current = now;

    try {
      await recommendationApi.updateListeningSession(
        state.current.sessionId,
        Math.floor(state.current.currentPosition),
        {
          pauseCount: state.current.pauseCount,
          seekForwardCount: state.current.seekForwardCount,
          seekBackwardCount: state.current.seekBackwardCount,
          playbackSpeed: state.current.playbackSpeed,
        }
      );

      if (isFinal) {
        await recommendationApi.endListeningSession(state.current.sessionId);
      }
    } catch (error) {
      console.error('Error sending progress update:', error);
    }
  }, []);

  const startProgressUpdates = useCallback(() => {
    // Clear existing interval
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
    }

    // Start new interval for periodic updates
    updateInterval.current = setInterval(() => {
      if (state.current?.isPlaying) {
        sendProgressUpdate(false);
      }
    }, UPDATE_INTERVAL_MS);
  }, [sendProgressUpdate]);

  const startSession = useCallback(async (
    episodeId: string,
    podcastId: string,
    durationSeconds: number,
    context?: ListeningContext
  ): Promise<string | null> => {
    // End any existing session first
    if (state.current?.sessionId) {
      await endSession();
    }

    const sessionId = await recommendationApi.startListeningSession(
      episodeId,
      podcastId,
      durationSeconds,
      context
    );

    if (sessionId) {
      state.current = {
        sessionId,
        episodeId,
        podcastId,
        episodeDuration: durationSeconds,
        startTime: Date.now(),
        currentPosition: 0,
        pauseCount: 0,
        seekForwardCount: 0,
        seekBackwardCount: 0,
        playbackSpeed: 1.0,
        isPlaying: true,
      };

      startProgressUpdates();
      console.log(`Started listening session: ${sessionId}`);
    }

    return sessionId;
  }, [startProgressUpdates]);

  const endSession = useCallback(async () => {
    // Stop periodic updates
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
      updateInterval.current = null;
    }

    if (state.current?.sessionId) {
      // Send final update
      await sendProgressUpdate(true);

      console.log(`Ended listening session: ${state.current.sessionId}`);
      state.current = null;
    }
  }, [sendProgressUpdate]);

  const updatePosition = useCallback((positionSeconds: number) => {
    if (state.current) {
      state.current.currentPosition = positionSeconds;
    }
  }, []);

  const recordPause = useCallback(() => {
    if (state.current) {
      state.current.pauseCount++;
      state.current.isPlaying = false;
      // Send immediate update on pause
      sendProgressUpdate(false);
    }
  }, [sendProgressUpdate]);

  const recordResume = useCallback(() => {
    if (state.current) {
      state.current.isPlaying = true;
    }
  }, []);

  const recordSeekForward = useCallback(() => {
    if (state.current) {
      state.current.seekForwardCount++;
    }
  }, []);

  const recordSeekBackward = useCallback(() => {
    if (state.current) {
      // Backward seek is a positive engagement signal
      state.current.seekBackwardCount++;
    }
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    if (state.current) {
      state.current.playbackSpeed = speed;
    }
  }, []);

  const isSessionActive = useCallback(() => {
    return state.current?.sessionId != null;
  }, []);

  const getSessionId = useCallback(() => {
    return state.current?.sessionId ?? null;
  }, []);

  return {
    startSession,
    endSession,
    updatePosition,
    recordPause,
    recordResume,
    recordSeekForward,
    recordSeekBackward,
    setPlaybackSpeed,
    isSessionActive,
    getSessionId,
  };
}

export default useListeningTracker;
