"""Podcast recommendation API endpoints."""

import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.podcast_recommendation import InteractionType, UserPodcastProfile
from app.services.recommendation_service import RecommendationService
from app.services.event_tracking_service import EventTrackingService
from app.services.feature_extraction_service import FeatureExtractionService
from app.schemas.recommendation import (
    StartSessionRequest,
    StartSessionResponse,
    UpdateSessionRequest,
    UpdateSessionResponse,
    EndSessionResponse,
    InteractionRequest,
    InteractionResponse,
    PodcastRecommendation,
    RecommendationsResponse,
    UserProfileResponse,
    ListeningSessionResponse,
    InteractionHistoryItem,
    InteractionHistoryResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# === Dependency ===

def get_current_user(db: Session = Depends(get_db)) -> User:
    """Get current user (development: most recently updated user)."""
    user = db.query(User).order_by(User.updated_at.desc()).first()
    if not user:
        raise HTTPException(
            status_code=401,
            detail="No user found. Please authenticate first."
        )
    return user


# === Recommendation Endpoints ===

@router.get("/podcasts", response_model=RecommendationsResponse)
async def get_recommendations(
    limit: int = Query(20, ge=1, le=50, description="Number of recommendations"),
    context: Optional[str] = Query(
        None,
        description="Listening context: commute, chore, workout, relaxing"
    ),
    refresh: bool = Query(False, description="Force refresh recommendations"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get personalized podcast recommendations.

    Returns ML-powered recommendations based on user's:
    - Listening history (completion rates, engagement)
    - Explicit preferences (likes, dislikes)
    - Saved podcasts
    - Stated preferences (topics, genres)

    For new users, falls back to trending podcasts.
    """
    service = RecommendationService(db, current_user)
    recommendations = service.get_recommendations(
        limit=limit,
        use_cache=not refresh,
        context=context
    )

    # Get profile metadata
    profile_age = None
    total_interactions = 0
    profile = db.query(UserPodcastProfile).filter_by(user_id=current_user.id).first()
    if profile:
        total_interactions = profile.total_interactions or 0
        if profile.last_updated_at:
            delta = datetime.utcnow() - profile.last_updated_at
            profile_age = delta.total_seconds() / 3600

    return RecommendationsResponse(
        recommendations=[PodcastRecommendation(**r) for r in recommendations],
        generated_at=datetime.utcnow(),
        is_cached=not refresh,
        user_profile_age_hours=profile_age,
        total_interactions=total_interactions,
    )


@router.post("/profile/refresh", response_model=UserProfileResponse)
async def refresh_user_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger a refresh of the user's recommendation profile.

    Recomputes preferences from all interaction history.
    Normally happens automatically after listening sessions.
    """
    service = RecommendationService(db, current_user)
    profile = service.update_user_profile()

    # Get top categories
    top_categories = []
    if profile.category_preferences:
        categories = FeatureExtractionService.CATEGORIES
        indexed = list(enumerate(profile.category_preferences))
        indexed.sort(key=lambda x: x[1], reverse=True)
        top_categories = [categories[i] for i, score in indexed[:5] if score > 0.1]

    return UserProfileResponse(
        has_profile=True,
        total_interactions=profile.total_interactions or 0,
        total_listening_hours=profile.total_listening_hours or 0.0,
        profile_version=profile.profile_version or 1,
        last_updated_at=profile.last_updated_at,
        preferred_duration_min=profile.preferred_duration_min,
        preferred_duration_max=profile.preferred_duration_max,
        top_categories=top_categories,
    )


@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the user's current recommendation profile."""
    profile = db.query(UserPodcastProfile).filter_by(user_id=current_user.id).first()

    if not profile:
        return UserProfileResponse(
            has_profile=False,
            total_interactions=0,
            total_listening_hours=0.0,
            profile_version=0,
            last_updated_at=None,
            preferred_duration_min=None,
            preferred_duration_max=None,
            top_categories=[],
        )

    # Get top categories
    top_categories = []
    if profile.category_preferences:
        categories = FeatureExtractionService.CATEGORIES
        indexed = list(enumerate(profile.category_preferences))
        indexed.sort(key=lambda x: x[1], reverse=True)
        top_categories = [categories[i] for i, score in indexed[:5] if score > 0.1]

    return UserProfileResponse(
        has_profile=True,
        total_interactions=profile.total_interactions or 0,
        total_listening_hours=profile.total_listening_hours or 0.0,
        profile_version=profile.profile_version or 1,
        last_updated_at=profile.last_updated_at,
        preferred_duration_min=profile.preferred_duration_min,
        preferred_duration_max=profile.preferred_duration_max,
        top_categories=top_categories,
    )


# === Listening Session Endpoints ===

@router.post("/listening/start", response_model=StartSessionResponse)
async def start_listening_session(
    request: StartSessionRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new listening session.

    Call this when the user starts playing an episode.
    The session tracks listening progress for recommendations.
    """
    service = EventTrackingService(db, current_user)
    session = service.start_listening_session(
        episode_id=request.episode_id,
        podcast_id=request.podcast_id,
        episode_duration_seconds=request.episode_duration_seconds,
        context=request.context,
        device_type='mobile'
    )

    # Extract features for podcast in background
    background_tasks.add_task(
        extract_podcast_features_background,
        db,
        request.podcast_id
    )

    return StartSessionResponse(session_id=session.id)


@router.put("/listening/{session_id}", response_model=UpdateSessionResponse)
async def update_listening_session(
    session_id: UUID,
    request: UpdateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update listening progress.

    Call this periodically (e.g., every 30 seconds) while playing.
    Tracks completion rate and engagement signals.
    """
    service = EventTrackingService(db, current_user)
    session = service.update_listening_session(
        session_id=session_id,
        listened_duration_seconds=request.listened_duration_seconds,
        pause_count=request.pause_count,
        seek_forward_count=request.seek_forward_count,
        seek_backward_count=request.seek_backward_count,
        playback_speed=request.playback_speed
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return UpdateSessionResponse(
        status="updated",
        completion_rate=session.completion_rate or 0.0
    )


@router.post("/listening/{session_id}/end", response_model=EndSessionResponse)
async def end_listening_session(
    session_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """End a listening session.

    Call this when the user stops playing or the episode ends.
    Triggers a profile update in the background.
    """
    service = EventTrackingService(db, current_user)
    session = service.end_listening_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Update user profile in background
    background_tasks.add_task(
        update_user_profile_background,
        db,
        current_user.id
    )

    return EndSessionResponse(
        status="ended",
        completion_rate=session.completion_rate or 0.0,
        listened_minutes=(session.listened_duration_seconds or 0) / 60
    )


@router.get("/listening/history", response_model=list[ListeningSessionResponse])
async def get_listening_history(
    limit: int = Query(20, ge=1, le=100),
    podcast_id: Optional[str] = Query(None, description="Filter by podcast"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's listening history."""
    service = EventTrackingService(db, current_user)
    sessions = service.get_listening_sessions(
        podcast_id=podcast_id,
        limit=limit
    )

    return [
        ListeningSessionResponse(
            id=s.id,
            episode_id=s.episode_external_id,
            podcast_id=s.podcast_external_id,
            started_at=s.started_at,
            ended_at=s.ended_at,
            completion_rate=s.completion_rate or 0.0,
            listened_duration_seconds=s.listened_duration_seconds or 0,
            pause_count=s.pause_count or 0,
            seek_backward_count=s.seek_backward_count or 0,
            context=s.listening_context,
        )
        for s in sessions
    ]


# === Interaction Endpoints ===

@router.post("/interaction", response_model=InteractionResponse)
async def record_interaction(
    request: InteractionRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a user interaction (like, dislike, save, share).

    These explicit signals strongly influence recommendations:
    - like: Strong positive signal (+2.0 weight)
    - dislike: Podcast is excluded from recommendations
    - save: Positive signal (+1.0 weight)
    - share: Strong positive signal
    """
    # Validate interaction type
    try:
        interaction_type = InteractionType(request.interaction_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid interaction type: {request.interaction_type}. "
                   f"Valid types: {[t.value for t in InteractionType]}"
        )

    service = EventTrackingService(db, current_user)
    interaction = service.record_interaction(
        podcast_id=request.podcast_id,
        episode_id=request.episode_id,
        interaction_type=interaction_type
    )

    # For dislike: immediately invalidate cache so recommendations refresh
    if interaction_type == InteractionType.dislike:
        rec_service = RecommendationService(db, current_user)
        rec_service.invalidate_cache(podcast_id=request.podcast_id)

    # Update profile in background for important interactions
    if interaction_type in [InteractionType.like, InteractionType.dislike]:
        background_tasks.add_task(
            update_user_profile_background,
            db,
            current_user.id
        )

    return InteractionResponse(
        status="recorded",
        interaction_id=interaction.id
    )


@router.get("/interactions", response_model=InteractionHistoryResponse)
async def get_interaction_history(
    limit: int = Query(50, ge=1, le=200),
    podcast_id: Optional[str] = Query(None, description="Filter by podcast"),
    interaction_type: Optional[str] = Query(None, description="Filter by type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's interaction history."""
    service = EventTrackingService(db, current_user)

    # Parse interaction type if provided
    type_filter = None
    if interaction_type:
        try:
            type_filter = InteractionType(interaction_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid interaction type: {interaction_type}"
            )

    interactions = service.get_user_interactions(
        podcast_id=podcast_id,
        interaction_type=type_filter,
        limit=limit
    )

    return InteractionHistoryResponse(
        interactions=[
            InteractionHistoryItem(
                id=i.id,
                podcast_id=i.podcast_external_id,
                episode_id=i.episode_external_id,
                interaction_type=i.interaction_type.value,
                timestamp=i.interaction_timestamp,
            )
            for i in interactions
        ],
        total_count=len(interactions),
    )


# === Background Task Functions ===

def extract_podcast_features_background(db: Session, podcast_id: str):
    """Background task to extract podcast features."""
    try:
        service = FeatureExtractionService(db)
        service.extract_and_store_features(podcast_id)
    except Exception as e:
        logger.error(f"Error extracting features for podcast {podcast_id}: {e}")


def update_user_profile_background(db: Session, user_id: UUID):
    """Background task to update user profile."""
    try:
        user = db.query(User).filter_by(id=user_id).first()
        if user:
            service = RecommendationService(db, user)
            service.update_user_profile()
    except Exception as e:
        logger.error(f"Error updating profile for user {user_id}: {e}")
