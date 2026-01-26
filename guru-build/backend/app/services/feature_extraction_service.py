"""Service for extracting ML features from podcast metadata."""

import logging
import os
import hashlib
import time
from datetime import datetime
from typing import Dict, Any, List, Optional

import requests
from sqlalchemy.orm import Session

from app.models.podcast_recommendation import PodcastFeatures

logger = logging.getLogger(__name__)


class FeatureExtractionService:
    """Service for extracting ML features from podcast metadata.

    Converts podcast data into feature vectors used for recommendations:
    - Category vectors: One-hot encoded podcast categories
    - Description embeddings: Semantic embeddings from sentence-transformers
    """

    # Standard podcast categories from Podcast Index
    # This matches the major categories used by podcast directories
    CATEGORIES = [
        "Arts",
        "Business",
        "Comedy",
        "Education",
        "Fiction",
        "Government",
        "Health & Fitness",
        "History",
        "Kids & Family",
        "Leisure",
        "Music",
        "News",
        "Religion & Spirituality",
        "Science",
        "Society & Culture",
        "Sports",
        "Technology",
        "True Crime",
        "TV & Film",
    ]

    def __init__(self, db: Session):
        self.db = db
        self._embedding_model = None
        self.api_key = os.getenv('PODCAST_INDEX_API_KEY')
        self.api_secret = os.getenv('PODCAST_INDEX_API_SECRET')

    @property
    def embedding_model(self):
        """Lazy load sentence transformer for embeddings.

        Uses all-MiniLM-L6-v2 which produces 384-dim embeddings.
        This model is a good balance of speed and quality.
        """
        if self._embedding_model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("Loaded sentence-transformers model: all-MiniLM-L6-v2")
            except ImportError:
                logger.warning(
                    "sentence-transformers not installed. "
                    "Run: pip install sentence-transformers"
                )
                return None
        return self._embedding_model

    def extract_and_store_features(
        self,
        podcast_id: str,
        force_refresh: bool = False
    ) -> Optional[PodcastFeatures]:
        """Extract features for a podcast and store in database.

        Args:
            podcast_id: External podcast ID from Podcast Index
            force_refresh: If True, recompute even if cached

        Returns:
            PodcastFeatures object, or None if extraction failed
        """
        # Check if already cached and fresh
        existing = self.db.query(PodcastFeatures).filter_by(
            external_id=podcast_id
        ).first()

        if existing and not force_refresh:
            if existing.features_computed_at:
                age_hours = (
                    datetime.utcnow() - existing.features_computed_at
                ).total_seconds() / 3600
                if age_hours < 24:  # Cache for 24 hours
                    logger.debug(f"Using cached features for podcast {podcast_id}")
                    return existing

        # Fetch from Podcast Index API
        podcast_data = self._fetch_podcast_data(podcast_id)
        if not podcast_data:
            logger.warning(f"Could not fetch data for podcast {podcast_id}")
            return existing  # Return existing if we have it

        # Create or update features
        features = existing or PodcastFeatures(external_id=podcast_id)

        # Basic metadata
        features.title = podcast_data.get('title', '')
        features.author = podcast_data.get('author', '')
        features.description = podcast_data.get('description', '')
        features.artwork = self._fix_image_url(podcast_data.get('artwork', ''))
        features.language = podcast_data.get('language', 'en')
        features.categories = podcast_data.get('categories', {})
        features.episode_count = podcast_data.get('episodeCount', 0)

        # Category vector (one-hot encoding)
        features.category_vector = self._encode_categories(features.categories)

        # Description embedding
        if features.description and self.embedding_model:
            try:
                # Limit input length to avoid memory issues
                text = features.description[:2000]
                embedding = self.embedding_model.encode(text)
                features.description_embedding = embedding.tolist()
            except Exception as e:
                logger.error(f"Error computing embedding for podcast {podcast_id}: {e}")

        # Compute additional metrics from episodes
        episode_stats = self._compute_episode_stats(podcast_id)
        features.avg_episode_duration_seconds = episode_stats.get('avg_duration')
        features.update_frequency_days = episode_stats.get('update_frequency')

        # Popularity (from trend score, normalized to 0-1)
        trend_score = podcast_data.get('trendScore', 0)
        features.popularity_score = min(1.0, trend_score / 100.0) if trend_score else 0.0

        features.last_fetched_at = datetime.utcnow()
        features.features_computed_at = datetime.utcnow()

        if not existing:
            self.db.add(features)
        self.db.commit()
        self.db.refresh(features)

        logger.info(f"Extracted features for podcast {podcast_id}: {features.title}")
        return features

    def _encode_categories(self, categories: Optional[Dict[str, str]]) -> List[float]:
        """One-hot encode podcast categories.

        Args:
            categories: Dict of category_id -> category_name from Podcast Index

        Returns:
            List of floats (one-hot vector of length len(CATEGORIES))
        """
        vector = [0.0] * len(self.CATEGORIES)

        if not categories:
            return vector

        # Match category names (case-insensitive partial match)
        for cat_name in categories.values():
            if not cat_name:
                continue
            cat_lower = cat_name.lower()

            for i, standard_cat in enumerate(self.CATEGORIES):
                standard_lower = standard_cat.lower()
                # Check if either contains the other
                if standard_lower in cat_lower or cat_lower in standard_lower:
                    vector[i] = 1.0
                    break

        return vector

    def _fetch_podcast_data(self, podcast_id: str) -> Optional[Dict[str, Any]]:
        """Fetch podcast data from Podcast Index API.

        Args:
            podcast_id: External podcast ID

        Returns:
            Podcast data dict, or None if failed
        """
        headers = self._get_api_headers()
        if not headers:
            logger.error("Missing Podcast Index API credentials")
            return None

        try:
            response = requests.get(
                f'https://api.podcastindex.org/api/1.0/podcasts/byfeedid',
                headers=headers,
                params={'id': podcast_id},
                timeout=10
            )

            if response.ok:
                data = response.json()
                return data.get('feed', {})
            else:
                logger.warning(
                    f"Podcast Index API error for {podcast_id}: {response.status_code}"
                )
        except requests.RequestException as e:
            logger.error(f"Error fetching podcast {podcast_id}: {e}")

        return None

    def _get_api_headers(self) -> Optional[Dict[str, str]]:
        """Generate Podcast Index API authentication headers.

        Returns:
            Headers dict, or None if credentials not available
        """
        if not self.api_key or not self.api_secret:
            return None

        epoch_time = str(int(time.time()))
        data_to_hash = self.api_key + self.api_secret + epoch_time
        sha_hash = hashlib.sha1(data_to_hash.encode()).hexdigest()

        return {
            'User-Agent': 'GuruApp/1.0',
            'X-Auth-Key': self.api_key,
            'X-Auth-Date': epoch_time,
            'Authorization': sha_hash,
        }

    def _compute_episode_stats(self, podcast_id: str) -> Dict[str, Any]:
        """Compute statistics from recent episodes.

        Args:
            podcast_id: External podcast ID

        Returns:
            Dict with avg_duration and update_frequency
        """
        headers = self._get_api_headers()
        if not headers:
            return {}

        try:
            response = requests.get(
                'https://api.podcastindex.org/api/1.0/episodes/byfeedid',
                headers=headers,
                params={'id': podcast_id, 'max': 10},
                timeout=10
            )

            if not response.ok:
                return {}

            episodes = response.json().get('items', [])
            if not episodes:
                return {}

            # Average duration
            durations = [
                e.get('duration', 0)
                for e in episodes
                if e.get('duration') and e.get('duration') > 0
            ]
            avg_duration = int(sum(durations) / len(durations)) if durations else None

            # Update frequency (average days between episodes)
            dates = sorted([
                e.get('datePublished', 0)
                for e in episodes
                if e.get('datePublished')
            ])
            update_frequency = None
            if len(dates) >= 2:
                gaps = [
                    (dates[i + 1] - dates[i]) / 86400  # Convert seconds to days
                    for i in range(len(dates) - 1)
                ]
                update_frequency = sum(gaps) / len(gaps)

            return {
                'avg_duration': avg_duration,
                'update_frequency': update_frequency
            }

        except requests.RequestException as e:
            logger.error(f"Error computing episode stats for {podcast_id}: {e}")
            return {}

    def _fix_image_url(self, url: str) -> str:
        """Fix image URL to use HTTPS."""
        if not url:
            return url
        if url.startswith('http://'):
            return url.replace('http://', 'https://')
        return url

    def get_or_extract_features(self, podcast_id: str) -> Optional[PodcastFeatures]:
        """Get features for a podcast, extracting if needed.

        Convenience method that first checks the cache.

        Args:
            podcast_id: External podcast ID

        Returns:
            PodcastFeatures object, or None if not available
        """
        # First try to get from cache
        features = self.db.query(PodcastFeatures).filter_by(
            external_id=podcast_id
        ).first()

        if features and features.description_embedding:
            return features

        # Extract if not cached or incomplete
        return self.extract_and_store_features(podcast_id)

    def batch_extract_features(
        self,
        podcast_ids: List[str],
        skip_existing: bool = True
    ) -> Dict[str, PodcastFeatures]:
        """Extract features for multiple podcasts.

        Args:
            podcast_ids: List of podcast IDs to process
            skip_existing: Skip podcasts that already have features

        Returns:
            Dict mapping podcast_id to PodcastFeatures
        """
        results = {}

        for podcast_id in podcast_ids:
            if skip_existing:
                existing = self.db.query(PodcastFeatures).filter_by(
                    external_id=podcast_id
                ).first()
                if existing and existing.description_embedding:
                    results[podcast_id] = existing
                    continue

            features = self.extract_and_store_features(podcast_id)
            if features:
                results[podcast_id] = features

        return results
