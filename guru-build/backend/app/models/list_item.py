"""List items model for weekly goals and to-do lists."""

from sqlalchemy import Column, String, Boolean, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class ListItemType(str, enum.Enum):
    """Type of list item."""
    WEEKLY_GOAL = "weekly_goal"
    TODO = "todo"


class ListItem(BaseModel):
    """List item model for weekly goals and to-do items."""

    __tablename__ = "list_items"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    text = Column(String, nullable=False)
    completed = Column(Boolean, default=False)
    item_type = Column(SQLEnum(ListItemType, name='listitemtype', values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    calendar_event_id = Column(String, nullable=True)  # Google Calendar event ID

    # Relationship
    user = relationship("User", back_populates="list_items")

    def __repr__(self):
        return f"<ListItem(id={self.id}, text={self.text}, type={self.item_type}, completed={self.completed})>"
