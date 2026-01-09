# 🎧 Quick Podcast Index Setup - 5 Minutes!

## ✅ What's Done:
- ✅ LoginScreen error fixed (GoogleAuthService import added)
- ✅ Duplicate `guru/` folder removed (saved 231MB)
- ✅ Podcast Index API integrated (backend + mobile)
- ✅ `.env` file prepared for your API keys

## 🚀 Get Your Free API Keys (2 minutes)

1. **Visit:** [https://podcastindex.org/signup](https://podcastindex.org/signup)

2. **Fill the form:**
   ```
   Email: your@email.com
   Name: Your Name
   Description: Guru Wellness App
   ```

3. **Copy your credentials** - You'll get them instantly:
   - API Key (starts with: something like `ABCD1234`)
   - API Secret (longer string)

## 📝 Add Keys to Your Backend (1 minute)

Open: `/backend/.env` and update these lines (around line 22-23):

```bash
PODCAST_INDEX_API_KEY=paste_your_api_key_here
PODCAST_INDEX_API_SECRET=paste_your_api_secret_here
```

## 🔄 Restart Backend (1 minute)

```bash
cd backend
python -m uvicorn app.main:app --reload
```

## ✅ Test It Works (1 minute)

Open in your browser:

1. **API Docs:** http://localhost:8000/docs
   - Look for "podcasts" section

2. **Search Test:** http://localhost:8000/api/v1/podcasts/search?q=wellness
   - Should return podcast results

3. **Trending Test:** http://localhost:8000/api/v1/podcasts/trending
   - Should return popular podcasts

## 🎯 Available Endpoints

All ready to use in your mobile app via `PodcastApiService`:

```typescript
import { PodcastApiService } from '../services/podcastApi';

// Search
const results = await PodcastApiService.searchPodcasts('meditation');

// Trending
const trending = await PodcastApiService.getTrendingPodcasts(20);

// Get episodes
const episodes = await PodcastApiService.getPodcastEpisodes('podcastId');

// Wellness podcasts
const wellness = await PodcastApiService.getWellnessPodcasts();
```

## 🎨 What You Get

- ✅ **4M+ Podcasts** - Massive library
- ✅ **No Limits** - Unlimited API calls
- ✅ **No OAuth** - Simple and fast
- ✅ **Trending** - See what's hot
- ✅ **Categories** - Browse by topic
- ✅ **Search** - Find anything
- ✅ **Episodes** - Full episode data

## 🐛 Troubleshooting

**Backend won't start?**
```bash
# Check if credentials are set
grep PODCAST_INDEX backend/.env

# Should show your actual keys, not "your_podcast_index_..."
```

**Search returns empty?**
- Make sure backend is running
- Check you added real API keys (not the placeholder text)
- Try a different search term

**"Credentials not configured" error?**
- Restart the backend after adding keys
- Make sure no extra spaces in the .env file

## 📚 Full Documentation

See [PODCAST_INDEX_SETUP.md](PODCAST_INDEX_SETUP.md) for complete details.

---

## Next Steps

1. Get keys from podcastindex.org ✅
2. Add to `/backend/.env` ✅
3. Restart backend ✅
4. Test endpoints ✅
5. Use in your mobile app! 🎉
