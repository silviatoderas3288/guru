"""Add podcast recommendation ML tables

Revision ID: a1b2c3d4e5f6
Revises: 0569e18e0d5d
Create Date: 2026-01-25 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '0569e18e0d5d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create listening_sessions table
    op.create_table(
        'listening_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('episode_external_id', sa.String(), nullable=False),
        sa.Column('podcast_external_id', sa.String(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('episode_duration_seconds', sa.Integer(), nullable=True),
        sa.Column('listened_duration_seconds', sa.Integer(), default=0),
        sa.Column('completion_rate', sa.Float(), default=0.0),
        sa.Column('pause_count', sa.Integer(), default=0),
        sa.Column('seek_forward_count', sa.Integer(), default=0),
        sa.Column('seek_backward_count', sa.Integer(), default=0),
        sa.Column('playback_speed', sa.Float(), default=1.0),
        sa.Column('listening_context', sa.String(), nullable=True),
        sa.Column('device_type', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_listening_sessions_user_podcast', 'listening_sessions', ['user_id', 'podcast_external_id'])
    op.create_index('ix_listening_sessions_user_episode', 'listening_sessions', ['user_id', 'episode_external_id'])

    # Create podcast_interactions table
    op.create_table(
        'podcast_interactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('podcast_external_id', sa.String(), nullable=False),
        sa.Column('episode_external_id', sa.String(), nullable=True),
        sa.Column('interaction_type', sa.String(), nullable=False),
        sa.Column('interaction_timestamp', sa.DateTime(), nullable=False),
        sa.Column('extra_data', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_podcast_interactions_user_type', 'podcast_interactions', ['user_id', 'interaction_type'])
    op.create_index('ix_podcast_interactions_podcast', 'podcast_interactions', ['podcast_external_id'])

    # Create podcast_features table
    op.create_table(
        'podcast_features',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('external_id', sa.String(), nullable=False, unique=True),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('author', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('artwork', sa.String(), nullable=True),
        sa.Column('language', sa.String(), nullable=True),
        sa.Column('categories', postgresql.JSONB(), nullable=True),
        sa.Column('episode_count', sa.Integer(), nullable=True),
        sa.Column('category_vector', postgresql.ARRAY(sa.Float()), nullable=True),
        sa.Column('description_embedding', postgresql.ARRAY(sa.Float()), nullable=True),
        sa.Column('avg_episode_duration_seconds', sa.Integer(), nullable=True),
        sa.Column('update_frequency_days', sa.Float(), nullable=True),
        sa.Column('popularity_score', sa.Float(), nullable=True),
        sa.Column('last_fetched_at', sa.DateTime(), nullable=True),
        sa.Column('features_computed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_podcast_features_external_id', 'podcast_features', ['external_id'])
    op.create_index('ix_podcast_features_popularity', 'podcast_features', ['popularity_score'])

    # Create user_podcast_profiles table
    op.create_table(
        'user_podcast_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, unique=True),
        sa.Column('category_preferences', postgresql.ARRAY(sa.Float()), nullable=True),
        sa.Column('content_embedding', postgresql.ARRAY(sa.Float()), nullable=True),
        sa.Column('preferred_duration_min', sa.Integer(), nullable=True),
        sa.Column('preferred_duration_max', sa.Integer(), nullable=True),
        sa.Column('preferred_languages', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('total_interactions', sa.Integer(), default=0),
        sa.Column('total_listening_hours', sa.Float(), default=0.0),
        sa.Column('profile_version', sa.Integer(), default=1),
        sa.Column('last_updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    # Create recommendation_cache table
    op.create_table(
        'recommendation_cache',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('podcast_ids', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('scores', postgresql.ARRAY(sa.Float()), nullable=True),
        sa.Column('reasons', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('algorithm_version', sa.String(), default='v1'),
        sa.Column('model_type', sa.String(), nullable=True),
        sa.Column('context', sa.String(), nullable=True),
        sa.Column('generated_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_recommendation_cache_user_expires', 'recommendation_cache', ['user_id', 'expires_at'])
    op.create_index('ix_recommendation_cache_user_context', 'recommendation_cache', ['user_id', 'context'])


def downgrade() -> None:
    op.drop_table('recommendation_cache')
    op.drop_table('user_podcast_profiles')
    op.drop_table('podcast_features')
    op.drop_table('podcast_interactions')
    op.drop_table('listening_sessions')
