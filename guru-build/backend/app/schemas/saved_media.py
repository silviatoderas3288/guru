from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class SavedEpisodeBase(BaseModel):
    external_id: str
    title: str
    description: Optional[str] = None
    duration: Optional[int] = None
    audio_url: Optional[str] = None
    image_url: Optional[str] = None
    published_at: Optional[int] = None

class SavedEpisodeCreate(SavedEpisodeBase):
    podcast_id: Optional[UUID] = None # Local podcast ID

class SavedEpisodeResponse(SavedEpisodeBase):
    id: UUID
    user_id: UUID
    podcast_id: Optional[UUID]
    created_at: datetime

    class Config:
        from_attributes = True

class SavedPodcastBase(BaseModel):
    external_id: str
    title: str
    image_url: Optional[str] = None
    author: Optional[str] = None
    feed_url: Optional[str] = None

class SavedPodcastCreate(SavedPodcastBase):
    pass

class SavedPodcastResponse(SavedPodcastBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    episodes: List[SavedEpisodeResponse] = []

    class Config:
        from_attributes = True
