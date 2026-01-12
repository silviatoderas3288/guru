"""Resolution model for New Year's goals."""

from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class Resolution(BaseModel):
    """New Year's resolution model."""

    __tablename__ = "resolutions"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    category = Column(String)
    target_value = Column(Integer)
    current_value = Column(Integer, default=0)
    year = Column(Integer)

    # Relationship
    user = relationship("User", back_populates="resolutions")

    def __repr__(self):
        return f"<Resolution(id={self.id}, title={self.title}, progress={self.current_value}/{self.target_value})>"
