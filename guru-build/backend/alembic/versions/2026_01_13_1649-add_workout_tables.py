"""add workout tables

Revision ID: add_workout_tables
Revises: c773e7461331
Create Date: 2026-01-13 16:49:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_workout_tables'
down_revision: Union[str, None] = 'c773e7461331'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create workouts table
    op.create_table('workouts',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create workout_sections table
    op.create_table('workout_sections',
        sa.Column('workout_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['workout_id'], ['workouts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create exercises table
    op.create_table('exercises',
        sa.Column('section_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('sets', sa.String(length=50), nullable=True),
        sa.Column('reps', sa.String(length=50), nullable=True),
        sa.Column('duration', sa.String(length=50), nullable=True),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['section_id'], ['workout_sections.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('exercises')
    op.drop_table('workout_sections')
    op.drop_table('workouts')
