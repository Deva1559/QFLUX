from typing import Dict, Any, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import ApplicationSetting
from app.services.seed_service import seed_service
from app.core.config import settings

router = APIRouter()

@router.get("")
def get_system_settings(db: Session = Depends(get_db)):
    db_settings = db.query(ApplicationSetting).all()
    setting_map = {s.key: {"value": s.value, "description": s.description} for s in db_settings}
    
    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database_url": "sqlite:///./q_flux.db (local persisted)",
        "environment": settings.ENVIRONMENT,
        "reports_directory": str(settings.REPORTS_DIR.name),
        "db_records": setting_map
    }

@router.post("/seed", status_code=status.HTTP_200_OK)
def trigger_seed(db: Session = Depends(get_db)):
    seed_service.seed_database(db)
    return {"status": "success", "message": "Database successfully populated with verified literature seed data."}

@router.post("/backup", status_code=status.HTTP_200_OK)
def backup_database():
    """Creates a timestamped snapshot of the local SQLite scientific database."""
    import shutil
    from datetime import datetime
    from pathlib import Path
    db_path = Path("q_flux.db")
    if not db_path.exists():
        # check parent or backend
        alt = Path("backend/q_flux.db")
        if alt.exists():
            db_path = alt
        else:
            return {"status": "error", "message": "q_flux.db not found on disk."}

    backup_dir = Path("backups")
    backup_dir.mkdir(exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_path = backup_dir / f"q_flux_backup_{timestamp}.db"
    shutil.copy2(db_path, backup_path)

    return {
        "status": "success",
        "backup_file": str(backup_path),
        "file_size_bytes": backup_path.stat().st_size,
        "restore_instruction": f"To restore: copy '{backup_path.name}' back to 'q_flux.db' while the server is stopped."
    }
