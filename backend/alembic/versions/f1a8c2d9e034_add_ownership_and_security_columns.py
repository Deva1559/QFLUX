"""add_ownership_and_security_columns

Revision ID: f1a8c2d9e034
Revises: e79a8e46f017
Create Date: 2026-10-30 00:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'f1a8c2d9e034'
down_revision: Union[str, Sequence[str], None] = 'e79a8e46f017'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add owner_id and user_id foreign keys and indexes for resource isolation."""
    with op.batch_alter_table("projects", schema=None) as batch_op:
        batch_op.add_column(sa.Column("owner_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key("fk_projects_owner_id", "users", ["owner_id"], ["id"], ondelete="SET NULL")
        batch_op.create_index("ix_projects_owner_id", ["owner_id"], unique=False)

    with op.batch_alter_table("calculation_jobs", schema=None) as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key("fk_calculation_jobs_user_id", "users", ["user_id"], ["id"], ondelete="SET NULL")
        batch_op.create_index("ix_calculation_jobs_user_id", ["user_id"], unique=False)

    with op.batch_alter_table("molecular_models", schema=None) as batch_op:
        batch_op.add_column(sa.Column("owner_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key("fk_molecular_models_owner_id", "users", ["owner_id"], ["id"], ondelete="SET NULL")
        batch_op.create_index("ix_molecular_models_owner_id", ["owner_id"], unique=False)

    with op.batch_alter_table("experiment_plans", schema=None) as batch_op:
        batch_op.add_column(sa.Column("owner_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key("fk_experiment_plans_owner_id", "users", ["owner_id"], ["id"], ondelete="SET NULL")
        batch_op.create_index("ix_experiment_plans_owner_id", ["owner_id"], unique=False)


def downgrade() -> None:
    """Revert ownership columns and associated indexes and foreign keys."""
    with op.batch_alter_table("experiment_plans", schema=None) as batch_op:
        batch_op.drop_index("ix_experiment_plans_owner_id")
        batch_op.drop_constraint("fk_experiment_plans_owner_id", type_="foreignkey")
        batch_op.drop_column("owner_id")

    with op.batch_alter_table("molecular_models", schema=None) as batch_op:
        batch_op.drop_index("ix_molecular_models_owner_id")
        batch_op.drop_constraint("fk_molecular_models_owner_id", type_="foreignkey")
        batch_op.drop_column("owner_id")

    with op.batch_alter_table("calculation_jobs", schema=None) as batch_op:
        batch_op.drop_index("ix_calculation_jobs_user_id")
        batch_op.drop_constraint("fk_calculation_jobs_user_id", type_="foreignkey")
        batch_op.drop_column("user_id")

    with op.batch_alter_table("projects", schema=None) as batch_op:
        batch_op.drop_index("ix_projects_owner_id")
        batch_op.drop_constraint("fk_projects_owner_id", type_="foreignkey")
        batch_op.drop_column("owner_id")
