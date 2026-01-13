"""Meal preference model for AI scheduling."""

from sqlalchemy import Column, Integer, Boolean, Time, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class MealPreference(BaseModel):
    """Meal scheduling preferences."""

    __tablename__ = "meal_preferences"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    meals_enabled = Column(Boolean, default=True)
    meal_duration_minutes = Column(Integer, default=30)
    
    # Preferred times
    breakfast_time = Column(Time, nullable=True)
    lunch_time = Column(Time, nullable=True)
    dinner_time = Column(Time, nullable=True)
    
    # Flexibility
    meal_time_flexibility_minutes = Column(Integer, default=30)

    # Relationship
    user = relationship("User", back_populates="meal_preferences")

    def __repr__(self):
        return f"<MealPreference(id={self.id}, user_id={self.user_id})>"
