"""add_list_items_table

Revision ID: 00704a8960e0
Revises: 16403d2c4d79
Create Date: 2026-01-03 16:14:05.360063

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '00704a8960e0'
down_revision: Union[str, None] = '16403d2c4d79'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum type for item_type
    # Check if type already exists and create only if it doesn't
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE listitemtype AS ENUM ('weekly_goal', 'todo');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create list_items table
    op.create_table(
        'list_items',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('user_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('text', sa.String(), nullable=False),
        sa.Column('completed', sa.Boolean(), default=False),
        sa.Column('item_type', sa.dialects.postgresql.ENUM('weekly_goal', 'todo', name='listitemtype', create_type=False), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    )

    # Create index on user_id and item_type for faster queries
    op.create_index('ix_list_items_user_id_item_type', 'list_items', ['user_id', 'item_type'])


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_list_items_user_id_item_type', 'list_items')

    # Drop table
    op.drop_table('list_items')

    # Drop enum type
    op.execute("DROP TYPE listitemtype")
