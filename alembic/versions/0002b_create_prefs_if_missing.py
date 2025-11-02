from __future__ import annotations

from alembic import op


revision = '0002b_create_prefs_if_missing'
down_revision = '0002_users_prefs'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users if missing (defensive)
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR UNIQUE,
            sub VARCHAR UNIQUE,
            name VARCHAR,
            created_at TIMESTAMP
        );
        """
    )

    # Create preferences if missing
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS preferences (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
            roles JSON,
            experience VARCHAR,
            location_mode VARCHAR,
            location_text VARCHAR,
            include_skills JSON,
            exclude_skills JSON,
            company_types JSON,
            batch_size INTEGER,
            frequency_days INTEGER,
            cv_url VARCHAR
        );
        """
    )

    # Ensure unique index on user_id
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_preferences_user_id ON preferences (user_id);")


def downgrade() -> None:
    # No-op; prefer manual cleanup if needed
    pass

