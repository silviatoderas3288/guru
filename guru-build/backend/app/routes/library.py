from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.saved_media import SavedPodcast, SavedEpisode
from app.models.user import User
from app.schemas.saved_media import SavedPodcastCreate, SavedPodcastResponse, SavedEpisodeCreate, SavedEpisodeResponse

router = APIRouter(prefix="/library", tags=["library"])

# Dependency to get current user (same as in journal.py)
async def get_current_user(db: Session = Depends(get_db)) -> User:
    """
    Get current authenticated user.
    For development, returns the most recently updated user.
    """
    user = db.query(User).order_by(User.updated_at.desc()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No user found. Please authenticate first."
        )
    return user

@router.get("/podcasts", response_model=List[SavedPodcastResponse])
def get_saved_podcasts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SavedPodcast).filter(SavedPodcast.user_id == current_user.id).all()

@router.post("/podcasts", response_model=SavedPodcastResponse)
def save_podcast(podcast: SavedPodcastCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if already saved
    existing = db.query(SavedPodcast).filter(SavedPodcast.user_id == current_user.id, SavedPodcast.external_id == podcast.external_id).first()
    if existing:
        return existing
    
    db_podcast = SavedPodcast(**podcast.dict(), user_id=current_user.id)
    db.add(db_podcast)
    db.commit()
    db.refresh(db_podcast)
    return db_podcast

@router.delete("/podcasts/{podcast_id}")
def remove_podcast(podcast_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        pid = UUID(podcast_id)
        db_podcast = db.query(SavedPodcast).filter(SavedPodcast.id == pid, SavedPodcast.user_id == current_user.id).first()
    except ValueError:
        # Try external_id
        db_podcast = db.query(SavedPodcast).filter(SavedPodcast.external_id == podcast_id, SavedPodcast.user_id == current_user.id).first()

    if not db_podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")
    
    db.delete(db_podcast)
    db.commit()
    return {"message": "Podcast removed"}

@router.get("/episodes", response_model=List[SavedEpisodeResponse])
def get_saved_episodes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SavedEpisode).filter(SavedEpisode.user_id == current_user.id).all()

@router.post("/episodes", response_model=SavedEpisodeResponse)
def save_episode(episode: SavedEpisodeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(SavedEpisode).filter(SavedEpisode.user_id == current_user.id, SavedEpisode.external_id == episode.external_id).first()
    if existing:
        return existing

    db_episode = SavedEpisode(**episode.dict(), user_id=current_user.id)
    db.add(db_episode)
    db.commit()
    db.refresh(db_episode)
    return db_episode

@router.delete("/episodes/{episode_id}")
def remove_episode(episode_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        eid = UUID(episode_id)
        db_episode = db.query(SavedEpisode).filter(SavedEpisode.id == eid, SavedEpisode.user_id == current_user.id).first()
    except ValueError:
         db_episode = db.query(SavedEpisode).filter(SavedEpisode.external_id == episode_id, SavedEpisode.user_id == current_user.id).first()

    if not db_episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    db.delete(db_episode)
    db.commit()
    return {"message": "Episode removed"}
