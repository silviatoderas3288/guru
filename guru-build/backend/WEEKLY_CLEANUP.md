# Automatic Weekly Cleanup and Rescheduling

## Overview

The Guru app now includes an automatic weekly cleanup system that runs every **Sunday at midnight (00:00 UTC)** to:

1. **Delete completed tasks/goals from Google Calendar**
2. **Automatically reschedule uncompleted tasks** for the next week using the AI scheduling agent

## How It Works

### Scheduled Execution

- **Trigger**: Every Sunday at 00:00 UTC (midnight)
- **Technology**: Celery Beat (distributed task scheduler)
- **Scope**: All users in the system

### Cleanup Process (Per User)

#### Step 1: Identify Completed vs Uncompleted Items

The system queries all `ListItems` (Weekly Goals and TODOs) for each user and categorizes them as:
- **Completed**: `completed = True`
- **Uncompleted**: `completed = False`

#### Step 2: Delete Completed Items from Calendar

For each completed item:
1. If the item has a `calendar_event_id`, delete the event from Google Calendar
2. Remove the `calendar_event_id` from the database (set to `NULL`)
3. The list item itself remains in the database for historical tracking

**Result**: Completed tasks are removed from your calendar but stay in the database.

#### Step 3: Reschedule Uncompleted Items

For each uncompleted item:
1. Delete any existing calendar event (from last week's schedule)
2. Use the **AI Scheduling Agent** (Claude) to intelligently reschedule for next week
3. The agent considers:
   - Your preferences (wake time, bed time, timezone)
   - Existing calendar events (to avoid conflicts)
   - Task priorities
   - Optimal time slots based on energy levels
   - Workload balancing across the week

**Result**: Uncompleted tasks are automatically rescheduled for the next week with optimized time slots.

### What Gets Rescheduled

- **TODOs**: Scheduled across Monday-Friday of next week
- **Weekly Goals**: Carried over without specific calendar events (they're general goals, not time-specific tasks)

## Architecture

### Files

```
backend/
├── app/
│   ├── celery_config.py          # Celery app and Beat schedule configuration
│   ├── tasks/
│   │   ├── __init__.py
│   │   └── weekly_cleanup.py     # Main cleanup logic
│   └── main.py                   # Manual trigger endpoint for testing
└── start_celery.sh               # Startup script for local development
```

### Deployment (Render.com)

The `render.yaml` now includes:

1. **guru-redis**: Redis instance (free tier) for Celery message broker
2. **guru-celery-worker**: Background worker service
3. **guru-celery-beat**: Scheduler service (triggers tasks at scheduled times)

### Database Changes

No new database tables required! The system uses existing models:
- `ListItem`: Stores tasks/goals with `completed` flag and `calendar_event_id`
- `User`: User data and preferences
- `UserPreference`: Scheduling preferences (wake time, bed time, etc.)

## Testing

### Manual Trigger (For Testing Only)

You can manually trigger the weekly cleanup without waiting for Sunday:

**Endpoint**: `POST /admin/trigger-weekly-cleanup`

**Example**:
```bash
curl -X POST https://guru-api.onrender.com/admin/trigger-weekly-cleanup
```

**Response**:
```json
{
  "status": "success",
  "message": "Weekly cleanup task triggered",
  "task_id": "abc123..."
}
```

### Local Development

To run Celery locally:

1. **Start Redis**:
   ```bash
   docker run -d -p 6379:6379 redis:alpine
   # OR
   brew services start redis  # macOS
   ```

2. **Start Celery Worker**:
   ```bash
   cd backend
   celery -A app.celery_config:celery_app worker --loglevel=info
   ```

3. **Start Celery Beat (Scheduler)**:
   ```bash
   cd backend
   celery -A app.celery_config:celery_app beat --loglevel=info
   ```

4. **Or use the startup script**:
   ```bash
   cd backend
   ./start_celery.sh
   ```

### Monitoring

Check Celery logs in Render:
1. Go to Render Dashboard
2. Select `guru-celery-worker` or `guru-celery-beat`
3. View logs to see task execution

## Configuration

### Change Schedule Time

Edit `backend/app/celery_config.py`:

```python
celery_app.conf.beat_schedule = {
    "weekly-cleanup-and-reschedule": {
        "task": "app.tasks.weekly_cleanup.cleanup_and_reschedule_tasks",
        "schedule": crontab(hour=0, minute=0, day_of_week=0),  # Sunday at 00:00 UTC
    },
}
```

**Examples**:
- Every day at midnight: `crontab(hour=0, minute=0)`
- Every Monday at 6 AM: `crontab(hour=6, minute=0, day_of_week=1)`
- Twice a week (Wed & Sun): `crontab(hour=0, minute=0, day_of_week='0,3')`

### User Timezone Handling

The task runs at 00:00 UTC for all users. To make it timezone-aware:

1. Users configure their timezone in `UserPreference.timezone`
2. The cleanup task can be modified to run at their local midnight
3. Currently: Single global run at midnight UTC

## How PageTwo Displays Results

**PageTwo** (`mobile/src/screens/PageTwo.tsx`) shows:
- Podcast schedule recommendations
- Workout schedule recommendations

**After auto-rescheduling**, users can:
- View their updated calendar in the Calendar screen
- See rescheduled TODOs in their task list
- Get notifications for newly scheduled items

The AI agent automatically schedules based on preferences set in PageTwo's preference configuration.

## Logging

All cleanup operations are logged:

```
INFO: Starting weekly cleanup and reschedule task
INFO: Processing 5 users
INFO: Processing cleanup for user: user@example.com
INFO: User user@example.com: 8 completed items, 3 uncompleted items
INFO: Deleted 8 calendar events for completed items
INFO: Scheduled 2 todos for 2025-02-03
INFO: Scheduled 1 todos for 2025-02-04
INFO: Rescheduled 3 uncompleted items
INFO: Cleanup complete for user: user@example.com
INFO: Weekly cleanup and reschedule task completed
```

## Security

- The manual trigger endpoint (`/admin/trigger-weekly-cleanup`) should be restricted to admin users in production
- Consider adding authentication to prevent unauthorized triggering
- Celery tasks run with the same database and API credentials as the main app

## Future Enhancements

1. **User notifications**: Send push notifications about rescheduled tasks
2. **Timezone-aware scheduling**: Run cleanup at each user's local midnight
3. **Customizable cleanup frequency**: Let users choose daily/weekly/monthly
4. **Rollover limits**: Limit how many times a task can be auto-rescheduled
5. **Progress tracking**: Show users which tasks have been auto-rescheduled vs manually scheduled
6. **Smart prioritization**: Increase priority of repeatedly rolled-over tasks

## Troubleshooting

### Task Not Running

1. Check Celery Beat logs: `guru-celery-beat` service in Render
2. Verify Redis is running: Check `guru-redis` in Render
3. Check cron schedule: `crontab(hour=0, minute=0, day_of_week=0)`

### Tasks Not Rescheduling

1. Check Celery Worker logs: `guru-celery-worker` service
2. Verify AI API keys are set (ANTHROPIC_API_KEY)
3. Check Google Calendar API credentials
4. Verify user has `UserPreference` configured

### Calendar Events Not Deleting

1. Check Google OAuth tokens are valid
2. Verify `calendar_event_id` exists in database
3. Check user has granted Calendar API permissions

## Dependencies

Required packages (already in `requirements.txt`):
- `celery>=5.4.0`
- `redis>=5.2.0`
- Google Calendar API dependencies
- Anthropic API (for AI scheduling)
