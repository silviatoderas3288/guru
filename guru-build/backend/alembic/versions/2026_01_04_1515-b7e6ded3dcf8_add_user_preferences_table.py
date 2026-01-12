"""add_user_preferences_table

Revision ID: b7e6ded3dcf8
Revises: 2c534953143e
Create Date: 2026-01-04 15:15:08.584217

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7e6ded3dcf8'
down_revision: Union[str, None] = '2c534953143e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'user_preferences',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('podcast_topics', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('podcast_length', sa.String(), nullable=True),
        sa.Column('notifications', sa.String(), nullable=True),
        sa.Column('workout_types', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('workout_duration', sa.String(), nullable=True),
        sa.Column('workout_frequency', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_user_preferences_id'), 'user_preferences', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_user_preferences_id'), table_name='user_preferences')
    op.drop_table('user_preferences')
