#!/bin/bash
# Start Celery worker and beat scheduler

# Start Celery worker in the background
celery -A app.celery_config:celery_app worker --loglevel=info &

# Start Celery beat scheduler (for scheduled tasks)
celery -A app.celery_config:celery_app beat --loglevel=info &

# Keep the script running
wait
