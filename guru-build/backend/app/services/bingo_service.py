
from sqlalchemy.orm import Session
from ..models.bingo_item import BingoItem
from ..schemas.bingo import BingoItemCreate
from uuid import UUID
from typing import List

def get_bingo_items(db: Session, user_id: UUID) -> List[BingoItem]:
    return db.query(BingoItem).filter(BingoItem.user_id == user_id).all()

def create_bingo_items(db: Session, items: List[BingoItemCreate], user_id: UUID) -> List[BingoItem]:
    # Clear existing items for the user
    db.query(BingoItem).filter(BingoItem.user_id == user_id).delete()
    
    db_items = []
    for item in items:
        db_item = BingoItem(**item.dict(), user_id=user_id)
        db.add(db_item)
        db_items.append(db_item)
    db.commit()
    return db_items
