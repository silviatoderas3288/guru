# AI Scheduling Agent - Implementation Plan & Architecture

## 📋 Executive Summary

This document provides a complete implementation plan for an AI scheduling agent that intelligently plans, estimates, and continuously adjusts a user's weekly schedule based on goals, preferences, and real-time calendar changes.

---

## 🎯 Core Objective

Create and maintain an optimal weekly schedule by allocating time for:
- Weekly goals/tasks
- Workouts
- Music & podcasts
- Meals and breaks

While respecting user preferences, constraints, and immovable calendar events.

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP (React Native)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Calendar   │  │   Workout    │  │    Media     │      │
│  │    Screen    │  │    Screen    │  │    Screen    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│         ┌──────────────────▼──────────────────┐             │
│         │   Scheduling Agent Service          │             │
│         │   (schedulingAgentApi.ts)           │             │
│         └──────────────────┬──────────────────┘             │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  POST /api/v1/schedule/agent/generate                       │
│  POST /api/v1/schedule/agent/rebalance                      │
│  POST /api/v1/schedule/agent/feedback                       │
│  GET  /api/v1/schedule/agent/status                         │
│                                                              │
│         ┌────────────────────────────────────┐              │
│         │   AI Scheduling Agent Service      │              │
│         │   (services/scheduling_agent.py)   │              │
│         └────────────┬───────────────────────┘              │
│                      │                                       │
│         ┌────────────┼───────────────────────┐              │
│         │            │                       │              │
│    ┌────▼────┐  ┌───▼────┐  ┌──────▼───────┐               │
│    │Calendar │  │  Task  │  │  LLM/Agent   │               │
│    │ Service │  │Service │  │   Service    │               │
│    └─────────┘  └────────┘  └──────────────┘               │
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL)                      │
├─────────────────────────────────────────────────────────────┤
│  • Tasks                    • ScheduleSuggestions           │
│  • TimeBlocks              • ScheduleHistory                │
│  • UserPreferences         • TaskCompletionFeedback         │
│  • CalendarEvents          • WorkoutPreferences             │
│  • MediaPreferences        • MealPreferences                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Phase 1: Database Schema Extensions

### New Models Needed

#### 1. WorkoutPreference Model
```python
class WorkoutPreference(Base):
    __tablename__ = "workout_preferences"

    id: UUID
    user_id: UUID (FK → users.id)
    importance_level: Enum['low', 'medium', 'high']
    preferred_time_start: Time  # e.g., "06:00"
    preferred_time_end: Time    # e.g., "09:00"
    frequency_per_week: Integer  # 1-7
    duration_minutes: Integer    # Default: 45
    workout_types: ARRAY[String] # ['strength', 'cardio', 'yoga']
    created_at: DateTime
    updated_at: DateTime
```

#### 2. MealPreference Model
```python
class MealPreference(Base):
    __tablename__ = "meal_preferences"

    id: UUID
    user_id: UUID (FK → users.id)
    meals_enabled: Boolean       # Default: True
    meal_duration_minutes: Integer  # Default: 30 (minimum)

    # Preferred times (nullable)
    breakfast_time: Time         # e.g., "08:00"
    lunch_time: Time             # e.g., "12:30"
    dinner_time: Time            # e.g., "18:30"

    # Flexibility
    meal_time_flexibility_minutes: Integer  # ±30 min

    created_at: DateTime
    updated_at: DateTime
```

#### 3. CommutePreference Model
```python
class CommutePreference(Base):
    __tablename__ = "commute_preferences"

    id: UUID
    user_id: UUID (FK → users.id)

    # Commute windows
    morning_commute_start: Time   # e.g., "07:30"
    morning_commute_end: Time     # e.g., "08:30"
    evening_commute_start: Time   # e.g., "17:00"
    evening_commute_end: Time     # e.g., "18:00"

    # Content preferences
    preferred_podcast_ids: ARRAY[String]
    preferred_music_genres: ARRAY[String]

    # Chore times
    chore_times: JSONB  # [{"day": "saturday", "start": "10:00", "end": "12:00"}]

    created_at: DateTime
    updated_at: DateTime
```

#### 4. ScheduleSuggestion Model
```python
class ScheduleSuggestion(Base):
    __tablename__ = "schedule_suggestions"

    id: UUID
    user_id: UUID (FK → users.id)
    week_start_date: Date

    # Suggested schedule
    suggested_events: JSONB  # Array of scheduled items

    # Metadata
    generation_timestamp: DateTime
    algorithm_version: String
    confidence_score: Float  # 0.0 - 1.0

    # Status
    status: Enum['pending', 'accepted', 'rejected', 'partially_accepted']
    applied_at: DateTime (nullable)

    # AI reasoning
    reasoning: Text
    warnings: JSONB  # Array of warning messages
    conflicts: JSONB  # Array of conflicts detected

    created_at: DateTime
    updated_at: DateTime
```

#### 5. TaskCompletionFeedback Model
```python
class TaskCompletionFeedback(Base):
    __tablename__ = "task_completion_feedback"

    id: UUID
    task_id: UUID (FK → tasks.id)
    user_id: UUID (FK → users.id)

    # Completion data
    estimated_duration_minutes: Integer
    actual_duration_minutes: Integer
    completed: Boolean

    # Feedback
    difficulty_rating: Integer  # 1-5
    notes: Text (nullable)

    created_at: DateTime
```

#### 6. ScheduleHistory Model
```python
class ScheduleHistory(Base):
    __tablename__ = "schedule_history"

    id: UUID
    user_id: UUID (FK → users.id)
    week_start_date: Date

    # Change tracking
    change_type: Enum['initial', 'rebalance', 'manual_edit', 'task_incomplete']
    trigger: String  # Description of what triggered the change

    # Before/after state
    previous_schedule: JSONB
    new_schedule: JSONB

    # Diff summary
    changes_summary: JSONB  # {"added": 2, "removed": 1, "moved": 3}

    created_at: DateTime
```

---

## 📱 Phase 2: Frontend Structure

### New Service: schedulingAgentApi.ts

```typescript
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
};
```

---

## 🎨 Phase 3: Settings Screen Enhancement

### Enhanced SettingsScreen.tsx Structure

```typescript
// mobile/src/screens/SettingsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface UserPreferences {
  // Meal preferences
  mealsEnabled: boolean;
  mealDuration: number;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;

  // Workout preferences
  workoutImportance: 'low' | 'medium' | 'high';
  workoutTimeStart: string;
  workoutTimeEnd: string;
  workoutFrequency: number;
  workoutDuration: number;
  workoutTypes: string[];

  // General schedule
  workingHoursStart: string;
  workingHoursEnd: string;
  bedTime: string;
  wakeTime: string;

  // Commute
  morningCommuteStart: string;
  morningCommuteEnd: string;
  eveningCommuteStart: string;
  eveningCommuteEnd: string;

  // Podcast/Music
  linkedPodcasts: string[];
  preferredMusicGenres: string[];
  audioContextPreferences: {
    commute: string[];  // Podcast IDs
    chores: string[];   // Podcast IDs or 'music'
  };
}

export default function SettingsScreen() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    // Default values
    mealsEnabled: true,
    mealDuration: 30,
    breakfastTime: '08:00',
    lunchTime: '12:30',
    dinnerTime: '18:30',
    workoutImportance: 'medium',
    workoutTimeStart: '06:00',
    workoutTimeEnd: '09:00',
    workoutFrequency: 3,
    workoutDuration: 45,
    workoutTypes: [],
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    bedTime: '22:00',
    wakeTime: '06:00',
    morningCommuteStart: '07:30',
    morningCommuteEnd: '08:30',
    eveningCommuteStart: '17:00',
    eveningCommuteEnd: '18:00',
    linkedPodcasts: [],
    preferredMusicGenres: [],
    audioContextPreferences: {
      commute: [],
      chores: [],
    },
  });

  const [loading, setLoading] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    // Implementation: fetch from backend
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      // Implementation: save to backend
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>

      {/* Meal Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal Preferences</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Enable meal breaks</Text>
          <Switch
            value={preferences.mealsEnabled}
            onValueChange={(value) =>
              setPreferences({ ...preferences, mealsEnabled: value })
            }
          />
        </View>

        {preferences.mealsEnabled && (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Meal duration (minutes)</Text>
              <Picker
                selectedValue={preferences.mealDuration}
                style={styles.picker}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, mealDuration: value })
                }
              >
                <Picker.Item label="30 min" value={30} />
                <Picker.Item label="45 min" value={45} />
                <Picker.Item label="60 min" value={60} />
              </Picker>
            </View>

            {/* Time pickers for breakfast, lunch, dinner */}
            <TimePickerRow
              label="Breakfast time"
              value={preferences.breakfastTime}
              onChange={(time) =>
                setPreferences({ ...preferences, breakfastTime: time })
              }
            />
            <TimePickerRow
              label="Lunch time"
              value={preferences.lunchTime}
              onChange={(time) =>
                setPreferences({ ...preferences, lunchTime: time })
              }
            />
            <TimePickerRow
              label="Dinner time"
              value={preferences.dinnerTime}
              onChange={(time) =>
                setPreferences({ ...preferences, dinnerTime: time })
              }
            />
          </>
        )}
      </View>

      {/* Workout Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Preferences</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Importance level</Text>
          <Picker
            selectedValue={preferences.workoutImportance}
            style={styles.picker}
            onValueChange={(value) =>
              setPreferences({ ...preferences, workoutImportance: value })
            }
          >
            <Picker.Item label="Low" value="low" />
            <Picker.Item label="Medium" value="medium" />
            <Picker.Item label="High" value="high" />
          </Picker>
        </View>

        <TimePickerRow
          label="Preferred start time"
          value={preferences.workoutTimeStart}
          onChange={(time) =>
            setPreferences({ ...preferences, workoutTimeStart: time })
          }
        />

        <TimePickerRow
          label="Preferred end time"
          value={preferences.workoutTimeEnd}
          onChange={(time) =>
            setPreferences({ ...preferences, workoutTimeEnd: time })
          }
        />

        <View style={styles.row}>
          <Text style={styles.label}>Frequency per week</Text>
          <Picker
            selectedValue={preferences.workoutFrequency}
            style={styles.picker}
            onValueChange={(value) =>
              setPreferences({ ...preferences, workoutFrequency: value })
            }
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Picker.Item key={n} label={`${n}x per week`} value={n} />
            ))}
          </Picker>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Duration (minutes)</Text>
          <Picker
            selectedValue={preferences.workoutDuration}
            style={styles.picker}
            onValueChange={(value) =>
              setPreferences({ ...preferences, workoutDuration: value })
            }
          >
            <Picker.Item label="30 min" value={30} />
            <Picker.Item label="45 min" value={45} />
            <Picker.Item label="60 min" value={60} />
            <Picker.Item label="90 min" value={90} />
          </Picker>
        </View>
      </View>

      {/* General Schedule Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General Schedule</Text>

        <TimePickerRow
          label="Working hours start"
          value={preferences.workingHoursStart}
          onChange={(time) =>
            setPreferences({ ...preferences, workingHoursStart: time })
          }
        />

        <TimePickerRow
          label="Working hours end"
          value={preferences.workingHoursEnd}
          onChange={(time) =>
            setPreferences({ ...preferences, workingHoursEnd: time })
          }
        />

        <TimePickerRow
          label="Wake time"
          value={preferences.wakeTime}
          onChange={(time) =>
            setPreferences({ ...preferences, wakeTime: time })
          }
        />

        <TimePickerRow
          label="Bedtime"
          value={preferences.bedTime}
          onChange={(time) =>
            setPreferences({ ...preferences, bedTime: time })
          }
        />
      </View>

      {/* Commute & Audio Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Commute & Audio</Text>

        <Text style={styles.subsectionTitle}>Morning Commute</Text>
        <TimePickerRow
          label="Start time"
          value={preferences.morningCommuteStart}
          onChange={(time) =>
            setPreferences({ ...preferences, morningCommuteStart: time })
          }
        />
        <TimePickerRow
          label="End time"
          value={preferences.morningCommuteEnd}
          onChange={(time) =>
            setPreferences({ ...preferences, morningCommuteEnd: time })
          }
        />

        <Text style={styles.subsectionTitle}>Evening Commute</Text>
        <TimePickerRow
          label="Start time"
          value={preferences.eveningCommuteStart}
          onChange={(time) =>
            setPreferences({ ...preferences, eveningCommuteStart: time })
          }
        />
        <TimePickerRow
          label="End time"
          value={preferences.eveningCommuteEnd}
          onChange={(time) =>
            setPreferences({ ...preferences, eveningCommuteEnd: time })
          }
        />

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => {/* Navigate to podcast selection */}}
        >
          <Text style={styles.linkButtonText}>
            Link Podcasts ({preferences.linkedPodcasts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={savePreferences}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Saving...' : 'Save Preferences'}
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// Helper component for time selection
function TimePickerRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (time: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={() => setShowPicker(true)}>
        <Text style={styles.timeValue}>{value}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={new Date(`2000-01-01T${value}:00`)}
          mode="time"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) {
              const hours = selectedDate.getHours().toString().padStart(2, '0');
              const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
              onChange(`${hours}:${minutes}`);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#333',
  },
  picker: {
    width: 150,
  },
  timeValue: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  linkButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  saveButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
```

---

## 🔄 Phase 4: Backend Implementation

### Part 1: New Routes (schedule_agent.py)

```python
# backend/app/routes/schedule_agent.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime

from app.database import get_db
from app.services.scheduling_agent_service import SchedulingAgentService
from app.schemas.schedule import (
    GenerateScheduleRequest,
    GenerateScheduleResponse,
    RebalanceRequest,
    TaskFeedbackSchema,
    ScheduleStatusResponse,
)
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/schedule/agent", tags=["scheduling-agent"])

@router.post("/generate", response_model=GenerateScheduleResponse)
async def generate_schedule(
    request: GenerateScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a new weekly schedule for the user.
    """
    service = SchedulingAgentService(db)

    try:
        result = await service.generate_schedule(
            user_id=current_user.id,
            week_start_date=request.week_start_date,
            include_goals=request.include_goals,
            force_regenerate=request.force_regenerate,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate schedule: {str(e)}",
        )


@router.post("/rebalance", response_model=GenerateScheduleResponse)
async def rebalance_schedule(
    request: RebalanceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Rebalance the schedule based on task feedback and calendar changes.
    """
    service = SchedulingAgentService(db)

    try:
        result = await service.rebalance_schedule(
            user_id=current_user.id,
            tasks_feedback=request.tasks_feedback,
            calendar_changes=request.calendar_changes,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rebalance schedule: {str(e)}",
        )


@router.post("/feedback")
async def submit_feedback(
    feedback: List[TaskFeedbackSchema],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit task completion feedback for learning.
    """
    service = SchedulingAgentService(db)

    try:
        await service.submit_feedback(
            user_id=current_user.id,
            feedback=feedback,
        )
        return {"message": "Feedback submitted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit feedback: {str(e)}",
        )


@router.get("/status", response_model=ScheduleStatusResponse)
async def get_schedule_status(
    week_start_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the current schedule status for a specific week.
    """
    service = SchedulingAgentService(db)

    try:
        status_info = await service.get_schedule_status(
            user_id=current_user.id,
            week_start_date=week_start_date,
        )
        return status_info
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get schedule status: {str(e)}",
        )
```

---

## ⏭️ NEXT STEPS

This plan document is now saved. I'll continue with:

1. **Phase 4 Part 2**: Backend Service Implementation (scheduling_agent_service.py)
2. **Phase 5**: LLM/AI Agent Integration
3. **Phase 6**: Calendar Screen Integration
4. **Phase 7**: Testing & Validation Strategy
5. **Phase 8**: Deployment Checklist

Would you like me to continue with the next phase?
