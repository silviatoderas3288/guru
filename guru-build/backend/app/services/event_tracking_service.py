"""Service for tracking user listening events and interactions."""

import logging
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.podcast_recommendation import (
    ListeningSession,
    PodcastInteraction,
    InteractionType,
)

logger = logging.getLogger(__name__)


class EventTrackingService:
    """Service for recording user listening events and interactions.

    Collects signals that feed into the ML recommendation system:
    - Listening sessions track implicit feedback (completion rate, seeks)
    - Interactions track explicit feedback (likes, dislikes, saves)
    """

    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user

    def start_listening_session(
        self,
        episode_id: str,
        podcast_id: str,
        episode_duration_seconds: int,
        context: Optional[str] = None,
        device_type: Optional[str] = None
    ) -> ListeningSession:
        """Start a new listening session.

        Args:
            episode_id: External episode ID from Podcast Index
            podcast_id: External podcast/feed ID from Podcast Index
            episode_duration_seconds: Total duration of the episode
            context: Listening context (commute, chore, workout, etc.)
            device_type: Device type (mobile, web)

        Returns:
            The created ListeningSession
        """
        session = ListeningSession(
            user_id=self.user.id,
            episode_external_id=episode_id,
            podcast_external_id=podcast_id,
            started_at=datetime.utcnow(),
            episode_duration_seconds=episode_duration_seconds,
            listening_context=context,
            device_type=device_type,
            listened_duration_seconds=0,
            completion_rate=0.0,
            pause_count=0,
            seek_forward_count=0,
            seek_backward_count=0,
            playback_speed=1.0,
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)

        logger.info(
            f"Started listening session {session.id} for user {self.user.id}, "
            f"episode {episode_id}, podcast {podcast_id}"
        )
        return session

    def update_listening_session(
        self,
        session_id: UUID,
        listened_duration_seconds: int,
        pause_count: Optional[int] = None,
        seek_forward_count: Optional[int] = None,
        seek_backward_count: Optional[int] = None,
        playback_speed: Optional[float] = None
    ) -> Optional[ListeningSession]:
        """Update an ongoing listening session with progress.

        Args:
            session_id: The session to update
            listened_duration_seconds: How much has been listened so far
            pause_count: Number of pauses
            seek_forward_count: Number of forward seeks
            seek_backward_count: Number of backward seeks (engagement signal)
            playback_speed: Current playback speed

        Returns:
            The updated session, or None if not found
        """
        session = self.db.query(ListeningSession).filter_by(
            id=session_id,
            user_id=self.user.id
        ).first()

        if not session:
            logger.warning(f"Session {session_id} not found for user {self.user.id}")
            return None

        session.listened_duration_seconds = listened_duration_seconds

        # Calculate completion rate
        if session.episode_duration_seconds and session.episode_duration_seconds > 0:
            session.completion_rate = min(
                1.0,
                listened_duration_seconds / session.episode_duration_seconds
            )

        # Update optional fields if provided
        if pause_count is not None:
            session.pause_count = pause_count
        if seek_forward_count is not None:
            session.seek_forward_count = seek_forward_count
        if seek_backward_count is not None:
            session.seek_backward_count = seek_backward_count
        if playback_speed is not None:
            session.playback_speed = playback_speed

        self.db.commit()

        logger.debug(
            f"Updated session {session_id}: {session.completion_rate:.1%} completion"
        )
        return session

    def end_listening_session(self, session_id: UUID) -> Optional[ListeningSession]:
        """End a listening session.

        Args:
            session_id: The session to end

        Returns:
            The ended session, or None if not found
        """
        session = self.db.query(ListeningSession).filter_by(
            id=session_id,
            user_id=self.user.id
        ).first()

        if not session:
            logger.warning(f"Session {session_id} not found for user {self.user.id}")
            return None

        session.ended_at = datetime.utcnow()
        self.db.commit()

        logger.info(
            f"Ended session {session_id}: {session.completion_rate:.1%} completion, "
            f"{session.listened_duration_seconds}s listened, "
            f"{session.seek_backward_count} rewinds"
        )
        return session

    def record_interaction(
        self,
        podcast_id: str,
        interaction_type: InteractionType,
        episode_id: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None
    ) -> PodcastInteraction:
        """Record an explicit user interaction.

        Args:
            podcast_id: External podcast ID
            interaction_type: Type of interaction (like, dislike, save, etc.)
            episode_id: Optional episode ID for episode-level interactions
            extra_data: Optional additional data

        Returns:
            The created interaction record
        """
        interaction = PodcastInteraction(
            user_id=self.user.id,
            podcast_external_id=podcast_id,
            episode_external_id=episode_id,
            interaction_type=interaction_type,
            interaction_timestamp=datetime.utcnow(),
            extra_data=extra_data,
        )
        self.db.add(interaction)
        self.db.commit()
        self.db.refresh(interaction)

        logger.info(
            f"Recorded {interaction_type.value} for podcast {podcast_id} "
            f"by user {self.user.id}"
        )
        return interaction

    def get_user_interactions(
        self,
        podcast_id: Optional[str] = None,
        interaction_type: Optional[InteractionType] = None,
        limit: int = 100
    ) -> list[PodcastInteraction]:
        """Get user's interactions, optionally filtered.

        Args:
            podcast_id: Filter by podcast
            interaction_type: Filter by interaction type
            limit: Maximum number to return

        Returns:
            List of interactions
        """
        query = self.db.query(PodcastInteraction).filter_by(user_id=self.user.id)

        if podcast_id:
            query = query.filter_by(podcast_external_id=podcast_id)
        if interaction_type:
            query = query.filter_by(interaction_type=interaction_type)

        return query.order_by(PodcastInteraction.interaction_timestamp.desc()).limit(limit).all()

    def get_listening_sessions(
        self,
        podcast_id: Optional[str] = None,
        min_completion_rate: float = 0.0,
        limit: int = 100
    ) -> list[ListeningSession]:
        """Get user's listening sessions, optionally filtered.

        Args:
            podcast_id: Filter by podcast
            min_completion_rate: Minimum completion rate to include
            limit: Maximum number to return

        Returns:
            List of listening sessions
        """
        query = self.db.query(ListeningSession).filter_by(user_id=self.user.id)

        if podcast_id:
            query = query.filter_by(podcast_external_id=podcast_id)
        if min_completion_rate > 0:
            query = query.filter(ListeningSession.completion_rate >= min_completion_rate)

        return query.order_by(ListeningSession.started_at.desc()).limit(limit).all()

    def has_liked_podcast(self, podcast_id: str) -> bool:
        """Check if user has liked a podcast."""
        return self.db.query(PodcastInteraction).filter_by(
            user_id=self.user.id,
            podcast_external_id=podcast_id,
            interaction_type=InteractionType.like
        ).first() is not None

    def has_disliked_podcast(self, podcast_id: str) -> bool:
        """Check if user has disliked a podcast."""
        return self.db.query(PodcastInteraction).filter_by(
            user_id=self.user.id,
            podcast_external_id=podcast_id,
            interaction_type=InteractionType.dislike
        ).first() is not None
