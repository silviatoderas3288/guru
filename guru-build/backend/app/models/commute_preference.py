"""Commute preference model for AI scheduling."""

from sqlalchemy import Column, String, Time, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from .base import BaseModel


class CommutePreference(BaseModel):
    """Commute scheduling preferences."""

    __tablename__ = "commute_preferences"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Commute windows
    morning_commute_start = Column(Time, nullable=True)
    morning_commute_end = Column(Time, nullable=True)
    evening_commute_start = Column(Time, nullable=True)
    evening_commute_end = Column(Time, nullable=True)
    
    # Content preferences
    preferred_podcast_ids = Column(ARRAY(String))
    preferred_music_genres = Column(ARRAY(String))
    
    # Chore times (JSON structure: [{"day": "saturday", "start": "10:00", "end": "12:00"}])
    chore_times = Column(JSONB, nullable=True)

    # Relationship
    user = relationship("User", back_populates="commute_preferences")

    def __repr__(self):
        return f"<CommutePreference(id={self.id}, user_id={self.user_id})>"
