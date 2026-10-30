from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas import RecommendationResponse
from app.services.recommendation_service import recommendation_engine

router = APIRouter()

@router.get("", response_model=List[RecommendationResponse])
def get_recommendations(
    target_pfas: str = Query("PFOA", description="Target PFAS compound (e.g. PFOA, PFOS)"),
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Generates transparent, evidence-backed catalyst recommendations explaining:
    - Composite ranking and defluorination penalty application
    - Mechanistic molecular insights from RHF SCF modeling
    - Remaining uncertainties and missing analytical measurements
    - Proposed next experiment to reduce uncertainty
    - Boundary conditions under which recommendation holds"""
    return recommendation_engine.generate_recommendations(
        db=db,
        target_pfas=target_pfas,
        project_id=project_id
    )
