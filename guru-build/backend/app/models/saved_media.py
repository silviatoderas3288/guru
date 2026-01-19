from sqlalchemy import Column, String, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel

class SavedPodcast(BaseModel):
    __tablename__ = "saved_podcasts"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    external_id = Column(String, nullable=False)  # Podcast Index ID or Spotify ID
    title = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    author = Column(String, nullable=True)
    feed_url = Column(String, nullable=True)

    # Relationships
    user = relationship("User", back_populates="saved_podcasts")
    episodes = relationship("SavedEpisode", back_populates="podcast", cascade="all, delete-orphan")

class SavedEpisode(BaseModel):
    __tablename__ = "saved_episodes"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    podcast_id = Column(UUID(as_uuid=True), ForeignKey("saved_podcasts.id"), nullable=True) # Link to local saved podcast if exists
    external_id = Column(String, nullable=False) # Episode ID
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    duration = Column(Integer, nullable=True) # In seconds
    audio_url = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    published_at = Column(Integer, nullable=True) # Timestamp

    # Relationships
    user = relationship("User", back_populates="saved_episodes")
    podcast = relationship("SavedPodcast", back_populates="episodes")
