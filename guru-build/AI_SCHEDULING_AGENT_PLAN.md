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
│  │   Calendar   │  │   Workout    │  │   Profile    │      │
│  │    Screen    │  │    Screen    │  │   Settings   │      │
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
│  GET  /api/v1/preferences/{email}                           │
│  POST /api/v1/preferences                                   │
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
│  • Tasks                    • UserPreferences (Consolidated)│
│  • TimeBlocks              • ScheduleHistory                │
│  • CalendarEvents          • Workouts                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Phase 1: Database Schema (Implemented)

We have consolidated user preferences into a single `UserPreference` model to simplify management and frontend integration.

### UserPreference Model (Active)
This model collects all inputs from the "Page Five" settings modal.

```python
class UserPreference(Base):
    __tablename__ = "user_preferences"

    id: UUID
    user_id: UUID (FK → users.id)

    # Podcast preferences
    podcast_topics: ARRAY[String]  # e.g. ['Tech', 'Science']
    podcast_length: String         # e.g. '20-40 minutes'
    notifications: String          # e.g. 'Enabled'

    # Workout preferences
    workout_types: ARRAY[String]   # e.g. ['Cardio', 'Yoga']
    workout_duration: String       # e.g. '30-45 minutes'
    workout_frequency: String      # e.g. '3-4 times per week'
    workout_days: ARRAY[String]    # e.g. ['Monday', 'Wednesday']
    workout_preferred_time: String # e.g. 'Morning'

    # Commute preferences
    commute_start: String          # e.g. '08:00 AM'
    commute_end: String            # e.g. '09:00 AM'
    commute_duration: String       # e.g. '30-60 min'

    # Chore preferences
    chore_time: String             # e.g. 'Weekend Mornings'
    chore_duration: String         # e.g. '1 hour'

    # Focus & Schedule preferences
    bed_time: String               # e.g. '10:00 PM'
    focus_time_start: String       # e.g. '09:00 AM'
    focus_time_end: String         # e.g. '11:00 AM'
    blocked_apps: ARRAY[String]    # e.g. ['Instagram']
```

---

## 📱 Phase 2: Frontend Integration (Implemented)

The frontend implementation is located in `mobile/src/screens/PageFive.tsx` (Settings Modal) and `mobile/src/screens/WorkoutScreen.tsx` (Plan View).

### 1. Settings Data Flow
- **Input:** User selects preferences (e.g., "Morning" workouts, "Tech" podcasts) in the Settings Modal.
- **Storage:** Data is sent to `POST /api/preferences`.
- **Retrieval:** Agent fetches these preferences via `UserPreference` model to inform scheduling.

### 2. Workout Screen Integration
- **Quick Add:** Users can now quickly add exercises to their plan.
- **AI Scheduling Button:** A "Schedule" button exists (currently a placeholder) which will trigger the AI Agent.

---

## 🧠 Phase 3: AI Agent Logic (To Be Implemented)

The AI Agent will use the `UserPreference` data to build the schedule.

### Logic Flow

1.  **Fetch Context:**
    *   Get `UserPreference` (knows *when* user likes to work out, *what* podcasts they like).
    *   Get `WeeklyGoals` (from `ListItems` table).
    *   Get `CalendarEvents` (Google Calendar).

2.  **Constraint Solving (The "Brain"):**
    *   *Workouts:* If `workout_days`=['Mon', 'Wed'] and `workout_preferred_time`='Morning', look for free slots on Mon/Wed mornings.
    *   *Commutes:* Block out `commute_start` to `commute_end`. Suggest podcasts from `podcast_topics` during this time.
    *   *Chores:* Schedule `chore_duration` block during `chore_time` (e.g., Sat 10 AM).

3.  **Generation:**
    *   Create `TimeBlock` entries or `CalendarEvent` suggestions.
    *   Return a structured plan to the frontend.

---

## 🚀 Getting Started with Implementation

To start implementing the AI Agent logic connecting these pieces:

### Step 1: Backend Service Setup
Create `backend/app/services/scheduling_agent.py`.
```python
class SchedulingAgentService:
    def __init__(self, db: Session):
        self.db = db

    async def generate_schedule(self, user_id: UUID):
        # 1. Load Preferences
        prefs = self.db.query(UserPreference).filter_by(user_id=user_id).first()
        
        # 2. Load Calendar (Mock for now or use GoogleService)
        calendar_events = [] 

        # 3. Apply Logic
        # Example: Schedule Workouts
        suggested_slots = []
        if "Monday" in prefs.workout_days and prefs.workout_preferred_time == "Morning":
            suggested_slots.append({"day": "Monday", "time": "08:00", "activity": "Workout"})

        return suggested_slots
```

### Step 2: Connect Frontend Button
In `mobile/src/screens/WorkoutScreen.tsx`, update the `handleSchedule` function to call the backend:

```typescript
const handleSchedule = async () => {
  // Call API to generate schedule
  const plan = await AgentService.generate(user.id);
  // Show plan in Modal
};
```

### Step 3: Run & Test
1.  **Start Backend:** `cd backend && uvicorn app.main:app --reload`
2.  **Start Mobile:** `cd mobile && npm start`
3.  **Configure:** Go to **Profile -> Settings** and save your preferences.
4.  **Trigger:** Go to **Workout Screen -> Schedule** and verify the agent receives your saved preferences.