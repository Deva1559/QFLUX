import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.session import Base
import app.models

exclude_cols = {
    'projects': {'owner_id'},
    'calculation_jobs': {'user_id'},
    'molecular_models': {'owner_id'},
    'experiment_plans': {'owner_id'}
}

script_lines = []
script_lines.append('"""create_initial_schema\n')
script_lines.append('Revision ID: e79a8e46f017')
script_lines.append('Revises: ')
script_lines.append('Create Date: 2026-10-19 10:24:45.172200')
script_lines.append('"""')
script_lines.append('from typing import Sequence, Union')
script_lines.append('from alembic import op')
script_lines.append('import sqlalchemy as sa')
script_lines.append('from sqlalchemy import Integer, String, Float, Boolean, Text, DateTime, ForeignKey\n')
script_lines.append("revision: str = 'e79a8e46f017'")
script_lines.append("down_revision: Union[str, Sequence[str], None] = None")
script_lines.append("branch_labels: Union[str, Sequence[str], None] = None")
script_lines.append("depends_on: Union[str, Sequence[str], None] = None\n")
script_lines.append("def upgrade() -> None:")

for table in Base.metadata.sorted_tables:
    script_lines.append(f'    op.create_table(')
    script_lines.append(f'        "{table.name}",')
    for col in table.columns:
        if table.name in exclude_cols and col.name in exclude_cols[table.name]:
            continue
        type_str = repr(col.type)
        parts = [f'sa.Column("{col.name}", {type_str}']
        if col.foreign_keys:
            fk = list(col.foreign_keys)[0]
            ondel = fk.ondelete or ""
            parts.append(f'sa.ForeignKey("{fk.target_fullname}", ondelete="{ondel}")')
        if col.primary_key:
            parts.append('primary_key=True')
        if not col.nullable and not col.primary_key:
            parts.append('nullable=False')
        elif col.nullable and not col.primary_key:
            parts.append('nullable=True')
        col_def = ', '.join(parts) + '),'
        script_lines.append(f'        {col_def}')
    script_lines.append('    )')
    for idx in table.indexes:
        col_names = [c.name for c in idx.columns]
        if table.name in exclude_cols and any(c in exclude_cols[table.name] for c in col_names):
            continue
        cols_repr = repr(col_names)
        script_lines.append(f'    op.create_index("{idx.name}", "{table.name}", {cols_repr}, unique={idx.unique})')

script_lines.append('\n\ndef downgrade() -> None:')

for table in reversed(Base.metadata.sorted_tables):
    for idx in table.indexes:
        col_names = [c.name for c in idx.columns]
        if table.name in exclude_cols and any(c in exclude_cols[table.name] for c in col_names):
            continue
        script_lines.append(f'    op.drop_index("{idx.name}", table_name="{table.name}")')
    script_lines.append(f'    op.drop_table("{table.name}")')

content = '\n'.join(script_lines) + '\n'

out_path = backend_dir / 'alembic' / 'versions' / 'e79a8e46f017_create_initial_schema.py'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Generated {out_path} ({len(content)} bytes)")
