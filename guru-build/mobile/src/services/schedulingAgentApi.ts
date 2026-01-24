// mobile/src/services/schedulingAgentApi.ts

import { GoogleAuthService } from './googleAuth';
import { API_URL } from './apiConfig';

console.log('Scheduling Agent API URL:', API_URL);

// Request types
export interface GenerateScheduleRequest {
  weekStartDate: string;  // ISO date (YYYY-MM-DD)
  includeGoals?: boolean;
  forceRegenerate?: boolean;
  modificationRequest?: string;  // Natural language request to modify the schedule
  email?: string | null;
}

export interface RebalanceRequest {
  tasksFeedback?: TaskFeedback[];
  calendarChanges?: CalendarChange[];
}

export interface TaskFeedback {
  task_id: string;
  estimated_duration_minutes: number;
  actual_duration_minutes?: number;
  completed: boolean;
  difficulty_rating?: number;
  notes?: string;
}

export interface CalendarChange {
  event_id: string;
  change_type: 'added' | 'removed' | 'modified';
  previous_start?: string;
  new_start?: string;
}

// Response types (matching backend schemas)
export interface ScheduledEvent {
  id?: string;
  title: string;
  activity_type: 'workout' | 'meal' | 'commute' | 'focus' | 'break' | 'chore' | 'task' | 'podcast' | 'meeting';
  start_time: string;
  end_time: string;
  day: string;
  description?: string;
  is_flexible: boolean;
  priority: number;
  suggested_podcast?: string;
  color?: string;
}

export interface ScheduleWarning {
  message: string;
  severity: 'info' | 'warning' | 'error';
  affected_events?: string[];
}

export interface ScheduleConflict {
  event1_id: string;
  event2_id: string;
  conflict_type: string;
  resolution_suggestion?: string;
}

export interface GenerateScheduleResponse {
  success: boolean;
  weekStartDate: string;
  scheduledEvents: ScheduledEvent[];
  reasoning: string;
  warnings: ScheduleWarning[];
  conflicts: ScheduleConflict[];
  generatedAt: string;
  confidenceScore: number;
}

export interface ScheduleStatusResponse {
  hasSchedule: boolean;
  weekStartDate?: string;
  lastGeneratedAt?: string;
  totalEvents: number;
  completedEvents: number;
  completionRate: number;
}

// Workout-specific scheduling types
export interface WorkoutScheduleRequest {
  weekStartDate: string;
  forceReschedule?: boolean;
  modificationRequest?: string;
}

export interface ScheduledWorkout {
  workout_id: string;
  title: string;
  description?: string;
  day: string;
  start_time: string;
  end_time: string;
  calendar_event_id?: string;
  is_rescheduled: boolean;
  exercises: string[];
}

export interface WorkoutScheduleResponse {
  success: boolean;
  weekStartDate: string;
  scheduledWorkouts: ScheduledWorkout[];
  alreadyScheduledCount: number;
  newlyScheduledCount: number;
  rescheduledCount: number;
  reasoning: string;
  warnings: ScheduleWarning[];
  generatedAt: string;
}

// Podcast-specific scheduling types
export interface PodcastScheduleRequest {
  weekStartDate: string;
  podcastId: string;
  podcastTitle: string;
  podcastImage?: string;
  selectedEpisodeId?: string;
  scheduleType: 'ai' | 'today' | 'week';
  forceReschedule?: boolean;
}

export interface ScheduledPodcastEpisode {
  episode_id: string;
  podcast_id: string;
  podcast_title: string;
  episode_title: string;
  description?: string;
  duration_minutes?: number;
  day: string;
  start_time: string;
  end_time: string;
  calendar_event_id?: string;
  is_already_scheduled: boolean;
}

export interface PodcastScheduleResponse {
  success: boolean;
  weekStartDate: string;
  scheduledEpisodes: ScheduledPodcastEpisode[];
  alreadyScheduledCount: number;
  newlyScheduledCount: number;
  reasoning: string;
  warnings: ScheduleWarning[];
  generatedAt: string;
}

// Todo-specific scheduling types
export interface TodoItemRequest {
  id: string;
  text: string;
  priority: number; // 1 = highest priority, 10 = lowest
  estimated_duration_minutes?: number; // Default 30 min
  is_selected: boolean;
}

export interface TodoScheduleRequest {
  targetDate: string; // ISO date (YYYY-MM-DD)
  todos: TodoItemRequest[];
  email?: string | null;
}

export interface ScheduledTodo {
  todo_id: string;
  text: string;
  start_time: string;
  end_time: string;
  calendar_event_id?: string;
  priority: number;
  scheduled_successfully: boolean;
}

export interface UnscheduledTodo {
  todo_id: string;
  text: string;
  priority: number;
  reason: string;
  suggested_alternative?: string;
}

export interface TodoScheduleResponse {
  success: boolean;
  targetDate: string;
  scheduledTodos: ScheduledTodo[];
  unscheduledTodos: UnscheduledTodo[];
  scheduledCount: number;
  unscheduledCount: number;
  totalAvailableMinutes: number;
  totalRequestedMinutes: number;
  requiresReranking: boolean;
  reasoning: string;
  warnings: ScheduleWarning[];
  generatedAt: string;
}

class SchedulingAgentApiService {
  /**
   * Get the start of the current week (Monday)
   */
  getWeekStartDate(): string {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  /**
   * Generate a new weekly schedule using AI
   */
  async generateSchedule(
    request?: Partial<GenerateScheduleRequest>
  ): Promise<GenerateScheduleResponse> {
    const weekStartDate = request?.weekStartDate || this.getWeekStartDate();
    
    // Get user email to ensure backend uses the correct user record
    const user = await GoogleAuthService.getStoredUser();

    const payload = {
      weekStartDate,
      includeGoals: request?.includeGoals ?? true,
      forceRegenerate: request?.forceRegenerate ?? false,
      modificationRequest: request?.modificationRequest || null,
      email: user?.email || null,
    };

    console.log('Generating schedule with payload:', payload);

    const response = await fetch(`${API_URL}/api/v1/schedule/agent/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Schedule generation failed:', errorText);
      throw new Error(`Failed to generate schedule: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Schedule generated successfully:', data);
    return data;
  }

  /**
   * Rebalance schedule based on feedback and changes
   */
  async rebalanceSchedule(
    request: RebalanceRequest
  ): Promise<GenerateScheduleResponse> {
    const response = await fetch(`${API_URL}/api/v1/schedule/agent/rebalance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasksFeedback: request.tasksFeedback || [],
        calendarChanges: request.calendarChanges || [],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to rebalance schedule: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Submit task completion feedback
   */
  async submitFeedback(feedback: TaskFeedback[]): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/schedule/agent/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feedback }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit feedback: ${response.status} - ${errorText}`);
    }
  }

  /**
   * Get current schedule status
   */
  async getScheduleStatus(weekStartDate?: string): Promise<ScheduleStatusResponse> {
    const date = weekStartDate || this.getWeekStartDate();

    const response = await fetch(
      `${API_URL}/api/v1/schedule/agent/status?week_start_date=${date}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get schedule status: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Schedule workouts only (not the full schedule)
   * - Checks which workouts are already on the calendar
   * - Only schedules workouts that are not yet scheduled
   * - Optionally reschedules existing workouts if forceReschedule is true
   */
  async scheduleWorkouts(
    request?: Partial<WorkoutScheduleRequest>
  ): Promise<WorkoutScheduleResponse> {
    const weekStartDate = request?.weekStartDate || this.getWeekStartDate();

    const payload = {
      weekStartDate,
      forceReschedule: request?.forceReschedule ?? false,
      modificationRequest: request?.modificationRequest || null,
    };

    console.log('Scheduling workouts with payload:', payload);

    const response = await fetch(`${API_URL}/api/v1/schedule/agent/workouts/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Workout scheduling failed:', errorText);
      throw new Error(`Failed to schedule workouts: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Workouts scheduled successfully:', data);
    return data;
  }

  /**
   * Schedule podcast listening sessions
   * - Fetches episodes from the specified podcast
   * - Checks which episodes are already on the calendar
   * - Uses AI to find optimal listening times
   * - Can schedule a specific episode if selectedEpisodeId is provided
   */
  async schedulePodcast(
    request: PodcastScheduleRequest
  ): Promise<PodcastScheduleResponse> {
    const weekStartDate = request.weekStartDate || this.getWeekStartDate();

    const payload = {
      weekStartDate,
      podcastId: request.podcastId,
      podcastTitle: request.podcastTitle,
      podcastImage: request.podcastImage || null,
      selectedEpisodeId: request.selectedEpisodeId || null,
      scheduleType: request.scheduleType || 'ai',
      forceReschedule: request.forceReschedule ?? false,
    };

    console.log('Scheduling podcast with payload:', payload);

    const response = await fetch(`${API_URL}/api/v1/schedule/agent/podcasts/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Podcast scheduling failed:', errorText);
      throw new Error(`Failed to schedule podcast: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Podcast scheduled successfully:', data);
    return data;
  }

  /**
   * Schedule todo items for a specific day using AI
   * - Analyzes the user's calendar for the target day
   * - Respects sleep time and wake time from preferences
   * - Schedules todos in priority order into available time slots
   * - Never overlaps with existing calendar events
   * - Returns warnings if todos cannot be scheduled
   * - Prompts user to re-rank priorities if not all todos fit
   */
  async scheduleTodos(
    request: TodoScheduleRequest
  ): Promise<TodoScheduleResponse> {
    // Get user email to ensure backend uses the correct user record
    const user = await GoogleAuthService.getStoredUser();

    const payload = {
      targetDate: request.targetDate,
      todos: request.todos,
      email: request.email || user?.email || null,
    };

    console.log('Scheduling todos with payload:', payload);

    const response = await fetch(`${API_URL}/api/v1/schedule/agent/todos/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Todo scheduling failed:', errorText);
      throw new Error(`Failed to schedule todos: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Todos scheduled successfully:', data);
    return data;
  }
}

export const schedulingAgentApi = new SchedulingAgentApiService();
export default schedulingAgentApi;
