"""AI Todo Scheduling Service using Claude API.

This service handles intelligent todo scheduling for a specific day by:
1. Fetching user preferences (sleep time, wake time, important events)
2. Analyzing calendar events for the target day
3. Finding available time slots
4. Scheduling todos based on priority, respecting constraints
5. Warning if todos can't be scheduled and prompting for re-ranking
"""

import os
import json
import logging
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any, Tuple

from sqlalchemy.orm import Session
from anthropic import Anthropic

from app.models.user import User
from app.models.user_preference import UserPreference
from app.models.list_item import ListItem, ListItemType
from app.schemas.schedule import (
    TodoScheduleRequest,
    TodoScheduleResponse,
    TodoItem,
    ScheduledTodo,
    UnscheduledTodo,
    ScheduleWarning,
)
from app.services.calendar_service import CalendarService

logger = logging.getLogger(__name__)


class TodoSchedulerService:
    """Service for AI-powered todo scheduling."""

    # Google Calendar color for todos (5 = Banana/Yellow)
    TODO_COLOR_ID = "5"

    def __init__(self, db: Session, user: User):
        """
        Initialize the todo scheduler.

        Args:
            db: Database session
            user: Current authenticated user
        """
        self.db = db
        self.user = user
        self.anthropic_client = self._init_anthropic_client()

    def _init_anthropic_client(self) -> Optional[Anthropic]:
        """Initialize the Anthropic client for Claude API."""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            logger.warning("ANTHROPIC_API_KEY not set.")
            return None
        return Anthropic(api_key=api_key)

    def _get_user_preferences(self) -> Optional[UserPreference]:
        """Fetch user preferences from database."""
        return self.db.query(UserPreference).filter_by(user_id=self.user.id).first()

    def _get_user_timezone(self) -> str:
        """Fetch user's timezone from Google Calendar."""
        if not self.user.google_tokens:
            return "UTC"
        try:
            return CalendarService(self.user.google_tokens).get_calendar_timezone()
        except Exception:
            return "UTC"

    def _get_calendar_events(self, target_date: date) -> List[Dict[str, Any]]:
        """Fetch calendar events for the target day."""
        try:
            if not self.user.google_tokens:
                logger.info("User has no Google Calendar connected")
                return []

            calendar_service = CalendarService(self.user.google_tokens)

            # Get events for the entire day
            day_start = datetime.combine(target_date, datetime.min.time())
            day_end = datetime.combine(target_date + timedelta(days=1), datetime.min.time())

            events = calendar_service.get_events(
                time_min=day_start,
                time_max=day_end,
            )
            return events
        except Exception as e:
            logger.error(f"Failed to fetch calendar events: {e}")
            return []

    def _parse_time_string(self, time_str: str, target_date: date) -> Optional[datetime]:
        """Parse a time string like '07:00' or '7:00 AM' into datetime."""
        if not time_str:
            return None

        try:
            # Try HH:MM format first
            if ':' in time_str:
                parts = time_str.replace(' ', '').upper()
                is_pm = 'PM' in parts
                is_am = 'AM' in parts
                time_part = parts.replace('AM', '').replace('PM', '')

                hour, minute = map(int, time_part.split(':'))

                if is_pm and hour != 12:
                    hour += 12
                elif is_am and hour == 12:
                    hour = 0

                return datetime.combine(target_date, datetime.min.time().replace(hour=hour, minute=minute))
        except Exception as e:
            logger.error(f"Failed to parse time string '{time_str}': {e}")

        return None

    def _calculate_available_slots(
        self,
        target_date: date,
        calendar_events: List[Dict[str, Any]],
        wake_time: Optional[datetime],
        bed_time: Optional[datetime],
    ) -> Tuple[List[Dict[str, datetime]], int]:
        """
        Calculate available time slots for the target day.

        Returns:
            Tuple of (list of available slots, total available minutes)
        """
        # Default working hours if preferences not set
        if not wake_time:
            wake_time = datetime.combine(target_date, datetime.min.time().replace(hour=8, minute=0))
        if not bed_time:
            bed_time = datetime.combine(target_date, datetime.min.time().replace(hour=22, minute=0))

        # Ensure bed_time is after wake_time
        if bed_time <= wake_time:
            bed_time = datetime.combine(target_date, datetime.min.time().replace(hour=23, minute=0))

        # Build list of busy periods from calendar events
        busy_periods = []
        for event in calendar_events:
            start = event.get("start", {}).get("dateTime", event.get("start", {}).get("date"))
            end = event.get("end", {}).get("dateTime", event.get("end", {}).get("date"))

            if not start or not end:
                continue

            try:
                # Parse datetime strings
                if 'T' in start:
                    start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                    end_dt = datetime.fromisoformat(end.replace('Z', '+00:00'))

                    # Remove timezone info for comparison
                    if start_dt.tzinfo:
                        start_dt = start_dt.replace(tzinfo=None)
                    if end_dt.tzinfo:
                        end_dt = end_dt.replace(tzinfo=None)

                    busy_periods.append({
                        'start': start_dt,
                        'end': end_dt,
                        'title': event.get('summary', 'Busy'),
                        'color_id': event.get('colorId', '')
                    })
            except Exception as e:
                logger.warning(f"Failed to parse event time: {e}")
                continue

        # Sort busy periods by start time
        busy_periods.sort(key=lambda x: x['start'])

        # Calculate available slots
        available_slots = []
        current_time = wake_time

        for busy in busy_periods:
            # Skip events outside our scheduling window
            if busy['end'] <= wake_time or busy['start'] >= bed_time:
                continue

            # Clamp busy period to scheduling window
            busy_start = max(busy['start'], wake_time)
            busy_end = min(busy['end'], bed_time)

            # If there's a gap before this busy period, it's available
            if current_time < busy_start:
                # Add 10-minute buffer
                slot_end = busy_start - timedelta(minutes=10)
                if slot_end > current_time:
                    available_slots.append({
                        'start': current_time,
                        'end': slot_end
                    })

            # Move current time past this busy period (with buffer)
            current_time = max(current_time, busy_end + timedelta(minutes=10))

        # Add final slot if there's time left
        if current_time < bed_time:
            available_slots.append({
                'start': current_time,
                'end': bed_time
            })

        # Calculate total available minutes
        total_minutes = sum(
            int((slot['end'] - slot['start']).total_seconds() / 60)
            for slot in available_slots
        )

        return available_slots, total_minutes

    def _build_scheduling_prompt(
        self,
        todos: List[TodoItem],
        available_slots: List[Dict[str, datetime]],
        calendar_events: List[Dict[str, Any]],
        target_date: date,
        timezone: str,
        preferences: Optional[UserPreference],
    ) -> str:
        """Build the prompt for Claude to schedule todos."""

        # Format todos
        todos_text = "TODOS TO SCHEDULE (in priority order - 1 is highest priority):\n"
        total_requested = 0
        for todo in sorted(todos, key=lambda x: x.priority):
            duration = todo.estimated_duration_minutes or 30
            total_requested += duration
            todos_text += f"- ID: {todo.id}, Priority: {todo.priority}, Duration: {duration}min, Text: \"{todo.text}\"\n"

        # Format available slots
        slots_text = "AVAILABLE TIME SLOTS:\n"
        total_available = 0
        for slot in available_slots:
            duration = int((slot['end'] - slot['start']).total_seconds() / 60)
            total_available += duration
            slots_text += f"- {slot['start'].strftime('%H:%M')} to {slot['end'].strftime('%H:%M')} ({duration} minutes)\n"

        # Format existing events
        events_text = "EXISTING CALENDAR EVENTS (BLOCKED - DO NOT OVERLAP):\n"
        for event in calendar_events:
            start = event.get("start", {}).get("dateTime", event.get("start", {}).get("date", ""))
            end = event.get("end", {}).get("dateTime", event.get("end", {}).get("date", ""))
            color_id = event.get("colorId", "")
            priority_note = ""
            if color_id == "11":
                priority_note = " [HIGH PRIORITY - RED - ABSOLUTELY BLOCKED]"
            elif color_id == "4":
                priority_note = " [IMPORTANT - PINK]"
            elif color_id == "6":
                priority_note = " [IMPORTANT - ORANGE]"
            events_text += f"- {event.get('summary', 'Untitled')}{priority_note}: {start} to {end}\n"

        # Build prompt
        prompt = f"""You are an AI scheduling assistant. Your task is to schedule todo items into available time slots for {target_date.strftime('%A, %B %d, %Y')}.

Timezone: {timezone}

{todos_text}

{slots_text}

{events_text}

TOTAL TIME NEEDED: {total_requested} minutes
TOTAL TIME AVAILABLE: {total_available} minutes

CRITICAL RULES:
1. Schedule todos in PRIORITY ORDER (priority 1 first, then 2, etc.)
2. NEVER schedule during existing calendar events
3. NEVER schedule outside the available slots
4. If a todo doesn't fit in any slot, mark it as "unscheduled" with a reason
5. Leave at least 5-minute buffer between scheduled items
6. Consider energy levels: schedule important tasks during morning/peak hours if possible
7. If total requested time > available time, you CANNOT schedule all todos - mark lower priority ones as unscheduled

Respond with a JSON object in this EXACT format:
{{
    "scheduled_todos": [
        {{
            "todo_id": "the-todo-id",
            "text": "the todo text",
            "start_time": "{target_date.isoformat()}T09:00:00",
            "end_time": "{target_date.isoformat()}T09:30:00",
            "priority": 1
        }}
    ],
    "unscheduled_todos": [
        {{
            "todo_id": "the-todo-id",
            "text": "the todo text",
            "priority": 5,
            "reason": "Not enough time available - higher priority items filled all slots",
            "suggested_alternative": "Try scheduling for tomorrow or reduce duration"
        }}
    ],
    "reasoning": "Explanation of scheduling decisions",
    "warnings": [
        {{
            "message": "Warning message here",
            "severity": "warning"
        }}
    ]
}}

IMPORTANT:
- If you cannot schedule ALL selected todos, set "requires_reranking" in reasoning to suggest user should reprioritize
- Always schedule in priority order - never skip a high-priority item to fit a lower-priority one
- Times must be in ISO format: {target_date.isoformat()}THH:MM:SS
"""
        return prompt

    async def schedule_todos(
        self,
        request: TodoScheduleRequest,
    ) -> TodoScheduleResponse:
        """
        Schedule todo items for a specific day using AI.

        Args:
            request: Todo scheduling request with todos and target date

        Returns:
            TodoScheduleResponse with scheduled and unscheduled todos
        """
        logger.info(f"Scheduling {len(request.todos)} todos for user {self.user.id} on {request.targetDate}")

        # Get user preferences
        preferences = self._get_user_preferences()
        timezone = self._get_user_timezone()

        # Get calendar events for the target day
        calendar_events = self._get_calendar_events(request.targetDate)
        logger.info(f"Found {len(calendar_events)} calendar events for {request.targetDate}")

        # Parse wake and bed times
        wake_time = None
        bed_time = None
        if preferences:
            wake_time = self._parse_time_string(preferences.wake_time, request.targetDate)
            bed_time = self._parse_time_string(preferences.bed_time, request.targetDate)

        # Calculate available slots
        available_slots, total_available = self._calculate_available_slots(
            request.targetDate,
            calendar_events,
            wake_time,
            bed_time,
        )
        logger.info(f"Found {len(available_slots)} available slots, {total_available} total minutes")

        # Calculate total requested time
        total_requested = sum(
            (todo.estimated_duration_minutes or 30) for todo in request.todos
        )

        # If no AI client or no todos, return early
        if not request.todos:
            return TodoScheduleResponse(
                success=True,
                targetDate=request.targetDate,
                scheduledTodos=[],
                unscheduledTodos=[],
                scheduledCount=0,
                unscheduledCount=0,
                totalAvailableMinutes=total_available,
                totalRequestedMinutes=0,
                requiresReranking=False,
                reasoning="No todos to schedule",
                warnings=[],
                generatedAt=datetime.utcnow(),
            )

        # Generate schedule with AI
        schedule_data = None
        if self.anthropic_client:
            schedule_data = await self._generate_with_claude(
                request.todos,
                available_slots,
                calendar_events,
                request.targetDate,
                timezone,
                preferences,
            )

        # Fallback to simple scheduling if AI fails
        if not schedule_data:
            logger.warning("AI scheduling failed, using fallback")
            schedule_data = self._generate_fallback_schedule(
                request.todos,
                available_slots,
                request.targetDate,
            )

        # Create calendar events for scheduled todos
        scheduled_todos = []
        for todo_data in schedule_data.get("scheduled_todos", []):
            calendar_event_id = None

            # Create Google Calendar event
            if self.user.google_tokens:
                try:
                    calendar_service = CalendarService(self.user.google_tokens)

                    start_time = datetime.fromisoformat(todo_data["start_time"])
                    end_time = datetime.fromisoformat(todo_data["end_time"])

                    event = calendar_service.create_event(
                        summary=todo_data["text"],
                        start_time=start_time,
                        end_time=end_time,
                        description=f"Todo item scheduled by Guru AI",
                        color_id=self.TODO_COLOR_ID,
                    )
                    calendar_event_id = event.get("id")
                    logger.info(f"Created calendar event {calendar_event_id} for todo {todo_data['todo_id']}")

                    # Update the list item with calendar event ID
                    list_item = self.db.query(ListItem).filter_by(id=todo_data["todo_id"]).first()
                    if list_item:
                        list_item.calendar_event_id = calendar_event_id
                        self.db.commit()

                except Exception as e:
                    logger.error(f"Failed to create calendar event for todo: {e}")

            scheduled_todos.append(ScheduledTodo(
                todo_id=todo_data["todo_id"],
                text=todo_data["text"],
                start_time=todo_data["start_time"],
                end_time=todo_data["end_time"],
                calendar_event_id=calendar_event_id,
                priority=todo_data["priority"],
                scheduled_successfully=calendar_event_id is not None,
            ))

        # Build unscheduled todos list
        unscheduled_todos = [
            UnscheduledTodo(
                todo_id=todo_data["todo_id"],
                text=todo_data["text"],
                priority=todo_data["priority"],
                reason=todo_data.get("reason", "Could not fit in available time"),
                suggested_alternative=todo_data.get("suggested_alternative"),
            )
            for todo_data in schedule_data.get("unscheduled_todos", [])
        ]

        # Build warnings
        warnings = [
            ScheduleWarning(
                message=w.get("message", ""),
                severity=w.get("severity", "info"),
            )
            for w in schedule_data.get("warnings", [])
        ]

        # Add warning if not all todos could be scheduled
        requires_reranking = len(unscheduled_todos) > 0
        if requires_reranking:
            warnings.append(ScheduleWarning(
                message=f"{len(unscheduled_todos)} todo(s) could not be scheduled. Please review priorities and try again.",
                severity="warning",
            ))

        return TodoScheduleResponse(
            success=True,
            targetDate=request.targetDate,
            scheduledTodos=scheduled_todos,
            unscheduledTodos=unscheduled_todos,
            scheduledCount=len(scheduled_todos),
            unscheduledCount=len(unscheduled_todos),
            totalAvailableMinutes=total_available,
            totalRequestedMinutes=total_requested,
            requiresReranking=requires_reranking,
            reasoning=schedule_data.get("reasoning", ""),
            warnings=warnings,
            generatedAt=datetime.utcnow(),
        )

    async def _generate_with_claude(
        self,
        todos: List[TodoItem],
        available_slots: List[Dict[str, datetime]],
        calendar_events: List[Dict[str, Any]],
        target_date: date,
        timezone: str,
        preferences: Optional[UserPreference],
    ) -> Optional[Dict[str, Any]]:
        """Generate schedule using Claude API."""
        prompt = self._build_scheduling_prompt(
            todos, available_slots, calendar_events, target_date, timezone, preferences
        )

        try:
            logger.info("Sending request to Claude API for todo scheduling...")
            message = self.anthropic_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2048,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            )

            # Extract response text
            response_text = message.content[0].text
            logger.info(f"Claude response: {response_text[:500]}...")

            # Parse JSON from response
            # Try to find JSON in the response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                return json.loads(json_str)
            else:
                logger.error("No JSON found in Claude response")
                return None

        except Exception as e:
            logger.error(f"Error generating schedule with Claude: {e}")
            return None

    def _generate_fallback_schedule(
        self,
        todos: List[TodoItem],
        available_slots: List[Dict[str, datetime]],
        target_date: date,
    ) -> Dict[str, Any]:
        """Generate a simple fallback schedule without AI."""
        scheduled = []
        unscheduled = []

        # Sort todos by priority
        sorted_todos = sorted(todos, key=lambda x: x.priority)

        # Track current position in each slot
        slot_index = 0
        current_time = available_slots[0]['start'] if available_slots else None

        for todo in sorted_todos:
            duration = todo.estimated_duration_minutes or 30
            scheduled_this = False

            while slot_index < len(available_slots) and not scheduled_this:
                slot = available_slots[slot_index]

                # Calculate available time in current slot
                if current_time < slot['start']:
                    current_time = slot['start']

                available_in_slot = int((slot['end'] - current_time).total_seconds() / 60)

                if available_in_slot >= duration:
                    # Schedule this todo
                    end_time = current_time + timedelta(minutes=duration)
                    scheduled.append({
                        "todo_id": todo.id,
                        "text": todo.text,
                        "start_time": current_time.isoformat(),
                        "end_time": end_time.isoformat(),
                        "priority": todo.priority,
                    })
                    current_time = end_time + timedelta(minutes=5)  # 5 min buffer
                    scheduled_this = True
                else:
                    # Move to next slot
                    slot_index += 1
                    if slot_index < len(available_slots):
                        current_time = available_slots[slot_index]['start']

            if not scheduled_this:
                unscheduled.append({
                    "todo_id": todo.id,
                    "text": todo.text,
                    "priority": todo.priority,
                    "reason": "Not enough time available in any slot",
                    "suggested_alternative": "Try scheduling for tomorrow or reduce duration",
                })

        return {
            "scheduled_todos": scheduled,
            "unscheduled_todos": unscheduled,
            "reasoning": "Scheduled todos in priority order using available time slots (fallback algorithm)",
            "warnings": [] if not unscheduled else [
                {"message": f"{len(unscheduled)} todo(s) could not be scheduled", "severity": "warning"}
            ],
        }
