"""Workout model for customizable workout management."""

from sqlalchemy import Column, String, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class Workout(BaseModel):
    """User-customizable workout with sections and exercises."""

    __tablename__ = "workouts"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    completed = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="workouts")
    sections = relationship(
        "WorkoutSection",
        back_populates="workout",
        cascade="all, delete-orphan",
        order_by="WorkoutSection.order"
    )

    def __repr__(self):
        return f"<Workout(id={self.id}, title={self.title}, user_id={self.user_id})>"
