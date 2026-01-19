"""AI Scheduling Agent Service using Claude API.

This service handles intelligent schedule generation by:
1. Fetching user preferences, goals, and calendar events
2. Using Claude AI to analyze and optimize the schedule
3. Creating suggested time blocks that respect user constraints
"""

import os
import json
import logging
import hashlib
import time
import requests
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID

from sqlalchemy.orm import Session
from anthropic import Anthropic
from openai import OpenAI

from app.models.user import User
from app.models.user_preference import UserPreference
from app.models.list_item import ListItem, ListItemType
from app.models.schedule_agent import ScheduleSuggestion, SuggestionStatus, ScheduleHistory, ChangeType
from app.models.workout import Workout
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

    def _get_user_workouts(self) -> List[Workout]:
        """Fetch user's workouts from their workout plan."""
        return (
            self.db.query(Workout)
            .filter_by(user_id=self.user.id)
            # Fetch ALL workouts, even completed ones, as they serve as templates
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

    def _get_podcast_recommendation(self, topic: str) -> Tuple[str, str]:
        """
        Fetch a real podcast recommendation from Podcast Index API based on topic.

        Args:
            topic: The podcast topic to search for (e.g., "Technology", "Health & Wellness")

        Returns:
            Tuple of (podcast_name, episode_title)
        """
        api_key = os.getenv('PODCAST_INDEX_API_KEY')
        api_secret = os.getenv('PODCAST_INDEX_API_SECRET')

        if not api_key or not api_secret:
            logger.warning("Podcast Index API credentials not configured, using fallback")
            return self._get_fallback_podcast(topic)

        try:
            # Generate auth headers
            api_header_time = str(int(time.time()))
            data_to_hash = api_key + api_secret + api_header_time
            sha_1_hash = hashlib.sha1(data_to_hash.encode()).hexdigest()

            headers = {
                'X-Auth-Date': api_header_time,
                'X-Auth-Key': api_key,
                'Authorization': sha_1_hash,
                'User-Agent': 'GuruApp/1.0'
            }

            # Search for trending podcasts in this topic
            response = requests.get(
                'https://api.podcastindex.org/api/1.0/search/byterm',
                headers=headers,
                params={'q': topic, 'max': 5},
                timeout=10
            )

            if response.ok:
                data = response.json()
                feeds = data.get('feeds', [])

                if feeds:
                    # Pick the first result
                    podcast = feeds[0]
                    podcast_name = podcast.get('title', f'{topic} Podcast')
                    podcast_id = podcast.get('id')

                    # Try to get a recent episode
                    if podcast_id:
                        episodes_response = requests.get(
                            'https://api.podcastindex.org/api/1.0/episodes/byfeedid',
                            headers=headers,
                            params={'id': podcast_id, 'max': 1},
                            timeout=10
                        )

                        if episodes_response.ok:
                            episodes_data = episodes_response.json()
                            items = episodes_data.get('items', [])
                            if items:
                                episode_title = items[0].get('title', 'Latest Episode')
                                return (podcast_name, episode_title)

                    return (podcast_name, 'Latest Episode')

            logger.warning(f"Podcast Index API request failed: {response.status_code}")
            return self._get_fallback_podcast(topic)

        except Exception as e:
            logger.error(f"Error fetching podcast from API: {e}")
            return self._get_fallback_podcast(topic)

    def _get_fallback_podcast(self, topic: str) -> Tuple[str, str]:
        """Get a fallback podcast suggestion when API is unavailable."""
        fallback_suggestions = {
            "Technology": ("Tech Today", "Latest in AI and Innovation"),
            "Health & Wellness": ("Healthy Living", "Tips for Better Wellness"),
            "Business": ("Business Insider Daily", "Entrepreneurship Insights"),
            "Science": ("Science Weekly", "New Research Discoveries"),
            "Sports": ("Sports Talk", "Game Analysis and Highlights"),
            "Politics": ("Political Pulse", "Current Events Discussion"),
            "Comedy": ("Comedy Hour", "Stand-up and Sketches"),
            "True Crime": ("Crime Chronicles", "Investigative Stories"),
            "History": ("History Uncovered", "Stories from the Past"),
            "Arts & Culture": ("Culture Cast", "Art and Music Today"),
            "Education": ("Learn Something New", "Educational Deep Dives"),
            "News": ("Daily News Brief", "Today's Headlines"),
        }
        return fallback_suggestions.get(topic, (f"{topic} Podcast", f"Latest {topic} Episode"))

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
        timezone: str,
        workouts: List[Workout] = None,
        modification_request: Optional[str] = None,
    ) -> str:
        """Build the prompt for Claude to generate a schedule."""

        # Format preferences for the prompt
        pref_text = "No preferences set."
        if preferences:
            pref_text = f"""
User Preferences:
- Timezone: {timezone} (ALL times must be in this timezone)
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
- Wake time: {preferences.wake_time or 'Not specified'}
- Sleep hours needed: {preferences.sleep_hours or 'Not specified'}
- Chore distribution: {preferences.chore_distribution or 'Not specified'} (distributed = spread throughout week, one_session = all at once)
- Chore list: {', '.join(preferences.chore_list) if preferences.chore_list else 'No specific list'}
- Meal duration: {preferences.meal_duration or 'Not specified'} minutes
- Focus time: {preferences.focus_time_start or 'Not specified'} to {preferences.focus_time_end or 'Not specified'} (NOTE: Focus time is ONLY for app blocking, DO NOT add it to the calendar)
- Blocked apps during focus: {preferences.blocked_apps or 'None'}
"""

        # Format goals
        goals_text = "No weekly goals set."
        if goals:
            goals_text = "Weekly Goals:\n" + "\n".join(
                [f"- {goal.text}" for goal in goals]
            )

        # Format user's workout plan (specific workouts to schedule)
        workouts_text = "No specific workouts in workout plan."
        if workouts:
            workouts_text = "USER'S WORKOUT PLAN (These specific workouts MUST be scheduled):\n"
            for workout in workouts:
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
                description_str = f"  Description: {workout.description}" if workout.description else ""
                workouts_text += f"\n* {workout.title}:{description_str}\n  Exercises:\n{exercises_str}\n"

        # Format calendar events (existing commitments)
        # Google Calendar color IDs: 1=Lavender, 2=Sage, 3=Grape, 4=Flamingo, 5=Banana, 6=Tangerine, 7=Peacock, 8=Graphite, 9=Blueberry, 10=Basil, 11=Tomato (RED = high priority)
        events_text = "No existing calendar events."
        if calendar_events:
            events_text = "EXISTING CALENDAR EVENTS - BLOCKED TIME SLOTS (You MUST NOT schedule anything during these times):\n"
            for event in calendar_events:
                start = event.get("start", {}).get("dateTime", event.get("start", {}).get("date", "Unknown"))
                end = event.get("end", {}).get("dateTime", event.get("end", {}).get("date", "Unknown"))
                color_id = event.get("colorId", "")
                # Determine priority based on color (11 = Tomato/Red = HIGH PRIORITY)
                priority_note = ""
                if color_id == "11":
                    priority_note = " [HIGH PRIORITY - RED]"
                elif color_id == "4":
                    priority_note = " [IMPORTANT - PINK]"
                elif color_id == "6":
                    priority_note = " [IMPORTANT - ORANGE]"
                events_text += f"- {event.get('summary', 'Untitled')}{priority_note}: {start} to {end}\n"

        # Build the main prompt
        prompt = f"""You are an AI scheduling assistant. Your task is to create an optimal weekly schedule for a user based on their preferences, goals, existing calendar commitments, and their specific workout plan.

Week starting: {week_start.strftime('%A, %B %d, %Y')}

{pref_text}

{workouts_text}

{goals_text}

{events_text}

{f'''USER MODIFICATION REQUEST:
The user has requested the following modifications to their schedule:
"{modification_request}"

IMPORTANT: You MUST incorporate this modification request into the schedule. This takes priority over default scheduling logic.
''' if modification_request else ''}
INSTRUCTIONS:
1. Create a balanced weekly schedule that includes:
   - **PRIORITY: Schedule the SPECIFIC workouts from the user's workout plan** - these are the exact workouts they created and want to do. Schedule them on the user's preferred workout days and times, respecting their workout frequency preference. if the ser has evening preferece for workouts please put them after the commute time.
   - Time blocks for weekly goals/tasks
   - **PODCAST RECOMMENDATIONS** (podcasts should ONLY be suggested during these activities, NOT as separate blocks):
     * During COMMUTE times - suggest podcasts matching their favorite topics
     * During CHORE times - suggest podcasts to make chores more enjoyable
     * During MEAL times (lunch, dinner) - suggest podcasts for mealtime listening
     * DO NOT create separate "Podcast Time" blocks - podcasts are paired with other activities only
     * Always include a specific podcast recommendation in the "suggested_podcast" field for commute, chore, and meal events
   - **COMMUTE TITLE FORMAT**: For commute events, the title MUST be "Listen to podcast (Podcast Name - Episode Title)" format, NOT "Morning Commute" or "Evening Commute". The podcast name and episode should be based on the user's podcast topics.
   - Commute times with podcast suggestions based on their interests
   - Chore time on their preferred schedule with podcast suggestions
   - **MEALS ARE NOT WEEKLY GOALS**: Meals (lunch, dinner, breakfast) should be scheduled as calendar blocks only. They are NOT weekly goals and should NOT appear in the weekly goals list. Just schedule them at reasonable times based on user preferences.

2. CRITICAL CONSTRAINTS (MUST FOLLOW - THESE ARE ABSOLUTE RULES):
   - **WAKE TIME RULE - NOTHING BEFORE WAKE TIME**: The user's day starts at their wake_time. You MUST NOT schedule ANY events before the wake_time. For example, if wake_time is 7:00 AM, the FIRST event of each day can only start at 7:00 AM or later. This applies to EVERY day of the week.
   - **SLEEP TIME RULE - NOTHING DURING SLEEP**: You MUST NEVER schedule ANY activity during sleep hours (from bed_time to wake_time). If bed_time is 11:00 PM and wake_time is 7:00 AM, then 11:00 PM to 7:00 AM is completely blocked - no exceptions.
   - **HIGH PRIORITY EVENTS ARE UNTOUCHABLE**: Events marked [HIGH PRIORITY - RED] in existing calendar events are absolutely blocked. You MUST NOT schedule anything that overlaps with these times - not even by 1 minute.
   - **EXISTING CALENDAR EVENTS ARE BLOCKED**: You MUST NEVER schedule ANY activity during the time slots of existing calendar events listed above. These are immovable commitments. If an event is from 9:00 AM to 5:00 PM, that ENTIRE time range is unavailable - schedule around it, not during it.
   - DO NOT add focus time blocks to the calendar - focus time is ONLY used for app blocking functionality
   - DO NOT add sleep/bed time blocks to the calendar - these are just parameters for scheduling constraints
   - Respect chore distribution preference: if "distributed", spread chores throughout the week; if "one_session", schedule all chores together
   - Use the meal_duration preference when scheduling meal times
   - Leave buffer time between activities (at least 10-15 minutes)
   - Make the schedule realistic and achievable
   - **CRITICAL FOR WORKOUTS**: When scheduling workouts from the user's workout plan:
     * Use the EXACT workout title (e.g., "Upper Body Strength", "Morning Cardio")
     * Include ALL exercises in the description field, formatted as a list (e.g., "Squats: 3 sets × 12 reps, Lunges: 3 sets × 10 reps")
     * If the workout has a description, include it at the start of the description field
     * The scheduled event should contain the complete workout details so the user knows exactly what exercises to do
   - **FILLING IN ADDITIONAL WORKOUTS**: If the user has fewer workouts in their workout plan than their preferred workout frequency (e.g., they have 3 workouts but prefer 5-6 times/week), you should:
     * First schedule ALL workouts from the user's workout plan
     * Then generate additional workout sessions based on their workout_types preference to fill in the remaining days
     * For these generated workouts, create appropriate titles like "Cardio Session", "Strength Training", "Yoga Session" based on their preferred workout types
     * Include suggested exercises in the description based on the workout type
   - **PODCAST PAIRING RULES** (podcasts are NOT standalone events):
     * DO NOT create separate "Podcast Time" events - podcasts are ONLY paired with other activities
     * For COMMUTE events, ALWAYS include a suggested_podcast recommendation based on their podcast_topics
     * **CRITICAL FOR COMMUTE TITLES**: The commute event title MUST follow this exact format: "Listen to podcast (Podcast Name - Episode Title)". For example: "Listen to podcast (Lex Fridman Podcast - Interview with Sam Altman)" or "Listen to podcast (Tech Today - AI Trends 2024)". NEVER use generic titles like "Morning Commute" or "Evening Commute".
     * For CHORE events, ALWAYS include a suggested_podcast recommendation to make chores enjoyable
     * For MEAL events (lunch, dinner), include a suggested_podcast recommendation for mealtime listening
     * DO NOT suggest podcasts for workouts - users may prefer music or focus during exercise
     * Be specific with podcast suggestions - include the podcast name and episode title (e.g., "Lex Fridman Podcast - Interview with Elon Musk" not just "Technology podcast")

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
        }},
        {{
            "title": "Listen to podcast (The Daily Tech News - AI Breakthroughs This Week)",
            "activity_type": "commute",
            "day": "Monday",
            "start_time": "2024-01-15T08:00:00",
            "end_time": "2024-01-15T08:30:00",
            "description": "Morning commute - perfect time for podcasts!",
            "is_flexible": false,
            "priority": 8,
            "suggested_podcast": "The Daily Tech News - AI Breakthroughs This Week",
            "color": "#2196F3"
        }},
        {{
            "title": "Lunch",
            "activity_type": "meal",
            "day": "Monday",
            "start_time": "2024-01-15T12:30:00",
            "end_time": "2024-01-15T13:00:00",
            "description": "Lunch break - enjoy a podcast while eating",
            "is_flexible": true,
            "priority": 5,
            "suggested_podcast": "Lex Fridman Podcast - AI and Technology Discussion",
            "color": "#FF9800"
        }},
        {{
            "title": "House Chores",
            "activity_type": "chore",
            "day": "Monday",
            "start_time": "2024-01-15T18:00:00",
            "end_time": "2024-01-15T19:00:00",
            "description": "Weekly cleaning and organizing",
            "is_flexible": true,
            "priority": 5,
            "suggested_podcast": "Comedy Hour - Make chores fun with laughs",
            "color": "#795548"
        }}
    ],
    "reasoning": "A brief explanation of your scheduling decisions including how podcasts were paired with commutes, meals, and chores",
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
        modification_request: Optional[str] = None,
    ) -> GenerateScheduleResponse:
        """
        Generate a new weekly schedule using Claude AI.

        Args:
            week_start_date: Start date of the week to schedule
            include_goals: Whether to include weekly goals in scheduling
            force_regenerate: Force regeneration even if schedule exists
            modification_request: Natural language request to modify the schedule

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
        logger.info("Gathering user context (preferences, goals, calendar, workouts)...")
        logger.info(f"Current User: ID={self.user.id}, Email={self.user.email}")
        
        preferences = self._get_user_preferences()
        goals = self._get_weekly_goals() if include_goals else []
        calendar_events = self._get_calendar_events(week_start_date)
        workouts = self._get_user_workouts()
        timezone = self._get_user_timezone()
        logger.info(f"Context gathered: Preferences found={bool(preferences)}, Goals={len(goals)}, Calendar Events={len(calendar_events)}, Workouts={len(workouts)}, Timezone={timezone}")

        # Log detailed preferences
        if preferences:
            logger.info(f"Preferences found for user_id: {preferences.user_id}")
            logger.info("=== USER PREFERENCES ===")
            logger.info(f"  Timezone: {timezone}")
            logger.info(f"  Workout types: {preferences.workout_types}")
            logger.info(f"  Workout duration: {preferences.workout_duration}")
            logger.info(f"  Workout frequency: {preferences.workout_frequency}")
            logger.info(f"  Workout days: {preferences.workout_days}")
            logger.info(f"  Workout preferred time: {preferences.workout_preferred_time}")
            logger.info(f"  Bed time: {preferences.bed_time}")
            logger.info(f"  Wake time: {preferences.wake_time}")
            logger.info(f"  Sleep hours: {preferences.sleep_hours}")
            logger.info(f"  Commute start: {preferences.commute_start}")
            logger.info(f"  Commute end: {preferences.commute_end}")
            logger.info(f"  Chore time: {preferences.chore_time}")
            logger.info(f"  Chore duration: {preferences.chore_duration}")
            logger.info(f"  Chore distribution: {preferences.chore_distribution}")
            logger.info(f"  Meal duration: {preferences.meal_duration}")
            logger.info(f"  Focus time: {preferences.focus_time_start} - {preferences.focus_time_end}")
            logger.info(f"  Podcast topics: {preferences.podcast_topics}")
        else:
            logger.info("=== NO USER PREFERENCES FOUND ===")

        # Log detailed workouts
        if workouts:
            logger.info("=== USER WORKOUTS FROM WORKOUT PLAN ===")
            for idx, workout in enumerate(workouts):
                logger.info(f"  Workout {idx + 1}: {workout.title}")
                logger.info(f"    Description: {workout.description}")
                logger.info(f"    Completed: {workout.completed}")
                for section in workout.sections:
                    logger.info(f"    Section: {section.title}")
                    for exercise in section.exercises:
                        if exercise.sets and exercise.reps:
                            logger.info(f"      - {exercise.name}: {exercise.sets} sets × {exercise.reps} reps")
                        elif exercise.duration:
                            logger.info(f"      - {exercise.name}: {exercise.duration}")
                        else:
                            logger.info(f"      - {exercise.name}")
        else:
            logger.info("=== NO WORKOUTS FOUND IN WORKOUT PLAN ===")

        # Log calendar events
        if calendar_events:
            logger.info("=== EXISTING CALENDAR EVENTS ===")
            for idx, event in enumerate(calendar_events):
                start = event.get("start", {}).get("dateTime", event.get("start", {}).get("date", "Unknown"))
                end = event.get("end", {}).get("dateTime", event.get("end", {}).get("date", "Unknown"))
                color_id = event.get("colorId", "default")
                logger.info(f"  Event {idx + 1}: {event.get('summary', 'Untitled')}")
                logger.info(f"    Time: {start} to {end}")
                logger.info(f"    Color ID: {color_id}")
        else:
            logger.info("=== NO EXISTING CALENDAR EVENTS ===")

        # Generate schedule with AI or fallback to rule-based
        schedule_data = None
        algorithm = "fallback-v1"

        # 1. Try Claude (Anthropic)
        if self.anthropic_client:
            logger.info("Attempting generation with Claude (Anthropic)...")
            schedule_data = await self._generate_with_claude(
                preferences, goals, calendar_events, week_start_date, timezone, workouts, modification_request
            )
            if schedule_data:
                algorithm = "claude-3-sonnet-20240229"

        # 2. Try OpenAI (GPT-4o) if Claude failed or wasn't available
        if not schedule_data and self.openai_client:
            logger.info("Attempting generation with OpenAI (GPT-4o)...")
            schedule_data = await self._generate_with_openai(
                preferences, goals, calendar_events, week_start_date, timezone, workouts, modification_request
            )
            if schedule_data:
                algorithm = "gpt-4o"

        # 3. Fallback to rule-based if both AI options failed
        if not schedule_data:
            logger.warning("Using fallback rule-based scheduling (no API key or AI failure)")
            schedule_data = self._generate_fallback_schedule(
                preferences, goals, calendar_events, week_start_date, workouts, timezone
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
        timezone: str,
        workouts: List[Workout] = None,
        modification_request: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate schedule using Claude API."""
        logger.info("Building prompt for Claude...")
        prompt = self._build_scheduling_prompt(
            preferences, goals, calendar_events, week_start, timezone, workouts, modification_request
        )

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
        timezone: str,
        workouts: List[Workout] = None,
        modification_request: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate schedule using OpenAI API."""
        logger.info("Building prompt for OpenAI...")
        prompt = self._build_scheduling_prompt(
            preferences, goals, calendar_events, week_start, timezone, workouts, modification_request
        )

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
        workouts: List[Workout] = None,
        timezone: str = "UTC",
    ) -> Dict[str, Any]:
        """Generate a basic schedule without AI (fallback mode)."""
        logger.info(f"Generating rule-based fallback schedule in timezone: {timezone}")
        events = []
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        # Get timezone object for proper datetime handling
        try:
            import pytz
            tz = pytz.timezone(timezone)
            logger.info(f"Using timezone: {tz}")
        except Exception as e:
            logger.warning(f"Could not load timezone {timezone}, using UTC: {e}")
            import pytz
            tz = pytz.UTC

        # Parse wake_time and bed_time for schedule constraints
        wake_time = None
        bed_time = None
        if preferences:
            if preferences.wake_time:
                try:
                    wake_time = datetime.strptime(preferences.wake_time, "%H:%M").time()
                    logger.info(f"Wake time constraint: {wake_time}")
                except ValueError:
                    logger.warning(f"Could not parse wake_time: {preferences.wake_time}")
            if preferences.bed_time:
                try:
                    bed_time = datetime.strptime(preferences.bed_time, "%H:%M").time()
                    logger.info(f"Bed time constraint: {bed_time}")
                except ValueError:
                    logger.warning(f"Could not parse bed_time: {preferences.bed_time}")

        # Helper function to check if event is within allowed time range
        def is_within_allowed_hours(event_start_time: datetime.time, event_end_time: datetime.time) -> bool:
            """Check if event time is within wake_time and bed_time constraints."""
            if wake_time and event_start_time < wake_time:
                return False
            if bed_time and event_end_time > bed_time:
                return False
            return True

        # Helper function to create timezone-aware datetime and format for output
        def make_aware_datetime(naive_dt: datetime) -> datetime:
            """Convert naive datetime to timezone-aware datetime in user's timezone."""
            return tz.localize(naive_dt)

        def format_datetime_iso(dt: datetime) -> str:
            """Format datetime as ISO string with timezone offset."""
            aware_dt = make_aware_datetime(dt) if dt.tzinfo is None else dt
            return aware_dt.isoformat()

        # Helper function to check if event conflicts with existing high-priority calendar events
        def conflicts_with_calendar(event_start: datetime, event_end: datetime) -> bool:
            """Check if event overlaps with any existing calendar event (especially high priority ones).

            Args:
                event_start: Naive datetime in user's local timezone
                event_end: Naive datetime in user's local timezone
            """
            # Make event times timezone-aware for comparison
            event_start_aware = make_aware_datetime(event_start)
            event_end_aware = make_aware_datetime(event_end)

            for cal_event in calendar_events:
                cal_start_str = cal_event.get("start", {}).get("dateTime", cal_event.get("start", {}).get("date"))
                cal_end_str = cal_event.get("end", {}).get("dateTime", cal_event.get("end", {}).get("date"))
                color_id = cal_event.get("colorId", "")

                # High priority events (colorId 11 = Tomato/Red) are absolutely blocked
                is_high_priority = color_id == "11"

                if cal_start_str and cal_end_str:
                    try:
                        # Parse the calendar event times
                        if "T" in cal_start_str:
                            # Calendar events from Google have timezone info
                            cal_start = datetime.fromisoformat(cal_start_str.replace("Z", "+00:00"))
                            cal_end = datetime.fromisoformat(cal_end_str.replace("Z", "+00:00"))

                            # Convert calendar events to user's timezone for comparison
                            cal_start_local = cal_start.astimezone(tz)
                            cal_end_local = cal_end.astimezone(tz)
                        else:
                            # All-day event - skip for time-based conflicts
                            continue

                        # Check for overlap (both are now in user's timezone)
                        if event_start_aware < cal_end_local and event_end_aware > cal_start_local:
                            if is_high_priority:
                                logger.info(f"Event conflicts with HIGH PRIORITY calendar event: {cal_event.get('summary')}")
                            return True
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Could not parse calendar event time: {e}")
                        continue
            return False

        # Add specific workouts from the user's workout plan
        if workouts and preferences and preferences.workout_days:
            workout_time = "07:00" if preferences.workout_preferred_time == "Morning" else "18:00"
            # Adjust workout time if it's before wake_time
            if wake_time:
                workout_time_obj = datetime.strptime(workout_time, "%H:%M").time()
                if workout_time_obj < wake_time:
                    workout_time = wake_time.strftime("%H:%M")
                    logger.info(f"Adjusted workout time to wake_time: {workout_time}")
            duration = 45  # Default 45 minutes

            # Schedule each workout from the plan on preferred days
            workout_day_index = 0
            for workout in workouts:
                # Find the next preferred day
                for i, day in enumerate(days):
                    if day in preferences.workout_days:
                        if workout_day_index == 0 or i > workout_day_index:
                            workout_day_index = i
                            event_date = week_start + timedelta(days=i)
                            start_dt = datetime.combine(event_date, datetime.strptime(workout_time, "%H:%M").time())
                            end_dt = start_dt + timedelta(minutes=duration)

                            # Build description from workout description and exercises
                            exercises_desc = []
                            for section in workout.sections:
                                for exercise in section.exercises:
                                    if exercise.sets and exercise.reps:
                                        exercises_desc.append(f"{exercise.name}: {exercise.sets} sets × {exercise.reps} reps")
                                    elif exercise.duration:
                                        exercises_desc.append(f"{exercise.name}: {exercise.duration}")
                                    else:
                                        exercises_desc.append(exercise.name)

                            # Combine workout description with exercises
                            full_description = ""
                            if workout.description:
                                full_description = workout.description + "\n\n"
                            if exercises_desc:
                                full_description += "Exercises: " + ", ".join(exercises_desc)
                            if not full_description:
                                full_description = f"{duration}-minute workout session"

                            # Check constraints before adding
                            if is_within_allowed_hours(start_dt.time(), end_dt.time()) and not conflicts_with_calendar(start_dt, end_dt):
                                events.append({
                                    "title": workout.title,
                                    "activity_type": "workout",
                                    "day": day,
                                    "start_time": format_datetime_iso(start_dt),
                                    "end_time": format_datetime_iso(end_dt),
                                    "description": full_description,
                                    "is_flexible": True,
                                    "priority": 7,
                                    "color": "#4CAF50",
                                })
                            else:
                                logger.info(f"Skipping workout '{workout.title}' on {day} - outside allowed hours or conflicts with calendar")
                            break
        # Fallback to generic workouts if no specific workouts in plan
        elif preferences and preferences.workout_days:
            workout_time = "07:00" if preferences.workout_preferred_time == "Morning" else "18:00"
            # Adjust workout time if it's before wake_time
            if wake_time:
                workout_time_obj = datetime.strptime(workout_time, "%H:%M").time()
                if workout_time_obj < wake_time:
                    workout_time = wake_time.strftime("%H:%M")
            duration = 45  # Default 45 minutes

            for i, day in enumerate(days):
                if day in preferences.workout_days:
                    event_date = week_start + timedelta(days=i)
                    start_dt = datetime.combine(event_date, datetime.strptime(workout_time, "%H:%M").time())
                    end_dt = start_dt + timedelta(minutes=duration)

                    # Check constraints before adding
                    if is_within_allowed_hours(start_dt.time(), end_dt.time()) and not conflicts_with_calendar(start_dt, end_dt):
                        events.append({
                            "title": f"Workout - {(preferences.workout_types or ['Exercise'])[0]}",
                            "activity_type": "workout",
                            "day": day,
                            "start_time": format_datetime_iso(start_dt),
                            "end_time": format_datetime_iso(end_dt),
                            "description": f"{duration}-minute workout session",
                            "is_flexible": True,
                            "priority": 7,
                            "color": "#4CAF50",
                        })
                    else:
                        logger.info(f"Skipping generic workout on {day} - outside allowed hours or conflicts with calendar")

        # Add commute blocks with podcast recommendations
        if preferences and preferences.commute_start:
            podcast_topics = preferences.podcast_topics or []
            for i, day in enumerate(days[:5]):  # Weekdays only
                event_date = week_start + timedelta(days=i)
                try:
                    commute_start = datetime.strptime(preferences.commute_start, "%H:%M").time()
                    commute_end = datetime.strptime(preferences.commute_end or "09:00", "%H:%M").time()

                    start_dt = datetime.combine(event_date, commute_start)
                    end_dt = datetime.combine(event_date, commute_end)

                    # Check constraints before adding
                    if not is_within_allowed_hours(commute_start, commute_end):
                        logger.info(f"Skipping commute on {day} - outside allowed hours")
                        continue
                    if conflicts_with_calendar(start_dt, end_dt):
                        logger.info(f"Skipping commute on {day} - conflicts with calendar")
                        continue

                    # Create specific podcast suggestion for commute using real API
                    suggested_podcast = None
                    commute_title = "Morning Commute"  # Default fallback
                    if podcast_topics:
                        topic = podcast_topics[i % len(podcast_topics)]
                        # Try to get a real podcast recommendation from Podcast Index API
                        podcast_name, episode_title = self._get_podcast_recommendation(topic)
                        suggested_podcast = f"{podcast_name} - {episode_title}"
                        commute_title = f"Listen to podcast ({podcast_name} - {episode_title})"

                    events.append({
                        "title": commute_title,
                        "activity_type": "commute",
                        "day": day,
                        "start_time": format_datetime_iso(start_dt),
                        "end_time": format_datetime_iso(end_dt),
                        "description": f"Morning commute - perfect time for podcasts!",
                        "is_flexible": False,
                        "priority": 8,
                        "suggested_podcast": suggested_podcast,
                        "color": "#2196F3",
                    })
                except ValueError:
                    pass

        # NOTE: Focus time blocks are NOT added to the calendar
        # Focus time is ONLY used for app blocking functionality, not scheduling

        # Add task blocks for goals
        task_slot_hour = 14  # 2 PM default for tasks
        # Adjust task slot hour if it's before wake_time
        if wake_time and wake_time.hour > task_slot_hour:
            task_slot_hour = wake_time.hour + 1  # Start 1 hour after wake time
        for i, goal in enumerate(goals[:5]):  # Limit to 5 goals
            day_index = i % 5  # Spread across weekdays
            event_date = week_start + timedelta(days=day_index)
            start_dt = datetime.combine(event_date, datetime.min.time().replace(hour=task_slot_hour))
            end_dt = start_dt + timedelta(hours=1)

            # Check constraints before adding
            if not is_within_allowed_hours(start_dt.time(), end_dt.time()):
                logger.info(f"Skipping task '{goal.text[:30]}' on {days[day_index]} - outside allowed hours")
                task_slot_hour += 1
                continue
            if conflicts_with_calendar(start_dt, end_dt):
                logger.info(f"Skipping task '{goal.text[:30]}' on {days[day_index]} - conflicts with calendar")
                task_slot_hour += 1
                continue

            events.append({
                "title": f"Work on: {goal.text[:50]}",
                "activity_type": "task",
                "day": days[day_index],
                "start_time": format_datetime_iso(start_dt),
                "end_time": format_datetime_iso(end_dt),
                "description": goal.text,
                "is_flexible": True,
                "priority": 6,
                "color": "#FF9800",
            })
            task_slot_hour += 1  # Stagger task times

        # Add meal times with podcast suggestions (podcasts paired with meals, not standalone)
        if preferences:
            podcast_topics = preferences.podcast_topics or []
            meal_duration = 30  # Default 30 minutes
            if preferences.meal_duration:
                try:
                    meal_duration = int(preferences.meal_duration)
                except ValueError:
                    meal_duration = 30

            # Schedule lunch for weekdays with podcast suggestions
            for i, day in enumerate(days[:5]):  # Weekdays only
                event_date = week_start + timedelta(days=i)
                start_dt = datetime.combine(event_date, datetime.strptime("12:30", "%H:%M").time())
                end_dt = start_dt + timedelta(minutes=meal_duration)

                # Check constraints before adding
                if not is_within_allowed_hours(start_dt.time(), end_dt.time()):
                    logger.info(f"Skipping lunch on {day} - outside allowed hours")
                    continue
                if conflicts_with_calendar(start_dt, end_dt):
                    logger.info(f"Skipping lunch on {day} - conflicts with calendar")
                    continue

                # Create podcast suggestion for meal if user has podcast preferences
                suggested_podcast = None
                if podcast_topics:
                    topic = podcast_topics[i % len(podcast_topics)]
                    podcast_suggestions = {
                        "Technology": f"Tech Today - Latest in technology innovations",
                        "Health & Wellness": f"Healthy Living - Tips for better wellness",
                        "Business": f"Business Insider - Entrepreneurship insights",
                        "Science": f"Science Weekly - Research breakthroughs",
                        "Sports": f"Sports Talk - Game analysis and interviews",
                        "Politics": f"Political Pulse - Current events discussion",
                        "Comedy": f"Comedy Hour - Laugh and unwind",
                        "True Crime": f"Crime Chronicles - Investigative stories",
                        "History": f"History Uncovered - Stories from the past",
                        "Arts & Culture": f"Culture Cast - Art and music",
                        "Education": f"Learn Something New - Educational content",
                        "News": f"Daily News Brief - Stay informed",
                    }
                    suggested_podcast = podcast_suggestions.get(topic, f"{topic} Podcast - {topic.lower()} topics")

                events.append({
                    "title": "Lunch",
                    "activity_type": "meal",
                    "day": day,
                    "start_time": format_datetime_iso(start_dt),
                    "end_time": format_datetime_iso(end_dt),
                    "description": f"Lunch break{' - enjoy a podcast while eating' if suggested_podcast else ''}",
                    "is_flexible": True,
                    "priority": 5,
                    "suggested_podcast": suggested_podcast,
                    "color": "#FF9800",
                })

        # Add chore blocks with podcast suggestions
        if preferences and preferences.chore_time:
            podcast_topics = preferences.podcast_topics or []
            chore_duration = 60  # Default 60 minutes
            if preferences.chore_duration:
                # Parse duration like "1h 30m" or just minutes
                try:
                    duration_str = preferences.chore_duration.lower()
                    total_minutes = 0
                    if 'h' in duration_str:
                        hours_match = duration_str.split('h')[0].strip()
                        total_minutes += int(hours_match) * 60
                        if 'm' in duration_str:
                            mins_part = duration_str.split('h')[1].replace('m', '').strip()
                            if mins_part:
                                total_minutes += int(mins_part)
                    elif 'm' in duration_str:
                        total_minutes = int(duration_str.replace('m', '').strip())
                    else:
                        total_minutes = int(duration_str)
                    chore_duration = total_minutes if total_minutes > 0 else 60
                except ValueError:
                    chore_duration = 60

            # Determine chore days based on preference
            chore_day_indices = []
            chore_time_str = "10:00"  # Default morning
            if "weekend" in preferences.chore_time.lower():
                chore_day_indices = [5, 6]  # Saturday, Sunday
                if "morning" in preferences.chore_time.lower():
                    chore_time_str = "10:00"
                elif "afternoon" in preferences.chore_time.lower():
                    chore_time_str = "14:00"
            elif "weekday" in preferences.chore_time.lower():
                if preferences.chore_distribution == "Distributed throughout the week":
                    chore_day_indices = [0, 2, 4]  # Mon, Wed, Fri
                else:
                    chore_day_indices = [0]  # Just Monday
                if "evening" in preferences.chore_time.lower():
                    chore_time_str = "18:00"
                else:
                    chore_time_str = "10:00"
            else:
                chore_day_indices = [5]  # Default to Saturday

            # Adjust chore time if it's before wake_time
            if wake_time:
                chore_time_obj = datetime.strptime(chore_time_str, "%H:%M").time()
                if chore_time_obj < wake_time:
                    chore_time_str = wake_time.strftime("%H:%M")
                    logger.info(f"Adjusted chore time to wake_time: {chore_time_str}")

            for idx, day_idx in enumerate(chore_day_indices):
                event_date = week_start + timedelta(days=day_idx)
                start_dt = datetime.combine(event_date, datetime.strptime(chore_time_str, "%H:%M").time())
                end_dt = start_dt + timedelta(minutes=chore_duration)

                # Check constraints before adding
                if not is_within_allowed_hours(start_dt.time(), end_dt.time()):
                    logger.info(f"Skipping chores on {days[day_idx]} - outside allowed hours")
                    continue
                if conflicts_with_calendar(start_dt, end_dt):
                    logger.info(f"Skipping chores on {days[day_idx]} - conflicts with calendar")
                    continue

                # Create podcast suggestion for chores
                suggested_podcast = None
                if podcast_topics:
                    topic = podcast_topics[idx % len(podcast_topics)]
                    suggested_podcast = f"{topic} Podcast - Make chores enjoyable"

                events.append({
                    "title": "House Chores",
                    "activity_type": "chore",
                    "day": days[day_idx],
                    "start_time": format_datetime_iso(start_dt),
                    "end_time": format_datetime_iso(end_dt),
                    "description": f"Cleaning and organizing{' - listen to podcasts while working' if suggested_podcast else ''}",
                    "is_flexible": True,
                    "priority": 5,
                    "suggested_podcast": suggested_podcast,
                    "color": "#795548",
                })

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
