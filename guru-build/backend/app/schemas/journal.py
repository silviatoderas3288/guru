"""Journal entry schemas."""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class JournalEntryBase(BaseModel):
    """Base schema for journal entries."""
    timestamp: datetime
    notes: Optional[str] = None


class JournalEntryCreate(JournalEntryBase):
    """Schema for creating a journal entry."""
    pass


class JournalEntryUpdate(BaseModel):
    """Schema for updating a journal entry."""
    timestamp: Optional[datetime] = None
    notes: Optional[str] = None


class JournalEntryResponse(JournalEntryBase):
    """Schema for journal entry responses."""
    id: int
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
