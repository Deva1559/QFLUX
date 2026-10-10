import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import PrioritizationRun
from app.schemas import PrioritizationRunRequest, PrioritizationRunResponse
from app.services.prioritization_service import prioritization_engine

router = APIRouter()

@router.post("/run", response_model=PrioritizationRunResponse, status_code=status.HTTP_201_CREATED)
def execute_prioritization(req: PrioritizationRunRequest, db: Session = Depends(get_db)):
    result = prioritization_engine.run_prioritization(
        db=db,
        project_id=req.project_id,
        custom_weights=req.custom_weights
    )
    return PrioritizationRunResponse(
        id=result["id"],
        weights=result["weights"],
        rankings=result["rankings"],
        sensitivity_analysis=result["sensitivity_analysis"],
        created_at=result["created_at"]
    )

@router.get("/latest", response_model=PrioritizationRunResponse)
def get_latest_prioritization(db: Session = Depends(get_db)):
    run = db.query(PrioritizationRun).order_by(PrioritizationRun.id.desc()).first()
    if not run:
        # Run default prioritization if none exists
        res = prioritization_engine.run_prioritization(db=db)
        return PrioritizationRunResponse(
            id=res["id"],
            weights=res["weights"],
            rankings=res["rankings"],
            sensitivity_analysis=res["sensitivity_analysis"],
            created_at=res["created_at"]
        )

    return PrioritizationRunResponse(
        id=run.id,
        weights=json.loads(run.weights_json),
        rankings=json.loads(run.rankings_json),
        sensitivity_analysis=json.loads(run.sensitivity_analysis_json),
        created_at=run.created_at.isoformat()
    )

@router.get("/{run_id}", response_model=PrioritizationRunResponse)
def get_prioritization_by_id(run_id: int, db: Session = Depends(get_db)):
    run = db.query(PrioritizationRun).filter(PrioritizationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Prioritization run not found")

    return PrioritizationRunResponse(
        id=run.id,
        weights=json.loads(run.weights_json),
        rankings=json.loads(run.rankings_json),
        sensitivity_analysis=json.loads(run.sensitivity_analysis_json),
        created_at=run.created_at.isoformat()
    )
