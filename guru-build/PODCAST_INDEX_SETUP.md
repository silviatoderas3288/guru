# Podcast Index API Setup Guide

## Overview
We've replaced Spotify API with **Podcast Index API** for podcast functionality. This is a free, open-source podcast API with no rate limits and no OAuth complexity.

## Why Podcast Index?
- ✅ **Completely FREE** - No cost, no credit card required
- ✅ **No rate limits** - Unlimited API calls
- ✅ **4M+ podcasts** - Comprehensive database
- ✅ **Simple authentication** - Just API key + secret (no OAuth)
- ✅ **Open source** - Community-driven project
- ✅ **Real-time updates** - Fresh podcast data
- ✅ **No user login required** - Works immediately

## Setup Instructions

### Step 1: Get Your API Credentials

1. Visit [https://podcastindex.org/signup](https://podcastindex.org/signup)
2. Fill out the simple registration form:
   - Email address
   - Name
   - Description (e.g., "Guru Wellness App")
3. You'll receive your credentials immediately:
   - API Key
   - API Secret

### Step 2: Add Credentials to Backend

1. Open `/backend/.env` file
2. Add these lines:
```bash
PODCAST_INDEX_API_KEY=your_api_key_here
PODCAST_INDEX_API_SECRET=your_api_secret_here
```

### Step 3: Test the API

Start your backend server:
```bash
cd backend
python -m uvicorn app.main:app --reload
```

Test the endpoints:
1. Search podcasts: `http://localhost:8000/api/v1/podcasts/search?q=wellness`
2. Trending: `http://localhost:8000/api/v1/podcasts/trending`
3. API docs: `http://localhost:8000/docs`

## Available Endpoints

### 🔍 Search Podcasts
```
GET /api/v1/podcasts/search?q=mindfulness&limit=20
```
Search for podcasts by keyword

### 📈 Trending Podcasts
```
GET /api/v1/podcasts/trending?limit=20
```
Get currently trending podcasts

### 📻 Get Podcast Details
```
GET /api/v1/podcasts/podcast/{podcast_id}
```
Get detailed information about a specific podcast

### 🎧 Get Podcast Episodes
```
GET /api/v1/podcasts/podcast/{podcast_id}/episodes?limit=50
```
Get episodes from a specific podcast

### 📂 Get Categories
```
GET /api/v1/podcasts/categories
```
Get all available podcast categories

### 🆕 Recent Episodes
```
GET /api/v1/podcasts/recent?limit=20
```
Get recently published episodes across all podcasts

## Using in Mobile App

The mobile app already has the `PodcastApiService` configured:

```typescript
import { PodcastApiService } from '../services/podcastApi';

// Search podcasts
const podcasts = await PodcastApiService.searchPodcasts('meditation');

// Get trending
const trending = await PodcastApiService.getTrendingPodcasts(20);

// Get episodes
const episodes = await PodcastApiService.getPodcastEpisodes('12345');

// Get wellness podcasts
const wellness = await PodcastApiService.getWellnessPodcasts();
```

## Migration from Spotify

### What Changed:
- ❌ Removed: Spotify OAuth flow
- ❌ Removed: Token management complexity
- ✅ Added: Simple, free podcast search
- ✅ Added: Trending podcasts feature
- ✅ Added: Category browsing

### Old Spotify Code:
```typescript
// Required OAuth, token refresh, user authentication
await SpotifyApiService.signIn();
const token = await SpotifyApiService.getValidAccessToken();
const shows = await SpotifyApiService.getUserShows();
```

### New Podcast Index Code:
```typescript
// No authentication needed from client side!
const podcasts = await PodcastApiService.searchPodcasts('wellness');
const trending = await PodcastApiService.getTrendingPodcasts();
```

## Features You Get

1. **Search** - Find any podcast by keyword
2. **Trending** - See what's popular now
3. **Categories** - Browse by topic
4. **Episodes** - Get full episode lists
5. **Recent** - Latest episodes across all podcasts
6. **Details** - Full podcast information

## Cost Comparison

| Feature | Spotify | Podcast Index |
|---------|---------|---------------|
| Cost | $0 (but requires user Spotify account) | $0 (completely free) |
| User Auth | Required | Not required |
| API Limits | Yes (rate limits) | No limits |
| Setup | Complex OAuth | Simple API key |
| Podcasts | Spotify catalog only | 4M+ open podcasts |

## Troubleshooting

### Error: "Podcast Index API credentials not configured"
- Make sure you added the credentials to `/backend/.env`
- Restart the backend server after adding credentials

### Search returns empty results
- Check your internet connection
- Verify API credentials are correct
- Try a different search term

### Episodes not loading
- The podcast ID might be incorrect
- Some podcasts may have no episodes indexed yet

## Next Steps

1. ✅ Get your API credentials from [podcastindex.org](https://podcastindex.org/signup)
2. ✅ Add them to your `.env` file
3. ✅ Restart your backend
4. ✅ Test the endpoints
5. ✅ Update your mobile app to use `PodcastApiService`

## Support

- Podcast Index Docs: https://podcastindex-org.github.io/docs-api/
- Community: https://podcastindex.social/

---

**Note:** The old Spotify integration is still available in the codebase but is marked as legacy. You can safely ignore it or remove it later.
