"""Journal entry routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.journal_entry import JournalEntry
from app.models.user import User
from app.schemas.journal import JournalEntryCreate, JournalEntryUpdate, JournalEntryResponse

router = APIRouter()


# Dependency to get current user (placeholder - implement with your auth system)
async def get_current_user(db: Session = Depends(get_db)) -> User:
    """
    Get current authenticated user.
    For development, returns the most recently updated user.
    TODO: Implement proper authentication middleware with JWT tokens
    """
    import logging
    logger = logging.getLogger(__name__)

    try:
        # For now, return the most recently updated user (development only)
        user = db.query(User).order_by(User.updated_at.desc()).first()
        if not user:
            logger.error("No user found in database")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No user found. Please authenticate first by signing in with Google."
            )
        logger.info(f"Found user: {user.email}")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting current user: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user: {str(e)}"
        )


@router.get("/", response_model=List[JournalEntryResponse])
def get_journal_entries(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Get all journal entries for a user."""
    entries = db.query(JournalEntry).filter(
        JournalEntry.user_id == user.id
    ).order_by(JournalEntry.timestamp.desc()).all()
    return entries


@router.get("/{entry_id}", response_model=JournalEntryResponse)
def get_journal_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Get a specific journal entry."""
    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.user_id == user.id
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    return entry


@router.post("/", response_model=JournalEntryResponse)
def create_journal_entry(
    entry: JournalEntryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Create a new journal entry."""
    db_entry = JournalEntry(
        user_id=user.id,
        timestamp=entry.timestamp,
        notes=entry.notes
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.put("/{entry_id}", response_model=JournalEntryResponse)
def update_journal_entry(
    entry_id: int,
    entry: JournalEntryUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Update a journal entry."""
    db_entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.user_id == user.id
    ).first()

    if not db_entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    if entry.timestamp is not None:
        db_entry.timestamp = entry.timestamp
    if entry.notes is not None:
        db_entry.notes = entry.notes

    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.delete("/{entry_id}")
def delete_journal_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Delete a journal entry."""
    db_entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.user_id == user.id
    ).first()

    if not db_entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    db.delete(db_entry)
    db.commit()
    return {"message": "Journal entry deleted successfully"}
