"""Workout Scheduling Agent Service.

This service handles intelligent workout scheduling by:
1. Checking which workouts are already scheduled on the calendar
2. Using AI to optimally schedule unscheduled workouts
3. Optionally rescheduling existing workouts based on preferences
"""

import os
import json
import logging
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID

from sqlalchemy.orm import Session, joinedload
from anthropic import Anthropic
from openai import OpenAI

from app.models.user import User
from app.models.user_preference import UserPreference
from app.models.workout import Workout
from app.models.workout_section import WorkoutSection
from app.schemas.schedule import (
    WorkoutScheduleRequest,
    WorkoutScheduleResponse,
    ScheduledWorkout,
    ScheduleWarning,
)
from app.services.calendar_service import CalendarService

logger = logging.getLogger(__name__)


class WorkoutSchedulerService:
    """Service for AI-powered workout scheduling."""

    def __init__(self, db: Session, user: User):
        """Initialize the workout scheduler."""
        self.db = db
        self.user = user
        self.anthropic_client = self._init_anthropic_client()
        self.openai_client = self._init_openai_client()

    def _init_anthropic_client(self) -> Optional[Anthropic]:
        """Initialize the Anthropic client for Claude API."""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            logger.warning("ANTHROPIC_API_KEY not set.")
            return None
        return Anthropic(api_key=api_key)

    def _init_openai_client(self) -> Optional[OpenAI]:
        """Initialize the OpenAI client."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY not set.")
            return None
        return OpenAI(api_key=api_key)

    def _get_user_preferences(self) -> Optional[UserPreference]:
        """Fetch user preferences from database."""
        return self.db.query(UserPreference).filter_by(user_id=self.user.id).first()

    def _get_user_workouts(self) -> List[Workout]:
        """Fetch user's incomplete workouts with sections and exercises."""
        return (
            self.db.query(Workout)
            .filter_by(user_id=self.user.id)
            .filter(Workout.completed == False)
            .options(
                joinedload(Workout.sections).joinedload(WorkoutSection.exercises)
            )
            .order_by(Workout.updated_at.desc())
            .all()
        )

    def _get_user_timezone(self) -> str:
        """Fetch user's timezone from Google Calendar."""
        if not self.user.google_tokens:
            return "UTC"
        try:
            return CalendarService(self.user.google_tokens).get_calendar_timezone()
        except Exception:
            return "UTC"

    def _get_calendar_events(self, week_start: date) -> List[Dict[str, Any]]:
        """Fetch calendar events for the week."""
        try:
            if not self.user.google_tokens:
                logger.info("User has no Google Calendar connected")
                return []

            calendar_service = CalendarService(self.user.google_tokens)
            week_end = week_start + timedelta(days=7)

            events = calendar_service.get_events(
                time_min=datetime.combine(week_start, datetime.min.time()),
                time_max=datetime.combine(week_end, datetime.min.time()),
            )
            return events
        except Exception as e:
            logger.error(f"Failed to fetch calendar events: {e}")
            return []

    def _find_existing_workout_events(
        self, workouts: List[Workout], calendar_events: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Find which workouts are already scheduled on the calendar.
        Returns a dict mapping workout_id to calendar event info.
        """
        workout_events = {}
        workout_titles = {str(w.id): w.title.lower() for w in workouts}

        for event in calendar_events:
            event_summary = event.get("summary", "").lower()
            for workout_id, workout_title in workout_titles.items():
                # Check if the event title matches or contains the workout title
                if workout_title in event_summary or event_summary in workout_title:
                    workout_events[workout_id] = {
                        "event_id": event.get("id"),
                        "summary": event.get("summary"),
                        "start": event.get("start", {}).get("dateTime"),
                        "end": event.get("end", {}).get("dateTime"),
                    }
                    break

        return workout_events

    def _build_workout_scheduling_prompt(
        self,
        preferences: Optional[UserPreference],
        workouts: List[Workout],
        existing_workout_events: Dict[str, Dict[str, Any]],
        calendar_events: List[Dict[str, Any]],
        week_start: date,
        timezone: str,
        force_reschedule: bool,
        modification_request: Optional[str] = None,
    ) -> str:
        """Build the prompt for AI to schedule workouts."""

        # Format preferences
        pref_text = "No workout preferences set."
        if preferences:
            pref_text = f"""
Workout Preferences:
- Timezone: {timezone} (ALL times must be in this timezone)
- Workout types: {preferences.workout_types or 'Not specified'}
- Workout duration: {preferences.workout_duration or 'Not specified'}
- Workout frequency: {preferences.workout_frequency or 'Not specified'} times per week
- Preferred workout days: {preferences.workout_days or 'Not specified'}
- Preferred workout time: {preferences.workout_preferred_time or 'Not specified'}
- Wake time: {preferences.wake_time or 'Not specified'}
- Bed time: {preferences.bed_time or 'Not specified'}
"""

        # Format workouts
        workouts_text = "WORKOUTS TO SCHEDULE:\n"
        for workout in workouts:
            workout_id = str(workout.id)
            existing_event = existing_workout_events.get(workout_id)

            exercises_list = []
            for section in workout.sections:
                for exercise in section.exercises:
                    if exercise.sets and exercise.reps:
                        exercises_list.append(f"  - {exercise.name}: {exercise.sets} sets × {exercise.reps} reps")
                    elif exercise.duration:
                        exercises_list.append(f"  - {exercise.name}: {exercise.duration}")
                    else:
                        exercises_list.append(f"  - {exercise.name}")

            exercises_str = "\n".join(exercises_list) if exercises_list else "  No exercises defined"

            status = "NOT SCHEDULED"
            if existing_event:
                if force_reschedule:
                    status = f"CURRENTLY SCHEDULED at {existing_event['start']} - CAN BE RESCHEDULED"
                else:
                    status = f"ALREADY SCHEDULED at {existing_event['start']} - KEEP AS IS"

            workouts_text += f"""
---
WORKOUT_ID: {workout_id}
TITLE: {workout.title}
DESCRIPTION: {workout.description or 'No description'}
STATUS: {status}
EXERCISES:
{exercises_str}
---
"""

        # Format blocked calendar events
        events_text = "BLOCKED TIME SLOTS (existing calendar events):\n"
        for event in calendar_events:
            start = event.get("start", {}).get("dateTime", event.get("start", {}).get("date", "Unknown"))
            end = event.get("end", {}).get("dateTime", event.get("end", {}).get("date", "Unknown"))
            events_text += f"- {event.get('summary', 'Untitled')}: {start} to {end}\n"

        prompt = f"""You are a workout scheduling assistant. Your task is to schedule the user's workouts for the week based on their preferences.

Week starting: {week_start.strftime('%A, %B %d, %Y')}

{pref_text}

{workouts_text}

{events_text}

{f'''USER MODIFICATION REQUEST:
"{modification_request}"
Please incorporate this request into your scheduling decisions.
''' if modification_request else ''}

INSTRUCTIONS:
1. Schedule workouts that are marked "NOT SCHEDULED"
2. {"Reschedule workouts marked 'CAN BE RESCHEDULED' if it would improve the schedule" if force_reschedule else "Keep workouts marked 'ALREADY SCHEDULED' at their current times"}
3. Respect the user's preferred workout days and times
4. Do NOT schedule workouts before wake_time or after bed_time
5. Do NOT schedule workouts during blocked time slots
6. Space out workouts appropriately (allow recovery time between intense workouts)
7. Use the exact workout titles provided - do not modify them

Return your response as a JSON object:
{{
    "scheduled_workouts": [
        {{
            "workout_id": "uuid-here",
            "title": "Leg Day",
            "day": "Monday",
            "start_time": "2026-01-19T18:00:00",
            "end_time": "2026-01-19T19:00:00",
            "is_rescheduled": false
        }}
    ],
    "reasoning": "Brief explanation of scheduling decisions",
    "warnings": [
        {{
            "message": "Warning message if any",
            "severity": "info"
        }}
    ]
}}

Only include workouts that need to be scheduled or rescheduled. Do not include workouts that are already scheduled and should stay as is."""

        return prompt

    async def schedule_workouts(
        self,
        week_start_date: date,
        force_reschedule: bool = False,
        modification_request: Optional[str] = None,
    ) -> WorkoutScheduleResponse:
        """
        Schedule workouts for the week.

        Args:
            week_start_date: Start date of the week to schedule
            force_reschedule: If True, reschedule even if already on calendar
            modification_request: Natural language request to modify schedule

        Returns:
            WorkoutScheduleResponse with the scheduled workouts
        """
        logger.info(f"Scheduling workouts for user {self.user.id}, week starting {week_start_date}")

        # Gather context
        preferences = self._get_user_preferences()
        workouts = self._get_user_workouts()
        calendar_events = self._get_calendar_events(week_start_date)
        timezone = self._get_user_timezone()

        logger.info(f"Found {len(workouts)} workouts, {len(calendar_events)} calendar events")

        if not workouts:
            return WorkoutScheduleResponse(
                success=True,
                weekStartDate=week_start_date,
                scheduledWorkouts=[],
                alreadyScheduledCount=0,
                newlyScheduledCount=0,
                rescheduledCount=0,
                reasoning="No workouts found to schedule. Create workouts first.",
                warnings=[],
                generatedAt=datetime.utcnow(),
            )

        # Find which workouts are already on the calendar
        existing_workout_events = self._find_existing_workout_events(workouts, calendar_events)
        logger.info(f"Found {len(existing_workout_events)} workouts already scheduled")

        # If all workouts are scheduled and we're not force rescheduling, return early
        if len(existing_workout_events) == len(workouts) and not force_reschedule:
            scheduled = []
            for workout in workouts:
                workout_id = str(workout.id)
                event = existing_workout_events.get(workout_id)
                if event:
                    # Parse the day from the start time
                    start_dt = datetime.fromisoformat(event['start'].replace('Z', '+00:00'))
                    day_name = start_dt.strftime('%A')

                    scheduled.append(ScheduledWorkout(
                        workout_id=workout_id,
                        title=workout.title,
                        description=workout.description,
                        day=day_name,
                        start_time=event['start'],
                        end_time=event['end'],
                        calendar_event_id=event['event_id'],
                        is_rescheduled=False,
                        exercises=[],
                    ))

            return WorkoutScheduleResponse(
                success=True,
                weekStartDate=week_start_date,
                scheduledWorkouts=scheduled,
                alreadyScheduledCount=len(existing_workout_events),
                newlyScheduledCount=0,
                rescheduledCount=0,
                reasoning="All workouts are already scheduled on your calendar.",
                warnings=[],
                generatedAt=datetime.utcnow(),
            )

        # Generate schedule with AI
        schedule_data = None

        if self.anthropic_client:
            schedule_data = await self._generate_with_claude(
                preferences, workouts, existing_workout_events, calendar_events,
                week_start_date, timezone, force_reschedule, modification_request
            )

        if not schedule_data and self.openai_client:
            schedule_data = await self._generate_with_openai(
                preferences, workouts, existing_workout_events, calendar_events,
                week_start_date, timezone, force_reschedule, modification_request
            )

        if not schedule_data:
            schedule_data = self._generate_fallback_schedule(
                preferences, workouts, existing_workout_events, calendar_events,
                week_start_date, timezone
            )

        # Process the result
        scheduled_workouts = []
        newly_scheduled = 0
        rescheduled = 0

        for event_data in schedule_data.get("scheduled_workouts", []):
            workout_id = event_data.get("workout_id")
            is_rescheduled = event_data.get("is_rescheduled", False)

            # Find the workout to get exercises
            workout = next((w for w in workouts if str(w.id) == workout_id), None)
            exercises = []
            if workout:
                for section in workout.sections:
                    for exercise in section.exercises:
                        if exercise.sets and exercise.reps:
                            exercises.append(f"{exercise.name}: {exercise.sets}x{exercise.reps}")
                        elif exercise.duration:
                            exercises.append(f"{exercise.name}: {exercise.duration}")
                        else:
                            exercises.append(exercise.name)

            scheduled_workouts.append(ScheduledWorkout(
                workout_id=workout_id,
                title=event_data.get("title", ""),
                description=workout.description if workout else None,
                day=event_data.get("day", ""),
                start_time=event_data.get("start_time", ""),
                end_time=event_data.get("end_time", ""),
                calendar_event_id=existing_workout_events.get(workout_id, {}).get("event_id"),
                is_rescheduled=is_rescheduled,
                exercises=exercises,
            ))

            if is_rescheduled:
                rescheduled += 1
            else:
                newly_scheduled += 1

        warnings = [
            ScheduleWarning(message=w.get("message", ""), severity=w.get("severity", "info"))
            for w in schedule_data.get("warnings", [])
        ]

        return WorkoutScheduleResponse(
            success=True,
            weekStartDate=week_start_date,
            scheduledWorkouts=scheduled_workouts,
            alreadyScheduledCount=len(existing_workout_events) - rescheduled,
            newlyScheduledCount=newly_scheduled,
            rescheduledCount=rescheduled,
            reasoning=schedule_data.get("reasoning", ""),
            warnings=warnings,
            generatedAt=datetime.utcnow(),
        )

    async def _generate_with_claude(
        self,
        preferences: Optional[UserPreference],
        workouts: List[Workout],
        existing_workout_events: Dict[str, Dict[str, Any]],
        calendar_events: List[Dict[str, Any]],
        week_start: date,
        timezone: str,
        force_reschedule: bool,
        modification_request: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Generate workout schedule using Claude API."""
        prompt = self._build_workout_scheduling_prompt(
            preferences, workouts, existing_workout_events, calendar_events,
            week_start, timezone, force_reschedule, modification_request
        )

        try:
            message = self.anthropic_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2048,
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = message.content[0].text
            json_str = response_text
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0]

            return json.loads(json_str.strip())
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return None

    async def _generate_with_openai(
        self,
        preferences: Optional[UserPreference],
        workouts: List[Workout],
        existing_workout_events: Dict[str, Dict[str, Any]],
        calendar_events: List[Dict[str, Any]],
        week_start: date,
        timezone: str,
        force_reschedule: bool,
        modification_request: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Generate workout schedule using OpenAI API."""
        prompt = self._build_workout_scheduling_prompt(
            preferences, workouts, existing_workout_events, calendar_events,
            week_start, timezone, force_reschedule, modification_request
        )

        try:
            completion = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a workout scheduling assistant that outputs JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
            )

            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return None

    def _generate_fallback_schedule(
        self,
        preferences: Optional[UserPreference],
        workouts: List[Workout],
        existing_workout_events: Dict[str, Dict[str, Any]],
        calendar_events: List[Dict[str, Any]],
        week_start: date,
        timezone: str,
    ) -> Dict[str, Any]:
        """Generate a basic workout schedule without AI."""
        scheduled = []
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        # Get preferred days or default to Mon, Wed, Fri
        preferred_days = []
        if preferences and preferences.workout_days:
            preferred_days = preferences.workout_days
        else:
            preferred_days = ["Monday", "Wednesday", "Friday"]

        # Get preferred time
        workout_time = "18:00"
        if preferences and preferences.workout_preferred_time:
            if "morning" in preferences.workout_preferred_time.lower():
                workout_time = "07:00"
            elif "evening" in preferences.workout_preferred_time.lower():
                workout_time = "18:00"

        # Schedule unscheduled workouts on preferred days
        day_index = 0
        for workout in workouts:
            workout_id = str(workout.id)

            # Skip if already scheduled
            if workout_id in existing_workout_events:
                continue

            # Find next available preferred day
            while day_index < len(preferred_days):
                day = preferred_days[day_index]
                day_index += 1

                # Calculate the date for this day
                day_offset = days.index(day)
                event_date = week_start + timedelta(days=day_offset)
                start_dt = datetime.combine(event_date, datetime.strptime(workout_time, "%H:%M").time())
                end_dt = start_dt + timedelta(minutes=60)

                scheduled.append({
                    "workout_id": workout_id,
                    "title": workout.title,
                    "day": day,
                    "start_time": start_dt.isoformat(),
                    "end_time": end_dt.isoformat(),
                    "is_rescheduled": False,
                })
                break

        return {
            "scheduled_workouts": scheduled,
            "reasoning": "Workouts scheduled on your preferred days using rule-based scheduling.",
            "warnings": [],
        }
