"""Calendar-related Pydantic schemas."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class GoogleTokens(BaseModel):
    """Google OAuth tokens."""
    access_token: str
    refresh_token: Optional[str] = None


class CalendarEventBase(BaseModel):
    """Base calendar event schema."""
    summary: str = Field(..., description="Event title")
    description: Optional[str] = Field(None, description="Event description")
    location: Optional[str] = Field(None, description="Event location")
    start_time: datetime = Field(..., description="Event start time")
    end_time: datetime = Field(..., description="Event end time")
    color_id: Optional[str] = Field(None, description="Google Calendar color ID (1-11)")


class CalendarEventCreate(CalendarEventBase):
    """Schema for creating a calendar event."""
    pass


class CalendarEventUpdate(BaseModel):
    """Schema for updating a calendar event."""
    summary: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    color_id: Optional[str] = None


class CalendarEvent(CalendarEventBase):
    """Calendar event response schema."""
    id: str
    html_link: Optional[str] = None
    created: Optional[datetime] = None
    updated: Optional[datetime] = None

    class Config:
        from_attributes = True


class AvailableSlot(BaseModel):
    """Available time slot schema."""
    start: datetime
    end: datetime
    duration_minutes: int


class AvailableSlotsRequest(BaseModel):
    """Request schema for available slots."""
    start_date: datetime
    end_date: datetime
    slot_duration: int = Field(default=30, ge=15, le=240, description="Slot duration in minutes")
    working_hours_start: int = Field(default=9, ge=0, le=23, description="Working hours start (hour)")
    working_hours_end: int = Field(default=17, ge=0, le=23, description="Working hours end (hour)")


class AvailableSlotsResponse(BaseModel):
    """Response schema for available slots."""
    slots: List[AvailableSlot]
    count: int
