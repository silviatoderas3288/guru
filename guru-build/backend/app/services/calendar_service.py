"""Google Calendar service for OAuth and event management."""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.auth.transport.requests import Request
import logging
import os

logger = logging.getLogger(__name__)


class CalendarService:
    """Service for Google Calendar operations."""

    SCOPES = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
    ]

    def __init__(self, tokens: Dict[str, Any], client_id: Optional[str] = None, client_secret: Optional[str] = None):
        """
        Initialize calendar service with OAuth tokens.

        Args:
            tokens: Dictionary containing access_token and refresh_token
            client_id: OAuth client ID (uses env var if not provided)
            client_secret: OAuth client secret (uses env var if not provided)
        """
        self._timezone_cache = {}  # Cache for calendar timezones

        try:
            # Get client credentials from environment if not provided
            # These are needed for the Google library to auto-refresh tokens
            if not client_id:
                client_id = os.getenv('GOOGLE_CLIENT_ID')
            if not client_secret:
                client_secret = os.getenv('GOOGLE_CLIENT_SECRET')

            # Create credentials with all required fields for auto-refresh (if refresh token available)
            # If we have a refresh token, Google's library can automatically get new access tokens
            # If not, the access token will be used until it expires (1 hour)
            refresh_token = tokens.get('refresh_token')

            self.credentials = Credentials(
                token=tokens.get('access_token'),
                refresh_token=refresh_token if refresh_token else None,
                token_uri='https://oauth2.googleapis.com/token',
                client_id=client_id if refresh_token else None,
                client_secret=client_secret if refresh_token else None,
                scopes=self.SCOPES
            )

            logger.info(f"Created credentials with token: {tokens.get('access_token')[:20] if tokens.get('access_token') else 'None'}...")
            logger.info(f"Refresh token available: {bool(refresh_token)}")
            if refresh_token:
                logger.info("Google library will auto-refresh tokens when they expire")
            else:
                logger.warning("No refresh token - access token will expire in ~1 hour, user will need to re-authenticate")

            # Build the calendar service
            self.service = build('calendar', 'v3', credentials=self.credentials)
            logger.info("Calendar service built successfully")
        except ValueError:
            # Re-raise ValueError (token expired/refresh failed)
            raise
        except Exception as e:
            logger.error(f"Error initializing calendar service: {e}", exc_info=True)
            raise

    def get_calendar_timezone(self, calendar_id: str = 'primary') -> str:
        """
        Get the timezone of a specific calendar.

        Args:
            calendar_id: Calendar ID (defaults to primary)

        Returns:
            Timezone string (e.g., 'America/Los_Angeles', 'UTC')
        """
        # Return cached timezone if available
        if calendar_id in self._timezone_cache:
            return self._timezone_cache[calendar_id]

        try:
            calendar = self.service.calendars().get(calendarId=calendar_id).execute()
            timezone = calendar.get('timeZone', 'UTC')
            self._timezone_cache[calendar_id] = timezone
            return timezone
        except Exception as e:
            logger.error(f"Error fetching calendar timezone: {e}")
            return 'UTC'

    def get_events(
        self,
        time_min: Optional[datetime] = None,
        time_max: Optional[datetime] = None,
        calendar_id: str = 'primary',
        max_results: int = 250
    ) -> List[Dict[str, Any]]:
        """
        Fetch calendar events within a time range.

        Args:
            time_min: Start time (defaults to now)
            time_max: End time (defaults to 7 days from now)
            calendar_id: Calendar ID (defaults to primary)
            max_results: Maximum number of events to return

        Returns:
            List of event dictionaries
        """
        try:
            if not time_min:
                time_min = datetime.utcnow()
            if not time_max:
                time_max = time_min + timedelta(days=7)

            # Format datetime for Google Calendar API
            # If datetime is naive (no timezone), append 'Z' for UTC
            # If datetime is timezone-aware, use isoformat() which includes timezone
            def format_datetime(dt: datetime) -> str:
                if dt.tzinfo is None:
                    return dt.isoformat() + 'Z'
                else:
                    # Replace '+00:00' with 'Z' for UTC, or keep as-is
                    iso_str = dt.isoformat()
                    if iso_str.endswith('+00:00'):
                        return iso_str[:-6] + 'Z'
                    return iso_str

            events_result = self.service.events().list(
                calendarId=calendar_id,
                timeMin=format_datetime(time_min),
                timeMax=format_datetime(time_max),
                maxResults=max_results,
                singleEvents=True,
                orderBy='startTime'
            ).execute()

            events = events_result.get('items', [])
            logger.info(f"Fetched {len(events)} events from {time_min} to {time_max}")
            return events

        except HttpError as error:
            logger.error(f"Error fetching events: {error}")
            raise

    def create_event(
        self,
        summary: str,
        start_time: datetime,
        end_time: datetime,
        description: Optional[str] = None,
        location: Optional[str] = None,
        color_id: Optional[str] = None,
        calendar_id: str = 'primary'
    ) -> Dict[str, Any]:
        """
        Create a new calendar event.

        Args:
            summary: Event title
            start_time: Event start time
            end_time: Event end time
            description: Event description (optional)
            location: Event location (optional)
            color_id: Google Calendar color ID 1-11 (optional)
            calendar_id: Calendar ID (defaults to primary)

        Returns:
            Created event dictionary
        """
        try:
            # Validate that start_time is before end_time
            if start_time >= end_time:
                raise ValueError(f"Start time ({start_time}) must be before end time ({end_time})")

            logger.info(f"Creating event '{summary}' from {start_time.isoformat()} to {end_time.isoformat()}")

            event = {
                'summary': summary,
                'start': {
                    'dateTime': start_time.isoformat(),
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                },
            }

            # If datetimes are naive (no timezone info), we MUST specify the calendar's timezone
            # defaulting to 'UTC' was causing the "off by 5 hours" bug for users in EST
            if start_time.tzinfo is None or end_time.tzinfo is None:
                # Fetch the actual timezone of the calendar (e.g., 'America/New_York')
                calendar_timezone = self.get_calendar_timezone(calendar_id)
                logger.info(f"Naive datetime detected. Using calendar timezone: {calendar_timezone}")
                
                if start_time.tzinfo is None:
                    event['start']['timeZone'] = calendar_timezone
                if end_time.tzinfo is None:
                    event['end']['timeZone'] = calendar_timezone

            if description:
                event['description'] = description
            if location:
                event['location'] = location
            if color_id:
                event['colorId'] = color_id

            logger.info(f"Event payload: {event}")

            created_event = self.service.events().insert(
                calendarId=calendar_id,
                body=event
            ).execute()

            logger.info(f"Successfully created event: {summary} at {start_time}")
            return created_event

        except HttpError as error:
            logger.error(f"HttpError creating event: {error}")
            logger.error(f"Event details - summary: '{summary}', start: {start_time}, end: {end_time}")
            raise
        except ValueError as error:
            logger.error(f"ValueError: {error}")
            raise

    def update_event(
        self,
        event_id: str,
        summary: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        description: Optional[str] = None,
        location: Optional[str] = None,
        color_id: Optional[str] = None,
        calendar_id: str = 'primary'
    ) -> Dict[str, Any]:
        """
        Update an existing calendar event.

        Args:
            event_id: ID of the event to update
            summary: New event title (optional)
            start_time: New start time (optional)
            end_time: New end time (optional)
            description: New description (optional)
            location: New location (optional)
            color_id: Google Calendar color ID 1-11 (optional)
            calendar_id: Calendar ID (defaults to primary)

        Returns:
            Updated event dictionary
        """
        try:
            # First fetch the existing event
            event = self.service.events().get(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()

            # Get calendar timezone in case we need it for naive datetimes
            calendar_timezone = None

            # Update fields if provided
            if summary:
                event['summary'] = summary
            if start_time:
                event['start'] = {
                    'dateTime': start_time.isoformat(),
                }
                # Only add explicit timeZone for naive datetimes
                if start_time.tzinfo is None:
                    if not calendar_timezone:
                        calendar_timezone = self.get_calendar_timezone(calendar_id)
                    event['start']['timeZone'] = calendar_timezone
            if end_time:
                event['end'] = {
                    'dateTime': end_time.isoformat(),
                }
                # Only add explicit timeZone for naive datetimes
                if end_time.tzinfo is None:
                    if not calendar_timezone:
                        calendar_timezone = self.get_calendar_timezone(calendar_id)
                    event['end']['timeZone'] = calendar_timezone
            if description is not None:
                event['description'] = description
            if location is not None:
                event['location'] = location
            if color_id is not None:
                event['colorId'] = color_id

            updated_event = self.service.events().update(
                calendarId=calendar_id,
                eventId=event_id,
                body=event
            ).execute()

            logger.info(f"Updated event: {event_id}")
            return updated_event

        except HttpError as error:
            # Handle 404 Not Found or 410 Gone - event was deleted externally
            if error.resp.status in [404, 410]:
                logger.warning(f"Event {event_id} not found or was deleted, cannot update")
                raise ValueError(f"Calendar event {event_id} no longer exists")

            logger.error(f"Error updating event: {error}")
            raise

    def delete_event(
        self,
        event_id: str,
        calendar_id: str = 'primary'
    ) -> bool:
        """
        Delete a calendar event.

        Args:
            event_id: ID of the event to delete
            calendar_id: Calendar ID (defaults to primary)

        Returns:
            True if successful
        """
        try:
            self.service.events().delete(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()

            logger.info(f"Deleted event: {event_id}")
            return True

        except HttpError as error:
            # Handle 410 Gone - resource already deleted
            if error.resp.status == 410:
                logger.info(f"Event {event_id} was already deleted, treating as success")
                return True

            logger.error(f"Error deleting event: {error}")
            raise

    def get_available_slots(
        self,
        start_date: datetime,
        end_date: datetime,
        slot_duration: int = 30,
        working_hours_start: int = 9,
        working_hours_end: int = 17,
        calendar_id: str = 'primary'
    ) -> List[Dict[str, datetime]]:
        """
        Calculate available time slots based on existing events.

        Args:
            start_date: Start of the period to check
            end_date: End of the period to check
            slot_duration: Duration of each slot in minutes
            working_hours_start: Start of working hours (hour, 0-23)
            working_hours_end: End of working hours (hour, 0-23)
            calendar_id: Calendar ID (defaults to primary)

        Returns:
            List of available slots with 'start' and 'end' datetime
        """
        try:
            # Fetch all events in the period
            events = self.get_events(
                time_min=start_date,
                time_max=end_date,
                calendar_id=calendar_id
            )

            # Convert events to busy periods
            busy_periods = []
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))

                # Parse datetime strings
                if 'T' in start:
                    start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                    end_dt = datetime.fromisoformat(end.replace('Z', '+00:00'))
                    busy_periods.append({'start': start_dt, 'end': end_dt})

            # Sort busy periods by start time
            busy_periods.sort(key=lambda x: x['start'])

            # Generate available slots
            available_slots = []
            current_date = start_date.date()

            while current_date <= end_date.date():
                # Define working hours for this day
                day_start = datetime.combine(current_date, datetime.min.time()).replace(
                    hour=working_hours_start, minute=0
                )
                day_end = datetime.combine(current_date, datetime.min.time()).replace(
                    hour=working_hours_end, minute=0
                )

                # Generate slots for this day
                current_slot_start = day_start
                while current_slot_start < day_end:
                    slot_end = current_slot_start + timedelta(minutes=slot_duration)

                    # Check if slot overlaps with any busy period
                    is_available = True
                    for busy in busy_periods:
                        if (current_slot_start < busy['end'] and slot_end > busy['start']):
                            is_available = False
                            break

                    if is_available and slot_end <= day_end:
                        available_slots.append({
                            'start': current_slot_start,
                            'end': slot_end
                        })

                    current_slot_start = slot_end

                current_date += timedelta(days=1)

            logger.info(f"Found {len(available_slots)} available slots")
            return available_slots

        except HttpError as error:
            logger.error(f"Error calculating available slots: {error}")
            raise

    def get_updated_tokens(self) -> Dict[str, Any]:
        """
        Get potentially refreshed tokens.
        If Google auto-refreshed the access token, this will return the new token.

        Returns:
            Dictionary with current access_token and refresh_token
        """
        return {
            'access_token': self.credentials.token,
            'refresh_token': self.credentials.refresh_token,
        }
