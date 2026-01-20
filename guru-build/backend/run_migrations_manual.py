import os
import sys
from alembic.config import Config
from alembic import command
from pathlib import Path

# Add the current directory to sys.path so we can import app
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir))

def run_migrations():
    print("Running migrations...")
    alembic_ini_path = current_dir / "alembic.ini"
    alembic_cfg = Config(str(alembic_ini_path))
    alembic_cfg.set_main_option("script_location", str(current_dir / "alembic"))
    
    try:
        command.upgrade(alembic_cfg, "head")
        print("Migrations successful!")
    except Exception as e:
        print(f"Migration failed: {e}")
        # Print more details if possible
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_migrations()
