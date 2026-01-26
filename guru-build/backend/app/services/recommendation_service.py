"""ML-based podcast recommendation service with hybrid scoring."""

import logging
import os
import hashlib
import time
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID

import requests
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.models.podcast_recommendation import (
    ListeningSession,
    PodcastInteraction,
    PodcastFeatures,
    UserPodcastProfile,
    RecommendationCache,
    InteractionType,
)
from app.models.saved_media import SavedPodcast
from app.models.user_preference import UserPreference
from app.models.media_preference import MediaPreference
from app.services.feature_extraction_service import FeatureExtractionService

logger = logging.getLogger(__name__)


class RecommendationService:
    """Service for generating personalized podcast recommendations.

    Uses a hybrid approach combining:
    1. Content-based filtering (user profile vs podcast features)
    2. Collaborative signals (saved podcasts, likes)
    3. Contextual boosting (time of day, activity context)

    Scoring weights:
    - Content similarity: 40%
    - Category alignment: 30%
    - Duration fit: 10%
    - Popularity: 10%
    - Novelty: 10%
    """

    # Scoring weights
    WEIGHT_CONTENT = 0.40
    WEIGHT_CATEGORY = 0.30
    WEIGHT_DURATION = 0.10
    WEIGHT_POPULARITY = 0.10
    WEIGHT_NOVELTY = 0.10

    # Cache settings - shorter duration for more variety
    CACHE_DURATION_HOURS = 1

    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user
        self.feature_service = FeatureExtractionService(db)

    def get_recommendations(
        self,
        limit: int = 20,
        use_cache: bool = True,
        context: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get personalized podcast recommendations for the user.

        Args:
            limit: Maximum number of recommendations to return
            use_cache: Whether to use cached recommendations
            context: Listening context (commute, chore, workout, etc.)

        Returns:
            List of recommendation dicts with podcast info and scores
        """
        # Check cache first
        if use_cache:
            cached = self._get_cached_recommendations(context)
            if cached:
                logger.debug(f"Returning cached recommendations for user {self.user.id}")
                return cached[:limit]

        # Compute fresh recommendations
        recommendations = self._compute_hybrid_recommendations(limit, context)

        # Cache results
        if recommendations:
            self._cache_recommendations(recommendations, context)

        return recommendations

    def _compute_hybrid_recommendations(
        self,
        limit: int,
        context: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Compute hybrid recommendations combining multiple signals.

        Args:
            limit: Maximum number to return
            context: Listening context for boosting

        Returns:
            List of recommendation dicts sorted by score
        """
        # Get or create user profile
        profile = self._get_or_create_user_profile()

        # Get candidate podcasts with features
        candidates = self._get_candidate_podcasts(limit * 5)  # Get more for filtering

        if not candidates:
            logger.info(f"No candidates, using cold start for user {self.user.id}")
            return self._get_cold_start_recommendations(limit, context)

        # Get podcasts user has already interacted with (to reduce novelty score)
        interacted_podcasts = self._get_interacted_podcast_ids()
        disliked_podcasts = self._get_disliked_podcast_ids()

        # Score candidates
        scored = []
        for podcast in candidates:
            # Skip disliked podcasts entirely
            if podcast.external_id in disliked_podcasts:
                continue

            score = self._compute_recommendation_score(
                podcast, profile, context, interacted_podcasts
            )
            reason = self._generate_recommendation_reason(podcast, profile, context)
            scored.append((podcast, score, reason))

        # Sort by score descending
        scored.sort(key=lambda x: x[1], reverse=True)

        # Format results
        return [
            {
                'podcast_id': p.external_id,
                'title': p.title,
                'author': p.author,
                'description': p.description,
                'categories': p.categories,
                'artwork': self._get_podcast_artwork(p.external_id),
                'score': float(score),
                'reason': reason,
            }
            for p, score, reason in scored[:limit]
        ]

    def _compute_recommendation_score(
        self,
        podcast: PodcastFeatures,
        profile: UserPodcastProfile,
        context: Optional[str],
        interacted_podcasts: set
    ) -> float:
        """Compute recommendation score for a podcast.

        Uses weighted combination of multiple signals:
        - Content similarity (embedding cosine similarity)
        - Category alignment
        - Duration fit
        - Popularity
        - Novelty (penalty for already-listened)

        Args:
            podcast: Podcast features to score
            profile: User's learned profile
            context: Listening context
            interacted_podcasts: Set of podcast IDs user has interacted with

        Returns:
            Score between 0.0 and ~1.3 (can exceed 1.0 with context boost)
        """
        score = 0.0

        # 1. CONTENT SIMILARITY (40% weight)
        if profile.content_embedding and podcast.description_embedding:
            content_sim = self._cosine_similarity(
                profile.content_embedding,
                podcast.description_embedding
            )
            # Normalize to 0-1 range (cosine can be -1 to 1)
            content_sim = (content_sim + 1) / 2
            score += self.WEIGHT_CONTENT * content_sim

        # 2. CATEGORY ALIGNMENT (30% weight)
        if profile.category_preferences and podcast.category_vector:
            category_sim = self._cosine_similarity(
                profile.category_preferences,
                podcast.category_vector
            )
            category_sim = max(0, category_sim)  # Only positive alignment
            score += self.WEIGHT_CATEGORY * category_sim

        # 3. DURATION FIT (10% weight)
        if profile.preferred_duration_min and profile.preferred_duration_max:
            if podcast.avg_episode_duration_seconds:
                duration_mins = podcast.avg_episode_duration_seconds / 60
                if profile.preferred_duration_min <= duration_mins <= profile.preferred_duration_max:
                    score += self.WEIGHT_DURATION  # Full points
                else:
                    # Partial score based on distance
                    distance = min(
                        abs(duration_mins - profile.preferred_duration_min),
                        abs(duration_mins - profile.preferred_duration_max)
                    )
                    # Decay over 30 minutes
                    score += self.WEIGHT_DURATION * max(0, 1 - distance / 30)
        else:
            # No preference, give half points
            score += self.WEIGHT_DURATION * 0.5

        # 4. POPULARITY (10% weight)
        if podcast.popularity_score:
            score += self.WEIGHT_POPULARITY * min(podcast.popularity_score, 1.0)
        else:
            score += self.WEIGHT_POPULARITY * 0.3  # Default for unknown

        # 5. NOVELTY (10% weight)
        if podcast.external_id in interacted_podcasts:
            # Reduce score for already-listened podcasts
            score += self.WEIGHT_NOVELTY * 0.3
        else:
            score += self.WEIGHT_NOVELTY * 1.0

        # 6. CONTEXT BOOST (optional multiplier)
        if context:
            context_boost = self._compute_context_boost(podcast, context)
            score *= (1 + 0.2 * context_boost)

        return score

    def _compute_context_boost(
        self,
        podcast: PodcastFeatures,
        context: str
    ) -> float:
        """Compute context-aware boost for a podcast.

        Args:
            podcast: Podcast to evaluate
            context: Listening context (commute, chore, workout)

        Returns:
            Boost multiplier (0 to 1)
        """
        boost = 0.0

        if not podcast.avg_episode_duration_seconds:
            return boost

        duration_mins = podcast.avg_episode_duration_seconds / 60

        if context == 'commute':
            # Prefer shorter episodes for commute
            if duration_mins <= 30:
                boost = 1.0
            elif duration_mins <= 45:
                boost = 0.5
        elif context == 'workout':
            # Prefer medium-length energetic content
            if 20 <= duration_mins <= 60:
                boost = 0.8
        elif context == 'chore':
            # Any length works for chores
            boost = 0.3
        elif context == 'relaxing':
            # Prefer longer, in-depth content
            if duration_mins >= 30:
                boost = 0.7

        return boost

    def _get_cold_start_recommendations(
        self,
        limit: int,
        context: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Handle cold start for new users with no listening history.

        Strategy:
        1. Use explicit preferences if available
        2. Fall back to trending podcasts

        Args:
            limit: Number of recommendations
            context: Listening context

        Returns:
            List of recommendation dicts
        """
        # Get disliked podcasts to filter them out
        disliked_ids = self._get_disliked_podcast_ids()

        # Strategy 1: Use explicit preferences if available
        user_prefs = self.db.query(UserPreference).filter_by(
            user_id=self.user.id
        ).first()
        media_prefs = self.db.query(MediaPreference).filter_by(
            user_id=self.user.id
        ).first()

        preferred_topics = []
        if user_prefs and user_prefs.podcast_topics:
            preferred_topics.extend(user_prefs.podcast_topics)
        if media_prefs and media_prefs.topics:
            preferred_topics.extend(media_prefs.topics)

        if preferred_topics:
            # Search for podcasts matching user's stated preferences
            results = self._search_podcasts_by_topics(preferred_topics, limit * 2)
            if results:
                # Filter out disliked podcasts
                results = [r for r in results if r['podcast_id'] not in disliked_ids]
                return results[:limit]

        # Strategy 2: Use trending podcasts
        trending = self._get_trending_podcasts(limit * 2)
        # Filter out disliked podcasts
        trending = [t for t in trending if t['podcast_id'] not in disliked_ids]
        return trending[:limit]

    def _search_podcasts_by_topics(
        self,
        topics: List[str],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Search for podcasts matching user's preferred topics.

        Args:
            topics: List of topic strings
            limit: Maximum results

        Returns:
            List of podcast dicts
        """
        headers = self._get_api_headers()
        if not headers:
            return []

        results = []
        seen_ids = set()

        for topic in topics[:3]:  # Limit to first 3 topics
            try:
                response = requests.get(
                    'https://api.podcastindex.org/api/1.0/search/byterm',
                    headers=headers,
                    params={'q': topic, 'max': 10},
                    timeout=10
                )

                if response.ok:
                    for feed in response.json().get('feeds', []):
                        podcast_id = str(feed.get('id'))
                        if podcast_id not in seen_ids:
                            seen_ids.add(podcast_id)
                            results.append({
                                'podcast_id': podcast_id,
                                'title': feed.get('title', ''),
                                'author': feed.get('author', ''),
                                'description': feed.get('description', ''),
                                'categories': feed.get('categories', {}),
                                'artwork': self._fix_image_url(feed.get('artwork', '')),
                                'score': 0.5,
                                'reason': f'Based on your interest in {topic}',
                            })
            except requests.RequestException as e:
                logger.warning(f"Error searching for topic {topic}: {e}")

        return results[:limit]

    def _get_trending_podcasts(self, limit: int) -> List[Dict[str, Any]]:
        """Get trending podcasts as fallback recommendations.

        Args:
            limit: Maximum results

        Returns:
            List of podcast dicts
        """
        headers = self._get_api_headers()
        if not headers:
            return []

        try:
            response = requests.get(
                'https://api.podcastindex.org/api/1.0/podcasts/trending',
                headers=headers,
                params={'max': limit, 'lang': 'en'},
                timeout=10
            )

            if response.ok:
                return [
                    {
                        'podcast_id': str(feed.get('id')),
                        'title': feed.get('title', ''),
                        'author': feed.get('author', ''),
                        'description': feed.get('description', ''),
                        'categories': feed.get('categories', {}),
                        'artwork': self._fix_image_url(feed.get('artwork', '')),
                        'score': (feed.get('trendScore', 0) / 100),
                        'reason': 'Trending podcast',
                    }
                    for feed in response.json().get('feeds', [])
                ]
        except requests.RequestException as e:
            logger.error(f"Error fetching trending podcasts: {e}")

        return []

    def _get_or_create_user_profile(self) -> UserPodcastProfile:
        """Get or create user's podcast preference profile.

        Returns:
            UserPodcastProfile (may be empty for new users)
        """
        profile = self.db.query(UserPodcastProfile).filter_by(
            user_id=self.user.id
        ).first()

        if not profile:
            profile = UserPodcastProfile(
                user_id=self.user.id,
                total_interactions=0,
                total_listening_hours=0.0,
                profile_version=1,
            )
            self.db.add(profile)
            self.db.commit()
            self.db.refresh(profile)

        return profile

    def update_user_profile(self) -> UserPodcastProfile:
        """Recompute user's preference profile from interaction history.

        Aggregates signals from:
        - Listening sessions (weighted by completion rate)
        - Explicit likes (strong positive)
        - Saved podcasts (positive)
        - Dislikes (excluded from profile)

        Returns:
            Updated UserPodcastProfile
        """
        profile = self._get_or_create_user_profile()

        # Aggregate listening sessions (completion >= 30% = positive signal)
        sessions = self.db.query(ListeningSession).filter_by(
            user_id=self.user.id
        ).filter(
            ListeningSession.completion_rate >= 0.3
        ).all()

        # Get liked podcasts
        liked_interactions = self.db.query(PodcastInteraction).filter_by(
            user_id=self.user.id,
            interaction_type=InteractionType.like
        ).all()

        # Get saved podcasts
        saved = self.db.query(SavedPodcast).filter_by(user_id=self.user.id).all()

        # Collect positive podcast IDs with weights
        positive_podcasts: Dict[str, float] = {}

        # Sessions: weight by completion rate + engagement
        for session in sessions:
            pid = session.podcast_external_id
            weight = session.completion_rate
            # Bonus for rewinds (engagement signal)
            weight *= (1 + 0.1 * (session.seek_backward_count or 0))
            positive_podcasts[pid] = positive_podcasts.get(pid, 0) + weight

        # Likes: strong positive signal (weight = 2.0)
        for interaction in liked_interactions:
            pid = interaction.podcast_external_id
            positive_podcasts[pid] = positive_podcasts.get(pid, 0) + 2.0

        # Saves: positive signal (weight = 1.0)
        for podcast in saved:
            pid = podcast.external_id
            positive_podcasts[pid] = positive_podcasts.get(pid, 0) + 1.0

        if not positive_podcasts:
            logger.info(f"No positive signals for user {self.user.id}")
            return profile

        # Get features for positive podcasts
        podcast_features = self.db.query(PodcastFeatures).filter(
            PodcastFeatures.external_id.in_(list(positive_podcasts.keys()))
        ).all()

        # If we don't have features, try to extract them
        if len(podcast_features) < len(positive_podcasts) * 0.5:
            for pid in positive_podcasts.keys():
                if not any(pf.external_id == pid for pf in podcast_features):
                    features = self.feature_service.extract_and_store_features(pid)
                    if features:
                        podcast_features.append(features)

        if not podcast_features:
            logger.warning(f"No podcast features available for user {self.user.id}")
            return profile

        # Compute weighted averages
        embeddings = []
        categories = []
        durations = []

        for pf in podcast_features:
            weight = positive_podcasts.get(pf.external_id, 1.0)

            if pf.description_embedding:
                embeddings.append((pf.description_embedding, weight))
            if pf.category_vector:
                categories.append((pf.category_vector, weight))
            if pf.avg_episode_duration_seconds:
                durations.append(pf.avg_episode_duration_seconds / 60)  # Convert to mins

        # Weighted average embedding
        if embeddings:
            total_weight = sum(w for _, w in embeddings)
            avg_embedding = [0.0] * len(embeddings[0][0])
            for emb, w in embeddings:
                for i, val in enumerate(emb):
                    avg_embedding[i] += val * (w / total_weight)
            profile.content_embedding = avg_embedding

        # Weighted average categories
        if categories:
            total_weight = sum(w for _, w in categories)
            avg_cats = [0.0] * len(categories[0][0])
            for cat, w in categories:
                for i, val in enumerate(cat):
                    avg_cats[i] += val * (w / total_weight)
            profile.category_preferences = avg_cats

        # Duration preferences (25th and 75th percentile)
        if durations:
            durations.sort()
            n = len(durations)
            profile.preferred_duration_min = int(durations[n // 4]) if n >= 4 else int(durations[0])
            profile.preferred_duration_max = int(durations[3 * n // 4]) if n >= 4 else int(durations[-1])

        # Update stats
        profile.total_interactions = len(sessions) + len(liked_interactions) + len(saved)
        profile.total_listening_hours = sum(
            s.listened_duration_seconds for s in sessions
        ) / 3600
        profile.last_updated_at = datetime.utcnow()
        profile.profile_version += 1

        self.db.commit()

        logger.info(
            f"Updated profile for user {self.user.id}: "
            f"{profile.total_interactions} interactions, "
            f"{profile.total_listening_hours:.1f} hours"
        )
        return profile

    def _get_candidate_podcasts(self, limit: int) -> List[PodcastFeatures]:
        """Get candidate podcasts for recommendation.

        Pulls from:
        1. Podcasts with pre-computed features
        2. Prioritizes recently popular podcasts

        Args:
            limit: Maximum candidates to return

        Returns:
            List of PodcastFeatures
        """
        # Get podcasts that have features and embeddings
        return self.db.query(PodcastFeatures).filter(
            PodcastFeatures.description_embedding.isnot(None)
        ).order_by(
            PodcastFeatures.popularity_score.desc().nullslast()
        ).limit(limit).all()

    def _get_interacted_podcast_ids(self) -> set:
        """Get IDs of podcasts user has interacted with.

        Returns:
            Set of podcast external IDs
        """
        # From listening sessions
        session_ids = self.db.query(ListeningSession.podcast_external_id).filter_by(
            user_id=self.user.id
        ).distinct().all()

        # From interactions
        interaction_ids = self.db.query(PodcastInteraction.podcast_external_id).filter_by(
            user_id=self.user.id
        ).distinct().all()

        # From saved
        saved_ids = self.db.query(SavedPodcast.external_id).filter_by(
            user_id=self.user.id
        ).all()

        return set(
            [r[0] for r in session_ids] +
            [r[0] for r in interaction_ids] +
            [r[0] for r in saved_ids]
        )

    def _get_disliked_podcast_ids(self) -> set:
        """Get IDs of podcasts user has disliked.

        Returns:
            Set of podcast external IDs
        """
        disliked = self.db.query(PodcastInteraction.podcast_external_id).filter_by(
            user_id=self.user.id,
            interaction_type=InteractionType.dislike
        ).all()
        return set(r[0] for r in disliked)

    def _generate_recommendation_reason(
        self,
        podcast: PodcastFeatures,
        profile: UserPodcastProfile,
        context: Optional[str]
    ) -> str:
        """Generate human-readable reason for recommendation.

        Args:
            podcast: Recommended podcast
            profile: User profile
            context: Listening context

        Returns:
            Reason string
        """
        reasons = []

        # Category match
        if profile.category_preferences and podcast.category_vector:
            # Find top matching category
            if podcast.categories:
                for cat_name in podcast.categories.values():
                    if cat_name:
                        reasons.append(f"Matches your interest in {cat_name}")
                        break

        # Duration fit
        if (profile.preferred_duration_min and profile.preferred_duration_max and
                podcast.avg_episode_duration_seconds):
            duration_mins = podcast.avg_episode_duration_seconds / 60
            if profile.preferred_duration_min <= duration_mins <= profile.preferred_duration_max:
                reasons.append("Perfect episode length for you")

        # Context
        if context == 'commute':
            reasons.append("Great for your commute")
        elif context == 'workout':
            reasons.append("Energize your workout")

        # Popularity
        if podcast.popularity_score and podcast.popularity_score > 0.7:
            reasons.append("Highly popular")

        if reasons:
            return reasons[0]
        return "Recommended for you"

    def _get_cached_recommendations(
        self,
        context: Optional[str]
    ) -> Optional[List[Dict[str, Any]]]:
        """Get cached recommendations if available and fresh.

        Args:
            context: Listening context to match

        Returns:
            List of recommendation dicts, or None if cache miss
        """
        cache = self.db.query(RecommendationCache).filter_by(
            user_id=self.user.id,
            context=context
        ).filter(
            RecommendationCache.expires_at > datetime.utcnow()
        ).first()

        if not cache or not cache.podcast_ids:
            return None

        # Get features for cached podcast IDs to fill in metadata
        features_map = {}
        features = self.db.query(PodcastFeatures).filter(
            PodcastFeatures.external_id.in_(cache.podcast_ids)
        ).all()
        for f in features:
            features_map[f.external_id] = f

        # Reconstruct recommendations from cache with full metadata
        recommendations = []
        for i, pid in enumerate(cache.podcast_ids):
            feature = features_map.get(pid)
            recommendations.append({
                'podcast_id': pid,
                'score': cache.scores[i] if cache.scores and i < len(cache.scores) else 0.0,
                'reason': cache.reasons[i] if cache.reasons and i < len(cache.reasons) else '',
                'title': feature.title if feature else '',
                'author': feature.author if feature else '',
                'description': feature.description if feature else '',
                'categories': feature.categories if feature else {},
                'artwork': feature.artwork if feature and feature.artwork else '',
            })

        # If we're missing titles, cache is stale - invalidate it
        if any(not r['title'] for r in recommendations):
            logger.debug("Cache missing titles, invalidating")
            return None

        return recommendations

    def _cache_recommendations(
        self,
        recommendations: List[Dict[str, Any]],
        context: Optional[str]
    ) -> None:
        """Cache recommendations for faster retrieval.

        Args:
            recommendations: List of recommendation dicts
            context: Listening context
        """
        # Remove old cache for this context
        self.db.query(RecommendationCache).filter_by(
            user_id=self.user.id,
            context=context
        ).delete()

        cache = RecommendationCache(
            user_id=self.user.id,
            podcast_ids=[r['podcast_id'] for r in recommendations],
            scores=[r['score'] for r in recommendations],
            reasons=[r['reason'] for r in recommendations],
            algorithm_version='v1',
            model_type='hybrid',
            context=context,
            generated_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=self.CACHE_DURATION_HOURS),
        )
        self.db.add(cache)
        self.db.commit()

    def invalidate_cache(self, podcast_id: Optional[str] = None) -> None:
        """Invalidate recommendation cache for this user.

        Call this when user dislikes, unsaves, or otherwise changes their preferences.

        Args:
            podcast_id: If provided, only invalidate if this podcast is in the cache.
                       If None, invalidate all caches for this user.
        """
        if podcast_id:
            # Check if this podcast is in any cached recommendations
            caches = self.db.query(RecommendationCache).filter_by(
                user_id=self.user.id
            ).all()

            for cache in caches:
                if cache.podcast_ids and podcast_id in cache.podcast_ids:
                    self.db.delete(cache)
            self.db.commit()
        else:
            # Invalidate all caches for user
            self.db.query(RecommendationCache).filter_by(
                user_id=self.user.id
            ).delete()
            self.db.commit()

        logger.debug(f"Invalidated recommendation cache for user {self.user.id}")

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Compute cosine similarity between two vectors.

        Args:
            vec1: First vector
            vec2: Second vector

        Returns:
            Cosine similarity (-1 to 1)
        """
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0

        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = sum(a * a for a in vec1) ** 0.5
        norm2 = sum(b * b for b in vec2) ** 0.5

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return dot_product / (norm1 * norm2)

    def _get_api_headers(self) -> Optional[Dict[str, str]]:
        """Get Podcast Index API headers."""
        api_key = os.getenv('PODCAST_INDEX_API_KEY')
        api_secret = os.getenv('PODCAST_INDEX_API_SECRET')

        if not api_key or not api_secret:
            return None

        epoch_time = str(int(time.time()))
        data_to_hash = api_key + api_secret + epoch_time
        sha_hash = hashlib.sha1(data_to_hash.encode()).hexdigest()

        return {
            'User-Agent': 'GuruApp/1.0',
            'X-Auth-Key': api_key,
            'X-Auth-Date': epoch_time,
            'Authorization': sha_hash,
        }

    def _get_podcast_artwork(self, podcast_id: str) -> str:
        """Get podcast artwork URL from cached features."""
        features = self.db.query(PodcastFeatures).filter_by(
            external_id=podcast_id
        ).first()

        # For now we don't store artwork in features, so return empty
        # The cold start and trending paths set artwork from API response
        return ''

    def _get_podcast_artwork_from_api(self, podcast_id: str) -> str:
        """Fetch podcast artwork from Podcast Index API."""
        headers = self._get_api_headers()
        if not headers:
            return ''

        try:
            response = requests.get(
                f'https://api.podcastindex.org/api/1.0/podcasts/byfeedid',
                headers=headers,
                params={'id': podcast_id},
                timeout=10
            )
            if response.ok:
                feed = response.json().get('feed', {})
                return self._fix_image_url(feed.get('artwork', ''))
        except requests.RequestException as e:
            logger.warning(f"Error fetching artwork for {podcast_id}: {e}")

        return ''

    def _fix_image_url(self, url: str) -> str:
        """Fix image URL to use HTTPS."""
        if not url:
            return url
        if url.startswith('http://'):
            return url.replace('http://', 'https://')
        return url
