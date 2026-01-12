import axios from 'axios';
import { GoogleAuthService } from './googleAuth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
console.log('List Item API URL:', API_BASE_URL);

const listItemApi = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/list-items`,
});

// Add auth interceptor
listItemApi.interceptors.request.use(async (config) => {
  const user = await GoogleAuthService.getStoredUser();
  if (user?.idToken) {
    config.headers.Authorization = `Bearer ${user.idToken}`;
  }
  return config;
});

export enum ListItemType {
  WEEKLY_GOAL = 'weekly_goal',
  TODO = 'todo',
}

export interface ListItem {
  id: string;
  user_id: string;
  text: string;
  completed: boolean;
  item_type: ListItemType;
  calendar_event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ListItemCreate {
  text: string;
  completed: boolean;
  item_type: ListItemType;
  calendar_event_id?: string;
}

export interface ListItemUpdate {
  text?: string;
  completed?: boolean;
  calendar_event_id?: string;
}

export const ListItemApiService = {
  // Get weekly goals
  async getWeeklyGoals(): Promise<ListItem[]> {
    const response = await listItemApi.get<ListItem[]>('/weekly-goals');
    return response.data;
  },

  // Get to-do items
  async getTodos(): Promise<ListItem[]> {
    const response = await listItemApi.get<ListItem[]>('/todos');
    return response.data;
  },

  // Create a list item
  async createListItem(item: ListItemCreate): Promise<ListItem> {
    const response = await listItemApi.post<ListItem>('/', item);
    return response.data;
  },

  // Update a list item
  async updateListItem(id: string, item: ListItemUpdate): Promise<ListItem> {
    const response = await listItemApi.patch<ListItem>(`/${id}`, item);
    return response.data;
  },

  // Delete a list item
  async deleteListItem(id: string): Promise<void> {
    await listItemApi.delete(`/${id}`);
  },
};
