from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = '0003_ratings_user_stars'
down_revision = '0002_users_prefs'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('ratings', sa.Column('user_id', sa.Integer(), nullable=True))
    op.add_column('ratings', sa.Column('stars', sa.Integer(), nullable=True))
    try:
        op.create_foreign_key('fk_ratings_user', 'ratings', 'users', ['user_id'], ['id'])
    except Exception:
        # If users table not present or FK already exists, skip
        pass


def downgrade() -> None:
    try:
        op.drop_constraint('fk_ratings_user', 'ratings', type_='foreignkey')
    except Exception:
        pass
    op.drop_column('ratings', 'stars')
    op.drop_column('ratings', 'user_id')

