"""List item schemas for API validation."""

from pydantic import BaseModel, field_serializer
from typing import Optional
from datetime import datetime
from uuid import UUID
from ..models.list_item import ListItemType


class ListItemBase(BaseModel):
    """Base list item schema."""
    text: str
    completed: bool = False
    item_type: ListItemType
    calendar_event_id: Optional[str] = None


class ListItemCreate(ListItemBase):
    """Schema for creating a list item."""
    pass


class ListItemUpdate(BaseModel):
    """Schema for updating a list item."""
    text: Optional[str] = None
    completed: Optional[bool] = None
    calendar_event_id: Optional[str] = None


class ListItem(ListItemBase):
    """Full list item schema with database fields."""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    @field_serializer('id', 'user_id')
    def serialize_uuid(self, value: UUID) -> str:
        """Convert UUID to string for JSON serialization."""
        return str(value)

    class Config:
        from_attributes = True
