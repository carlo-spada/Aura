from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'jobs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('company', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('salary_min', sa.Float(), nullable=True),
        sa.Column('salary_max', sa.Float(), nullable=True),
        sa.Column('currency', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('url', sa.String(), nullable=False),
        sa.Column('date_posted', sa.String(), nullable=True),
        sa.Column('embedding', sa.LargeBinary(), nullable=True),
    )
    op.create_unique_constraint('uq_jobs_url', 'jobs', ['url'])

    op.create_table(
        'ratings',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('job_id', sa.Integer(), sa.ForeignKey('jobs.id'), nullable=False),
        sa.Column('fit_score', sa.Integer(), nullable=True),
        sa.Column('interest_score', sa.Integer(), nullable=True),
        sa.Column('prestige_score', sa.Integer(), nullable=True),
        sa.Column('location_score', sa.Integer(), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'outcomes',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('job_id', sa.Integer(), sa.ForeignKey('jobs.id'), nullable=False),
        sa.Column('stage', sa.String(), nullable=True),
        sa.Column('reward', sa.Float(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('outcomes')
    op.drop_table('ratings')
    op.drop_constraint('uq_jobs_url', 'jobs', type_='unique')
    op.drop_table('jobs')

