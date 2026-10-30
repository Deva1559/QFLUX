from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import ExperimentPlan, TreatmentExperiment, PFASCompound, Catalyst, User
from app.api.v1.endpoints.auth import get_current_user, get_optional_current_user
from app.schemas import (
    ExperimentPlanCreate, ExperimentPlanUpdate, ExperimentPlanResponse
)

router = APIRouter()

@router.get("/plans", response_model=List[ExperimentPlanResponse])
def list_experiment_plans(
    project_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Lists scheduled, draft, and completed research experiment plans."""
    query = db.query(ExperimentPlan)
    if project_id:
        query = query.filter(ExperimentPlan.project_id == project_id)
    if status:
        query = query.filter(ExperimentPlan.experiment_status == status)
    return query.order_by(ExperimentPlan.created_at.desc()).all()

@router.get("/plans/{plan_id}", response_model=ExperimentPlanResponse)
def get_experiment_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Retrieves specific experiment plan by ID. Enforces ownership authorization on private plans."""
    plan = db.query(ExperimentPlan).filter(ExperimentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Experiment plan not found.")
    
    if plan.owner_id is not None:
        if not current_user:
            raise HTTPException(
                status_code=401,
                detail="Authentication required to view this experiment plan.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        if plan.owner_id != current_user.id and current_user.role not in ["Admin", "Project Owner"]:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You do not have permission to view this experiment plan."
            )
    return plan

@router.post("/plans", response_model=ExperimentPlanResponse, status_code=201)
def create_experiment_plan(
    plan_in: ExperimentPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new experiment plan addressing research uncertainty (authenticated)."""
    # Verify PFAS exists
    pfas = db.query(PFASCompound).filter(PFASCompound.id == plan_in.target_pfas_id).first()
    if not pfas:
        raise HTTPException(status_code=404, detail="Target PFAS compound not found.")

    if plan_in.catalyst_id:
        cat = db.query(Catalyst).filter(Catalyst.id == plan_in.catalyst_id).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Catalyst candidate not found.")

    plan_data = plan_in.model_dump()
    plan_data["owner_id"] = current_user.id
    plan = ExperimentPlan(**plan_data)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@router.put("/plans/{plan_id}", response_model=ExperimentPlanResponse)
def update_experiment_plan(
    plan_id: int,
    plan_in: ExperimentPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates an experiment plan's status, conditions, or observations (authenticated with ownership check)."""
    plan = db.query(ExperimentPlan).filter(ExperimentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Experiment plan not found.")

    if plan.owner_id is not None and plan.owner_id != current_user.id and current_user.role not in ["Admin", "Project Owner"]:
        raise HTTPException(
            status_code=403,
            detail="Access denied: You do not have permission to modify this experiment plan."
        )

    update_data = plan_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(plan, field, val)

    db.commit()
    db.refresh(plan)
    return plan

@router.delete("/plans/{plan_id}")
def delete_experiment_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes an experiment plan (authenticated with ownership check)."""
    plan = db.query(ExperimentPlan).filter(ExperimentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Experiment plan not found.")

    if plan.owner_id is not None and plan.owner_id != current_user.id and current_user.role not in ["Admin", "Project Owner"]:
        raise HTTPException(
            status_code=403,
            detail="Access denied: You do not have permission to delete this experiment plan."
        )

    db.delete(plan)
    db.commit()
    return {"status": "success", "message": f"Plan '{plan.title}' deleted."}


@router.get("/bayesian-recommendation")
def get_bayesian_recommendation(
    target_pfas_id: Optional[int] = Query(None),
    catalyst_id: Optional[int] = Query(None),
    objective: Optional[str] = Query("maximize_defluorination"),
    db: Session = Depends(get_db)
):
    """Computes Gaussian Process surrogate acquisition (Expected Improvement)
    to recommend the next highest-yield experiment without fabricating results."""
    from app.services.bayesian_optimization_service import bayesian_planner
    return bayesian_planner.optimize_next_experiment(
        db=db,
        target_pfas_id=target_pfas_id,
        catalyst_id=catalyst_id,
        objective=objective or "maximize_defluorination"
    )
