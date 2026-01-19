"""Add chore_list and parent_goal_id

Revision ID: add_chore_list_and_parent_goal
Revises: add_extended_preferences
Create Date: 2026-01-18 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_chore_list_and_parent_goal'
down_revision: Union[str, None] = 'add_extended_preferences'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add chore_list to user_preferences
    op.add_column('user_preferences', sa.Column('chore_list', sa.ARRAY(sa.String()), nullable=True))

    # Add parent_goal_id to list_items
    op.add_column('list_items', sa.Column('parent_goal_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_list_items_parent_goal', 'list_items', 'list_items', ['parent_goal_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_list_items_parent_goal', 'list_items', type_='foreignkey')
    op.drop_column('list_items', 'parent_goal_id')
    op.drop_column('user_preferences', 'chore_list')
