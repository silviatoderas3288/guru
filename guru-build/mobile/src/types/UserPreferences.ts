export interface UserPreferences {
  podcastTopics: string[];
  podcastLength: string[];
  notifications: string[];
  workoutTypes: string[];
  workoutDuration: string[];
  workoutFrequency: string[];
  bedTime: string[];
  focusTimeStart: string[];
  focusTimeEnd: string[];
  blockedApps: string[];
  // New fields requested
  commuteStartTime: string[];
  commuteEndTime: string[];
  commuteMethod: string[];
  choreTime: string[];
  choreDuration: string[];
}