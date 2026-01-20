"""Scheduling Agent API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.database import get_db
from app.schemas.schedule import (
    GenerateScheduleRequest,
    GenerateScheduleResponse,
    RebalanceRequest,
    TaskFeedbackRequest,
    ScheduleStatusResponse,
    WorkoutScheduleRequest,
    WorkoutScheduleResponse,
    PodcastScheduleRequest,
    PodcastScheduleResponse,
)
from app.services.scheduling_agent_service import SchedulingAgentService
from app.services.workout_scheduler_service import WorkoutSchedulerService
from app.services.podcast_scheduler_service import PodcastSchedulerService
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter()


@router.post("/generate", response_model=GenerateScheduleResponse)
async def generate_schedule(
    request: GenerateScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a new weekly schedule for the user.

    This endpoint:
    - Fetches user's tasks and goals
    - Retrieves calendar events from Google Calendar
    - Uses AI to intelligently schedule tasks, workouts, meals, etc.
    - Returns a suggested schedule with reasoning and warnings
    """
    # If email is provided in request, look up that specific user
    user = current_user
    if request.email:
        found_user = db.query(User).filter(User.email == request.email).first()
        if found_user:
            user = found_user
        else:
            # If user not found by email, create one (similar to preferences logic)
            from app.routes.preferences import get_or_create_user
            user = get_or_create_user(db, request.email)

    service = SchedulingAgentService(db, user)

    try:
        result = await service.generate_schedule(
            week_start_date=request.weekStartDate,
            include_goals=request.includeGoals,
            force_regenerate=request.forceRegenerate,
            modification_request=request.modificationRequest,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate schedule: {str(e)}",
        )


@router.post("/rebalance", response_model=GenerateScheduleResponse)
async def rebalance_schedule(
    request: RebalanceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Rebalance the schedule based on task feedback and calendar changes.

    This endpoint:
    - Accepts feedback on task completion and duration
    - Detects calendar changes since last generation
    - Re-optimizes the schedule based on new constraints
    """
    service = SchedulingAgentService(db, current_user)

    try:
        result = await service.rebalance_schedule(
            tasks_feedback=request.tasksFeedback,
            calendar_changes=request.calendarChanges,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rebalance schedule: {str(e)}",
        )


@router.post("/feedback")
async def submit_feedback(
    request: TaskFeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit task completion feedback for learning.

    This helps the AI improve future scheduling by learning:
    - How long tasks actually take vs. estimates
    - Which tasks are completed vs. skipped
    - User's productivity patterns
    """
    service = SchedulingAgentService(db, current_user)

    try:
        await service.submit_feedback(feedback=request.feedback)
        return {"message": "Feedback submitted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit feedback: {str(e)}",
        )


@router.get("/status", response_model=ScheduleStatusResponse)
async def get_schedule_status(
    week_start_date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the current schedule status for a specific week.

    Returns:
    - Whether a schedule has been generated for this week
    - When it was last generated
    - Completion rate of scheduled tasks
    """
    service = SchedulingAgentService(db, current_user)

    try:
        status_info = await service.get_schedule_status(
            week_start_date=week_start_date,
        )
        return status_info
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get schedule status: {str(e)}",
        )


@router.post("/workouts/schedule", response_model=WorkoutScheduleResponse)
async def schedule_workouts(
    request: WorkoutScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Schedule workouts only (not the full schedule).

    This endpoint:
    - Checks which workouts are already on the calendar
    - Only schedules workouts that are not yet scheduled
    - Optionally reschedules existing workouts if forceReschedule is True
    - Respects workout preferences (preferred days, times, etc.)
    """
    service = WorkoutSchedulerService(db, current_user)

    try:
        result = await service.schedule_workouts(
            week_start_date=request.weekStartDate,
            force_reschedule=request.forceReschedule,
            modification_request=request.modificationRequest,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule workouts: {str(e)}",
        )


@router.post("/podcasts/schedule", response_model=PodcastScheduleResponse)
async def schedule_podcast(
    request: PodcastScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Schedule podcast listening sessions for the week.

    This endpoint:
    - Fetches episodes from the specified podcast
    - Checks which episodes are already on the calendar
    - Uses AI to find optimal listening times
    - Optionally schedules a specific episode if selectedEpisodeId is provided
    """
    service = PodcastSchedulerService(db, current_user)

    try:
        result = await service.schedule_podcast(request)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule podcast: {str(e)}",
        )
