# Quick Start Guide

## Prerequisites

- Node.js installed
- Expo CLI (`npm install -g expo-cli`)
- Google Cloud Console account
- Expo account (create at expo.dev)

## Setup Steps

### 1. Google Cloud Console (10 minutes)

1. Go to https://console.cloud.google.com
2. Create new project: "Guru Wellness App"
3. Enable APIs:
   - Google Calendar API ✓
   - Google+ API ✓
4. OAuth consent screen:
   - External user type
   - Add scopes: email, profile, calendar
   - Add your Gmail as test user
5. Create credentials (3 OAuth clients):
   - **Web**: for Expo Go
   - **iOS**: bundle ID `com.yourname.guru`
   - **Android** (optional): package `com.yourname.guru`

### 2. Configure App (2 minutes)

Edit `mobile/.env`:
```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com
```

Edit `mobile/app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourname.guru"
    },
    "android": {
      "package": "com.yourname.guru"
    }
  }
}
```

### 3. Run the App

```bash
cd mobile
npm start

# Then press:
# - i for iOS
# - a for Android
# - or scan QR with Expo Go
```

## That's It!

You should see:
1. Login screen with "Sign in with Google" button
2. Browser opens for Google sign in
3. Grant permissions
4. Redirected back to app
5. Welcome screen with your name and email

## Need Help?

See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for detailed instructions.

## Project Structure

```
mobile/
├── src/
│   ├── components/
│   │   └── GoogleSignInButton.tsx  # Reusable Google sign-in button
│   ├── screens/
│   │   └── LoginScreen.tsx         # Login UI
│   ├── services/
│   │   └── googleAuth.ts           # OAuth logic
│   └── types/                      # TypeScript types
├── App.tsx                         # Main app entry
├── app.json                        # Expo configuration
├── .env                           # Environment variables (not in git)
└── package.json                   # Dependencies
```

## Next Steps

1. Set up backend API (FastAPI)
2. Implement calendar sync
3. Build task scheduling algorithm
4. Add protected time blocks
5. Create media recommendations

See main [README.md](../README.md) for full roadmap.
