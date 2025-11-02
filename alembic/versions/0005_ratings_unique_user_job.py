from __future__ import annotations

from alembic import op


revision = '0005_ratings_unique_user_job'
down_revision = '0004_batches'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create unique index on (user_id, job_id) if not exists
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS ratings_user_job_uidx ON ratings (user_id, job_id)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ratings_user_job_uidx")

