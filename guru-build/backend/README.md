# Guru Backend API

FastAPI backend for the Guru personal productivity and wellness application.

## Features

- **FastAPI** - Modern, fast web framework for building APIs
- **PostgreSQL** - Reliable relational database with JSONB support
- **SQLAlchemy** - Powerful ORM for database operations
- **Alembic** - Database migration tool
- **Google Calendar API** - Calendar integration
- **Celery + Redis** - Background task processing

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Redis (for Celery tasks)

### Installation

1. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Create PostgreSQL database:
```bash
createdb guru_db
```

5. Run database migrations:
```bash
alembic upgrade head
```

### Running the Application

Development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## Database Schema

The application uses the following models:

- **Users** - User authentication and preferences
- **Tasks** - To-do items with priority and scheduling
- **TimeBlocks** - Protected time (sleep, unwind, workout, journal)
- **Resolutions** - New Year's goals tracking
- **BingoItems** - Gamified achievement board
- **MediaPreferences** - User media genre and topic preferences
- **MediaFeedback** - Learning from user likes/dislikes

## API Endpoints

### Authentication
- `POST /api/v1/auth/google` - Google OAuth login
- `POST /api/v1/auth/refresh` - Refresh access token

### Tasks
- `GET /api/v1/tasks` - List all tasks
- `POST /api/v1/tasks` - Create a new task
- `GET /api/v1/tasks/{id}` - Get task details
- `PUT /api/v1/tasks/{id}` - Update task
- `DELETE /api/v1/tasks/{id}` - Delete task

### Calendar
- `GET /api/v1/calendar/events` - Get calendar events
- `POST /api/v1/calendar/schedule` - Auto-schedule tasks

### Media
- `GET /api/v1/media/recommendations` - Get personalized recommendations
- `POST /api/v1/media/feedback` - Submit like/dislike feedback

### Resolutions
- `GET /api/v1/resolutions` - List resolutions
- `POST /api/v1/resolutions` - Create resolution
- `PUT /api/v1/resolutions/{id}/progress` - Update progress

### Settings
- `GET /api/v1/settings` - Get user settings
- `PUT /api/v1/settings` - Update user settings

## Development

### Creating a new migration

```bash
alembic revision --autogenerate -m "description of changes"
alembic upgrade head
```

### Running tests

```bash
pytest
```

### Code formatting

```bash
black app/
ruff check app/ --fix
```

## Project Structure

```
backend/
├── alembic/              # Database migrations
│   ├── versions/         # Migration files
│   └── env.py           # Alembic environment
├── app/
│   ├── models/          # SQLAlchemy models
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   ├── database.py      # Database connection
│   └── main.py          # FastAPI app
├── requirements.txt     # Python dependencies
├── alembic.ini         # Alembic configuration
└── .env.example        # Environment variables template
```

## License

MIT
