"""Task model."""

from sqlalchemy import Column, String, Integer, Date, ForeignKey, CheckConstraint, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class Task(BaseModel):
    """Task model for to-do items."""

    __tablename__ = "tasks"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    duration_minutes = Column(Integer)
    priority = Column(Integer, CheckConstraint("priority >= 1 AND priority <= 5"))
    status = Column(String)  # pending, scheduled, completed, rolled_over
    due_date = Column(Date)
    calendar_event_id = Column(String)  # Google Calendar event ID

    # Relationship
    user = relationship("User", back_populates="tasks")

    __table_args__ = (
        CheckConstraint("priority >= 1 AND priority <= 5", name="priority_check"),
    )

    def __repr__(self):
        return f"<Task(id={self.id}, title={self.title}, status={self.status})>"
