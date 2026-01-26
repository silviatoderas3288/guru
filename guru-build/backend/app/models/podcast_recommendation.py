"""Podcast recommendation ML models for personalized suggestions."""

import enum
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Enum, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from .base import BaseModel


class InteractionType(str, enum.Enum):
    """Types of user interactions with podcasts."""
    play_start = "play_start"
    play_pause = "play_pause"
    play_complete = "play_complete"
    skip = "skip"
    seek_forward = "seek_forward"
    seek_backward = "seek_backward"
    save = "save"
    unsave = "unsave"
    like = "like"
    dislike = "dislike"
    share = "share"


class ListeningSession(BaseModel):
    """Tracks user listening sessions for implicit feedback.

    Used to learn user preferences from actual listening behavior:
    - completion_rate: How much of the episode was listened to
    - seek_backward_count: Rewinding = engagement signal
    - pause_count: Many pauses might indicate distraction or difficulty
    """

    __tablename__ = "listening_sessions"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    episode_external_id = Column(String, nullable=False)  # Podcast Index episode ID
    podcast_external_id = Column(String, nullable=False)  # Podcast Index feed ID

    # Session timing
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=True)

    # Playback metrics
    episode_duration_seconds = Column(Integer)  # Total episode length
    listened_duration_seconds = Column(Integer, default=0)  # Actual time listened
    completion_rate = Column(Float, default=0.0)  # 0.0 to 1.0

    # Playback behavior signals
    pause_count = Column(Integer, default=0)
    seek_forward_count = Column(Integer, default=0)
    seek_backward_count = Column(Integer, default=0)  # Positive signal - rewinding to re-listen
    playback_speed = Column(Float, default=1.0)

    # Context
    listening_context = Column(String, nullable=True)  # commute, chore, workout, etc.
    device_type = Column(String, nullable=True)  # mobile, web

    # Relationship
    user = relationship("User", back_populates="listening_sessions")

    __table_args__ = (
        Index('ix_listening_sessions_user_podcast', 'user_id', 'podcast_external_id'),
        Index('ix_listening_sessions_user_episode', 'user_id', 'episode_external_id'),
    )


class PodcastInteraction(BaseModel):
    """Explicit user interactions with podcasts/episodes.

    Tracks discrete actions like:
    - like/dislike: Strong preference signals
    - save/unsave: Interest signals
    - share: Strong positive signal
    """

    __tablename__ = "podcast_interactions"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    podcast_external_id = Column(String, nullable=False)
    episode_external_id = Column(String, nullable=True)  # Null for podcast-level interactions

    interaction_type = Column(Enum(InteractionType), nullable=False)
    interaction_timestamp = Column(DateTime, nullable=False)

    # Additional context
    extra_data = Column(JSONB, nullable=True)  # For flexible additional data

    user = relationship("User", back_populates="podcast_interactions")

    __table_args__ = (
        Index('ix_podcast_interactions_user_type', 'user_id', 'interaction_type'),
        Index('ix_podcast_interactions_podcast', 'podcast_external_id'),
    )


class PodcastFeatures(BaseModel):
    """Cached feature vectors for podcasts.

    Stores pre-computed ML features:
    - category_vector: One-hot encoded podcast categories (19 dims)
    - description_embedding: Semantic embedding from sentence-transformers (384 dims)
    """

    __tablename__ = "podcast_features"

    external_id = Column(String, unique=True, nullable=False, index=True)  # Podcast Index ID

    # Basic metadata (cached from API)
    title = Column(String)
    author = Column(String)
    description = Column(Text)
    artwork = Column(String)  # Artwork URL
    language = Column(String)
    categories = Column(JSONB)  # {category_id: category_name}
    episode_count = Column(Integer)

    # Extracted features
    category_vector = Column(ARRAY(Float))  # One-hot encoded categories (19 dims)
    description_embedding = Column(ARRAY(Float))  # Sentence-transformer embedding (384 dims)

    # Computed metadata
    avg_episode_duration_seconds = Column(Integer)
    update_frequency_days = Column(Float)  # Average days between episodes
    popularity_score = Column(Float)  # Based on trend data (0.0 to 1.0)

    # Freshness
    last_fetched_at = Column(DateTime)
    features_computed_at = Column(DateTime)

    __table_args__ = (
        Index('ix_podcast_features_popularity', 'popularity_score'),
    )


class UserPodcastProfile(BaseModel):
    """User's learned podcast preference profile.

    Built from aggregating user interactions:
    - category_preferences: Weighted average of liked podcast categories
    - content_embedding: Average embedding of liked podcast descriptions
    - duration preferences: Based on actually listened episode lengths
    """

    __tablename__ = "user_podcast_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)

    # Learned preference vectors
    category_preferences = Column(ARRAY(Float))  # Weighted category preferences (19 dims)
    content_embedding = Column(ARRAY(Float))  # Averaged embedding of liked content (384 dims)

    # Preference statistics
    preferred_duration_min = Column(Integer)  # Minutes (25th percentile)
    preferred_duration_max = Column(Integer)  # Minutes (75th percentile)
    preferred_languages = Column(ARRAY(String))

    # Learning metadata
    total_interactions = Column(Integer, default=0)
    total_listening_hours = Column(Float, default=0.0)
    profile_version = Column(Integer, default=1)
    last_updated_at = Column(DateTime)

    user = relationship("User", back_populates="podcast_profile")


class RecommendationCache(BaseModel):
    """Cached recommendations for users.

    Pre-computed recommendations to avoid real-time computation:
    - Refreshed periodically by background jobs
    - Expires after a set time to ensure freshness
    """

    __tablename__ = "recommendation_cache"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Recommendation data
    podcast_ids = Column(ARRAY(String))  # Ordered list of recommended podcast IDs
    scores = Column(ARRAY(Float))  # Corresponding recommendation scores
    reasons = Column(ARRAY(String))  # Why each podcast was recommended

    # Algorithm metadata
    algorithm_version = Column(String, default="v1")
    model_type = Column(String)  # content_based, collaborative, hybrid
    context = Column(String, nullable=True)  # commute, workout, etc.

    # Validity
    generated_at = Column(DateTime)
    expires_at = Column(DateTime)

    user = relationship("User")

    __table_args__ = (
        Index('ix_recommendation_cache_user_expires', 'user_id', 'expires_at'),
        Index('ix_recommendation_cache_user_context', 'user_id', 'context'),
    )
