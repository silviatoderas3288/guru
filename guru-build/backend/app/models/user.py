"""User model."""

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from .base import BaseModel


class User(BaseModel):
    """User model for authentication and preferences."""

    __tablename__ = "users"

    email = Column(String, unique=True, nullable=False, index=True)
    google_tokens = Column(JSONB)  # Encrypted OAuth tokens
    preferences_json = Column(JSONB)  # User preferences and settings

    # Relationships
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    time_blocks = relationship("TimeBlock", back_populates="user", cascade="all, delete-orphan")
    resolutions = relationship("Resolution", back_populates="user", cascade="all, delete-orphan")
    bingo_items = relationship("BingoItem", back_populates="user", cascade="all, delete-orphan")
    media_preferences = relationship("MediaPreference", back_populates="user", cascade="all, delete-orphan")
    media_feedback = relationship("MediaFeedback", back_populates="user", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    list_items = relationship("ListItem", cascade="all, delete-orphan")
    user_preferences = relationship("UserPreference", back_populates="user", cascade="all, delete-orphan", uselist=False)

    # Phase 1: Scheduling Agent Relationships
    workout_preferences = relationship("WorkoutPreference", back_populates="user", cascade="all, delete-orphan")
    workouts = relationship("Workout", back_populates="user", cascade="all, delete-orphan")
    meal_preferences = relationship("MealPreference", back_populates="user", cascade="all, delete-orphan")
    commute_preferences = relationship("CommutePreference", back_populates="user", cascade="all, delete-orphan")
    schedule_suggestions = relationship("ScheduleSuggestion", back_populates="user", cascade="all, delete-orphan")
    task_feedback = relationship("TaskCompletionFeedback", back_populates="user", cascade="all, delete-orphan")
    schedule_history = relationship("ScheduleHistory", back_populates="user", cascade="all, delete-orphan")
    saved_podcasts = relationship("SavedPodcast", back_populates="user", cascade="all, delete-orphan")
    saved_episodes = relationship("SavedEpisode", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
