"""User preferences API routes."""

from fastapi import APIRouter, HTTPException, Depends
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


class PreferenceResponse(BaseModel):
    """Response schema for preferences."""
    podcast_topics: Optional[List[str]] = None
    podcast_length: Optional[str] = None
    notifications: Optional[str] = None
    workout_types: Optional[List[str]] = None
    workout_duration: Optional[str] = None
    workout_frequency: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/api/preferences/{email}", response_model=PreferenceResponse)
async def get_preferences(email: str, db: Session = Depends(get_db)):
    """Get user preferences by email."""
    # Find user by email
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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
            workout_frequency=None
        )

    return PreferenceResponse(
        podcast_topics=preferences.podcast_topics or [],
        podcast_length=preferences.podcast_length,
        notifications=preferences.notifications,
        workout_types=preferences.workout_types or [],
        workout_duration=preferences.workout_duration,
        workout_frequency=preferences.workout_frequency
    )


@router.post("/api/preferences")
async def save_preferences(
    preference_data: PreferenceSchema,
    db: Session = Depends(get_db)
):
    """Save or update user preferences."""
    # Find user by email
    user = db.query(User).filter(User.email == preference_data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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
    else:
        # Create new preferences
        preferences = UserPreference(
            user_id=user.id,
            podcast_topics=preference_data.podcast_topics,
            podcast_length=preference_data.podcast_length,
            notifications=preference_data.notifications,
            workout_types=preference_data.workout_types,
            workout_duration=preference_data.workout_duration,
            workout_frequency=preference_data.workout_frequency
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
            workout_frequency=preferences.workout_frequency
        )
    }
