"""List item schemas for API validation."""

from pydantic import BaseModel, field_serializer
from typing import Optional, List as TypeList
from datetime import datetime
from uuid import UUID
from ..models.list_item import ListItemType


class ListItemBase(BaseModel):
    """Base list item schema."""
    text: str
    completed: bool = False
    item_type: ListItemType
    calendar_event_id: Optional[str] = None
    parent_goal_id: Optional[str] = None


class ListItemCreate(ListItemBase):
    """Schema for creating a list item."""
    pass


class ListItemCreateWithChildren(BaseModel):
    """Schema for creating a weekly goal with child chore items."""
    text: str
    child_items: TypeList[str]  # List of chore text items to create as children


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
    parent_goal_id: Optional[UUID] = None

    @field_serializer('id', 'user_id')
    def serialize_uuid(self, value: UUID) -> str:
        """Convert UUID to string for JSON serialization."""
        return str(value)

    @field_serializer('parent_goal_id')
    def serialize_parent_goal_id(self, value: Optional[UUID]) -> Optional[str]:
        """Convert UUID to string for JSON serialization."""
        return str(value) if value else None

    class Config:
        from_attributes = True


class ListItemWithChildren(ListItem):
    """List item with child items included."""
    child_items: TypeList['ListItem'] = []
