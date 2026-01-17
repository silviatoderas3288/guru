import axios from 'axios';
import { GoogleAuthService } from './googleAuth';
import { API_URL } from './apiConfig';

console.log('Workout API URL:', API_URL);

const workoutApi = axios.create({
  baseURL: `${API_URL}/api/v1/workouts`,
});

// Add auth interceptor
workoutApi.interceptors.request.use(async (config) => {
  const user = await GoogleAuthService.getStoredUser();
  if (user?.idToken) {
    config.headers.Authorization = `Bearer ${user.idToken}`;
  }
  return config;
});

// Type definitions
export interface Exercise {
  id?: string;
  section_id?: string;
  name: string;
  sets?: string;
  reps?: string;
  duration?: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface WorkoutSection {
  id?: string;
  workout_id?: string;
  title: string;
  order: number;
  completed?: boolean;
  exercises: Exercise[];
  created_at?: string;
  updated_at?: string;
}

export interface Workout {
  id?: string;
  user_id?: string;
  title: string;
  description?: string;
  completed?: boolean;
  sections: WorkoutSection[];
  created_at?: string;
  updated_at?: string;
}

export interface WorkoutCreate {
  title: string;
  description?: string;
  completed?: boolean;
  sections: {
    title: string;
    order: number;
    exercises: {
      name: string;
      sets?: string;
      reps?: string;
      duration?: string;
      order: number;
    }[];
  }[];
}

export interface WorkoutUpdate {
  title?: string;
  description?: string;
  completed?: boolean;
}

export interface SectionCreate {
  title: string;
  order: number;
  exercises: {
    name: string;
    sets?: string;
    reps?: string;
    duration?: string;
    order: number;
  }[];
}

export interface SectionUpdate {
  title?: string;
  order?: number;
}

export interface ExerciseCreate {
  name: string;
  sets?: string;
  reps?: string;
  duration?: string;
  order: number;
}

export interface ExerciseUpdate {
  name?: string;
  sets?: string;
  reps?: string;
  duration?: string;
  order?: number;
}

export const WorkoutApiService = {
  // Workout endpoints
  async getWorkouts(): Promise<Workout[]> {
    const response = await workoutApi.get<Workout[]>('/');
    return response.data;
  },

  async getWorkout(workoutId: string): Promise<Workout> {
    const response = await workoutApi.get<Workout>(`/${workoutId}`);
    return response.data;
  },

  async createWorkout(workout: WorkoutCreate): Promise<Workout> {
    const response = await workoutApi.post<Workout>('/', workout);
    return response.data;
  },

  async updateWorkout(workoutId: string, workout: WorkoutUpdate): Promise<Workout> {
    const response = await workoutApi.put<Workout>(`/${workoutId}`, workout);
    return response.data;
  },

  async deleteWorkout(workoutId: string): Promise<void> {
    await workoutApi.delete(`/${workoutId}`);
  },

  // Section endpoints
  async createSection(workoutId: string, section: SectionCreate): Promise<WorkoutSection> {
    const response = await workoutApi.post<WorkoutSection>(`/${workoutId}/sections`, section);
    return response.data;
  },

  async updateSection(sectionId: string, section: SectionUpdate): Promise<WorkoutSection> {
    const response = await workoutApi.put<WorkoutSection>(`/sections/${sectionId}`, section);
    return response.data;
  },

  async deleteSection(sectionId: string): Promise<void> {
    await workoutApi.delete(`/sections/${sectionId}`);
  },

  // Exercise endpoints
  async createExercise(sectionId: string, exercise: ExerciseCreate): Promise<Exercise> {
    const response = await workoutApi.post<Exercise>(`/sections/${sectionId}/exercises`, exercise);
    return response.data;
  },

  async updateExercise(exerciseId: string, exercise: ExerciseUpdate): Promise<Exercise> {
    const response = await workoutApi.put<Exercise>(`/exercises/${exerciseId}`, exercise);
    return response.data;
  },

  async deleteExercise(exerciseId: string): Promise<void> {
    await workoutApi.delete(`/exercises/${exerciseId}`);
  },
};
