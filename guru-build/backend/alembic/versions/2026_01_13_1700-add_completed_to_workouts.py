"""add completed to workouts

Revision ID: add_completed_to_workouts
Revises: add_workout_tables
Create Date: 2026-01-13 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_completed_to_workouts'
down_revision: Union[str, None] = 'add_workout_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('workouts', sa.Column('completed', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    op.drop_column('workouts', 'completed')
