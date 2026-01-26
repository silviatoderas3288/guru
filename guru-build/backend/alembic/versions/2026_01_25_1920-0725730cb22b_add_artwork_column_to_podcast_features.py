"""add artwork column to podcast_features

Revision ID: 0725730cb22b
Revises: a1b2c3d4e5f6
Create Date: 2026-01-25 19:20:08.539213

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0725730cb22b'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add artwork column to podcast_features table
    op.add_column('podcast_features', sa.Column('artwork', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('podcast_features', 'artwork')
