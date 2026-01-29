"""Main FastAPI application."""

# Load environment variables first, before any other imports
from pathlib import Path
from dotenv import load_dotenv

# Get the backend directory (parent of app directory)
backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Guru API",
    description="Personal Productivity & Wellness App API",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Log available AI providers on startup."""
    claude_key = os.getenv("ANTHROPIC_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    logger.info("--- AI Provider Status ---")
    logger.info(f"Anthropic (Claude): {'Available' if claude_key else 'Not Configured'}")
    logger.info(f"OpenAI (GPT-4): {'Available' if openai_key else 'Not Configured'}")
    logger.info("--------------------------")

    # Run database migrations
    try:
        from alembic.config import Config
        from alembic import command

        logger.info("Running database migrations...")
        alembic_ini_path = backend_dir / "alembic.ini"
        alembic_cfg = Config(str(alembic_ini_path))
        # Ensure script location is absolute to avoid CWD issues
        alembic_cfg.set_main_option("script_location", str(backend_dir / "alembic"))

        # Fix DATABASE_URL if needed (Render uses postgres:// but SQLAlchemy requires postgresql://)
        database_url = os.getenv("DATABASE_URL")
        if database_url and database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
            alembic_cfg.set_main_option("sqlalchemy.url", database_url)
            logger.info(f"Fixed DATABASE_URL scheme for SQLAlchemy")

        # Run upgrade
        command.upgrade(alembic_cfg, "head")
        logger.info("Database migrations completed successfully.")
    except Exception as e:
        logger.error(f"Error running database migrations: {e}", exc_info=True)

    # Ensure journal_entries table exists (workaround for migration issues)
    try:
        from sqlalchemy import inspect, text
        from app.database import engine

        inspector = inspect(engine)
        tables = inspector.get_table_names()

        if 'journal_entries' not in tables:
            logger.warning("journal_entries table missing, creating it now...")
            with engine.connect() as conn:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS journal_entries (
                        id SERIAL PRIMARY KEY,
                        user_id UUID NOT NULL REFERENCES users(id),
                        timestamp TIMESTAMP NOT NULL,
                        notes TEXT,
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW()
                    )
                """))
                conn.commit()
            logger.info("journal_entries table created successfully")
        else:
            logger.info("journal_entries table already exists")
    except Exception as e:
        logger.error(f"Error ensuring journal_entries table: {e}", exc_info=True)

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Guru API",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/debug/tables")
async def debug_tables():
    """Debug endpoint to check what tables exist in the database."""
    from sqlalchemy import inspect, text
    from app.database import engine

    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        # Also try to query the database directly
        with engine.connect() as conn:
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            db_tables = [row[0] for row in result]

        return {
            "inspector_tables": tables,
            "direct_query_tables": db_tables,
            "database_url": os.getenv("DATABASE_URL", "").split("@")[-1] if os.getenv("DATABASE_URL") else "Not set"
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/debug/users")
async def debug_users():
    """Debug endpoint to check users in database."""
    from sqlalchemy.orm import Session
    from app.database import get_db
    from app.models.user import User

    db = next(get_db())
    try:
        users = db.query(User).all()
        return {
            "user_count": len(users),
            "users": [{"id": str(u.id), "email": u.email, "created_at": u.created_at.isoformat(), "updated_at": u.updated_at.isoformat()} for u in users]
        }
    except Exception as e:
        return {"error": str(e), "type": type(e).__name__}
    finally:
        db.close()


@app.post("/admin/trigger-weekly-cleanup")
async def trigger_weekly_cleanup_manually():
    """
    Manual trigger for weekly cleanup task (for testing).
    In production, this runs automatically every Sunday at midnight.
    """
    from app.tasks.weekly_cleanup import cleanup_and_reschedule_tasks

    try:
        # Trigger the task asynchronously
        task = cleanup_and_reschedule_tasks.delay()

        return {
            "status": "success",
            "message": "Weekly cleanup task triggered",
            "task_id": task.id
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


# Import and include routers
from app.routes import calendar, bingo, journal, list_items, preferences, spotify, podcasts, workouts, schedule_agent, library, recommendations

app.include_router(calendar.router, prefix="/api/v1/calendar", tags=["calendar"])
app.include_router(bingo.router, prefix="/api/v1/bingo", tags=["bingo"])
app.include_router(journal.router, prefix="/api/v1/journal", tags=["journal"])
app.include_router(list_items.router, prefix="/api/v1/list-items", tags=["list-items"])
app.include_router(preferences.router, tags=["preferences"])
app.include_router(spotify.router, prefix="/api/v1/spotify", tags=["spotify"])
app.include_router(podcasts.router, prefix="/api/v1/podcasts", tags=["podcasts"])
app.include_router(workouts.router, prefix="/api/v1/workouts", tags=["workouts"])
app.include_router(schedule_agent.router, prefix="/api/v1/schedule/agent", tags=["schedule-agent"])
app.include_router(library.router, prefix="/api/v1/library", tags=["library"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["recommendations"])

# TODO: Add more routers as they are implemented
# from app.routes import tasks, media, resolutions, settings
# app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["tasks"])
# app.include_router(media.router, prefix="/api/v1/media", tags=["media"])
# app.include_router(resolutions.router, prefix="/api/v1/resolutions", tags=["resolutions"])
# app.include_router(settings.router, prefix="/api/v1/settings", tags=["settings"])
