
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

class BingoItemBase(BaseModel):
    title: str
    position: int
    completed: bool = False

class BingoItemCreate(BingoItemBase):
    pass

class BingoItem(BingoItemBase):
    id: UUID
    user_id: UUID

    class Config:
        orm_mode = True

class BingoBoard(BaseModel):
    items: List[BingoItem]
