"""Media preference model."""

from sqlalchemy import Column, String, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class MediaPreference(BaseModel):
    """User media preferences for recommendations."""

    __tablename__ = "media_preferences"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    podcast_genres = Column(ARRAY(String))
    book_genres = Column(ARRAY(String))
    topics = Column(ARRAY(String))
    preferred_duration = Column(String)  # short, medium, long

    # Relationship
    user = relationship("User", back_populates="media_preferences")

    def __repr__(self):
        return f"<MediaPreference(id={self.id}, user_id={self.user_id})>"
