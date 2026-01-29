"""Celery configuration for background tasks."""

import os
from celery import Celery
from celery.schedules import crontab

# Get Redis URL from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    "guru_app",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks.weekly_cleanup"]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes max
    result_expires=3600,  # Results expire after 1 hour
)

# Celery Beat schedule - runs tasks at specific times
celery_app.conf.beat_schedule = {
    # Run weekly cleanup every Sunday at midnight UTC
    "weekly-cleanup-and-reschedule": {
        "task": "app.tasks.weekly_cleanup.cleanup_and_reschedule_tasks",
        "schedule": crontab(hour=0, minute=0, day_of_week=0),  # Sunday at 00:00 UTC
    },
}

# Optional: Add additional schedules for different timezones
# Users can configure their timezone in preferences, and we'll handle it in the task
