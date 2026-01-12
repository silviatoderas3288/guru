"""Time block model for protected time."""

from sqlalchemy import Column, String, Time, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class TimeBlock(BaseModel):
    """Protected time blocks (sleep, unwind, workout, journal)."""

    __tablename__ = "time_blocks"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type = Column(String)  # sleep, unwind, workout, journal
    start_time = Column(Time)
    end_time = Column(Time)
    is_protected = Column(Boolean, default=True)
    recurrence_rule = Column(String)  # RFC 5545 recurrence rule

    # Relationship
    user = relationship("User", back_populates="time_blocks")

    def __repr__(self):
        return f"<TimeBlock(id={self.id}, type={self.type}, protected={self.is_protected})>"
