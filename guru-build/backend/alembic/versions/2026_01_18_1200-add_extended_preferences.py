"""Add extended preferences fields

Revision ID: add_extended_preferences
Revises: 899d1a13202d
Create Date: 2026-01-18 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_extended_preferences'
down_revision: Union[str, None] = '899d1a13202d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to user_preferences table
    op.add_column('user_preferences', sa.Column('wake_time', sa.String(), nullable=True))
    op.add_column('user_preferences', sa.Column('sleep_hours', sa.String(), nullable=True))
    op.add_column('user_preferences', sa.Column('chore_distribution', sa.String(), nullable=True))
    op.add_column('user_preferences', sa.Column('meal_duration', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('user_preferences', 'meal_duration')
    op.drop_column('user_preferences', 'chore_distribution')
    op.drop_column('user_preferences', 'sleep_hours')
    op.drop_column('user_preferences', 'wake_time')
