"""add calendar_event_id to list_items

Revision ID: 2c534953143e
Revises: 00704a8960e0
Create Date: 2026-01-03 17:32:33.642826

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2c534953143e'
down_revision: Union[str, None] = '00704a8960e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add calendar_event_id column to list_items table
    op.add_column('list_items', sa.Column('calendar_event_id', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove calendar_event_id column from list_items table
    op.drop_column('list_items', 'calendar_event_id')
