
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from uuid import UUID

# In a real app, this would involve token decoding and validation
def get_current_user(db: Session = Depends(get_db)) -> User:
    # For now, let's return a dummy user.
    # Replace this with actual user retrieval logic based on auth token.
    user = db.query(User).first()
    if user is None:
        # you can create a user for the test 
        user = User(id=UUID("123e4567-e89b-12d3-a456-426614174000"), email="test@test.com", full_name="Test User")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
