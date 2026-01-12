"""Service for managing list items (weekly goals and to-do items)."""

from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from ..models.list_item import ListItem, ListItemType
from ..schemas.list_item import ListItemCreate, ListItemUpdate


def get_list_items(db: Session, user_id: UUID, item_type: ListItemType) -> List[ListItem]:
    """Get all list items for a user by type."""
    return db.query(ListItem).filter(
        ListItem.user_id == user_id,
        ListItem.item_type == item_type
    ).order_by(ListItem.created_at).all()


def create_list_item(db: Session, item: ListItemCreate, user_id: UUID) -> ListItem:
    """Create a new list item."""
    db_item = ListItem(
        user_id=user_id,
        text=item.text,
        completed=item.completed,
        item_type=item.item_type
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def update_list_item(db: Session, item_id: UUID, item: ListItemUpdate, user_id: UUID) -> ListItem:
    """Update a list item."""
    db_item = db.query(ListItem).filter(
        ListItem.id == item_id,
        ListItem.user_id == user_id
    ).first()

    if not db_item:
        raise ValueError("List item not found")

    if item.text is not None:
        db_item.text = item.text
    if item.completed is not None:
        db_item.completed = item.completed
    if item.calendar_event_id is not None:
        db_item.calendar_event_id = item.calendar_event_id

    db.commit()
    db.refresh(db_item)
    return db_item


def delete_list_item(db: Session, item_id: UUID, user_id: UUID) -> bool:
    """Delete a list item."""
    db_item = db.query(ListItem).filter(
        ListItem.id == item_id,
        ListItem.user_id == user_id
    ).first()

    if not db_item:
        return False

    db.delete(db_item)
    db.commit()
    return True
