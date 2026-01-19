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
}

export const schedulingAgentApi = new SchedulingAgentApiService();
export default schedulingAgentApi;
