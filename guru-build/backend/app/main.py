"""Main FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


# Import and include routers
from app.routes import calendar, bingo, journal, list_items, preferences, spotify, podcasts

app.include_router(calendar.router, prefix="/api/v1/calendar", tags=["calendar"])
app.include_router(bingo.router, prefix="/api/v1/bingo", tags=["bingo"])
app.include_router(journal.router, prefix="/api/v1/journal", tags=["journal"])
app.include_router(list_items.router, prefix="/api/v1/list-items", tags=["list-items"])
app.include_router(preferences.router, tags=["preferences"])
app.include_router(spotify.router, prefix="/api/v1/spotify", tags=["spotify"])
app.include_router(podcasts.router, prefix="/api/v1/podcasts", tags=["podcasts"])

# TODO: Add more routers as they are implemented
# from app.routes import tasks, media, resolutions, settings
# app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["tasks"])
# app.include_router(media.router, prefix="/api/v1/media", tags=["media"])
# app.include_router(resolutions.router, prefix="/api/v1/resolutions", tags=["resolutions"])
# app.include_router(settings.router, prefix="/api/v1/settings", tags=["settings"])
