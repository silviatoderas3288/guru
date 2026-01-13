"""AI Scheduling Agent models."""

from sqlalchemy import Column, String, Integer, Float, Boolean, Date, DateTime, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class SuggestionStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    partially_accepted = "partially_accepted"


class ChangeType(str, enum.Enum):
    initial = "initial"
    rebalance = "rebalance"
    manual_edit = "manual_edit"
    task_incomplete = "task_incomplete"


class ScheduleSuggestion(BaseModel):
    """AI generated schedule suggestions."""

    __tablename__ = "schedule_suggestions"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    week_start_date = Column(Date, nullable=False)
    
    # Suggested schedule (Array of scheduled items)
    suggested_events = Column(JSONB)
    
    # Metadata
    generation_timestamp = Column(DateTime)
    algorithm_version = Column(String)
    confidence_score = Column(Float)
    
    # Status
    status = Column(Enum(SuggestionStatus), default=SuggestionStatus.pending)
    applied_at = Column(DateTime, nullable=True)
    
    # AI reasoning
    reasoning = Column(Text)
    warnings = Column(JSONB)  # Array of warning messages
    conflicts = Column(JSONB)  # Array of conflicts detected

    # Relationship
    user = relationship("User", back_populates="schedule_suggestions")


class TaskCompletionFeedback(BaseModel):
    """Feedback on task completion for AI learning."""

    __tablename__ = "task_completion_feedback"

    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Completion data
    estimated_duration_minutes = Column(Integer)
    actual_duration_minutes = Column(Integer)
    completed = Column(Boolean)
    
    # Feedback
    difficulty_rating = Column(Integer)  # 1-5
    notes = Column(Text, nullable=True)

    # Relationship
    user = relationship("User", back_populates="task_feedback")
    task = relationship("Task")


class ScheduleHistory(BaseModel):
    """History of schedule changes."""

    __tablename__ = "schedule_history"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    week_start_date = Column(Date, nullable=False)
    
    # Change tracking
    change_type = Column(Enum(ChangeType), default=ChangeType.initial)
    trigger = Column(String)
    
    # Before/after state
    previous_schedule = Column(JSONB)
    new_schedule = Column(JSONB)
    
    # Diff summary
    changes_summary = Column(JSONB)  # {"added": 2, "removed": 1, "moved": 3}

    # Relationship
    user = relationship("User", back_populates="schedule_history")
