from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = '0004_batches'
down_revision = '0003_ratings_user_stars'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'batches',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('locked_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_batches_user_id', 'batches', ['user_id'])

    op.create_table(
        'batch_jobs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('batch_id', sa.Integer(), sa.ForeignKey('batches.id'), nullable=False),
        sa.Column('job_id', sa.Integer(), sa.ForeignKey('jobs.id'), nullable=False),
    )
    op.create_index('ix_batch_jobs_batch_id', 'batch_jobs', ['batch_id'])
    op.create_index('ix_batch_jobs_job_id', 'batch_jobs', ['job_id'])


def downgrade() -> None:
    op.drop_index('ix_batch_jobs_job_id', table_name='batch_jobs')
    op.drop_index('ix_batch_jobs_batch_id', table_name='batch_jobs')
    op.drop_table('batch_jobs')
    op.drop_index('ix_batches_user_id', table_name='batches')
    op.drop_table('batches')

