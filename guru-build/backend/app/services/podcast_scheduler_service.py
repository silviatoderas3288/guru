"""Podcast Scheduling Agent Service.

This service handles intelligent podcast scheduling by:
1. Fetching podcast episodes from Podcast Index API
2. Checking which episodes are already scheduled on the calendar
3. Using AI to optimally schedule podcast listening sessions
4. Supporting manual scheduling (today's todo or weekly goals)
"""

import os
import json
import logging
import hashlib
import time
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
import requests

from sqlalchemy.orm import Session
from anthropic import Anthropic
from openai import OpenAI

from app.models.user import User
from app.models.user_preference import UserPreference
from app.schemas.schedule import (
    PodcastScheduleRequest,
    PodcastScheduleResponse,
    ScheduledPodcastEpisode,
    ScheduleWarning,
)
from app.services.calendar_service import CalendarService

logger = logging.getLogger(__name__)


class PodcastSchedulerService:
    """Service for AI-powered podcast scheduling."""

    def __init__(self, db: Session, user: User):
        """Initialize the podcast scheduler."""
        self.db = db
        self.user = user
        self.anthropic_client = self._init_anthropic_client()
        self.openai_client = self._init_openai_client()
        self.podcast_api_key = os.getenv("PODCAST_INDEX_API_KEY")
        self.podcast_api_secret = os.getenv("PODCAST_INDEX_API_SECRET")

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

    def _get_podcast_index_headers(self) -> Dict[str, str]:
        """Generate authentication headers for Podcast Index API."""
        if not self.podcast_api_key or not self.podcast_api_secret:
            return {}

        epoch_time = int(time.time())
        data_to_hash = self.podcast_api_key + self.podcast_api_secret + str(epoch_time)
        sha_hash = hashlib.sha1(data_to_hash.encode()).hexdigest()

        return {
            "User-Agent": "GuruApp/1.0",
            "X-Auth-Key": self.podcast_api_key,
            "X-Auth-Date": str(epoch_time),
            "Authorization": sha_hash,
        }

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

    def _get_podcast_episodes(self, feed_id: str, count: int = 10) -> List[Dict[str, Any]]:
        """Fetch recent episodes from Podcast Index API."""
        try:
            headers = self._get_podcast_index_headers()
            if not headers:
                logger.warning("Podcast Index API credentials not configured")
                return []

            url = f"https://api.podcastindex.org/api/1.0/episodes/byfeedid?id={feed_id}&max={count}"
            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code != 200:
                logger.error(f"Podcast Index API error: {response.status_code}")
                return []

            data = response.json()
            return data.get("items", [])
        except Exception as e:
            logger.error(f"Failed to fetch podcast episodes: {e}")
            return []

    def _find_existing_podcast_events(
        self, episodes: List[Dict[str, Any]], calendar_events: List[Dict[str, Any]], podcast_title: str
    ) -> Dict[str, Dict[str, Any]]:
        """
        Find which podcast episodes are already scheduled on the calendar.
        Returns a dict mapping episode_id to calendar event info.
        """
        episode_events = {}

        for event in calendar_events:
            event_summary = event.get("summary", "").lower()
            event_description = event.get("description", "").lower()

            for episode in episodes:
                episode_id = str(episode.get("id"))
                episode_title = episode.get("title", "").lower()

                # Check if the event matches this episode
                if (episode_title in event_summary or
                    podcast_title.lower() in event_summary or
                    episode_title in event_description):
                    episode_events[episode_id] = {
                        "event_id": event.get("id"),
                        "summary": event.get("summary"),
                        "start": event.get("start", {}).get("dateTime"),
                        "end": event.get("end", {}).get("dateTime"),
                    }
                    break

        return episode_events

    def _build_podcast_scheduling_prompt(
        self,
        preferences: Optional[UserPreference],
        episodes: List[Dict[str, Any]],
        podcast_title: str,
        existing_episode_events: Dict[str, Dict[str, Any]],
        calendar_events: List[Dict[str, Any]],
        week_start: date,
        timezone: str,
        selected_episode_id: Optional[str] = None,
    ) -> str:
        """Build the prompt for AI to schedule podcast episodes."""

        # Format preferences
        pref_text = "No listening preferences set."
        if preferences:
            # Build commute times string from start/end
            commute_times_str = 'Not specified'
            if preferences.commute_start and preferences.commute_end:
                commute_times_str = f"{preferences.commute_start} - {preferences.commute_end}"
            elif preferences.commute_start:
                commute_times_str = f"Starts at {preferences.commute_start}"

            pref_text = f"""
User Preferences:
- Timezone: {timezone} (ALL times must be in this timezone)
- Commute times: {commute_times_str}
- Commute duration: {preferences.commute_duration or 'Not specified'}
- Podcast topics: {preferences.podcast_topics or 'Not specified'}
- Podcast length: {preferences.podcast_length or 'Not specified'}
- Wake time: {preferences.wake_time or 'Not specified'}
- Bed time: {preferences.bed_time or 'Not specified'}
- Chore time: {preferences.chore_time or 'Not specified'}
"""

        # Format episodes
        episodes_text = f"PODCAST: {podcast_title}\n\nEPISODES AVAILABLE:\n"
        for episode in episodes:
            episode_id = str(episode.get("id"))
            existing_event = existing_episode_events.get(episode_id)

            duration_secs = episode.get("duration", 0)
            duration_mins = duration_secs // 60 if duration_secs else 30

            status = "NOT SCHEDULED"
            if existing_event:
                status = f"ALREADY SCHEDULED at {existing_event['start']}"

            if selected_episode_id and episode_id == selected_episode_id:
                status = "SELECTED BY USER - MUST SCHEDULE THIS ONE"

            episodes_text += f"""
---
EPISODE_ID: {episode_id}
TITLE: {episode.get('title', 'Untitled')}
DURATION: {duration_mins} minutes
PUBLISHED: {datetime.fromtimestamp(episode.get('datePublished', 0)).strftime('%Y-%m-%d') if episode.get('datePublished') else 'Unknown'}
STATUS: {status}
---
"""

        # Format blocked calendar events
        events_text = "BLOCKED TIME SLOTS (existing calendar events):\n"
        for event in calendar_events:
            start = event.get("start", {}).get("dateTime", event.get("start", {}).get("date", "Unknown"))
            end = event.get("end", {}).get("dateTime", event.get("end", {}).get("date", "Unknown"))
            events_text += f"- {event.get('summary', 'Untitled')}: {start} to {end}\n"

        prompt = f"""You are a podcast scheduling assistant. Your task is to schedule podcast listening sessions for the user based on their available time.

Week starting: {week_start.strftime('%A, %B %d, %Y')}

{pref_text}

{episodes_text}

{events_text}

INSTRUCTIONS:
1. {"Schedule the episode marked 'SELECTED BY USER'" if selected_episode_id else "Choose 1-2 episodes from the list that would fit well in the user's schedule"}
2. Find optimal listening times in this priority order:
   a. During COMMUTE times (if user has commute preferences set)
   b. During CHORE times (if user has chore preferences set) - podcasts make chores enjoyable!
   c. During lunch breaks
   d. Evening relaxation time
3. Do NOT schedule during blocked time slots (existing calendar events)
4. Do NOT schedule before wake_time or after bed_time
5. Consider episode duration when scheduling
6. If the episode is too long for a single commute, it can span across multiple commute sessions or be combined with chore time

Return your response as a JSON object:
{{
    "scheduled_episodes": [
        {{
            "episode_id": "123456",
            "episode_title": "Episode Title Here",
            "day": "Monday",
            "start_time": "2026-01-19T08:00:00",
            "end_time": "2026-01-19T08:45:00"
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

Only include episodes that need to be scheduled. Do not include episodes already on the calendar."""

        return prompt

    async def schedule_podcast(
        self,
        request: PodcastScheduleRequest,
    ) -> PodcastScheduleResponse:
        """
        Schedule podcast episodes for the week.

        Args:
            request: PodcastScheduleRequest with podcast details

        Returns:
            PodcastScheduleResponse with the scheduled episodes
        """
        logger.info(f"Scheduling podcast for user {self.user.id}, week starting {request.weekStartDate}")

        # Gather context
        preferences = self._get_user_preferences()
        calendar_events = self._get_calendar_events(request.weekStartDate)
        timezone = self._get_user_timezone()

        # Fetch podcast episodes
        episodes = self._get_podcast_episodes(request.podcastId)

        if not episodes:
            return PodcastScheduleResponse(
                success=False,
                weekStartDate=request.weekStartDate,
                scheduledEpisodes=[],
                alreadyScheduledCount=0,
                newlyScheduledCount=0,
                reasoning="Could not fetch episodes for this podcast.",
                warnings=[ScheduleWarning(message="Failed to load podcast episodes", severity="error")],
                generatedAt=datetime.utcnow(),
            )

        # Find which episodes are already on the calendar
        existing_episode_events = self._find_existing_podcast_events(
            episodes, calendar_events, request.podcastTitle
        )

        logger.info(f"Found {len(episodes)} episodes, {len(existing_episode_events)} already scheduled")

        # Generate schedule with AI
        schedule_data = None

        if self.anthropic_client:
            schedule_data = await self._generate_with_claude(
                preferences, episodes, request.podcastTitle, existing_episode_events,
                calendar_events, request.weekStartDate, timezone, request.selectedEpisodeId
            )

        if not schedule_data and self.openai_client:
            schedule_data = await self._generate_with_openai(
                preferences, episodes, request.podcastTitle, existing_episode_events,
                calendar_events, request.weekStartDate, timezone, request.selectedEpisodeId
            )

        if not schedule_data:
            schedule_data = self._generate_fallback_schedule(
                episodes, request.podcastTitle, existing_episode_events,
                request.weekStartDate, request.selectedEpisodeId, preferences
            )

        # Process the result
        scheduled_episodes = []
        newly_scheduled = 0

        for event_data in schedule_data.get("scheduled_episodes", []):
            episode_id = str(event_data.get("episode_id"))

            # Find the episode to get duration
            episode = next((e for e in episodes if str(e.get("id")) == episode_id), None)
            duration_mins = (episode.get("duration", 0) // 60) if episode else 30

            scheduled_episodes.append(ScheduledPodcastEpisode(
                episode_id=episode_id,
                podcast_id=request.podcastId,
                podcast_title=request.podcastTitle,
                episode_title=event_data.get("episode_title", ""),
                description=episode.get("description") if episode else None,
                duration_minutes=duration_mins,
                day=event_data.get("day", ""),
                start_time=event_data.get("start_time", ""),
                end_time=event_data.get("end_time", ""),
                calendar_event_id=existing_episode_events.get(episode_id, {}).get("event_id"),
                is_already_scheduled=episode_id in existing_episode_events,
            ))

            if episode_id not in existing_episode_events:
                newly_scheduled += 1

        warnings = [
            ScheduleWarning(message=w.get("message", ""), severity=w.get("severity", "info"))
            for w in schedule_data.get("warnings", [])
        ]

        return PodcastScheduleResponse(
            success=True,
            weekStartDate=request.weekStartDate,
            scheduledEpisodes=scheduled_episodes,
            alreadyScheduledCount=len(existing_episode_events),
            newlyScheduledCount=newly_scheduled,
            reasoning=schedule_data.get("reasoning", ""),
            warnings=warnings,
            generatedAt=datetime.utcnow(),
        )

    async def _generate_with_claude(
        self,
        preferences: Optional[UserPreference],
        episodes: List[Dict[str, Any]],
        podcast_title: str,
        existing_episode_events: Dict[str, Dict[str, Any]],
        calendar_events: List[Dict[str, Any]],
        week_start: date,
        timezone: str,
        selected_episode_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Generate podcast schedule using Claude API."""
        prompt = self._build_podcast_scheduling_prompt(
            preferences, episodes, podcast_title, existing_episode_events,
            calendar_events, week_start, timezone, selected_episode_id
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
        episodes: List[Dict[str, Any]],
        podcast_title: str,
        existing_episode_events: Dict[str, Dict[str, Any]],
        calendar_events: List[Dict[str, Any]],
        week_start: date,
        timezone: str,
        selected_episode_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Generate podcast schedule using OpenAI API."""
        prompt = self._build_podcast_scheduling_prompt(
            preferences, episodes, podcast_title, existing_episode_events,
            calendar_events, week_start, timezone, selected_episode_id
        )

        try:
            completion = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a podcast scheduling assistant that outputs JSON."},
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
        episodes: List[Dict[str, Any]],
        podcast_title: str,
        existing_episode_events: Dict[str, Dict[str, Any]],
        week_start: date,
        selected_episode_id: Optional[str] = None,
        preferences: Optional[UserPreference] = None,
    ) -> Dict[str, Any]:
        """Generate a basic podcast schedule without AI.

        Priority for scheduling:
        1. During commute times (if set)
        2. During chore times (if set)
        3. Evening fallback
        """
        scheduled = []
        reasoning_parts = []

        # Determine the best time slot based on preferences
        schedule_time = "19:00"  # Default evening time
        schedule_context = "evening listening"

        if preferences:
            # Priority 1: Commute time
            if preferences.commute_start:
                schedule_time = preferences.commute_start
                schedule_context = "your commute"
                reasoning_parts.append("during your commute")
            # Priority 2: Chore time
            elif preferences.chore_time:
                # Parse chore_time preference (e.g., "Weekend Mornings", "Weekday Evenings")
                chore_time_str = preferences.chore_time.lower()
                if "morning" in chore_time_str:
                    schedule_time = "10:00"
                elif "afternoon" in chore_time_str:
                    schedule_time = "14:00"
                elif "evening" in chore_time_str:
                    schedule_time = "18:00"
                else:
                    schedule_time = "10:00"  # Default morning for chores
                schedule_context = "while doing chores"
                reasoning_parts.append("while doing chores")

        # If a specific episode was selected, schedule that one
        if selected_episode_id:
            episode = next((e for e in episodes if str(e.get("id")) == selected_episode_id), None)
            if episode:
                duration_mins = (episode.get("duration", 0) // 60) if episode.get("duration") else 30
                # Schedule for tomorrow at the determined time
                event_date = week_start + timedelta(days=1)
                start_dt = datetime.combine(event_date, datetime.strptime(schedule_time, "%H:%M").time())
                end_dt = start_dt + timedelta(minutes=duration_mins)

                scheduled.append({
                    "episode_id": selected_episode_id,
                    "episode_title": episode.get("title", "Untitled"),
                    "day": event_date.strftime("%A"),
                    "start_time": start_dt.isoformat(),
                    "end_time": end_dt.isoformat(),
                })
        else:
            # Pick the most recent unscheduled episode
            for episode in episodes:
                episode_id = str(episode.get("id"))
                if episode_id not in existing_episode_events:
                    duration_mins = (episode.get("duration", 0) // 60) if episode.get("duration") else 30
                    event_date = week_start + timedelta(days=1)
                    start_dt = datetime.combine(event_date, datetime.strptime(schedule_time, "%H:%M").time())
                    end_dt = start_dt + timedelta(minutes=duration_mins)

                    scheduled.append({
                        "episode_id": episode_id,
                        "episode_title": episode.get("title", "Untitled"),
                        "day": event_date.strftime("%A"),
                        "start_time": start_dt.isoformat(),
                        "end_time": end_dt.isoformat(),
                    })
                    break

        reasoning = f"Scheduled {podcast_title} for {schedule_context} using rule-based scheduling."
        if reasoning_parts:
            reasoning = f"Scheduled {podcast_title} {', '.join(reasoning_parts)} using rule-based scheduling."

        return {
            "scheduled_episodes": scheduled,
            "reasoning": reasoning,
            "warnings": [],
        }
