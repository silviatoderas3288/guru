"""Bingo item model for gamified goals."""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class BingoItem(BaseModel):
    """Bingo board item model."""

    __tablename__ = "bingo_items"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    bingo_board_id = Column(UUID(as_uuid=True))  # Group items into boards
    title = Column(String, nullable=False)
    position = Column(Integer, CheckConstraint("position >= 0 AND position <= 24"))
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)

    # Relationship
    user = relationship("User", back_populates="bingo_items")

    __table_args__ = (
        CheckConstraint("position >= 0 AND position <= 24", name="position_check"),
    )

    def __repr__(self):
        return f"<BingoItem(id={self.id}, title={self.title}, completed={self.completed})>"
