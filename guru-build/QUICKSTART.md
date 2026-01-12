# Quick Start Guide

Get the Guru app running in 5 minutes!

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 14+
- Expo Go app on your phone

---

## Mobile App Setup (2 minutes)

```bash
# 1. Navigate to mobile directory
cd mobile

# 2. Install dependencies (if not done)
npm install

# 3. Start Expo
npx expo start

# 4. Scan QR code with Expo Go app
# - iOS: Use Camera app to scan QR
# - Android: Use Expo Go app to scan QR
```

**That's it!** You should see the login screen. Sign in with Google to see the navigation tabs.

---

## Backend API Setup (3 minutes)

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create PostgreSQL database
createdb guru_db

# 5. Copy environment file
cp .env.example .env

# 6. Edit .env and set database URL
# DATABASE_URL=postgresql://localhost:5432/guru_db

# 7. Run database migrations
alembic upgrade head

# 8. Start the API server
uvicorn app.main:app --reload
```

**Done!** Visit http://localhost:8000/docs to see the API documentation.

---

## Verify Everything Works

### Mobile App ✅
1. Open Expo Go and scan QR code
2. See "Welcome to Guru" login screen
3. Tap "Sign in with Google"
4. After login, see 4 tabs: Calendar, Media, Goals, Settings

### Backend API ✅
1. Visit http://localhost:8000
2. Should see: `{"message": "Welcome to Guru API"}`
3. Visit http://localhost:8000/docs
4. Should see Swagger API documentation
5. Try http://localhost:8000/health
6. Should see: `{"status": "healthy"}`

---

## Troubleshooting

### Mobile: "Can't connect to Metro"
```bash
npx expo start -c  # Clear cache and restart
```

### Mobile: Google OAuth not working
- Check that you added the correct redirect URI in Google Cloud Console
- For tunnel mode: Add the `exp://xxx.exp.direct` URI
- For LAN mode: Add the `exp://192.168.x.x:8081` URI

### Backend: Database connection error
```bash
# Make sure PostgreSQL is running
postgres --version

# Check if database exists
psql -l | grep guru_db

# If not, create it
createdb guru_db
```

### Backend: Module import errors
```bash
# Make sure virtual environment is activated
which python  # Should show path to venv

# Reinstall dependencies
pip install -r requirements.txt
```

---

## Using Page 2 - Google Calendar Integration 📅

Your Page 2 now syncs with Google Calendar! Here's how to use it:

### 1. Sign In with Google
- Click "Sign in with Google" on login screen
- Grant calendar permissions
- Your tokens are saved to the backend automatically

### 2. Navigate to Page 2
- After login, tap the second tab
- You'll see "Smart Tasks & Calendar"

### 3. View Your Calendar Events
- Pull down to refresh
- All your Google Calendar events for the next 7 days load automatically
- Events marked with `[Task]` appear as tasks

### 4. Add and Schedule Tasks
```
1. Type task name in the input field
2. Press + or hit enter
3. Task appears in "Pending" section
4. Tap "📅 Schedule to Calendar" button
5. Task is added to your Google Calendar!
6. Check calendar.google.com - you'll see it there!
```

### 5. Manage Tasks
- **Tap any task** to mark it complete
- **Pull down** to refresh from Google Calendar
- **Scheduled tasks** show the scheduled time

### Example Workflow
```
Add task: "Review project proposal"
  → Appears in "Pending"

Tap "📅 Schedule to Calendar"
  → Moves to "Scheduled"
  → Shows time: "🕐 2:00 PM"
  → Event created in Google Calendar

Check Google Calendar
  → See: "[Task] Review project proposal"

Tap task to complete
  → Moves to "Completed" section
```

## What's Next?

- Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed Google OAuth setup
- See [README.md](README.md) for full feature roadmap
- Backend API docs: http://localhost:8000/docs

Happy coding! 🚀
