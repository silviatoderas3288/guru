/**
 * Calendar API service for connecting to the backend.
 */

import { GoogleAuthService } from './googleAuth';
import { API_URL } from './apiConfig';

console.log('Calendar API URL:', API_URL);

/**
 * Helper to make API calls with better error handling.
 * Note: Token refresh is now handled automatically by the backend.
 * If we get 401, it means the refresh token is invalid and user needs to re-authenticate.
 */
async function fetchWithRetry(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, options);

  // If we get a 401 Unauthorized, it means the backend couldn't refresh the token
  // This indicates the refresh token is invalid/expired and user must sign in again
  if (response.status === 401) {
    console.error('Got 401 - refresh token may be invalid. User needs to sign in again.');
    throw new Error('Session expired. Please sign in again.');
  }

  return response;
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start_time: string; // ISO 8601 format
  end_time: string; // ISO 8601 format
  color_id?: string; // Google Calendar color ID (1-11)
  html_link?: string;
  created?: string;
  updated?: string;
}

export interface AvailableSlot {
  start: string; // ISO 8601 format
  end: string; // ISO 8601 format
  duration_minutes: number;
}

export interface AvailableSlotsRequest {
  start_date: string; // ISO 8601 format
  end_date: string; // ISO 8601 format
  slot_duration?: number;
  working_hours_start?: number;
  working_hours_end?: number;
}

export class CalendarApiService {
  /**
   * Save Google OAuth tokens to the backend.
   */
  static async saveGoogleTokens(
    accessToken: string,
    refreshToken?: string
  ): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/calendar/oauth/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save Google tokens');
    }
  }

  /**
   * Fetch calendar events from the backend.
   */
  static async getCalendarEvents(
    timeMin?: Date,
    timeMax?: Date
  ): Promise<CalendarEvent[]> {
    const params = new URLSearchParams();

    if (timeMin) {
      params.append('time_min', timeMin.toISOString());
    }
    if (timeMax) {
      params.append('time_max', timeMax.toISOString());
    }

    const url = `${API_URL}/api/v1/calendar/events?${params.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch calendar events');
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Create a new calendar event.
   */
  static async createCalendarEvent(
    event: Omit<CalendarEvent, 'id' | 'html_link' | 'created' | 'updated'>
  ): Promise<CalendarEvent> {
    const response = await fetch(`${API_URL}/api/v1/calendar/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create calendar event');
    }

    return response.json();
  }

  /**
   * Update an existing calendar event.
   */
  static async updateCalendarEvent(
    eventId: string,
    updates: Partial<Omit<CalendarEvent, 'id' | 'html_link' | 'created' | 'updated'>>
  ): Promise<CalendarEvent> {
    const response = await fetch(`${API_URL}/api/v1/calendar/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update calendar event');
    }

    return response.json();
  }

  /**
   * Delete a calendar event.
   */
  static async deleteCalendarEvent(eventId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/calendar/events/${eventId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete calendar event');
    }
  }

  /**
   * Get available time slots.
   */
  static async getAvailableSlots(
    request: AvailableSlotsRequest
  ): Promise<AvailableSlot[]> {
    const response = await fetch(`${API_URL}/api/v1/calendar/available-slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get available slots');
    }

    const data = await response.json();
    return data.slots;
  }
}
