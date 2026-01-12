# Podcast Page (Page 3) - Implementation Summary

## What Was Created

### 1. **New Podcast Page Design** ([mobile/src/screens/PageThree.tsx](mobile/src/screens/PageThree.tsx))

The page now features:
- **Purple background** (#F7E8FF) matching the rest of your app
- **Settings button** in the top right corner with gradient
- **"Podcasts" title** in orange with underline decoration
- **Background image** showing podcast vectors/lines (podcasts.png)
- **Grid layout** of podcast items using:
  - **sq.png** (squares) for even-indexed items
  - **rect.png** (rectangles) for odd-indexed items
  - Colored with alternating **orange** (#FF9D00) and **blue** (#4D5AEE)
- **Margarine font** throughout for consistency

### 2. **Schedule Modal**

When clicking a podcast:
- **Transparent blue modal** (rgba(77, 90, 238, 0.85))
- **AI button** in top right corner (for future implementation)
- **Manual Schedule button** - to manually add to calendar
- **Cancel button** to close the modal

### 3. **Spotify API Integration**

#### Backend Files Created:
- `backend/app/routes/spotify.py` - Spotify API routes
  - `/api/v1/spotify/exchange-code` - Exchange auth code for token
  - `/api/v1/spotify/refresh` - Refresh access token
  - `/api/v1/spotify/user-shows` - Get user's saved podcasts
  - `/api/v1/spotify/search` - Search for podcasts
  - `/api/v1/spotify/shows/{id}/episodes` - Get podcast episodes

#### Mobile Files Created:
- `mobile/src/services/spotifyApi.ts` - Spotify API service
  - OAuth authentication flow
  - Token management (access & refresh)
  - Fetch user's podcasts
  - Search functionality
  - Episode retrieval

#### Documentation Created:
- `mobile/SPOTIFY_SETUP.md` - Complete setup guide

## How to Connect Your Spotify Account

### Quick Setup Steps:

1. **Go to Spotify Developer Dashboard**
   - Visit: https://developer.spotify.com/dashboard
   - Log in with your Spotify account
   - Click "Create an App"

2. **Create Your App**
   - **App Name**: Guru Podcast Recommendations
   - **App Description**: Personal productivity app
   - **Redirect URIs**: Add:
     - `guru://spotify-auth`
     - `http://localhost:8000/api/v1/spotify/callback`
   - Click "Save"

3. **Get Your Credentials**
   - Copy your **Client ID**
   - Click "Show Client Secret" and copy it

4. **Add to Backend .env**
   ```bash
   # In backend/.env
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   SPOTIFY_REDIRECT_URI=http://localhost:8000/api/v1/spotify/callback
   ```

5. **Add to Mobile .env**
   ```bash
   # In mobile/.env
   EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id_here
   ```

6. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   pip install spotipy requests

   # Mobile (already installed if you have expo)
   cd mobile
   npm install expo-auth-session expo-web-browser
   ```

7. **Restart Backend Server**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload
   ```

## Features You Can Build

### Current Features:
- View sample podcasts
- Click to schedule podcasts
- Manual scheduling option
- AI button (placeholder for future)

### With Spotify Connected:
1. **Personalized Recommendations**
   - Fetch user's saved podcasts
   - Display real podcast artwork
   - Show actual episode counts

2. **Smart Scheduling**
   - Schedule specific episodes to calendar
   - Set listening reminders
   - Track listening progress

3. **Search & Discovery**
   - Search Spotify's podcast catalog
   - Browse by category
   - Get personalized recommendations

4. **Playback Control** (Premium only)
   - Start/pause playback
   - Queue episodes
   - See currently playing

## Design Elements Used

- **Background**: podcasts.png (vector lines design)
- **Squares**: sq.png (for square podcast cards)
- **Rectangles**: rect.png (for rectangular podcast cards)
- **Colors**: Alternating orange (#FF9D00) and blue (#4D5AEE)
- **Font**: Margarine (consistent with app)
- **Modal**: Transparent blue background matching your design system

## File Locations

```
mobile/
├── assets/
│   ├── podcasts.png    (background image)
│   ├── sq.png          (square shape)
│   └── rect.png        (rectangle shape)
├── src/
│   ├── screens/
│   │   └── PageThree.tsx       (main podcast page)
│   └── services/
│       └── spotifyApi.ts       (Spotify integration)
└── SPOTIFY_SETUP.md    (setup instructions)

backend/
├── app/
│   ├── routes/
│   │   └── spotify.py  (Spotify API routes)
│   └── main.py         (updated with Spotify router)
└── .env               (add Spotify credentials here)
```

## Next Steps

1. **Set up Spotify Developer App** (5 minutes)
2. **Add credentials to .env files**
3. **Install Python dependencies**: `pip install spotipy requests`
4. **Test the connection** from the Podcasts page

## Troubleshooting

### "Invalid Client" Error
- Double-check Client ID and Secret are correct
- No extra spaces when copying

### "Invalid Redirect URI"
- URI in code must match exactly what's in Spotify Dashboard
- Case-sensitive

### Network Errors
- Make sure backend is running on port 8000
- Check mobile .env has correct API_URL

## API Rate Limits

Spotify allows:
- **180 requests per minute** (standard)
- Can request higher limits if needed

For detailed Spotify documentation, see: `mobile/SPOTIFY_SETUP.md`
