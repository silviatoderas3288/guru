"""Media feedback model for learning user preferences."""

from sqlalchemy import Column, String, Boolean, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class MediaFeedback(BaseModel):
    """User feedback on media recommendations."""

    __tablename__ = "media_feedback"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    media_id = Column(String)  # External media ID (Spotify, Google Books, etc.)
    media_type = Column(String)  # podcast, audiobook
    liked = Column(Boolean)
    listen_completion_rate = Column(Float)  # 0.0 to 1.0

    # Relationship
    user = relationship("User", back_populates="media_feedback")

    def __repr__(self):
        return f"<MediaFeedback(id={self.id}, media_id={self.media_id}, liked={self.liked})>"
