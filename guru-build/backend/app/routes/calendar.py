"""Calendar API routes."""

from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.calendar import (
    CalendarEventCreate,
    CalendarEventUpdate,
    CalendarEvent,
    AvailableSlotsRequest,
    AvailableSlotsResponse,
    AvailableSlot,
    GoogleTokens
)
from app.services.calendar_service import CalendarService
from app.models.user import User

router = APIRouter()


# Dependency to get current user (placeholder - implement with your auth system)
async def get_current_user(db: Session = Depends(get_db)) -> User:
    """
    Get current authenticated user.
    For development, returns the most recently updated user.
    TODO: Implement proper authentication middleware with JWT tokens
    """
    # For now, return the most recently updated user (development only)
    user = db.query(User).order_by(User.updated_at.desc()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No user found. Please authenticate with Google first by calling POST /api/v1/calendar/oauth/tokens"
        )
    return user


def get_calendar_service(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> CalendarService:
    """
    Get calendar service instance for current user.
    Automatically refreshes tokens if expired and saves them back to database.

    Args:
        user: Current authenticated user
        db: Database session

    Returns:
        CalendarService instance

    Raises:
        HTTPException: If user doesn't have Google tokens
    """
    import logging
    logger = logging.getLogger(__name__)

    if not user.google_tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has not connected Google Calendar. Please authenticate with Google."
        )

    # Get tokens from database
    token_data = user.google_tokens.copy()

    # Create calendar service (will auto-refresh if needed)
    calendar_service = CalendarService(tokens=token_data)

    # Check if tokens were refreshed and save them back to database
    updated_tokens = calendar_service.get_updated_tokens()
    if updated_tokens.get('access_token') != token_data.get('access_token'):
        logger.info("Tokens were refreshed, updating database...")
        user.google_tokens = updated_tokens
        db.commit()
        logger.info("Updated tokens saved to database")

    return calendar_service


@router.post("/oauth/tokens", status_code=status.HTTP_200_OK)
async def save_google_tokens(
    tokens: GoogleTokens,
    email: str = None,
    db: Session = Depends(get_db)
):
    """
    Save Google OAuth tokens for the user.
    Creates a new user if one doesn't exist.

    Note: iOS mobile clients typically don't provide refresh tokens.
    Access tokens expire after ~1 hour, requiring user re-authentication.

    Args:
        tokens: Google OAuth tokens (access_token required, refresh_token optional)
        email: User's email (optional, will be fetched from Google if not provided)
        db: Database session

    Returns:
        Success message
    """
    import logging
    import requests
    import os

    logger = logging.getLogger(__name__)

    try:
        access_token = tokens.access_token
        refresh_token = tokens.refresh_token

        # Check if refresh_token is actually a server auth code (starts with "4/")
        # Server auth codes can be exchanged for access token + refresh token
        if refresh_token and refresh_token.startswith('4/'):
            logger.info("📱 Detected server auth code from mobile app, exchanging for refresh token...")

            # Exchange server auth code for tokens
            token_exchange_response = requests.post(
                'https://oauth2.googleapis.com/token',
                data={
                    'code': refresh_token,
                    'client_id': os.getenv('GOOGLE_CLIENT_ID'),
                    'client_secret': os.getenv('GOOGLE_CLIENT_SECRET'),
                    'redirect_uri': '',  # Empty for mobile
                    'grant_type': 'authorization_code',
                }
            )

            if token_exchange_response.ok:
                token_data = token_exchange_response.json()
                # Update with tokens from exchange
                access_token = token_data.get('access_token', access_token)
                refresh_token = token_data.get('refresh_token')  # Real refresh token!
                logger.info(f"✅ Successfully exchanged auth code. Refresh token obtained: {bool(refresh_token)}")
            else:
                logger.error(f"❌ Failed to exchange auth code: {token_exchange_response.text}")
                # Continue with original tokens (will work but no refresh capability)
                refresh_token = None

        # Try to get user info from Google to get email
        if not email:
            headers = {'Authorization': f'Bearer {access_token}'}
            user_info_response = requests.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers=headers
            )
            if user_info_response.ok:
                user_info = user_info_response.json()
                email = user_info.get('email')

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not determine user email"
            )

        # Find or create user
        user = db.query(User).filter(User.email == email).first()

        # Prepare token data
        token_dict = {
            'access_token': access_token,
            'refresh_token': refresh_token,
        }

        if not user:
            # Create new user
            user = User(email=email, google_tokens=token_dict)
            db.add(user)
            logger.info(f"Created new user {email}")
        else:
            # Update existing user's tokens
            user.google_tokens = token_dict
            logger.info(f"Updated tokens for user {email}")

        db.commit()

        if refresh_token:
            logger.info(f"✅ Saved tokens with refresh capability for {email}")
        else:
            logger.warning(f"⚠️  Saved access token only for {email} - user will need to re-auth when token expires (~1 hour)")

        return {
            "message": "Google tokens saved successfully",
            "user_id": str(user.id),
            "email": user.email,
            "has_refresh_token": bool(refresh_token)
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving tokens: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save tokens: {str(e)}"
        )


@router.get("/events", response_model=List[CalendarEvent])
async def get_calendar_events(
    time_min: datetime = None,
    time_max: datetime = None,
    calendar_service: CalendarService = Depends(get_calendar_service)
):
    """
    Fetch calendar events for the user.

    Args:
        time_min: Start time for events (optional)
        time_max: End time for events (optional)
        calendar_service: Calendar service instance

    Returns:
        List of calendar events
    """
    import logging
    logger = logging.getLogger(__name__)

    try:
        logger.info(f"Fetching events from {time_min} to {time_max}")
        events = calendar_service.get_events(time_min=time_min, time_max=time_max)
        logger.info(f"Retrieved {len(events)} events from Google Calendar")

        # Convert Google Calendar event format to our schema
        formatted_events = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))

            formatted_events.append(CalendarEvent(
                id=event['id'],
                summary=event.get('summary', 'No title'),
                description=event.get('description'),
                location=event.get('location'),
                start_time=datetime.fromisoformat(start.replace('Z', '+00:00')),
                end_time=datetime.fromisoformat(end.replace('Z', '+00:00')),
                color_id=event.get('colorId'),
                html_link=event.get('htmlLink'),
                created=datetime.fromisoformat(event['created'].replace('Z', '+00:00')) if event.get('created') else None,
                updated=datetime.fromisoformat(event['updated'].replace('Z', '+00:00')) if event.get('updated') else None
            ))

        return formatted_events
    except Exception as e:
        logger.error(f"Error fetching calendar events: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch events: {str(e)}"
        )


@router.post("/events", response_model=CalendarEvent, status_code=status.HTTP_201_CREATED)
async def create_calendar_event(
    event_data: CalendarEventCreate,
    calendar_service: CalendarService = Depends(get_calendar_service)
):
    """
    Create a new calendar event.

    Args:
        event_data: Event data
        calendar_service: Calendar service instance

    Returns:
        Created calendar event
    """
    try:
        event = calendar_service.create_event(
            summary=event_data.summary,
            start_time=event_data.start_time,
            end_time=event_data.end_time,
            description=event_data.description,
            location=event_data.location,
            color_id=event_data.color_id
        )

        start = event['start'].get('dateTime', event['start'].get('date'))
        end = event['end'].get('dateTime', event['end'].get('date'))

        return CalendarEvent(
            id=event['id'],
            summary=event.get('summary', 'No title'),
            description=event.get('description'),
            location=event.get('location'),
            start_time=datetime.fromisoformat(start.replace('Z', '+00:00')),
            end_time=datetime.fromisoformat(end.replace('Z', '+00:00')),
            color_id=event.get('colorId'),
            html_link=event.get('htmlLink'),
            created=datetime.fromisoformat(event['created'].replace('Z', '+00:00')) if event.get('created') else None,
            updated=datetime.fromisoformat(event['updated'].replace('Z', '+00:00')) if event.get('updated') else None
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create event: {str(e)}"
        )


@router.put("/events/{event_id}", response_model=CalendarEvent)
async def update_calendar_event(
    event_id: str,
    event_data: CalendarEventUpdate,
    calendar_service: CalendarService = Depends(get_calendar_service)
):
    """
    Update an existing calendar event.

    Args:
        event_id: Event ID
        event_data: Updated event data
        calendar_service: Calendar service instance

    Returns:
        Updated calendar event
    """
    try:
        event = calendar_service.update_event(
            event_id=event_id,
            summary=event_data.summary,
            start_time=event_data.start_time,
            end_time=event_data.end_time,
            description=event_data.description,
            location=event_data.location,
            color_id=event_data.color_id
        )

        start = event['start'].get('dateTime', event['start'].get('date'))
        end = event['end'].get('dateTime', event['end'].get('date'))

        return CalendarEvent(
            id=event['id'],
            summary=event.get('summary', 'No title'),
            description=event.get('description'),
            location=event.get('location'),
            start_time=datetime.fromisoformat(start.replace('Z', '+00:00')),
            end_time=datetime.fromisoformat(end.replace('Z', '+00:00')),
            color_id=event.get('colorId'),
            html_link=event.get('htmlLink'),
            created=datetime.fromisoformat(event['created'].replace('Z', '+00:00')) if event.get('created') else None,
            updated=datetime.fromisoformat(event['updated'].replace('Z', '+00:00')) if event.get('updated') else None
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update event: {str(e)}"
        )


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calendar_event(
    event_id: str,
    calendar_service: CalendarService = Depends(get_calendar_service)
):
    """
    Delete a calendar event.

    Args:
        event_id: Event ID
        calendar_service: Calendar service instance

    Returns:
        No content
    """
    try:
        calendar_service.delete_event(event_id=event_id)
        return None
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete event: {str(e)}"
        )


@router.post("/available-slots", response_model=AvailableSlotsResponse)
async def get_available_slots(
    request: AvailableSlotsRequest,
    calendar_service: CalendarService = Depends(get_calendar_service)
):
    """
    Get available time slots based on calendar events and working hours.

    Args:
        request: Available slots request parameters
        calendar_service: Calendar service instance

    Returns:
        List of available time slots
    """
    try:
        slots = calendar_service.get_available_slots(
            start_date=request.start_date,
            end_date=request.end_date,
            slot_duration=request.slot_duration,
            working_hours_start=request.working_hours_start,
            working_hours_end=request.working_hours_end
        )

        formatted_slots = [
            AvailableSlot(
                start=slot['start'],
                end=slot['end'],
                duration_minutes=request.slot_duration
            )
            for slot in slots
        ]

        return AvailableSlotsResponse(
            slots=formatted_slots,
            count=len(formatted_slots)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get available slots: {str(e)}"
        )
