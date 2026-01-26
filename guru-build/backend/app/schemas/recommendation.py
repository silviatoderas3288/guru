"""Pydantic schemas for podcast recommendation API."""

from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


# === Request Schemas ===

class StartSessionRequest(BaseModel):
    """Request to start a listening session."""
    episode_id: str = Field(..., description="External episode ID from Podcast Index")
    podcast_id: str = Field(..., description="External podcast/feed ID from Podcast Index")
    episode_duration_seconds: int = Field(..., gt=0, description="Total duration of the episode in seconds")
    context: Optional[str] = Field(None, description="Listening context: commute, chore, workout, relaxing")


class UpdateSessionRequest(BaseModel):
    """Request to update listening session progress."""
    listened_duration_seconds: int = Field(..., ge=0, description="How much has been listened so far")
    pause_count: Optional[int] = Field(None, ge=0, description="Number of pauses")
    seek_forward_count: Optional[int] = Field(None, ge=0, description="Number of forward seeks")
    seek_backward_count: Optional[int] = Field(None, ge=0, description="Number of backward seeks (engagement signal)")
    playback_speed: Optional[float] = Field(None, gt=0, le=3.0, description="Current playback speed")


class InteractionRequest(BaseModel):
    """Request to record a user interaction."""
    podcast_id: str = Field(..., description="External podcast ID")
    episode_id: Optional[str] = Field(None, description="Optional episode ID for episode-level interactions")
    interaction_type: str = Field(
        ...,
        description="Type of interaction: like, dislike, save, unsave, share"
    )


# === Response Schemas ===

class StartSessionResponse(BaseModel):
    """Response after starting a listening session."""
    session_id: UUID
    message: str = "Session started"


class UpdateSessionResponse(BaseModel):
    """Response after updating a session."""
    status: str = "updated"
    completion_rate: float = Field(..., ge=0, le=1, description="Current completion rate (0.0 to 1.0)")


class EndSessionResponse(BaseModel):
    """Response after ending a session."""
    status: str = "ended"
    completion_rate: float
    listened_minutes: float


class InteractionResponse(BaseModel):
    """Response after recording an interaction."""
    status: str = "recorded"
    interaction_id: UUID


class PodcastRecommendation(BaseModel):
    """A single podcast recommendation."""
    podcast_id: str = Field(..., description="External podcast ID")
    title: str = Field(default="", description="Podcast title")
    author: Optional[str] = Field(default="", description="Podcast author")
    description: Optional[str] = Field(default="", description="Podcast description")
    categories: Optional[Dict[str, str]] = Field(default_factory=dict, description="Podcast categories")
    artwork: Optional[str] = Field(default="", description="Podcast artwork URL")
    score: float = Field(..., ge=0, description="Recommendation score")
    reason: str = Field(default="Recommended for you", description="Why this was recommended")


class RecommendationsResponse(BaseModel):
    """Response containing podcast recommendations."""
    recommendations: List[PodcastRecommendation]
    generated_at: datetime
    is_cached: bool = False
    user_profile_age_hours: Optional[float] = Field(
        None,
        description="Hours since user profile was last updated"
    )
    total_interactions: Optional[int] = Field(
        None,
        description="Total user interactions used for training"
    )


class UserProfileResponse(BaseModel):
    """Response containing user's recommendation profile."""
    has_profile: bool
    total_interactions: int
    total_listening_hours: float
    profile_version: int
    last_updated_at: Optional[datetime]
    preferred_duration_min: Optional[int] = Field(None, description="Preferred minimum episode duration (minutes)")
    preferred_duration_max: Optional[int] = Field(None, description="Preferred maximum episode duration (minutes)")
    top_categories: List[str] = Field(default_factory=list, description="User's top preferred categories")


class ListeningSessionResponse(BaseModel):
    """Response containing listening session details."""
    id: UUID
    episode_id: str
    podcast_id: str
    started_at: datetime
    ended_at: Optional[datetime]
    completion_rate: float
    listened_duration_seconds: int
    pause_count: int
    seek_backward_count: int
    context: Optional[str]


class InteractionHistoryItem(BaseModel):
    """A single interaction in history."""
    id: UUID
    podcast_id: str
    episode_id: Optional[str]
    interaction_type: str
    timestamp: datetime


class InteractionHistoryResponse(BaseModel):
    """Response containing user's interaction history."""
    interactions: List[InteractionHistoryItem]
    total_count: int


# === Config ===

class Config:
    """Pydantic config."""
    from_attributes = True
