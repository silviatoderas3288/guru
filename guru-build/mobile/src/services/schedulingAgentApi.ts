// mobile/src/services/schedulingAgentApi.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

interface GenerateScheduleRequest {
  weekStartDate: string;  // ISO date
  includeGoals?: boolean;
  forceRegenerate?: boolean;
}

interface GenerateScheduleResponse {
  suggestedSchedule: ScheduleEvent[];
  reasoning: string;
  warnings: Warning[];
  conflicts: Conflict[];
  summary: ScheduleSummary;
}

interface ScheduleEvent {
  id: string;
  type: 'task' | 'workout' | 'meal' | 'break' | 'podcast' | 'music';
  title: string;
  startTime: string;  // ISO datetime
  endTime: string;
  duration: number;   // minutes
  priority: number;
  confidence: number; // 0.0-1.0
  metadata?: {
    taskId?: string;
    workoutType?: string;
    podcastId?: string;
  };
}

interface Warning {
  severity: 'low' | 'medium' | 'high';
  message: string;
  affectedEvents: string[];  // Event IDs
}

interface Conflict {
  type: 'overlap' | 'insufficient_time' | 'constraint_violation';
  description: string;
  suggestions: string[];
}

interface ScheduleSummary {
  totalTasksScheduled: number;
  totalWorkoutsScheduled: number;
  totalFreeTime: number;
  changesMade: number;
}

interface RebalanceRequest {
  tasksFeedback?: TaskFeedback[];
  calendarChanges?: CalendarChange[];
}

interface TaskFeedback {
  taskId: string;
  completed: boolean;
  actualDuration?: number;  // minutes
  estimatedDuration: number;
}

interface CalendarChange {
  changeType: 'added' | 'removed' | 'moved';
  eventId: string;
  newStartTime?: string;
  newEndTime?: string;
}

class SchedulingAgentApiService {

  /**
   * Generate a new weekly schedule
   */
  async generateSchedule(
    request: GenerateScheduleRequest
  ): Promise<GenerateScheduleResponse> {
    const token = await AsyncStorage.getItem('@google_access_token');

    const response = await fetch(`${BASE_URL}/api/v1/schedule/agent/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate schedule: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Rebalance schedule based on feedback and changes
   */
  async rebalanceSchedule(
    request: RebalanceRequest
  ): Promise<GenerateScheduleResponse> {
    const token = await AsyncStorage.getItem('@google_access_token');

    const response = await fetch(`${BASE_URL}/api/v1/schedule/agent/rebalance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to rebalance schedule: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Submit task completion feedback
   */
  async submitFeedback(feedback: TaskFeedback[]): Promise<void> {
    const token = await AsyncStorage.getItem('@google_access_token');

    const response = await fetch(`${BASE_URL}/api/v1/schedule/agent/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ feedback }),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit feedback: ${response.status}`);
    }
  }

  /**
   * Get current schedule status
   */
  async getScheduleStatus(weekStartDate: string): Promise<{
    hasSchedule: boolean;
    lastGenerated?: string;
    completionRate?: number;
  }> {
    const token = await AsyncStorage.getItem('@google_access_token');

    const response = await fetch(
      `${BASE_URL}/api/v1/schedule/agent/status?week_start_date=${weekStartDate}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get schedule status: ${response.status}`);
    }

    return await response.json();
  }
}

export default new SchedulingAgentApiService();
export type {
  GenerateScheduleRequest,
  GenerateScheduleResponse,
  ScheduleEvent,
  Warning,
  Conflict,
  RebalanceRequest,
  TaskFeedback,
  CalendarChange,
  ScheduleSummary,
};
