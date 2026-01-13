"""Exercise model for individual workout exercises."""

from sqlalchemy import Column, String, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class Exercise(BaseModel):
    """Individual exercise within a workout section."""

    __tablename__ = "exercises"

    section_id = Column(UUID(as_uuid=True), ForeignKey("workout_sections.id"), nullable=False)
    name = Column(String(255), nullable=False)
    sets = Column(String(50), nullable=True)
    reps = Column(String(50), nullable=True)
    duration = Column(String(50), nullable=True)
    order = Column(Integer, nullable=False, default=0)

    # Relationships
    section = relationship("WorkoutSection", back_populates="exercises")

    def __repr__(self):
        return f"<Exercise(id={self.id}, name={self.name}, section_id={self.section_id})>"
