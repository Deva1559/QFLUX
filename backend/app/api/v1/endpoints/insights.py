from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas import InsightResponse
from app.services.insight_service import insight_engine

router = APIRouter()

@router.get("", response_model=List[InsightResponse])
def get_insights(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    return insight_engine.generate_insights_for_project(db, project_id)
