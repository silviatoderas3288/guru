"""Routes for list items (weekly goals and to-do items)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from ..database import get_db
from ..schemas.list_item import ListItem, ListItemCreate, ListItemUpdate
from ..services import list_item_service
from ..models.user import User
from ..models.list_item import ListItemType
from ..services.auth_service import get_current_user

router = APIRouter()


@router.get("/weekly-goals", response_model=List[ListItem])
def get_weekly_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all weekly goals for the current user."""
    return list_item_service.get_list_items(
        db=db,
        user_id=current_user.id,
        item_type=ListItemType.WEEKLY_GOAL
    )


@router.get("/todos", response_model=List[ListItem])
def get_todos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all to-do items for the current user."""
    return list_item_service.get_list_items(
        db=db,
        user_id=current_user.id,
        item_type=ListItemType.TODO
    )


@router.post("/", response_model=ListItem)
def create_list_item(
    item: ListItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new list item."""
    return list_item_service.create_list_item(
        db=db,
        item=item,
        user_id=current_user.id
    )


@router.patch("/{item_id}", response_model=ListItem)
def update_list_item(
    item_id: str,
    item: ListItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a list item."""
    try:
        return list_item_service.update_list_item(
            db=db,
            item_id=UUID(item_id),
            item=item,
            user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{item_id}")
def delete_list_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a list item."""
    success = list_item_service.delete_list_item(
        db=db,
        item_id=UUID(item_id),
        user_id=current_user.id
    )
    if not success:
        raise HTTPException(status_code=404, detail="List item not found")
    return {"message": "List item deleted successfully"}
