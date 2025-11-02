from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = '0002_users_prefs'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('email', sa.String(), nullable=True, unique=True),
        sa.Column('sub', sa.String(), nullable=True, unique=True),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_table(
        'preferences',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, unique=True),
        sa.Column('roles', sa.JSON(), nullable=True),
        sa.Column('experience', sa.String(), nullable=True),
        sa.Column('location_mode', sa.String(), nullable=True),
        sa.Column('location_text', sa.String(), nullable=True),
        sa.Column('include_skills', sa.JSON(), nullable=True),
        sa.Column('exclude_skills', sa.JSON(), nullable=True),
        sa.Column('company_types', sa.JSON(), nullable=True),
        sa.Column('batch_size', sa.Integer(), nullable=True),
        sa.Column('frequency_days', sa.Integer(), nullable=True),
        sa.Column('cv_url', sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('preferences')
    op.drop_table('users')

