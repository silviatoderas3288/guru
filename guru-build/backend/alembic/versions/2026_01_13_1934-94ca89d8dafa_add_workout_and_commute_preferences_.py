"""Add workout and commute preferences fields

Revision ID: 94ca89d8dafa
Revises: add_completed_to_workouts
Create Date: 2026-01-13 19:34:01.238600

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '94ca89d8dafa'
down_revision: Union[str, None] = 'add_completed_to_workouts'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to user_preferences table
    op.add_column('user_preferences', sa.Column('workout_preferred_time', sa.String(), nullable=True))
    op.add_column('user_preferences', sa.Column('workout_days', sa.ARRAY(sa.String()), nullable=True))
    op.add_column('user_preferences', sa.Column('commute_start', sa.String(), nullable=True))
    op.add_column('user_preferences', sa.Column('commute_end', sa.String(), nullable=True))
    op.add_column('user_preferences', sa.Column('commute_duration', sa.String(), nullable=True))
    op.add_column('user_preferences', sa.Column('chore_time', sa.String(), nullable=True))
    op.add_column('user_preferences', sa.Column('chore_duration', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove the added columns
    op.drop_column('user_preferences', 'chore_duration')
    op.drop_column('user_preferences', 'chore_time')
    op.drop_column('user_preferences', 'commute_duration')
    op.drop_column('user_preferences', 'commute_end')
    op.drop_column('user_preferences', 'commute_start')
    op.drop_column('user_preferences', 'workout_days')
    op.drop_column('user_preferences', 'workout_preferred_time')
