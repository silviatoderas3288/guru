"""Podcast Index API routes for podcast recommendations."""

from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel
from typing import List, Optional
import os
import hashlib
import time
import requests

router = APIRouter()

# Podcast Index API configuration
PODCAST_INDEX_API_KEY = os.getenv('PODCAST_INDEX_API_KEY')
PODCAST_INDEX_API_SECRET = os.getenv('PODCAST_INDEX_API_SECRET')
PODCAST_INDEX_BASE_URL = 'https://api.podcastindex.org/api/1.0'


def fix_image_url(url: str) -> str:
    """
    Convert HTTP image URLs to HTTPS for mobile app compatibility.
    Many podcast images use HTTP but mobile apps require HTTPS.
    """
    if not url:
        return url

    # Convert BBC images to HTTPS
    if url.startswith('http://ichef.bbci.co.uk'):
        return url.replace('http://', 'https://')

    # Convert other HTTP URLs to HTTPS
    if url.startswith('http://'):
        return url.replace('http://', 'https://')

    return url


def get_podcast_index_headers():
    """
    Generate authentication headers for Podcast Index API
    Uses API key and secret with timestamp-based hash
    """
    if not PODCAST_INDEX_API_KEY or not PODCAST_INDEX_API_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Podcast Index API credentials not configured"
        )

    api_header_time = str(int(time.time()))

    # Create hash using API key, secret, and timestamp
    data_to_hash = PODCAST_INDEX_API_KEY + PODCAST_INDEX_API_SECRET + api_header_time
    sha_1_hash = hashlib.sha1(data_to_hash.encode()).hexdigest()

    return {
        'X-Auth-Date': api_header_time,
        'X-Auth-Key': PODCAST_INDEX_API_KEY,
        'Authorization': sha_1_hash,
        'User-Agent': 'GuruApp/1.0'
    }


@router.get("/search")
async def search_podcasts(
    q: str = Query(..., description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Number of results to return")
):
    """
    Search for podcasts by term
    """
    try:
        response = requests.get(
            f"{PODCAST_INDEX_BASE_URL}/search/byterm",
            headers=get_podcast_index_headers(),
            params={'q': q, 'max': limit}
        )

        if not response.ok:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to search podcasts: {response.text}"
            )

        data = response.json()

        # Transform to match our frontend format
        podcasts = []
        for feed in data.get('feeds', []):
            podcasts.append({
                'id': str(feed.get('id')),
                'name': feed.get('title', ''),
                'author': feed.get('author', ''),
                'description': feed.get('description', ''),
                'artwork': fix_image_url(feed.get('artwork', feed.get('image', ''))),
                'categories': feed.get('categories', {}),
                'url': feed.get('url', ''),
                'website': feed.get('link', ''),
                'episodeCount': feed.get('episodeCount', 0),
                'language': feed.get('language', 'en')
            })

        return {
            'feeds': podcasts,
            'count': data.get('count', 0)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching podcasts: {str(e)}"
        )


@router.get("/trending")
async def get_trending_podcasts(
    limit: int = Query(20, ge=1, le=100, description="Number of results to return"),
    category: Optional[str] = Query(None, description="Filter by category")
):
    """
    Get trending podcasts
    """
    try:
        params = {'max': limit}
        if category:
            params['cat'] = category

        response = requests.get(
            f"{PODCAST_INDEX_BASE_URL}/podcasts/trending",
            headers=get_podcast_index_headers(),
            params=params
        )

        if not response.ok:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to fetch trending podcasts: {response.text}"
            )

        data = response.json()

        # Transform to match our frontend format
        podcasts = []
        for feed in data.get('feeds', []):
            podcasts.append({
                'id': str(feed.get('id')),
                'name': feed.get('title', ''),
                'author': feed.get('author', ''),
                'description': feed.get('description', ''),
                'artwork': fix_image_url(feed.get('artwork', feed.get('image', ''))),
                'categories': feed.get('categories', {}),
                'url': feed.get('url', ''),
                'website': feed.get('link', ''),
                'episodeCount': feed.get('episodeCount', 0),
                'trendScore': feed.get('trendScore', 0),
                'language': feed.get('language', 'en')
            })

        return {
            'feeds': podcasts,
            'count': data.get('count', 0)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching trending podcasts: {str(e)}"
        )


@router.get("/podcast/{podcast_id}")
async def get_podcast_by_id(podcast_id: str):
    """
    Get a specific podcast by ID
    """
    try:
        response = requests.get(
            f"{PODCAST_INDEX_BASE_URL}/podcasts/byfeedid",
            headers=get_podcast_index_headers(),
            params={'id': podcast_id}
        )

        if not response.ok:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to fetch podcast: {response.text}"
            )

        data = response.json()
        feed = data.get('feed', {})

        if not feed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Podcast not found"
            )

        return {
            'id': str(feed.get('id')),
            'name': feed.get('title', ''),
            'author': feed.get('author', ''),
            'description': feed.get('description', ''),
            'artwork': fix_image_url(feed.get('artwork', feed.get('image', ''))),
            'categories': feed.get('categories', {}),
            'url': feed.get('url', ''),
            'website': feed.get('link', ''),
            'episodeCount': feed.get('episodeCount', 0),
            'language': feed.get('language', 'en')
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching podcast: {str(e)}"
        )


@router.get("/podcast/{podcast_id}/episodes")
async def get_podcast_episodes(
    podcast_id: str,
    limit: int = Query(50, ge=1, le=1000, description="Number of episodes to return")
):
    """
    Get episodes from a specific podcast
    """
    try:
        response = requests.get(
            f"{PODCAST_INDEX_BASE_URL}/episodes/byfeedid",
            headers=get_podcast_index_headers(),
            params={'id': podcast_id, 'max': limit}
        )

        if not response.ok:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to fetch episodes: {response.text}"
            )

        data = response.json()

        # Transform to match our frontend format
        episodes = []
        for item in data.get('items', []):
            episodes.append({
                'id': str(item.get('id')),
                'title': item.get('title', ''),
                'description': item.get('description', ''),
                'datePublished': item.get('datePublished', 0),
                'duration': item.get('duration', 0),
                'enclosureUrl': item.get('enclosureUrl', ''),
                'enclosureType': item.get('enclosureType', ''),
                'image': fix_image_url(item.get('image', item.get('feedImage', ''))),
                'feedId': item.get('feedId', podcast_id),
                'link': item.get('link', '')
            })

        return {
            'episodes': episodes,
            'count': data.get('count', 0)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching episodes: {str(e)}"
        )


@router.get("/categories")
async def get_categories():
    """
    Get all podcast categories
    """
    try:
        response = requests.get(
            f"{PODCAST_INDEX_BASE_URL}/categories/list",
            headers=get_podcast_index_headers()
        )

        if not response.ok:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to fetch categories: {response.text}"
            )

        data = response.json()
        return {
            'feeds': data.get('feeds', []),
            'count': data.get('count', 0)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching categories: {str(e)}"
        )


@router.get("/recent")
async def get_recent_episodes(
    limit: int = Query(20, ge=1, le=1000, description="Number of episodes to return"),
    category: Optional[str] = Query(None, description="Filter by category")
):
    """
    Get recently published episodes across all podcasts
    """
    try:
        params = {'max': limit}

        response = requests.get(
            f"{PODCAST_INDEX_BASE_URL}/recent/episodes",
            headers=get_podcast_index_headers(),
            params=params
        )

        if not response.ok:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to fetch recent episodes: {response.text}"
            )

        data = response.json()

        # Transform to match our frontend format
        episodes = []
        for item in data.get('items', []):
            episodes.append({
                'id': str(item.get('id')),
                'title': item.get('title', ''),
                'description': item.get('description', ''),
                'datePublished': item.get('datePublished', 0),
                'duration': item.get('duration', 0),
                'enclosureUrl': item.get('enclosureUrl', ''),
                'image': fix_image_url(item.get('image', item.get('feedImage', ''))),
                'feedId': str(item.get('feedId', '')),
                'feedTitle': item.get('feedTitle', ''),
                'link': item.get('link', '')
            })

        return {
            'episodes': episodes,
            'count': data.get('count', 0)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching recent episodes: {str(e)}"
        )
