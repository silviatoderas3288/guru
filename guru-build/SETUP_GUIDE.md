# Google Calendar OAuth Setup Guide

This guide will help you set up Google Calendar integration for your Guru app, ensuring Page 2 (Smart Tasks) can sync with your Google Calendar.

## Table of Contents
1. [Google Cloud Console Setup](#google-cloud-console-setup)
2. [Backend Configuration](#backend-configuration)
3. [Mobile App Configuration](#mobile-app-configuration)
4. [Testing the OAuth Flow](#testing-the-oauth-flow)
5. [Troubleshooting](#troubleshooting)

---

## Google Cloud Console Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name: `guru-productivity-app`
4. Click **Create**

### Step 2: Enable Google Calendar API

1. Navigate to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click **Google Calendar API**
4. Click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Click **Create**
4. Fill in required fields:
   - **App name**: Guru Productivity App
   - **User support email**: your email
   - **Developer contact information**: your email
5. Click **Save and Continue**
6. **Scopes**: Click **Add or Remove Scopes**
   - Add: `https://www.googleapis.com/auth/calendar`
   - Add: `https://www.googleapis.com/auth/calendar.events`
7. Click **Save and Continue**
8. **Test users**: Add your email for testing
9. Click **Save and Continue**

### Step 4: Create OAuth Credentials

#### For iOS (Expo Go)

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **iOS**
4. **Name**: `Guru iOS Client`
5. **Bundle ID**: `host.exp.Exponent` (for Expo Go)
6. Click **Create**
7. **Copy the iOS Client ID** - you'll need this!

#### For Web (Development)

1. Click **Create Credentials** → **OAuth client ID**
2. Select **Web application**
3. **Name**: `Guru Web Client`
4. **Authorized redirect URIs**: Add these:
   - `http://localhost:8000/auth/google/callback`
   - `http://localhost:19006`
5. Click **Create**
6. **Copy the Client ID and Client Secret** - you'll need these!

---

## Backend Configuration

### Step 1: Update Environment Variables

1. Copy the example environment file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` with your Google OAuth credentials:
   ```bash
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

3. Make sure your database is running:
   ```bash
   # Start PostgreSQL (if using Docker)
   docker-compose up -d postgres

   # Or using local PostgreSQL
   brew services start postgresql
   ```

### Step 2: Run Database Migrations

```bash
# Make sure you're in the backend directory
cd backend

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows

# Run migrations
alembic upgrade head
```

### Step 3: Start the Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

### Step 4: Test the API

Open your browser and go to: [http://localhost:8000/docs](http://localhost:8000/docs)

You should see the FastAPI interactive documentation with these endpoints:
- `POST /api/v1/calendar/oauth/tokens` - Save Google tokens
- `GET /api/v1/calendar/events` - Fetch calendar events
- `POST /api/v1/calendar/events` - Create calendar event
- `PUT /api/v1/calendar/events/{event_id}` - Update calendar event
- `DELETE /api/v1/calendar/events/{event_id}` - Delete calendar event
- `POST /api/v1/calendar/available-slots` - Get available time slots

---

## Mobile App Configuration

### Step 1: Update Environment Variables

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your credentials:
   ```bash
   # iOS Client ID (from Google Cloud Console)
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com

   # Web Client ID (from Google Cloud Console)
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com

   # Client Secret (from Web OAuth client)
   EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your-client-secret

   # Backend API URL
   EXPO_PUBLIC_API_URL=http://localhost:8000
   ```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start the Mobile App

```bash
npx expo start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your phone

---

## Testing the OAuth Flow

### Step 1: Sign In with Google

1. Open the app in Expo Go or simulator
2. You should see a Login screen
3. Click **Sign in with Google**
4. You'll be redirected to Google's consent screen
5. Select your Google account
6. Grant permissions for Calendar access
7. You'll be redirected back to the app

### Step 2: Verify Token Storage

After successful sign-in, the app will:
1. Store your Google access token locally (AsyncStorage)
2. Send tokens to the backend (`POST /api/v1/calendar/oauth/tokens`)
3. Backend saves encrypted tokens in the database

### Step 3: Test Calendar Integration on Page 2

1. Navigate to **Page 2** (Smart Tasks)
2. You should see your tasks list
3. The backend will use your saved Google tokens to:
   - Fetch your existing calendar events
   - Create new events when you schedule tasks
   - Calculate available time slots

---

## How Page 2 Works with Google Calendar

### Current Flow

Page 2 (PageTwo.tsx) currently shows a mock task list. Here's how to connect it to the real Google Calendar:

### 1. Fetching Calendar Events

```typescript
import { CalendarApiService } from '../services/calendarApi';

// Fetch events for the next 7 days
const events = await CalendarApiService.getCalendarEvents(
  new Date(), // from now
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // to 7 days later
);
```

### 2. Creating Calendar Events from Tasks

When a user completes a task or wants to schedule it:

```typescript
// Create a calendar event for a task
const event = await CalendarApiService.createCalendarEvent({
  summary: task.title,
  description: `Task: ${task.title}\nPriority: ${task.priority}`,
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + task.duration * 60 * 1000).toISOString(),
});
```

### 3. Getting Available Time Slots

To show when tasks can be scheduled:

```typescript
const slots = await CalendarApiService.getAvailableSlots({
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  slot_duration: 30, // 30-minute slots
  working_hours_start: 9, // 9 AM
  working_hours_end: 17, // 5 PM
});
```

### 4. Auto-Scheduling Algorithm

The backend includes a `TaskSchedulingService` that:
1. Sorts tasks by priority and due date
2. Finds available time slots
3. Filters out protected time (sleep, unwind)
4. Automatically creates calendar events
5. Handles rollover for incomplete tasks

---

## API Endpoints Reference

### Authentication

#### Save Google Tokens
```http
POST /api/v1/calendar/oauth/tokens
Content-Type: application/json

{
  "access_token": "ya29.a0...",
  "refresh_token": "1//...",
  "token_uri": "https://oauth2.googleapis.com/token",
  "client_id": "your-client-id",
  "client_secret": "your-client-secret"
}
```

### Calendar Events

#### Get Events
```http
GET /api/v1/calendar/events?time_min=2025-01-01T00:00:00Z&time_max=2025-01-07T23:59:59Z
```

#### Create Event
```http
POST /api/v1/calendar/events
Content-Type: application/json

{
  "summary": "Finish project proposal",
  "description": "Complete the Q1 project proposal",
  "start_time": "2025-01-02T10:00:00Z",
  "end_time": "2025-01-02T12:00:00Z"
}
```

#### Update Event
```http
PUT /api/v1/calendar/events/{event_id}
Content-Type: application/json

{
  "summary": "Updated title",
  "start_time": "2025-01-02T11:00:00Z"
}
```

#### Delete Event
```http
DELETE /api/v1/calendar/events/{event_id}
```

### Available Slots

#### Get Available Time Slots
```http
POST /api/v1/calendar/available-slots
Content-Type: application/json

{
  "start_date": "2025-01-01T00:00:00Z",
  "end_date": "2025-01-07T23:59:59Z",
  "slot_duration": 30,
  "working_hours_start": 9,
  "working_hours_end": 17
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Redirect URI mismatch" Error

**Problem**: OAuth redirect URI doesn't match what's configured in Google Cloud Console.

**Solution**:
- For Expo Go: Make sure you're using the reversed iOS client ID
- Check that your redirect URI matches: `com.googleusercontent.apps.{IOS_CLIENT_ID}:/oauth2redirect/google`
- Update Google Cloud Console if needed

#### 2. "Invalid grant" Error

**Problem**: Tokens have expired or are invalid.

**Solution**:
- Clear app storage and sign in again
- Check that refresh_token is being saved
- Verify token_uri is correct: `https://oauth2.googleapis.com/token`

#### 3. Backend Can't Connect to Database

**Problem**: `DATABASE_URL` is incorrect or PostgreSQL isn't running.

**Solution**:
```bash
# Check if PostgreSQL is running
brew services list

# Start PostgreSQL
brew services start postgresql

# Verify connection
psql -U postgres -d guru_db
```

#### 4. CORS Errors in Mobile App

**Problem**: Backend rejecting requests from mobile app.

**Solution**:
- Check `ALLOWED_ORIGINS` in backend `.env`
- Verify `EXPO_PUBLIC_API_URL` in mobile `.env`
- For local development, backend should allow `*` origins (already configured)

#### 5. "No user found" Error

**Problem**: No user exists in the database yet.

**Solution**:
```bash
# Create a test user using Python
cd backend
python -c "
from app.database import SessionLocal
from app.models.user import User

db = SessionLocal()
user = User(email='test@example.com')
db.add(user)
db.commit()
print('User created!')
"
```

---

## Next Steps

Now that Google Calendar OAuth is working, you can:

1. **Update PageTwo.tsx** to fetch real calendar events
2. **Implement auto-scheduling** when users add tasks
3. **Add protected time blocks** (sleep, unwind) to prevent scheduling during those times
4. **Build the task rollover logic** for incomplete tasks

Check the [README.md](README.md) for the full implementation roadmap!

---

## Security Notes

- **Never commit `.env` files** to version control
- Store Google tokens **encrypted** in the database (update User model as needed)
- Use **HTTPS in production** for all OAuth redirects
- Rotate tokens regularly and implement proper refresh logic
- Consider using a secrets manager (AWS Secrets Manager, Google Secret Manager) in production

---

## Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [Expo AuthSession Documentation](https://docs.expo.dev/guides/authentication/#google)
- [FastAPI OAuth2 Documentation](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) - Test API calls
