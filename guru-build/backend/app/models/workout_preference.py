"""Workout preference model for AI scheduling."""

from sqlalchemy import Column, String, Integer, ForeignKey, ARRAY, Enum, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class ImportanceLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class WorkoutPreference(BaseModel):
    """Detailed workout preferences for scheduling."""

    __tablename__ = "workout_preferences"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    importance_level = Column(Enum(ImportanceLevel), default=ImportanceLevel.medium)
    preferred_time_start = Column(Time, nullable=True)
    preferred_time_end = Column(Time, nullable=True)
    frequency_per_week = Column(Integer, default=3)
    duration_minutes = Column(Integer, default=45)
    workout_types = Column(ARRAY(String))

    # Relationship
    user = relationship("User", back_populates="workout_preferences")

    def __repr__(self):
        return f"<WorkoutPreference(id={self.id}, user_id={self.user_id})>"
