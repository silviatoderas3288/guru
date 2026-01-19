import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent
sys.path.append(str(backend_dir))

from app.database import SessionLocal
from app.services import list_item_service
from app.models.list_item import ListItemType
from app.models.user import User

def debug():
    db = SessionLocal()
    try:
        # Get a user
        user = db.query(User).first()
        if not user:
            print("No users found.")
            return

        print(f"Testing for user: {user.email} ({user.id})")

        # Try fetching weekly goals
        print("Fetching weekly goals...")
        goals = list_item_service.get_list_items(
            db=db,
            user_id=user.id,
            item_type=ListItemType.WEEKLY_GOAL
        )
        print(f"Found {len(goals)} weekly goals.")
        for g in goals:
            print(f" - {g.text} (Parent: {g.parent_goal_id})")

        # Try fetching todos
        print("\nFetching todos...")
        todos = list_item_service.get_list_items(
            db=db,
            user_id=user.id,
            item_type=ListItemType.TODO
        )
        print(f"Found {len(todos)} todos.")
        for t in todos:
            print(f" - {t.text} (Parent: {t.parent_goal_id})")

    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug()
