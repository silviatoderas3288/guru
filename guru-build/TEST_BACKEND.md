# Testing the Backend

Quick guide to test your Google Calendar backend integration.

## Step 1: Start the Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

## Step 2: Test Basic Endpoints

### Health Check
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status":"healthy"}
```

### API Documentation
Open in browser: http://localhost:8000/docs

You should see all the calendar endpoints.

## Step 3: Test Without Mobile App (Using curl)

### Save Test Tokens (This will create a user)

```bash
curl -X POST "http://localhost:8000/api/v1/calendar/oauth/tokens" \
  -H "Content-Type: application/json" \
  -d 
```json
{
    "access_token": "YOUR_GOOGLE_ACCESS_TOKEN",
    "refresh_token": "YOUR_GOOGLE_REFRESH_TOKEN",
    "token_uri": "https://oauth2.googleapis.com/token",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET"
  }
```

Expected response:
```json
{
  "message": "Google tokens saved successfully",
  "user_id": "some-uuid",
  "email": "your@email.com"
}
```

## Step 4: Test with Mobile App

### The Correct Flow

1. **Start Backend**
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

2. **Start Mobile**
   ```bash
   cd mobile
   npx expo start
   ```

3. **Sign In with Google**
   - Open app in Expo Go
   - Click "Sign in with Google"
   - Complete OAuth flow
   - **This automatically saves tokens to backend**

4. **Navigate to Page 2**
   - You should now see "Synced with Google Calendar"
   - Pull down to refresh
   - Your calendar events should load!

## Common Errors and Solutions

### Error: "No user found. Please authenticate"

**Cause**: Backend has no users in database.

**Solution**:
- Make sure you signed in with Google in the mobile app
- Check backend logs to confirm tokens were saved
- Verify database has users:
  ```bash
  cd backend
  python -c "
  from app.database import SessionLocal
  from app.models.user import User
  db = SessionLocal()
  users = db.query(User).all()
  print(f'Found {len(users)} users')
  for u in users:
      print(f'  - {u.email}')
  "
  ```

### Error: "Failed to load calendar events"

**Cause**: Google tokens might be invalid or expired.

**Solution**:
- Sign out and sign in again in mobile app
- Check Google Cloud Console that Calendar API is enabled
- Verify scopes include calendar access

### Error: "Connection refused" from mobile

**Cause**: Backend not running or wrong URL.

**Solution**:
- Verify backend is running: `curl http://localhost:8000/health`
- Check mobile `.env` has `EXPO_PUBLIC_API_URL=http://localhost:8000`
- For physical devices, use computer's IP instead of localhost

## Debugging Tips

### Check Backend Logs

When you make requests, you should see logs like:
```
INFO:     127.0.0.1:54321 - "POST /api/v1/calendar/oauth/tokens HTTP/1.1" 200 OK
INFO:     127.0.0.1:54322 - "GET /api/v1/calendar/events HTTP/1.1" 200 OK
```

### Check Database

```bash
cd backend
python
```

```python
from app.database import SessionLocal
from app.models.user import User

db = SessionLocal()

# Check users
users = db.query(User).all()
print(f"Total users: {len(users)}")

for user in users:
    print(f"\nUser: {user.email}")
    print(f"Has tokens: {bool(user.google_tokens)}")
    if user.google_tokens:
        print(f"Access token (first 20 chars): {user.google_tokens.get('access_token', '')[:20]}...")
```


### Test Google Calendar API Directly

```python
from app.services.calendar_service import CalendarService
from app.database import SessionLocal
from app.models.user import User
from datetime import datetime, timedelta

db = SessionLocal()
user = db.query(User).first()

if user and user.google_tokens:
    cal = CalendarService(tokens=user.google_tokens)

    # Fetch events
    events = cal.get_events(
        time_min=datetime.utcnow(),
        time_max=datetime.utcnow() + timedelta(days=7)
    )

    print(f"Found {len(events)} events")
    for event in events[:5]:
        print(f"  - {event.get('summary', 'No title')}")
else:
    print("No user or tokens found")
```

## Success Indicators

✅ Backend starts without errors
✅ `/health` endpoint returns 200
✅ `/docs` shows API documentation
✅ Mobile app connects and saves tokens
✅ Page 2 shows "Synced with Google Calendar"
✅ Can pull down to refresh and see events
✅ Can schedule tasks to calendar
✅ Events appear in Google Calendar

## Next Steps

Once everything is working:
1. Add authentication middleware (JWT tokens)
2. Implement proper user sessions
3. Add token refresh logic
4. Encrypt tokens in database
5. Add rate limiting
6. Deploy to production

For now, the development setup works great for testing! 🚀
