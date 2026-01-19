"""Scheduling Agent schemas for request/response validation."""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from enum import Enum
from uuid import UUID


class ActivityType(str, Enum):
    """Types of activities that can be scheduled."""
    WORKOUT = "workout"
    MEAL = "meal"
    COMMUTE = "commute"
    FOCUS = "focus"
    BREAK = "break"
    CHORE = "chore"
    TASK = "task"
    PODCAST = "podcast"
    MEETING = "meeting"


class ScheduledEvent(BaseModel):
    """A single scheduled event in the plan."""
    id: Optional[str] = None
    title: str
    activity_type: ActivityType
    start_time: str  # ISO format datetime
    end_time: str  # ISO format datetime
    day: str  # e.g., "Monday", "Tuesday"
    description: Optional[str] = None
    is_flexible: bool = True  # Can this event be moved if needed?
    priority: int = Field(default=5, ge=1, le=10)  # 1 = low, 10 = high
    suggested_podcast: Optional[str] = None  # For commute/workout
    color: Optional[str] = None  # For UI display


class ScheduleWarning(BaseModel):
    """Warning about a potential scheduling conflict or issue."""
    message: str
    severity: str = "info"  # "info", "warning", "error"
    affected_events: List[str] = []


class ScheduleConflict(BaseModel):
    """A detected conflict between events."""
    event1_id: str
    event2_id: str
    conflict_type: str  # "overlap", "too_close", "preference_violation"
    resolution_suggestion: Optional[str] = None


# Request Schemas
class GenerateScheduleRequest(BaseModel):
    """Request to generate a new schedule."""
    weekStartDate: date
    includeGoals: bool = True
    forceRegenerate: bool = False
    modificationRequest: Optional[str] = None  # Natural language request to modify the schedule
    email: Optional[str] = None  # Email to identify the user


class TaskFeedback(BaseModel):
    """Feedback on a specific task."""
    task_id: str
    estimated_duration_minutes: int
    actual_duration_minutes: Optional[int] = None
    completed: bool = False
    difficulty_rating: Optional[int] = Field(default=None, ge=1, le=5)
    notes: Optional[str] = None


class CalendarChange(BaseModel):
    """A change detected in the calendar."""
    event_id: str
    change_type: str  # "added", "removed", "modified"
    previous_start: Optional[str] = None
    new_start: Optional[str] = None


class RebalanceRequest(BaseModel):
    """Request to rebalance an existing schedule."""
    tasksFeedback: List[TaskFeedback] = []
    calendarChanges: List[CalendarChange] = []


class TaskFeedbackRequest(BaseModel):
    """Request to submit task feedback."""
    feedback: List[TaskFeedback]


# Response Schemas
class GenerateScheduleResponse(BaseModel):
    """Response from schedule generation."""
    success: bool
    weekStartDate: date
    scheduledEvents: List[ScheduledEvent]
    reasoning: str  # AI explanation of scheduling decisions
    warnings: List[ScheduleWarning] = []
    conflicts: List[ScheduleConflict] = []
    generatedAt: datetime
    confidenceScore: float = Field(ge=0.0, le=1.0)


class ScheduleStatusResponse(BaseModel):
    """Response with schedule status information."""
    hasSchedule: bool
    weekStartDate: Optional[date] = None
    lastGeneratedAt: Optional[datetime] = None
    totalEvents: int = 0
    completedEvents: int = 0
    completionRate: float = 0.0
