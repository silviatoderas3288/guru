"""User preference model for podcast and workout preferences."""

from sqlalchemy import Column, String, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class UserPreference(BaseModel):
    """User preferences for podcasts and workouts."""

    __tablename__ = "user_preferences"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)

    # Podcast preferences
    podcast_topics = Column(ARRAY(String))  # Multiple topics
    podcast_length = Column(String)  # Single selection
    notifications = Column(String)  # Single selection

    # Workout preferences
    workout_types = Column(ARRAY(String))  # Multiple types
    workout_duration = Column(String)  # Single selection
    workout_frequency = Column(String)  # Single selection
    workout_days = Column(ARRAY(String))  # Multiple days (e.g. Mon, Wed, Fri)
    workout_preferred_time = Column(String)  # Single selection (e.g. Morning, Evening)

    # Commute preferences
    commute_start = Column(String)  # "HH:MM"
    commute_end = Column(String)  # "HH:MM"
    commute_duration = Column(String)  # Single selection

    # Chore preferences
    chore_time = Column(String)  # Single selection (e.g. Weekend Mornings)
    chore_duration = Column(String)  # Single selection

    # Focus & Schedule preferences
    bed_time = Column(String, nullable=True)  # "HH:MM"
    focus_time_start = Column(String, nullable=True)  # "HH:MM"
    focus_time_end = Column(String, nullable=True)  # "HH:MM"
    blocked_apps = Column(ARRAY(String), nullable=True)  # List of app names

    # Relationship
    user = relationship("User", back_populates="user_preferences")

    def __repr__(self):
        return f"<UserPreference(id={self.id}, user_id={self.user_id})>"
