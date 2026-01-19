
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from uuid import UUID

# In a real app, this would involve token decoding and validation
def get_current_user(db: Session = Depends(get_db)) -> User:
    """
    Get current authenticated user.
    For development, returns the most recently updated user.
    TODO: Implement proper authentication middleware with JWT tokens
    """
    # For now, return the most recently updated user (development only)
    user = db.query(User).order_by(User.updated_at.desc()).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No user found. Please authenticate with Google first."
        )
    return user
