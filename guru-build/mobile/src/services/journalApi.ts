import axios from 'axios';
import { API_URL } from './apiConfig';

console.log('Journal API URL:', API_URL);

export interface JournalEntry {
  id?: number;
  timestamp: Date;
  notes?: string;
  user_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface JournalEntryCreate {
  timestamp: Date;
  notes?: string;
}

export interface JournalEntryUpdate {
  timestamp?: Date;
  notes?: string;
}

export const journalApi = {
  // Get all journal entries
  async getEntries(): Promise<JournalEntry[]> {
    try {
      const response = await axios.get(`${API_URL}/api/v1/journal/`);
      return response.data.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
        created_at: new Date(entry.created_at),
        updated_at: new Date(entry.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      throw error;
    }
  },

  // Get a specific journal entry
  async getEntry(id: number): Promise<JournalEntry> {
    try {
      const response = await axios.get(`${API_URL}/api/v1/journal/${id}`);
      return {
        ...response.data,
        timestamp: new Date(response.data.timestamp),
        created_at: new Date(response.data.created_at),
        updated_at: new Date(response.data.updated_at),
      };
    } catch (error) {
      console.error(`Error fetching journal entry ${id}:`, error);
      throw error;
    }
  },

  // Create a new journal entry
  async createEntry(entry: JournalEntryCreate): Promise<JournalEntry> {
    try {
      const response = await axios.post(`${API_URL}/api/v1/journal/`, {
        timestamp: entry.timestamp.toISOString(),
        notes: entry.notes || '',
      });
      return {
        ...response.data,
        timestamp: new Date(response.data.timestamp),
        created_at: new Date(response.data.created_at),
        updated_at: new Date(response.data.updated_at),
      };
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  },

  // Update a journal entry
  async updateEntry(id: number, entry: JournalEntryUpdate): Promise<JournalEntry> {
    try {
      const payload: any = {};
      if (entry.timestamp) {
        payload.timestamp = entry.timestamp.toISOString();
      }
      if (entry.notes !== undefined) {
        payload.notes = entry.notes;
      }

      const response = await axios.put(`${API_URL}/api/v1/journal/${id}`, payload);
      return {
        ...response.data,
        timestamp: new Date(response.data.timestamp),
        created_at: new Date(response.data.created_at),
        updated_at: new Date(response.data.updated_at),
      };
    } catch (error) {
      console.error(`Error updating journal entry ${id}:`, error);
      throw error;
    }
  },

  // Delete a journal entry
  async deleteEntry(id: number): Promise<void> {
    try {
      await axios.delete(`${API_URL}/api/v1/journal/${id}`);
    } catch (error) {
      console.error(`Error deleting journal entry ${id}:`, error);
      throw error;
    }
  },
};
