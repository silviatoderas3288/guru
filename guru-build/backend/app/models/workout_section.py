"""Workout section model for organizing exercises."""

from sqlalchemy import Column, String, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class WorkoutSection(BaseModel):
    """Section within a workout containing exercises."""

    __tablename__ = "workout_sections"

    workout_id = Column(UUID(as_uuid=True), ForeignKey("workouts.id"), nullable=False)
    title = Column(String(255), nullable=False)
    order = Column(Integer, nullable=False, default=0)

    # Relationships
    workout = relationship("Workout", back_populates="sections")
    exercises = relationship(
        "Exercise",
        back_populates="section",
        cascade="all, delete-orphan",
        order_by="Exercise.order"
    )

    def __repr__(self):
        return f"<WorkoutSection(id={self.id}, title={self.title}, workout_id={self.workout_id})>"
