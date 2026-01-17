# 🌿 Personal Productivity & Wellness App

A smart personal assistant that manages your time, promotes healthy habits, and provides personalized content recommendations.

## 🤖 AI Scheduling Agent Implementation

We have laid the groundwork for the AI Scheduling Agent. The database models and frontend settings are ready.

### 📚 Documentation
- **[Detailed Implementation Plan](AI_SCHEDULING_AGENT_PLAN.md)**: Read this for architecture and logic details.
- **[Backend Setup](backend/README.md)**: Instructions for running the API.
- **[Mobile Setup](mobile/README.md)**: Instructions for running the React Native app.

### 🚀 How to Start Implementing the Agent

1.  **Verify Data Structures:**
    The `UserPreference` model in `backend/app/models/user_preference.py` is the source of truth for user constraints (workouts, commutes, chores).
    
2.  **Create the Logic Service:**
    Create a new file `backend/app/services/scheduling_agent.py`.
    *   **Input:** `UserPreference` data + Google Calendar Events.
    *   **Output:** A list of suggested `TimeBlocks` or `CalendarEvents`.
    *   **Logic:** Implement the constraint solving described in Phase 3 of the [Plan](AI_SCHEDULING_AGENT_PLAN.md).

3.  **Expose the API:**
    Add a new route in `backend/app/routes/schedule_agent.py` that accepts a POST request to trigger generation.

4.  **Connect the UI:**
    The "Schedule" button in `WorkoutScreen.tsx` is ready to be wired up to your new API endpoint.

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [APIs & External Services](#-apis--external-services)
- [Database Schema](#-database-schema)
- [Implementation Phases](#-implementation-phases)
- [Infrastructure & Deployment](#-infrastructure--deployment)
- [Testing](#-testing)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Project Timeline](#-project-timeline)

---

## ✨ Features

### 1. Smart Calendar Integration
- Connect to Google Calendar via OAuth
- Automatically allocate time for to-do items based on priority and due dates
- Tasks not completed during the week roll over to the next day or weekend
- Respects existing calendar commitments and protected time blocks

### 2. Bedtime & Unwind Mode
- Set a designated unwind time with push notification reminders
- Block selected social media apps during protected evening hours
- Full-screen "unwind mode" overlay to encourage winding down

### 3. Protected Sleep Time
- No tasks can be scheduled during sleep and unwind periods
- Time blocks are sacred and fully protected from any scheduling

### 4. Personalized Media Recommendations
- Curated podcast and audiobook suggestions for commutes, walks, and chores
- Recommendations based on your genre preferences and listening history
- Swipe to like/dislike, shuffle for new suggestions, or add your own items
- Feedback loop continuously improves future recommendations

### 5. Resolutions & Bingo Tracker
- Dedicated tab for New Year's resolutions with progress tracking
- Interactive 5x5 bingo board for achievement goals
- Automatic bingo detection (rows, columns, diagonals)
- Confetti animations and year-end recap visualizations

### 6. Workout Scheduling
- Designated time blocks for fitness activities
- Choose workout types: running, gym, yoga, classes, HIIT
- Auto-generate balanced weekly workout plans
- Syncs with calendar as protected time

### 7. Weekly Journaling
- Protected reflection time at the end of each week
- Push notifications with customizable journaling prompts
- In-app rich text editor with mood tracking
- Optional voice-to-text support

### 8. Full Customization
- All features and configurations fully customizable
- Comprehensive settings interface for complete control

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│              React Native (iOS/Android/Web)                  │
│                   or Next.js (Web + PWA)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend API                              │
│                  Python (FastAPI)                            │
│    ┌──────────┬──────────┬──────────┬──────────────┐        │
│    │ Calendar │  Tasks   │  Media   │ Preferences  │        │
│    │ Service  │ Service  │ Recomm.  │   Service    │        │
│    └──────────┴──────────┴──────────┴──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│   Database   │    │  External    │    │   Notification   │
│  PostgreSQL  │    │    APIs      │    │     Service      │
└──────────────┘    └──────────────┘    └──────────────────┘
```

### Core Services

| Service | Responsibilities |
|---------|------------------|
| **Calendar Service** | OAuth integration, event CRUD, availability calculation, conflict detection |
| **Task Service** | Task management, priority sorting, automatic scheduling, rollover logic |
| **Media Service** | Podcast/audiobook recommendations, preference learning, feedback processing |
| **Preferences Service** | User settings, protected time management, notification preferences |
| **Notification Service** | Push notifications, bedtime reminders, task alerts, journal prompts |

---

## 🛠 Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React Native + Expo | Cross-platform (iOS, Android, Web) |
| **Backend** | Python + FastAPI | Fast, modern, excellent typing support |
| **Database** | PostgreSQL + SQLAlchemy | Reliable, feature-rich, great ORM |
| **Authentication** | Clerk or Auth0 | Handles OAuth flows seamlessly |
| **Background Jobs** | Celery + Redis | Task scheduling, daily sync jobs |
| **Hosting** | Vercel + Railway/Render | Cost-effective, easy deployment |

---

## 🔌 APIs & External Services

| Feature | API/Service | Purpose | Auth Type |
|---------|-------------|---------|-----------|
| Calendar Sync | **Google Calendar API** | Read/write events, check availability | OAuth 2.0 |
| App Blocking | **Screen Time / Digital Wellbeing** | Block social media during unwind | Device Permissions |
| Podcasts | **Spotify API** | Fetch podcasts, playback control | OAuth 2.0 |
| Audiobooks | **Google Books API** | Book metadata, recommendations | API Key |
| Notifications | **Firebase Cloud Messaging** | Push notifications, reminders | API Key |
| AI Features | **OpenAI / Claude API** | Smart scheduling, recommendations | API Key |

### API Setup URLs

- **Google Calendar**: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com
- **Spotify**: https://developer.spotify.com/dashboard
- **Firebase**: https://console.firebase.google.com
- **OpenAI**: https://platform.openai.com/api-keys

---

## 🗄 Database Schema

```sql
-- Users
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  google_tokens JSONB,  -- encrypted
  preferences_json JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Tasks
tasks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  priority INTEGER CHECK (priority BETWEEN 1 AND 5),
  status VARCHAR,  -- pending, scheduled, completed, rolled_over
  due_date DATE,
  calendar_event_id VARCHAR,
  created_at TIMESTAMP
)

-- Protected Time Blocks
time_blocks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR,  -- sleep, unwind, workout, journal
  start_time TIME,
  end_time TIME,
  is_protected BOOLEAN DEFAULT true,
  recurrence_rule VARCHAR,
  created_at TIMESTAMP
)

-- Resolutions
resolutions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR NOT NULL,
  category VARCHAR,
  target_value INTEGER,
  current_value INTEGER DEFAULT 0,
  year INTEGER,
  created_at TIMESTAMP
)

-- Bingo Items
bingo_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  bingo_board_id UUID,
  title VARCHAR NOT NULL,
  position INTEGER CHECK (position BETWEEN 0 AND 24),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP
)

-- Media Preferences
media_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  podcast_genres TEXT[],
  book_genres TEXT[],
  topics TEXT[],
  preferred_duration VARCHAR,  -- short, medium, long
  created_at TIMESTAMP
)

-- Media Feedback
media_feedback (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  media_id VARCHAR,
  media_type VARCHAR,  -- podcast, audiobook
  liked BOOLEAN,
  listen_completion_rate FLOAT,
  created_at TIMESTAMP
)
```

---

## 📅 Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Basic authentication, database setup, and Google Calendar integration

- [x] User authentication with OAuth (Google Sign-In)
- [x] PostgreSQL database schema implementation
- [x] React Native project shell with navigation structure
- [x] FastAPI project structure with service modules
- [x] Google Calendar OAuth flow implementation
- [x] Calendar event CRUD operations (fetch, create, update, delete)
- [x] Available time slot calculation algorithm

### Phase 2: Smart Scheduling (Weeks 3-4)
**Goal:** Automatic task allocation to calendar with rollover logic

**Algorithm Overview:**
```python
def allocate_tasks_to_calendar(tasks, available_slots, protected_times):
    """
    1. Sort tasks by priority (high→low) and due date (earliest first)
    2. Fetch available slots from Google Calendar
    3. Filter out protected times (sleep, unwind, existing events)
    4. Use bin-packing algorithm to fit tasks into slots
    5. If task doesn't fit today, cascade to next day
    6. Weekend overflow for incomplete weekly tasks
    """
    for task in sorted_tasks:
        slot = find_best_slot(task.duration, available_slots)
        if slot:
            create_calendar_event(slot, task)
            mark_slot_used(slot)
        else:
            cascade_to_next_day(task)
```

- [ ] Task priority sorting algorithm
- [ ] Available slot detection with conflict checking
- [ ] Bin-packing algorithm for optimal task placement
- [ ] Next-day cascade logic for overflow tasks
- [ ] Weekend overflow for incomplete weekly tasks
- [ ] Morning sync job to re-evaluate incomplete tasks
- [ ] "Mark as done" functionality with calendar sync

### Phase 3: Unwind & Sleep Protection (Week 5)
**Goal:** Bedtime reminders and social media blocking during protected time

**Implementation Options:**

| Platform | Approach |
|----------|----------|
| iOS | Screen Time API or Focus Mode shortcut automation |
| Android | Digital Wellbeing API or Accessibility Service |
| Cross-platform | VPN-based blocker SDK or DNS-level blocking |

- [ ] Protected time configuration in user settings
- [ ] Push notification at unwind_start_time
- [ ] Full-screen "unwind mode" overlay in app
- [ ] User-guided Focus Mode setup (iOS)
- [ ] Do Not Disturb integration (Android)
- [ ] Blocked apps list management

### Phase 4: Media Recommendations (Weeks 6-7)
**Goal:** Personalized podcast and audiobook suggestions with feedback learning

```python
class MediaRecommender:
    def get_recommendations(self, context="commute"):
        # 1. Fetch candidates from Spotify/podcast APIs
        candidates = self.fetch_from_apis(self.prefs.genres)
        
        # 2. Use embeddings to find similar to liked items
        scored = self.score_by_similarity(candidates, self.feedback.liked)
        
        # 3. Filter out disliked/already consumed
        filtered = self.filter_consumed(scored)
        
        # 4. Use LLM for final curation based on context
        return llm_curate(filtered, context)
    
    def record_feedback(self, item_id, liked: bool):
        self.feedback.append({"item": item_id, "liked": liked})
```

- [ ] Spotify API integration for podcast fetching
- [ ] Google Books API integration for audiobooks
- [ ] User preference input (genres, topics, duration)
- [ ] Embedding-based similarity scoring
- [ ] LLM-powered contextual curation
- [ ] Swipe interface (right=like, left=dislike)
- [ ] Listening completion tracking
- [ ] Custom item addition by user

### Phase 5: Resolutions & Bingo (Week 8)
**Goal:** Goal tracking with gamification elements

- [ ] Resolution cards with progress bars
- [ ] Target tracking and progress updates
- [ ] 5x5 interactive bingo board UI
- [ ] Tap-to-complete functionality
- [ ] Automatic bingo line detection (rows, columns, diagonals)
- [ ] Confetti animation on achievements
- [ ] Year-end recap visualization with statistics

### Phase 6: Workout & Journal (Week 9)
**Goal:** Fitness scheduling and weekly reflection time

**Workout Scheduler:**
- [ ] Workout type selection (running, gym, yoga, classes, HIIT)
- [ ] Frequency setting (workouts per week)
- [ ] Preferred time slots configuration
- [ ] Auto-generated balanced weekly plan
- [ ] Calendar integration as protected time

**Journal Features:**
- [ ] Weekly recurring "Sunday Reflection" event
- [ ] Push notification with journaling prompts
- [ ] In-app rich text editor
- [ ] Mood tracking integration
- [ ] Optional voice-to-text support

### Phase 7: Settings & Polish (Weeks 10-11)
**Goal:** Full customization and production readiness

- [ ] Comprehensive settings interface
- [ ] Time preferences (wake, unwind, sleep)
- [ ] Scheduling options (buffer time, morning/evening preference)
- [ ] App blocking configuration
- [ ] Workout preferences
- [ ] Media preferences
- [ ] Journal settings
- [ ] UI polish and animations
- [ ] Performance optimization
- [ ] Bug fixes and edge cases

---

## 🚀 Infrastructure & Deployment

### Development Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy celery redis alembic

# Frontend
npx create-expo-app@latest frontend
cd frontend
npm install @react-navigation/native axios zustand
npm install @react-native-async-storage/async-storage
```

### Production Infrastructure

| Component | Service | Estimated Cost |
|-----------|---------|----------------|
| Frontend Hosting | Vercel / Expo | Free tier |
| Backend + DB | Railway / Render | $5-20/month |
| Redis (Jobs) | Upstash / Railway | Free tier / $5/month |
| Notifications | Firebase Cloud Messaging | Free tier |
| External APIs | Google, Spotify, OpenAI | Free tiers (personal use) |

**Total Estimated Monthly Cost: $5-25 for personal use**

### Environment Variables

```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@host:5432/wellness_db
REDIS_URL=redis://localhost:6379
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
OPENAI_API_KEY=your_openai_api_key
FIREBASE_CREDENTIALS=path/to/firebase-credentials.json

# Frontend (.env)
EXPO_PUBLIC_API_URL=https://your-backend-url.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## 🧪 Testing

### Unit Tests

```python
# test_scheduler.py
def test_task_allocation_respects_protected_time():
    user = create_test_user(unwind_start="21:30", sleep="23:00")
    task = Task(title="Work", duration=60)
    
    result = allocate_task(task, date="2024-01-15", user=user)
    
    assert result.end_time < time(21, 30)

def test_incomplete_tasks_cascade_to_next_day():
    task = Task(status="incomplete", due_date="2024-01-15")
    
    result = daily_rollover(task)
    
    assert result.scheduled_date == "2024-01-16"

def test_bingo_detection():
    board = create_board_with_completed_row(0)
    
    result = detect_bingo(board)
    
    assert result.has_bingo == True
    assert result.type == "row"
```

### Integration Tests

```python
def test_google_calendar_sync():
    with mock_google_api():
        events = fetch_calendar_events(user_id=1, date_range=week)
        assert len(events) > 0

def test_end_to_end_task_scheduling():
    task = create_task("Read chapter 5", duration=30)
    result = schedule_task(task)
    
    calendar_event = fetch_event(result.event_id)
    assert calendar_event.summary == "Read chapter 5"
```

### Manual Testing Checklist

- [ ] OAuth flow works on iOS and Android
- [ ] Tasks appear correctly in Google Calendar
- [ ] Unwind notification fires at configured time
- [ ] Protected time blocks prevent task scheduling
- [ ] Podcast recommendations update based on feedback
- [ ] Bingo detection works for all winning patterns
- [ ] Settings persist after app restart
- [ ] Workout schedule syncs to calendar
- [ ] Journal prompts appear at scheduled time

---

## 🏁 Getting Started

### Week 1 Quick Start

1. **Set up Google Cloud Project**
   ```
   - Go to console.cloud.google.com
   - Create new project
   - Enable Google Calendar API
   - Configure OAuth consent screen
   - Create OAuth 2.0 credentials
   ```

2. **Initialize repositories**
   ```bash
   mkdir wellness-app && cd wellness-app
   
   # Frontend
   npx create-expo-app frontend
   
   # Backend
   mkdir backend && cd backend
   python -m venv venv
   source venv/bin/activate
   pip install fastapi uvicorn sqlalchemy
   ```

3. **Build OAuth flow first** — this unlocks all calendar functionality

4. **Design database schema** — use dbdiagram.io to visualize relationships

5. **Set up CI/CD** — configure GitHub Actions for linting and testing

---

## ⚙️ Configuration

### User Settings Interface

```typescript
interface UserSettings {
  // Time preferences
  wakeTime: string;           // "07:00"
  unwindStartTime: string;    // "21:30"
  sleepTime: string;          // "23:00"
  
  // Scheduling preferences
  taskBufferMinutes: number;  // 15
  preferMorningTasks: boolean;
  weekendOverflowEnabled: boolean;
  
  // Blocked apps
  blockedApps: string[];      // ["instagram", "twitter", "tiktok"]
  
  // Workout preferences
  workoutTypes: WorkoutType[];
  workoutsPerWeek: number;
  preferredWorkoutTimes: TimeSlot[];
  
  // Media preferences
  podcastGenres: string[];
  bookGenres: string[];
  preferredDuration: 'short' | 'medium' | 'long';
  
  // Journal settings
  journalDay: DayOfWeek;
  journalTime: string;
  journalPromptsEnabled: boolean;
}
```

---

## 📊 Project Timeline

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| Phase 1: Foundation | 2 weeks | Auth + Calendar read/write |
| Phase 2: Smart Scheduling | 2 weeks | Auto task allocation |
| Phase 3: Unwind Mode | 1 week | Bedtime reminders + protection |
| Phase 4: Media Recs | 2 weeks | Podcast/book suggestions |
| Phase 5: Resolutions | 1 week | Goals + Bingo UI |
| Phase 6: Workout/Journal | 1 week | Fitness + reflection |
| Phase 7: Polish | 2 weeks | Settings, testing, deploy |

**Total: ~11 weeks for MVP**

---

## 📝 License

MIT License - feel free to use this for your own personal productivity!

---

## 🤝 Contributing

This is a personal project, but suggestions and ideas are welcome! Open an issue to discuss.