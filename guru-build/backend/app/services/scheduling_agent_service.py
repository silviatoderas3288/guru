"""AI Scheduling Agent Service using Claude API.

This service handles intelligent schedule generation by:
1. Fetching user preferences, goals, and calendar events
2. Using Claude AI to analyze and optimize the schedule
3. Creating suggested time blocks that respect user constraints
"""

import os
import json
import logging
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy.orm import Session
from anthropic import Anthropic
from openai import OpenAI

from app.models.user import User
from app.models.user_preference import UserPreference
from app.models.list_item import ListItem, ListItemType
from app.models.schedule_agent import ScheduleSuggestion, SuggestionStatus, ScheduleHistory, ChangeType
from app.schemas.schedule import (
    GenerateScheduleResponse,
    ScheduledEvent,
    ScheduleWarning,
    ScheduleConflict,
    ScheduleStatusResponse,
    TaskFeedback,
    CalendarChange,
    ActivityType,
)
from app.services.calendar_service import CalendarService

logger = logging.getLogger(__name__)


class SchedulingAgentService:
    """Service for AI-powered schedule generation and management."""

    def __init__(self, db: Session, user: User):
        """
        Initialize the scheduling agent.

        Args:
            db: Database session
            user: Current authenticated user
        """
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

    def _get_weekly_goals(self) -> List[ListItem]:
        """Fetch user's weekly goals."""
        return (
            self.db.query(ListItem)
            .filter_by(user_id=self.user.id, item_type=ListItemType.WEEKLY_GOAL)
            .filter(ListItem.completed == False)
            .all()
        )

    def _get_calendar_events(self, week_start: date) -> List[Dict[str, Any]]:
        """Fetch calendar events for the week."""
        try:
            # Check if user has Google Calendar tokens
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

    def _build_scheduling_prompt(
        self,
        preferences: Optional[UserPreference],
        goals: List[ListItem],
        calendar_events: List[Dict[str, Any]],
        week_start: date,
    ) -> str:
        """Build the prompt for Claude to generate a schedule."""

        # Format preferences for the prompt
        pref_text = "No preferences set."
        if preferences:
            pref_text = f"""
User Preferences:
- Workout types: {preferences.workout_types or 'Not specified'}
- Workout duration: {preferences.workout_duration or 'Not specified'}
- Workout frequency: {preferences.workout_frequency or 'Not specified'}
- Preferred workout days: {preferences.workout_days or 'Not specified'}
- Preferred workout time: {preferences.workout_preferred_time or 'Not specified'}
- Podcast topics: {preferences.podcast_topics or 'Not specified'}
- Podcast length: {preferences.podcast_length or 'Not specified'}
- Commute start: {preferences.commute_start or 'Not specified'}
- Commute end: {preferences.commute_end or 'Not specified'}
- Commute duration: {preferences.commute_duration or 'Not specified'}
- Chore time: {preferences.chore_time or 'Not specified'}
- Chore duration: {preferences.chore_duration or 'Not specified'}
- Bed time: {preferences.bed_time or 'Not specified'}
- Focus time: {preferences.focus_time_start or 'Not specified'} to {preferences.focus_time_end or 'Not specified'}
- Blocked apps during focus: {preferences.blocked_apps or 'None'}
"""

        # Format goals
        goals_text = "No weekly goals set."
        if goals:
            goals_text = "Weekly Goals:\n" + "\n".join(
                [f"- {goal.text}" for goal in goals]
            )

        # Format calendar events (existing commitments)
        events_text = "No existing calendar events."
        if calendar_events:
            events_text = "Existing Calendar Events (DO NOT schedule over these):\n"
            for event in calendar_events:
                start = event.get("start", {}).get("dateTime", event.get("start", {}).get("date", "Unknown"))
                end = event.get("end", {}).get("dateTime", event.get("end", {}).get("date", "Unknown"))
                events_text += f"- {event.get('summary', 'Untitled')}: {start} to {end}\n"

        # Build the main prompt
        prompt = f"""You are an AI scheduling assistant. Your task is to create an optimal weekly schedule for a user based on their preferences, goals, and existing calendar commitments.

Week starting: {week_start.strftime('%A, %B %d, %Y')}

{pref_text}

{goals_text}

{events_text}

INSTRUCTIONS:
1. Create a balanced weekly schedule that includes:
   - Workouts on the user's preferred days and times
   - Time blocks for weekly goals/tasks
   - Commute times with podcast suggestions based on their interests
   - Focus time blocks for deep work
   - Chore time on their preferred schedule
   - Breaks and meals at reasonable times

2. IMPORTANT CONSTRAINTS:
   - NEVER schedule over important (high priority) or existing calendar events. you can rearrange them if they are marked as medium or low priority or if they do not have a deadline that the user marked 
   - Respect the user's bed time (don't schedule activities too late)
   - Leave buffer time between activities (at least 10-15 minutes)
   - Make the schedule realistic and achievable

3. Return your response as a JSON object with this exact structure:
{{
    "scheduled_events": [
        {{
            "title": "Morning Workout - Cardio",
            "activity_type": "workout",
            "day": "Monday",
            "start_time": "2024-01-15T07:00:00",
            "end_time": "2024-01-15T07:45:00",
            "description": "45-minute cardio session",
            "is_flexible": true,
            "priority": 7,
            "suggested_podcast": null,
            "color": "#4CAF50"
        }}
    ],
    "reasoning": "A brief explanation of your scheduling decisions",
    "warnings": [
        {{
            "message": "Limited time slots available on Wednesday due to meetings",
            "severity": "info"
        }}
    ],
    "conflicts": [],
    "confidence_score": 0.85
}}

Activity types must be one of: workout, meal, commute, focus, break, chore, task, podcast, meeting

Provide a complete schedule for the entire week. Be practical and consider energy levels throughout the day."""

        return prompt

    async def generate_schedule(
        self,
        week_start_date: date,
        include_goals: bool = True,
        force_regenerate: bool = False,
    ) -> GenerateScheduleResponse:
        """
        Generate a new weekly schedule using Claude AI.

        Args:
            week_start_date: Start date of the week to schedule
            include_goals: Whether to include weekly goals in scheduling
            force_regenerate: Force regeneration even if schedule exists

        Returns:
            GenerateScheduleResponse with the AI-generated schedule
        """
        logger.info(f"Generating schedule for user {self.user.id}, week starting {week_start_date}")

        # Check for existing schedule if not forcing regeneration
        if not force_regenerate:
            logger.info("Checking for existing schedule...")
            existing = (
                self.db.query(ScheduleSuggestion)
                .filter_by(user_id=self.user.id, week_start_date=week_start_date)
                .filter(ScheduleSuggestion.status != SuggestionStatus.rejected)
                .first()
            )
            if existing and existing.suggested_events:
                logger.info("Returning existing schedule")
                return self._suggestion_to_response(existing)

        # Gather context
        logger.info("Gathering user context (preferences, goals, calendar)...")
        preferences = self._get_user_preferences()
        goals = self._get_weekly_goals() if include_goals else []
        calendar_events = self._get_calendar_events(week_start_date)
        logger.info(f"Context gathered: Preferences found={bool(preferences)}, Goals={len(goals)}, Calendar Events={len(calendar_events)}")

        # Generate schedule with AI or fallback to rule-based
        schedule_data = None
        algorithm = "fallback-v1"

        # 1. Try Claude (Anthropic)
        if self.anthropic_client:
            logger.info("Attempting generation with Claude (Anthropic)...")
            schedule_data = await self._generate_with_claude(
                preferences, goals, calendar_events, week_start_date
            )
            if schedule_data:
                algorithm = "claude-3-sonnet-20240229"
        
        # 2. Try OpenAI (GPT-4o) if Claude failed or wasn't available
        if not schedule_data and self.openai_client:
            logger.info("Attempting generation with OpenAI (GPT-4o)...")
            schedule_data = await self._generate_with_openai(
                preferences, goals, calendar_events, week_start_date
            )
            if schedule_data:
                algorithm = "gpt-4o"
        
        # 3. Fallback to rule-based if both AI options failed
        if not schedule_data:
            logger.warning("Using fallback rule-based scheduling (no API key or AI failure)")
            schedule_data = self._generate_fallback_schedule(
                preferences, goals, calendar_events, week_start_date
            )

        # Save suggestion to database
        logger.info(f"Saving schedule suggestion (Algorithm: {algorithm})...")
        suggestion = ScheduleSuggestion(
            user_id=self.user.id,
            week_start_date=week_start_date,
            suggested_events=schedule_data.get("scheduled_events", []),
            generation_timestamp=datetime.utcnow(),
            algorithm_version=algorithm,
            confidence_score=schedule_data.get("confidence_score", 0.5),
            status=SuggestionStatus.pending,
            reasoning=schedule_data.get("reasoning", ""),
            warnings=schedule_data.get("warnings", []),
            conflicts=schedule_data.get("conflicts", []),
        )
        self.db.add(suggestion)
        self.db.commit()
        self.db.refresh(suggestion)

        return self._suggestion_to_response(suggestion)

    async def _generate_with_claude(
        self,
        preferences: Optional[UserPreference],
        goals: List[ListItem],
        calendar_events: List[Dict[str, Any]],
        week_start: date,
    ) -> Dict[str, Any]:
        """Generate schedule using Claude API."""
        logger.info("Building prompt for Claude...")
        prompt = self._build_scheduling_prompt(preferences, goals, calendar_events, week_start)

        try:
            logger.info("Sending request to Anthropic API...")
            message = self.anthropic_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4096,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            )

            # Extract the response text
            logger.info("Received response from Anthropic, parsing JSON...")
            response_text = message.content[0].text

            # Try to parse JSON from the response
            # Claude might wrap it in markdown code blocks
            json_str = response_text
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0]

            schedule_data = json.loads(json_str.strip())
            logger.info(f"Successfully generated schedule with {len(schedule_data.get('scheduled_events', []))} events")
            return schedule_data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Claude response as JSON: {e}")
            return None
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return None

    async def _generate_with_openai(
        self,
        preferences: Optional[UserPreference],
        goals: List[ListItem],
        calendar_events: List[Dict[str, Any]],
        week_start: date,
    ) -> Dict[str, Any]:
        """Generate schedule using OpenAI API."""
        logger.info("Building prompt for OpenAI...")
        prompt = self._build_scheduling_prompt(preferences, goals, calendar_events, week_start)

        try:
            logger.info("Sending request to OpenAI API...")
            completion = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful AI scheduling assistant that outputs JSON.",
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                response_format={"type": "json_object"},
            )

            # Extract the response text
            logger.info("Received response from OpenAI, parsing JSON...")
            response_text = completion.choices[0].message.content

            schedule_data = json.loads(response_text)
            logger.info(f"Successfully generated schedule with OpenAI with {len(schedule_data.get('scheduled_events', []))} events")
            return schedule_data

        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return None

    def _generate_fallback_schedule(
        self,
        preferences: Optional[UserPreference],
        goals: List[ListItem],
        calendar_events: List[Dict[str, Any]],
        week_start: date,
    ) -> Dict[str, Any]:
        """Generate a basic schedule without AI (fallback mode)."""
        logger.info("Generating rule-based fallback schedule...")
        events = []
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        # Add workouts based on preferences
        if preferences and preferences.workout_days:
            workout_time = "07:00" if preferences.workout_preferred_time == "Morning" else "18:00"
            duration = 45  # Default 45 minutes

            for i, day in enumerate(days):
                if day in preferences.workout_days:
                    event_date = week_start + timedelta(days=i)
                    start_dt = datetime.combine(event_date, datetime.strptime(workout_time, "%H:%M").time())
                    end_dt = start_dt + timedelta(minutes=duration)

                    events.append({
                        "title": f"Workout - {(preferences.workout_types or ['Exercise'])[0]}",
                        "activity_type": "workout",
                        "day": day,
                        "start_time": start_dt.isoformat(),
                        "end_time": end_dt.isoformat(),
                        "description": f"{duration}-minute workout session",
                        "is_flexible": True,
                        "priority": 7,
                        "color": "#4CAF50",
                    })

        # Add commute blocks
        if preferences and preferences.commute_start:
            for i, day in enumerate(days[:5]):  # Weekdays only
                event_date = week_start + timedelta(days=i)
                try:
                    commute_start = datetime.strptime(preferences.commute_start, "%H:%M").time()
                    commute_end = datetime.strptime(preferences.commute_end or "09:00", "%H:%M").time()

                    events.append({
                        "title": "Morning Commute",
                        "activity_type": "commute",
                        "day": day,
                        "start_time": datetime.combine(event_date, commute_start).isoformat(),
                        "end_time": datetime.combine(event_date, commute_end).isoformat(),
                        "description": "Commute time - great for podcasts!",
                        "is_flexible": False,
                        "priority": 8,
                        "suggested_podcast": (preferences.podcast_topics or ["News"])[0] if preferences.podcast_topics else None,
                        "color": "#2196F3",
                    })
                except ValueError:
                    pass

        # Add focus time blocks
        if preferences and preferences.focus_time_start:
            for i, day in enumerate(days[:5]):  # Weekdays only
                event_date = week_start + timedelta(days=i)
                try:
                    focus_start = datetime.strptime(preferences.focus_time_start, "%H:%M").time()
                    focus_end = datetime.strptime(preferences.focus_time_end or "11:00", "%H:%M").time()

                    events.append({
                        "title": "Focus Time",
                        "activity_type": "focus",
                        "day": day,
                        "start_time": datetime.combine(event_date, focus_start).isoformat(),
                        "end_time": datetime.combine(event_date, focus_end).isoformat(),
                        "description": "Deep work session - minimize distractions",
                        "is_flexible": True,
                        "priority": 9,
                        "color": "#9C27B0",
                    })
                except ValueError:
                    pass

        # Add task blocks for goals
        task_slot_hour = 14  # 2 PM default for tasks
        for i, goal in enumerate(goals[:5]):  # Limit to 5 goals
            day_index = i % 5  # Spread across weekdays
            event_date = week_start + timedelta(days=day_index)
            start_dt = datetime.combine(event_date, datetime.min.time().replace(hour=task_slot_hour))
            end_dt = start_dt + timedelta(hours=1)

            events.append({
                "title": f"Work on: {goal.text[:50]}",
                "activity_type": "task",
                "day": days[day_index],
                "start_time": start_dt.isoformat(),
                "end_time": end_dt.isoformat(),
                "description": goal.text,
                "is_flexible": True,
                "priority": 6,
                "color": "#FF9800",
            })
            task_slot_hour += 1  # Stagger task times

        return {
            "scheduled_events": events,
            "reasoning": "This is a basic schedule generated without AI assistance. Connect your Claude API key for smarter scheduling.",
            "warnings": [
                {
                    "message": "AI scheduling unavailable - using rule-based fallback",
                    "severity": "warning",
                }
            ],
            "conflicts": [],
            "confidence_score": 0.5,
        }

    def _suggestion_to_response(self, suggestion: ScheduleSuggestion) -> GenerateScheduleResponse:
        """Convert a database suggestion to API response."""
        events = []
        for event_data in suggestion.suggested_events or []:
            events.append(
                ScheduledEvent(
                    id=event_data.get("id"),
                    title=event_data.get("title", "Untitled"),
                    activity_type=ActivityType(event_data.get("activity_type", "task")),
                    start_time=event_data.get("start_time", ""),
                    end_time=event_data.get("end_time", ""),
                    day=event_data.get("day", ""),
                    description=event_data.get("description"),
                    is_flexible=event_data.get("is_flexible", True),
                    priority=event_data.get("priority", 5),
                    suggested_podcast=event_data.get("suggested_podcast"),
                    color=event_data.get("color"),
                )
            )

        warnings = [
            ScheduleWarning(**w) for w in (suggestion.warnings or [])
        ]
        conflicts = [
            ScheduleConflict(**c) for c in (suggestion.conflicts or [])
        ]

        return GenerateScheduleResponse(
            success=True,
            weekStartDate=suggestion.week_start_date,
            scheduledEvents=events,
            reasoning=suggestion.reasoning or "",
            warnings=warnings,
            conflicts=conflicts,
            generatedAt=suggestion.generation_timestamp or datetime.utcnow(),
            confidenceScore=suggestion.confidence_score or 0.5,
        )

    async def rebalance_schedule(
        self,
        tasks_feedback: List[TaskFeedback],
        calendar_changes: List[CalendarChange],
    ) -> GenerateScheduleResponse:
        """
        Rebalance the schedule based on feedback and calendar changes.

        Args:
            tasks_feedback: Feedback on task completion
            calendar_changes: Detected calendar changes

        Returns:
            Updated schedule response
        """
        # Get current week's start date (Monday)
        today = date.today()
        week_start = today - timedelta(days=today.weekday())

        # Save the current schedule to history before rebalancing
        current_suggestion = (
            self.db.query(ScheduleSuggestion)
            .filter_by(user_id=self.user.id, week_start_date=week_start)
            .first()
        )

        if current_suggestion:
            history = ScheduleHistory(
                user_id=self.user.id,
                week_start_date=week_start,
                change_type=ChangeType.rebalance,
                trigger="user_feedback" if tasks_feedback else "calendar_change",
                previous_schedule=current_suggestion.suggested_events,
                changes_summary={
                    "feedback_items": len(tasks_feedback),
                    "calendar_changes": len(calendar_changes),
                },
            )
            self.db.add(history)
            self.db.commit()

        # Regenerate the schedule with force=True
        return await self.generate_schedule(
            week_start_date=week_start,
            include_goals=True,
            force_regenerate=True,
        )

    async def submit_feedback(self, feedback: List[TaskFeedback]) -> None:
        """
        Submit task completion feedback for learning.

        Args:
            feedback: List of task feedback items
        """
        from app.models.schedule_agent import TaskCompletionFeedback

        for fb in feedback:
            feedback_record = TaskCompletionFeedback(
                task_id=fb.task_id,
                user_id=self.user.id,
                estimated_duration_minutes=fb.estimated_duration_minutes,
                actual_duration_minutes=fb.actual_duration_minutes,
                completed=fb.completed,
                difficulty_rating=fb.difficulty_rating,
                notes=fb.notes,
            )
            self.db.add(feedback_record)

        self.db.commit()
        logger.info(f"Saved {len(feedback)} feedback items for user {self.user.id}")

    async def get_schedule_status(self, week_start_date: str) -> ScheduleStatusResponse:
        """
        Get the status of a schedule for a specific week.

        Args:
            week_start_date: ISO format date string

        Returns:
            Schedule status information
        """
        try:
            week_start = date.fromisoformat(week_start_date)
        except ValueError:
            week_start = date.today() - timedelta(days=date.today().weekday())

        suggestion = (
            self.db.query(ScheduleSuggestion)
            .filter_by(user_id=self.user.id, week_start_date=week_start)
            .first()
        )

        if not suggestion:
            return ScheduleStatusResponse(
                hasSchedule=False,
                weekStartDate=week_start,
                totalEvents=0,
                completedEvents=0,
                completionRate=0.0,
            )

        total_events = len(suggestion.suggested_events or [])

        # TODO: Track actual completion - for now return placeholder
        completed_events = 0
        completion_rate = 0.0

        return ScheduleStatusResponse(
            hasSchedule=True,
            weekStartDate=suggestion.week_start_date,
            lastGeneratedAt=suggestion.generation_timestamp,
            totalEvents=total_events,
            completedEvents=completed_events,
            completionRate=completion_rate,
        )
