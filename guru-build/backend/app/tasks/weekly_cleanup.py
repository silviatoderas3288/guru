"""Weekly cleanup and auto-rescheduling task."""

import logging
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session

from app.celery_config import celery_app
from app.database import SessionLocal
from app.models.user import User
from app.models.list_item import ListItem, ItemType
from app.services.calendar_service import CalendarService
from app.services.todo_scheduler_service import TodoSchedulerService

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.weekly_cleanup.cleanup_and_reschedule_tasks")
def cleanup_and_reschedule_tasks():
    """
    Weekly task that runs every Sunday at midnight to:
    1. Delete completed tasks/goals from Google Calendar
    2. Auto-reschedule uncompleted tasks for the next week

    This task processes all users in the system.
    """
    db = SessionLocal()
    try:
        logger.info("Starting weekly cleanup and reschedule task")

        # Get all users
        users = db.query(User).all()
        logger.info(f"Processing {len(users)} users")

        for user in users:
            try:
                process_user_weekly_cleanup(db, user)
            except Exception as e:
                logger.error(f"Error processing user {user.id}: {e}", exc_info=True)
                # Continue with next user even if one fails
                continue

        logger.info("Weekly cleanup and reschedule task completed")

    except Exception as e:
        logger.error(f"Error in weekly cleanup task: {e}", exc_info=True)
    finally:
        db.close()


def process_user_weekly_cleanup(db: Session, user: User):
    """
    Process weekly cleanup for a single user.

    Args:
        db: Database session
        user: User to process
    """
    logger.info(f"Processing cleanup for user: {user.email}")

    # Initialize services
    calendar_service = CalendarService(db, user)

    # Calculate date range for the past week
    today = datetime.now().date()
    week_start = today - timedelta(days=today.weekday() + 1)  # Last Sunday
    week_end = week_start + timedelta(days=6)  # Last Saturday

    # Step 1: Get all list items (weekly goals and todos) from the past week
    past_week_items = db.query(ListItem).filter(
        ListItem.user_id == user.id,
        ListItem.item_type.in_([ItemType.WEEKLY_GOAL, ItemType.TODO])
    ).all()

    completed_items = []
    uncompleted_items = []

    for item in past_week_items:
        if item.completed:
            completed_items.append(item)
        else:
            uncompleted_items.append(item)

    logger.info(
        f"User {user.email}: {len(completed_items)} completed items, "
        f"{len(uncompleted_items)} uncompleted items"
    )

    # Step 2: Delete completed items from Google Calendar
    deleted_count = delete_completed_from_calendar(
        calendar_service, completed_items, db
    )
    logger.info(f"Deleted {deleted_count} calendar events for completed items")

    # Step 3: Auto-reschedule uncompleted items for next week
    if uncompleted_items:
        reschedule_uncompleted_items(db, user, uncompleted_items, calendar_service)
        logger.info(f"Rescheduled {len(uncompleted_items)} uncompleted items")

    logger.info(f"Cleanup complete for user: {user.email}")


def delete_completed_from_calendar(
    calendar_service: CalendarService,
    completed_items: List[ListItem],
    db: Session
) -> int:
    """
    Delete calendar events for completed tasks/goals.

    Args:
        calendar_service: Calendar service instance
        completed_items: List of completed items
        db: Database session

    Returns:
        Number of events deleted
    """
    deleted_count = 0

    for item in completed_items:
        if item.calendar_event_id:
            try:
                # Delete from Google Calendar
                calendar_service.delete_event(item.calendar_event_id)

                # Remove the calendar event ID from the database
                item.calendar_event_id = None
                db.commit()

                deleted_count += 1
                logger.debug(f"Deleted calendar event for item: {item.text}")

            except Exception as e:
                logger.error(
                    f"Failed to delete calendar event {item.calendar_event_id} "
                    f"for item {item.id}: {e}"
                )
                # Continue with next item
                continue

    return deleted_count


def reschedule_uncompleted_items(
    db: Session,
    user: User,
    uncompleted_items: List[ListItem],
    calendar_service: CalendarService
):
    """
    Auto-reschedule uncompleted items for the next week using AI scheduling.

    Args:
        db: Database session
        user: User instance
        uncompleted_items: List of uncompleted items
        calendar_service: Calendar service instance
    """
    # First, delete any existing calendar events for these items
    # (they were scheduled for last week, we'll create new ones for next week)
    for item in uncompleted_items:
        if item.calendar_event_id:
            try:
                calendar_service.delete_event(item.calendar_event_id)
                item.calendar_event_id = None
            except Exception as e:
                logger.warning(
                    f"Could not delete old calendar event {item.calendar_event_id}: {e}"
                )

    db.commit()

    # Calculate next week's date range
    today = datetime.now().date()
    next_week_start = today + timedelta(days=(7 - today.weekday()))  # Next Monday

    # Use the AI scheduler to reschedule these items
    # We'll schedule them starting from next Monday
    todo_scheduler = TodoSchedulerService(db, user)

    # Schedule for each day of next week (Monday-Friday)
    for day_offset in range(5):  # Monday to Friday
        target_date = next_week_start + timedelta(days=day_offset)

        try:
            # Get todos for this specific day (or use all uncompleted for flexibility)
            result = todo_scheduler.schedule_todos_for_date(
                target_date=target_date,
                todo_ids=[item.id for item in uncompleted_items if item.item_type == ItemType.TODO]
            )

            logger.info(
                f"Scheduled {len(result.get('scheduled_todos', []))} todos for {target_date}"
            )

        except Exception as e:
            logger.error(f"Failed to reschedule for {target_date}: {e}")
            continue

    # For weekly goals, just carry them over without specific scheduling
    # (they represent general goals, not specific calendar events)
    for item in uncompleted_items:
        if item.item_type == ItemType.WEEKLY_GOAL:
            logger.info(f"Carried over weekly goal: {item.text}")
            # Weekly goals remain in the database, just without calendar events
            # User can manually schedule or let the agent schedule them
