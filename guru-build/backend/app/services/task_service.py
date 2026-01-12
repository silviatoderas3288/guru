"""Task scheduling service."""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.time_block import TimeBlock
from app.services.calendar_service import CalendarService
import logging

logger = logging.getLogger(__name__)


class TaskSchedulingService:
    """Service for intelligent task scheduling."""

    def __init__(self, db: Session, calendar_service: CalendarService):
        """
        Initialize task scheduling service.

        Args:
            db: Database session
            calendar_service: Calendar service instance
        """
        self.db = db
        self.calendar = calendar_service

    def schedule_tasks(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Task]:
        """
        Automatically schedule pending tasks to available calendar slots.

        Algorithm:
        1. Fetch pending tasks sorted by priority (high→low) and due date (earliest first)
        2. Get available time slots from calendar
        3. Filter out protected time blocks (sleep, unwind, etc.)
        4. Use greedy algorithm to fit tasks into slots
        5. Create calendar events for scheduled tasks
        6. If task doesn't fit, cascade to next day

        Args:
            user_id: User ID
            start_date: Start of scheduling period (defaults to now)
            end_date: End of scheduling period (defaults to 7 days)

        Returns:
            List of scheduled tasks
        """
        try:
            if not start_date:
                start_date = datetime.utcnow()
            if not end_date:
                end_date = start_date + timedelta(days=7)

            # 1. Fetch pending tasks sorted by priority and due date
            tasks = self.db.query(Task).filter(
                Task.user_id == user_id,
                Task.status == 'pending'
            ).order_by(
                Task.priority.asc(),  # Lower number = higher priority
                Task.due_date.asc()
            ).all()

            if not tasks:
                logger.info("No pending tasks to schedule")
                return []

            # 2. Get protected time blocks
            protected_blocks = self.db.query(TimeBlock).filter(
                TimeBlock.user_id == user_id,
                TimeBlock.is_protected == True
            ).all()

            # 3. Get available slots from calendar
            available_slots = self.calendar.get_available_slots(
                start_date=start_date,
                end_date=end_date
            )

            # 4. Filter out protected time blocks
            filtered_slots = self._filter_protected_slots(available_slots, protected_blocks)

            # 5. Schedule tasks to slots
            scheduled_tasks = []
            for task in tasks:
                slot = self._find_best_slot(task, filtered_slots)

                if slot:
                    # Create calendar event
                    event = self.calendar.create_event(
                        summary=task.title,
                        start_time=slot['start'],
                        end_time=slot['end'],
                        description=task.description
                    )

                    # Update task
                    task.status = 'scheduled'
                    task.calendar_event_id = event['id']
                    self.db.commit()

                    scheduled_tasks.append(task)

                    # Remove used slot
                    filtered_slots.remove(slot)
                    logger.info(f"Scheduled task '{task.title}' at {slot['start']}")
                else:
                    logger.warning(f"No available slot for task '{task.title}'")

            return scheduled_tasks

        except Exception as error:
            logger.error(f"Error scheduling tasks: {error}")
            self.db.rollback()
            raise

    def _filter_protected_slots(
        self,
        slots: List[Dict[str, datetime]],
        protected_blocks: List[TimeBlock]
    ) -> List[Dict[str, datetime]]:
        """
        Filter out slots that overlap with protected time blocks.

        Args:
            slots: Available time slots
            protected_blocks: Protected time blocks

        Returns:
            Filtered list of available slots
        """
        filtered = []

        for slot in slots:
            is_available = True

            for block in protected_blocks:
                # Check if slot overlaps with protected block
                slot_start_time = slot['start'].time()
                slot_end_time = slot['end'].time()

                if (slot_start_time < block.end_time and slot_end_time > block.start_time):
                    is_available = False
                    break

            if is_available:
                filtered.append(slot)

        return filtered

    def _find_best_slot(
        self,
        task: Task,
        available_slots: List[Dict[str, datetime]]
    ) -> Optional[Dict[str, datetime]]:
        """
        Find the best available slot for a task.

        Strategy:
        - Prefer slots closest to current time
        - Prefer slots before due date
        - Ensure slot duration >= task duration

        Args:
            task: Task to schedule
            available_slots: List of available time slots

        Returns:
            Best matching slot or None
        """
        task_duration = timedelta(minutes=task.duration_minutes)

        for slot in available_slots:
            slot_duration = slot['end'] - slot['start']

            # Check if slot is large enough
            if slot_duration >= task_duration:
                # If task has a due date, prefer slots before it
                if task.due_date and slot['start'].date() > task.due_date:
                    continue

                # Return slot adjusted to task duration
                return {
                    'start': slot['start'],
                    'end': slot['start'] + task_duration
                }

        return None

    def cascade_incomplete_tasks(self, user_id: str) -> List[Task]:
        """
        Move incomplete tasks from past days to today or next available day.

        Args:
            user_id: User ID

        Returns:
            List of cascaded tasks
        """
        try:
            today = datetime.utcnow().date()

            # Find tasks that were scheduled but not completed
            incomplete_tasks = self.db.query(Task).filter(
                Task.user_id == user_id,
                Task.status.in_(['scheduled', 'pending']),
                Task.due_date < today
            ).all()

            for task in incomplete_tasks:
                # Delete old calendar event if exists
                if task.calendar_event_id:
                    try:
                        self.calendar.delete_event(task.calendar_event_id)
                    except Exception as e:
                        logger.warning(f"Could not delete old event: {e}")

                # Reset task status
                task.status = 'pending'
                task.calendar_event_id = None

            self.db.commit()

            logger.info(f"Cascaded {len(incomplete_tasks)} incomplete tasks")
            return incomplete_tasks

        except Exception as error:
            logger.error(f"Error cascading tasks: {error}")
            self.db.rollback()
            raise
