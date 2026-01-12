
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas.bingo import BingoItem, BingoItemCreate
from ..services import bingo_service
from ..models.user import User
from ..services.auth_service import get_current_user

router = APIRouter()

@router.get("/api/bingo_items", response_model=List[BingoItem])
def read_bingo_items(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return bingo_service.get_bingo_items(db=db, user_id=current_user.id)

@router.post("/api/bingo_items", response_model=List[BingoItem])
def create_user_bingo_items(items: List[BingoItemCreate], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return bingo_service.create_bingo_items(db=db, items=items, user_id=current_user.id)
