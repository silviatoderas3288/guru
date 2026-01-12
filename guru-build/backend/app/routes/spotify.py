"""Spotify API routes for podcast recommendations."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import os
import base64
import requests
from typing import List, Optional

router = APIRouter()

# Spotify API configuration
SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
SPOTIFY_REDIRECT_URI = os.getenv('SPOTIFY_REDIRECT_URI', 'http://localhost:8000/api/v1/spotify/callback')

SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1'


class CodeExchangeRequest(BaseModel):
    code: str
    redirect_uri: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


def get_auth_header():
    """Get base64 encoded auth header for Spotify API"""
    auth_str = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
    auth_bytes = auth_str.encode('utf-8')
    auth_base64 = base64.b64encode(auth_bytes).decode('utf-8')
    return f"Basic {auth_base64}"


@router.post("/exchange-code")
async def exchange_code(request: CodeExchangeRequest):
    """
    Exchange authorization code for access token
    """
    try:
        response = requests.post(
            SPOTIFY_TOKEN_URL,
            headers={
                'Authorization': get_auth_header(),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data={
                'grant_type': 'authorization_code',
                'code': request.code,
                'redirect_uri': request.redirect_uri
            }
        )

        if not response.ok:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to exchange code: {response.text}"
            )

        return response.json()

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exchanging code: {str(e)}"
        )


@router.post("/refresh")
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh Spotify access token
    """
    try:
        response = requests.post(
            SPOTIFY_TOKEN_URL,
            headers={
                'Authorization': get_auth_header(),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data={
                'grant_type': 'refresh_token',
                'refresh_token': request.refresh_token
            }
        )

        if not response.ok:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to refresh token: {response.text}"
            )

        return response.json()

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error refreshing token: {str(e)}"
        )


@router.get("/user-shows")
async def get_user_shows(access_token: Optional[str] = None):
    """
    Get user's saved podcast shows
    """
    try:
        # For development, return sample data if no token provided
        if not access_token:
            return {
                "shows": [
                    {
                        "id": "sample1",
                        "name": "The Daily",
                        "publisher": "The New York Times",
                        "description": "This is what the news should sound like.",
                        "total_episodes": 500,
                        "images": [{"url": "https://via.placeholder.com/300", "height": 300, "width": 300}],
                        "external_urls": {"spotify": "https://open.spotify.com"}
                    },
                    {
                        "id": "sample2",
                        "name": "How I Built This",
                        "publisher": "Guy Raz",
                        "description": "Stories behind the companies you know and love.",
                        "total_episodes": 400,
                        "images": [{"url": "https://via.placeholder.com/300", "height": 300, "width": 300}],
                        "external_urls": {"spotify": "https://open.spotify.com"}
                    }
                ]
            }

        response = requests.get(
            f"{SPOTIFY_API_BASE_URL}/me/shows",
            headers={'Authorization': f'Bearer {access_token}'}
        )

        if not response.ok:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to fetch shows: {response.text}"
            )

        data = response.json()
        shows = [item['show'] for item in data.get('items', [])]

        return {"shows": shows}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching user shows: {str(e)}"
        )


@router.get("/search")
async def search_podcasts(q: str, type: str = "show", access_token: Optional[str] = None):
    """
    Search for podcasts
    """
    try:
        # For development, return sample data if no token provided
        if not access_token:
            return {
                "shows": [
                    {
                        "id": f"search_{q}_1",
                        "name": f"{q} Podcast",
                        "publisher": "Sample Publisher",
                        "description": f"Sample podcast about {q}",
                        "total_episodes": 100,
                        "images": [{"url": "https://via.placeholder.com/300", "height": 300, "width": 300}],
                        "external_urls": {"spotify": "https://open.spotify.com"}
                    }
                ]
            }

        response = requests.get(
            f"{SPOTIFY_API_BASE_URL}/search",
            headers={'Authorization': f'Bearer {access_token}'},
            params={'q': q, 'type': type, 'limit': 20}
        )

        if not response.ok:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to search: {response.text}"
            )

        data = response.json()
        shows = data.get('shows', {}).get('items', [])

        return {"shows": shows}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching podcasts: {str(e)}"
        )


@router.get("/shows/{show_id}/episodes")
async def get_show_episodes(show_id: str, access_token: Optional[str] = None):
    """
    Get episodes from a specific show
    """
    try:
        # For development, return sample data if no token provided
        if not access_token:
            return {
                "episodes": [
                    {
                        "id": f"{show_id}_ep1",
                        "name": "Sample Episode 1",
                        "description": "This is a sample episode",
                        "duration_ms": 1800000,
                        "release_date": "2024-01-01",
                        "images": [{"url": "https://via.placeholder.com/300", "height": 300, "width": 300}],
                        "external_urls": {"spotify": "https://open.spotify.com"}
                    }
                ]
            }

        response = requests.get(
            f"{SPOTIFY_API_BASE_URL}/shows/{show_id}/episodes",
            headers={'Authorization': f'Bearer {access_token}'},
            params={'limit': 50}
        )

        if not response.ok:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to fetch episodes: {response.text}"
            )

        data = response.json()
        episodes = data.get('items', [])

        return {"episodes": episodes}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching episodes: {str(e)}"
        )
