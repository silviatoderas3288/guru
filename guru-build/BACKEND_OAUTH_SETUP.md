# Backend Google OAuth Setup Guide

This guide explains how to configure Google OAuth credentials for the backend server to access the Google Calendar API on behalf of users.

## Overview

The architecture works as follows:
1. **Mobile app**: Uses OAuth to authenticate users and get access tokens
2. **Backend server**: Uses its own OAuth credentials + user's access/refresh tokens to make Google Calendar API calls

## Why Backend Needs Its Own Credentials

When the backend makes Google Calendar API calls, it needs to include:
- User's access token (to access their data)
- OAuth client credentials (to identify the application)

The backend **must** use **Web Application** type OAuth credentials, not iOS/Android credentials.

## Step 1: Create Web Application OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Select **Web application** as the application type
6. Configure:
   - **Name**: "Guru Backend Server"
   - **Authorized redirect URIs**: Add `http://localhost:8000/auth/google/callback` (for development)
7. Click **Create**
8. **Download the JSON** or copy the **Client ID** and **Client Secret**

## Step 2: Configure Backend Environment Variables

Edit your `backend/.env` file:

```bash
# Google OAuth Configuration (Web Application credentials)
GOOGLE_CLIENT_ID=your_web_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_web_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
```

**IMPORTANT**: These must be **Web Application** credentials, not iOS or Android credentials!

## Step 3: Enable Required APIs

Make sure you have enabled these APIs in Google Cloud Console:

1. Navigate to **APIs & Services** → **Library**
2. Search for and enable:
   - **Google Calendar API**
   - **Google+ API** (for user info)

## Step 4: Verify Setup

You can verify your setup by checking:

```bash
cd backend
grep GOOGLE_CLIENT_ID .env
grep GOOGLE_CLIENT_SECRET .env
```

Both should show actual values, not placeholders like `your_google_client_id`.

## Step 5: Test the Flow

1. Start the backend server:
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```

2. Start the mobile app and sign in with Google

3. Check the backend logs - you should see:
   ```
   INFO: POST /api/v1/calendar/oauth/tokens HTTP/1.1" 200 OK
   INFO: Token refreshed successfully
   INFO: GET /api/v1/calendar/events HTTP/1.1" 200 OK
   ```

## Common Issues

### Issue: "Bad Request" from Google Calendar API

**Cause**: Backend is using incorrect or missing OAuth credentials

**Solution**:
1. Verify you created **Web Application** credentials (not iOS/Android)
2. Check that `.env` has the correct `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. Restart the backend server after updating `.env`

### Issue: "Invalid grant" error

**Cause**: The access token or refresh token is invalid or expired

**Solution**:
1. Sign out of the mobile app
2. Sign back in to get fresh tokens
3. The backend will automatically refresh tokens when they expire

### Issue: "Missing refresh token"

**Cause**: Google OAuth flow didn't request offline access

**Solution**: The mobile app is configured to request offline access. If you're not getting a refresh token:
1. Revoke app access in Google Account settings
2. Sign in again - the first sign-in should provide a refresh token

## Security Notes

- **NEVER** commit `.env` file to git
- Use different OAuth credentials for production
- For production, use HTTPS redirect URIs
- Implement proper user authentication (JWT) instead of the development placeholder

## Architecture Diagram

```
┌─────────────┐                 ┌─────────────┐                 ┌─────────────┐
│   Mobile    │ -- Tokens -->   │   Backend   │ -- API Calls -> │   Google    │
│     App     │                 │   Server    │                 │  Calendar   │
└─────────────┘                 └─────────────┘                 └─────────────┘
     │                                 │                               │
     │                                 │                               │
  Uses iOS/                      Uses Web App                    Validates
  Android OAuth                  OAuth Credentials               Credentials
  Credentials                    + User Tokens                   + Token
```

## Next Steps

Once OAuth is working, you can:
1. Implement proper JWT authentication
2. Add token refresh logic
3. Add error handling for expired credentials
4. Deploy to production with production OAuth credentials