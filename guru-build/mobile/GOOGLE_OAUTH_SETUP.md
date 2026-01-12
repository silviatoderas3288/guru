# Google OAuth Setup Guide for React Native

This guide will walk you through setting up Google OAuth for your Guru wellness app.

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Name: "Guru Wellness App" (or your preferred name)
4. Click "Create"
5. Wait for the project to be created and select it

### 1.2 Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search and enable these APIs:
   - **Google Calendar API**
   - **Google+ API** (for user profile data)
   - **People API** (optional, for extended profile info)

### 1.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type (unless you have Google Workspace)
3. Click "Create"

**App Information:**
- App name: `Guru Wellness App`
- User support email: `your-email@gmail.com`
- App logo: (optional, upload later)

**App domain:**
- Application home page: (can leave empty for now)
- Privacy policy: (can leave empty for development)
- Terms of service: (can leave empty for development)

**Developer contact information:**
- Email addresses: `your-email@gmail.com`

Click "Save and Continue"

**Scopes:**
Click "Add or Remove Scopes" and add:
- `../auth/userinfo.email`
- `../auth/userinfo.profile`
- `../auth/calendar`
- `../auth/calendar.events`

Click "Save and Continue"

**Test Users:**
- Add your Gmail address as a test user
- Add any other Gmail accounts you want to test with
- Click "Save and Continue"

### 1.4 Create OAuth Credentials

You need to create **THREE** different OAuth clients for different platforms:

#### A) Web Client (for Expo Go Development)

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Guru Web Client`
5. **Authorized redirect URIs:**
   ```
   https://auth.expo.io/@YOUR_EXPO_USERNAME/guru
   ```
   Replace `YOUR_EXPO_USERNAME` with your Expo username (run `expo whoami` to check)

6. Click "Create"
7. **SAVE THESE VALUES:**
   - Client ID (looks like: `xxxxx.apps.googleusercontent.com`)
   - Client Secret

#### B) iOS Client

1. Click **Create Credentials** → **OAuth client ID** again
2. Application type: **iOS**
3. Name: `Guru iOS Client`
4. Bundle ID: `com.yourname.guru` (match with your app.json bundleIdentifier)
5. Click "Create"
6. **SAVE THIS VALUE:**
   - iOS Client ID (looks like: `xxxxx.apps.googleusercontent.com`)

#### C) Android Client (Optional, for Android support)

1. Click **Create Credentials** → **OAuth client ID** again
2. Application type: **Android**
3. Name: `Guru Android Client`
4. Package name: `com.yourname.guru` (match with your app.json package)
5. SHA-1 certificate fingerprint:

   For development, get it by running:
   ```bash
   cd android
   ./gradlew signingReport
   ```

   Or for Expo managed workflow:
   ```bash
   keytool -keystore ~/.android/debug.keystore -list -v
   # Default password is: android
   ```

6. Click "Create"
7. **SAVE THIS VALUE:**
   - Android Client ID

## Step 2: Configure Your React Native App

### 2.1 Update Environment Variables

1. Open `mobile/.env` file
2. Replace the placeholder values with your actual credentials:

```env
# Web Client ID (for Expo Go development)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-abcdefgh.apps.googleusercontent.com

# iOS Client ID
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=987654321-ijklmnop.apps.googleusercontent.com

# Android Client ID (if you created one)
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=111222333-qrstuvwx.apps.googleusercontent.com

# Backend API (leave as is for now)
EXPO_PUBLIC_API_URL=http://localhost:8000
```

### 2.2 Update app.json

1. Open `mobile/app.json`
2. Update the bundle identifier to match what you used in Google Cloud Console:

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

## Step 3: Test the OAuth Flow

### 3.1 Start the Development Server

```bash
cd mobile
npm start
```

### 3.2 Run on Your Device

Press one of:
- `i` for iOS simulator
- `a` for Android emulator
- Scan QR code with Expo Go app on your phone

### 3.3 Test Sign In

1. The app should show a login screen
2. Tap "Sign in with Google"
3. A browser will open asking you to choose your Google account
4. Select your account
5. Grant the requested permissions
6. You should be redirected back to the app
7. The app should display your name and email

## Step 4: Troubleshooting

### Common Issues

#### "redirect_uri_mismatch" error
- Make sure the redirect URI in Google Cloud Console matches exactly
- For Expo Go: `https://auth.expo.io/@YOUR_EXPO_USERNAME/guru`
- Get your username: `expo whoami`

#### "invalid_client" error
- Check that you're using the correct Client ID for your platform
- iOS simulator needs iOS Client ID
- Android emulator needs Android Client ID
- Expo Go needs Web Client ID

#### OAuth consent screen shows "This app isn't verified"
- This is normal during development
- Click "Advanced" → "Go to [App Name] (unsafe)"
- Only users you added as "Test Users" can sign in

#### "Access blocked: This app's request is invalid"
- Make sure you added all required scopes in OAuth consent screen
- Verify the APIs (Calendar, Google+) are enabled

#### Can't sign in on physical device
- Make sure you added your Gmail as a test user in OAuth consent screen
- Check that you're using the correct Client ID for the platform

## Step 5: Next Steps

### For Calendar Integration

Once OAuth is working, you can start making Calendar API calls:

```typescript
// Example: Fetch calendar events
const accessToken = await GoogleAuthService.getAccessToken();

const response = await fetch(
  'https://www.googleapis.com/calendar/v3/calendars/primary/events',
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);

const data = await response.json();
console.log('Calendar events:', data.items);
```

### For Production

Before publishing your app:

1. **Submit OAuth consent screen for verification**
   - Go to OAuth consent screen in Google Cloud Console
   - Click "Publish App"
   - Submit for verification (can take days/weeks)

2. **Create production OAuth clients**
   - Create new iOS client with production bundle ID
   - Create new Android client with production signing certificate

3. **Update environment variables**
   - Use production client IDs
   - Update redirect URIs

## Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Calendar API Reference](https://developers.google.com/calendar/api/v3/reference)
- [Expo AuthSession Documentation](https://docs.expo.dev/guides/authentication/#google)
- [React Native Google Sign In](https://github.com/react-native-google-signin/google-signin)

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all credentials are correct in `.env`
3. Make sure APIs are enabled in Google Cloud Console
4. Check that test users are added to OAuth consent screen
