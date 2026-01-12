# Spotify API Integration Setup

## Overview
This guide will help you integrate Spotify API into your Guru app to fetch podcast recommendations and user playlists.

## Step 1: Create Spotify Developer Account

1. Go to https://developer.spotify.com/dashboard
2. Log in with your Spotify account (or create one)
3. Click **"Create an App"**
4. Fill in the app details:
   - **App Name**: Guru Podcast Recommendations
   - **App Description**: Personal productivity app with podcast recommendations
   - **Redirect URI**: Add these (you can add more later):
     - `guru://spotify-auth`
     - `http://localhost:8000/api/v1/spotify/callback`
   - Accept the Terms of Service
5. Click **"Save"**

## Step 2: Get Your Credentials

After creating the app, you'll see:
- **Client ID**: Copy this
- **Client Secret**: Click "Show Client Secret" and copy this

## Step 3: Configure Backend

1. Open `/backend/.env` file
2. Add your Spotify credentials:

```bash
# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:8000/api/v1/spotify/callback
```

## Step 4: Configure Mobile App

1. Open `/mobile/.env` file
2. Add:

```bash
# Spotify Configuration
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id_here
```

## Step 5: Install Dependencies

### Backend
```bash
cd backend
pip install spotipy python-dotenv
```

### Mobile
```bash
cd mobile
npm install expo-auth-session expo-web-browser
```

## Step 6: Test the Integration

1. Start your backend server:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

2. Start your mobile app:
```bash
cd mobile
npm start
```

3. In the Podcasts page (Page 3), try connecting to Spotify

## What You Can Do With Spotify API

### Available Features:
1. **Get User's Saved Shows** - Fetch podcasts the user follows
2. **Get Podcast Episodes** - Retrieve episodes from specific shows
3. **Search for Podcasts** - Search Spotify's podcast catalog
4. **Get Recommendations** - Get personalized podcast recommendations
5. **Playback Control** - Control Spotify playback (requires premium)

### API Scopes Needed:
- `user-library-read` - Read saved podcasts
- `user-read-playback-state` - Read playback state
- `user-modify-playback-state` - Control playback
- `user-read-currently-playing` - See what's playing

## Troubleshooting

### Common Issues:

1. **"Invalid Redirect URI"**
   - Make sure the redirect URI in your code matches exactly what's in the Spotify Dashboard
   - URIs are case-sensitive

2. **"Invalid Client"**
   - Double-check your Client ID and Client Secret
   - Make sure there are no extra spaces when copying

3. **"Access Denied"**
   - User needs to approve the permissions
   - Check that the scopes requested match what's allowed in your app settings

## Rate Limits

Spotify API has rate limits:
- **Standard**: 180 requests per minute
- **Extended**: Higher limits available on request

## Next Steps

After setup, you can:
1. Fetch user's podcast library
2. Display personalized recommendations
3. Integrate with your calendar for scheduling podcast listening time
4. Track listening history

## Resources

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api/)
- [Spotipy Python Library](https://spotipy.readthedocs.io/)
- [Spotify Authorization Guide](https://developer.spotify.com/documentation/general/guides/authorization/)
