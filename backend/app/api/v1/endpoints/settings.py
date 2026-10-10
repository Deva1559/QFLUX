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
