"""User preferences API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from ..database import get_db
from ..models import User, UserPreference

router = APIRouter()


class PreferenceSchema(BaseModel):
    """Schema for user preferences."""
    email: str
    podcast_topics: Optional[List[str]] = None
    podcast_length: Optional[str] = None
    notifications: Optional[str] = None
    workout_types: Optional[List[str]] = None
    workout_duration: Optional[str] = None
    workout_frequency: Optional[str] = None
    workout_days: Optional[List[str]] = None
    workout_preferred_time: Optional[str] = None
    bed_time: Optional[str] = None
    focus_time_start: Optional[str] = None
    focus_time_end: Optional[str] = None
    blocked_apps: Optional[List[str]] = None
    commute_start: Optional[str] = None
    commute_end: Optional[str] = None
    commute_duration: Optional[str] = None
    commute_method: Optional[str] = None
    chore_time: Optional[str] = None
    chore_duration: Optional[str] = None


class PreferenceResponse(BaseModel):
    """Response schema for preferences."""
    podcast_topics: Optional[List[str]] = None
    podcast_length: Optional[str] = None
    notifications: Optional[str] = None
    workout_types: Optional[List[str]] = None
    workout_duration: Optional[str] = None
    workout_frequency: Optional[str] = None
    workout_days: Optional[List[str]] = None
    workout_preferred_time: Optional[str] = None
    bed_time: Optional[str] = None
    focus_time_start: Optional[str] = None
    focus_time_end: Optional[str] = None
    blocked_apps: Optional[List[str]] = None
    commute_start: Optional[str] = None
    commute_end: Optional[str] = None
    commute_duration: Optional[str] = None
    commute_method: Optional[str] = None
    chore_time: Optional[str] = None
    chore_duration: Optional[str] = None

    class Config:
        from_attributes = True


def get_or_create_user(db: Session, email: str) -> User:
    """Get existing user or create a new one."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Auto-create user for OAuth-based apps
        user = User(email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.get("/api/preferences/{email}", response_model=PreferenceResponse)
async def get_preferences(email: str, db: Session = Depends(get_db)):
    """Get user preferences by email."""
    # Find or create user by email
    user = get_or_create_user(db, email)

    # Get or create preferences
    preferences = db.query(UserPreference).filter(
        UserPreference.user_id == user.id
    ).first()

    if not preferences:
        # Return empty preferences if none exist
        return PreferenceResponse(
            podcast_topics=[],
            podcast_length=None,
            notifications=None,
            workout_types=[],
            workout_duration=None,
            workout_frequency=None,
            workout_days=[],
            workout_preferred_time=None,
            bed_time=None,
            focus_time_start=None,
            focus_time_end=None,
            blocked_apps=[],
            commute_start=None,
            commute_end=None,
            commute_duration=None,
            commute_method=None,
            chore_time=None,
            chore_duration=None
        )

    return PreferenceResponse(
        podcast_topics=preferences.podcast_topics or [],
        podcast_length=preferences.podcast_length,
        notifications=preferences.notifications,
        workout_types=preferences.workout_types or [],
        workout_duration=preferences.workout_duration,
        workout_frequency=preferences.workout_frequency,
        workout_days=preferences.workout_days or [],
        workout_preferred_time=preferences.workout_preferred_time,
        bed_time=preferences.bed_time,
        focus_time_start=preferences.focus_time_start,
        focus_time_end=preferences.focus_time_end,
        blocked_apps=preferences.blocked_apps or [],
        commute_start=preferences.commute_start,
        commute_end=preferences.commute_end,
        commute_duration=preferences.commute_duration,
        commute_method=preferences.commute_method,
        chore_time=preferences.chore_time,
        chore_duration=preferences.chore_duration
    )


@router.post("/api/preferences")
async def save_preferences(
    preference_data: PreferenceSchema,
    db: Session = Depends(get_db)
):
    """Save or update user preferences."""
    # Find or create user by email
    user = get_or_create_user(db, preference_data.email)

    # Get or create preferences
    preferences = db.query(UserPreference).filter(
        UserPreference.user_id == user.id
    ).first()

    if preferences:
        # Update existing preferences
        preferences.podcast_topics = preference_data.podcast_topics
        preferences.podcast_length = preference_data.podcast_length
        preferences.notifications = preference_data.notifications
        preferences.workout_types = preference_data.workout_types
        preferences.workout_duration = preference_data.workout_duration
        preferences.workout_frequency = preference_data.workout_frequency
        preferences.workout_days = preference_data.workout_days
        preferences.workout_preferred_time = preference_data.workout_preferred_time
        preferences.bed_time = preference_data.bed_time
        preferences.focus_time_start = preference_data.focus_time_start
        preferences.focus_time_end = preference_data.focus_time_end
        preferences.blocked_apps = preference_data.blocked_apps
        preferences.commute_start = preference_data.commute_start
        preferences.commute_end = preference_data.commute_end
        preferences.commute_duration = preference_data.commute_duration
        preferences.commute_method = preference_data.commute_method
        preferences.chore_time = preference_data.chore_time
        preferences.chore_duration = preference_data.chore_duration
    else:
        # Create new preferences
        preferences = UserPreference(
            user_id=user.id,
            podcast_topics=preference_data.podcast_topics,
            podcast_length=preference_data.podcast_length,
            notifications=preference_data.notifications,
            workout_types=preference_data.workout_types,
            workout_duration=preference_data.workout_duration,
            workout_frequency=preference_data.workout_frequency,
            workout_days=preference_data.workout_days,
            workout_preferred_time=preference_data.workout_preferred_time,
            bed_time=preference_data.bed_time,
            focus_time_start=preference_data.focus_time_start,
            focus_time_end=preference_data.focus_time_end,
            blocked_apps=preference_data.blocked_apps,
            commute_start=preference_data.commute_start,
            commute_end=preference_data.commute_end,
            commute_duration=preference_data.commute_duration,
            commute_method=preference_data.commute_method,
            chore_time=preference_data.chore_time,
            chore_duration=preference_data.chore_duration
        )
        db.add(preferences)

    db.commit()
    db.refresh(preferences)

    return {
        "message": "Preferences saved successfully",
        "preferences": PreferenceResponse(
            podcast_topics=preferences.podcast_topics or [],
            podcast_length=preferences.podcast_length,
            notifications=preferences.notifications,
            workout_types=preferences.workout_types or [],
            workout_duration=preferences.workout_duration,
            workout_frequency=preferences.workout_frequency,
            workout_days=preferences.workout_days or [],
            workout_preferred_time=preferences.workout_preferred_time,
            bed_time=preferences.bed_time,
            focus_time_start=preferences.focus_time_start,
            focus_time_end=preferences.focus_time_end,
            blocked_apps=preferences.blocked_apps or [],
            commute_start=preferences.commute_start,
            commute_end=preferences.commute_end,
            commute_duration=preferences.commute_duration,
            commute_method=preferences.commute_method,
            chore_time=preferences.chore_time,
            chore_duration=preferences.chore_duration
        )
    }