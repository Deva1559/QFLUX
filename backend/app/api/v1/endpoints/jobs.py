from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import CalculationJob, User
from app.schemas import CalculationJobCreate, CalculationJobResponse
from app.services.job_service import job_service
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.post("", response_model=CalculationJobResponse, status_code=201)
def submit_calculation_job(
    job_in: CalculationJobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submits a long-running molecular SCF or quantum VQE calculation as a background job (authenticated)."""
    try:
        job = job_service.submit_job(
            db=db,
            job_type=job_in.job_type,
            input_params=job_in.input_params,
            project_id=job_in.project_id,
            user_id=current_user.id
        )
        return job
    except ValueError as e:
        err_msg = str(e)
        if "Resource limit" in err_msg:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=err_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

@router.get("", response_model=List[CalculationJobResponse])
def list_calculation_jobs(
    project_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists calculation jobs with real-time status. Non-admin users only see their own jobs."""
    query = db.query(CalculationJob)
    
    # Non-admin researchers can only view their own jobs
    if current_user.role not in ["Admin", "Project Owner"]:
        query = query.filter(CalculationJob.user_id == current_user.id)
    elif user_id is not None:
        query = query.filter(CalculationJob.user_id == user_id)

    if project_id:
        query = query.filter(CalculationJob.project_id == project_id)
    if status_filter:
        query = query.filter(CalculationJob.status == status_filter)
        
    return query.order_by(CalculationJob.created_at.desc()).all()

@router.get("/{job_id}", response_model=CalculationJobResponse)
def get_calculation_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves calculation job details. Enforces ownership authorization."""
    job = db.query(CalculationJob).filter(CalculationJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calculation job not found.")
    
    # Ownership authorization check
    if job.user_id is not None and job.user_id != current_user.id and current_user.role not in ["Admin", "Project Owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to view this calculation job."
        )
    return job

@router.post("/{job_id}/cancel", response_model=CalculationJobResponse)
def cancel_calculation_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancels a queued or running calculation job. Enforces ownership authorization."""
    job = db.query(CalculationJob).filter(CalculationJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calculation job not found.")

    if job.user_id is not None and job.user_id != current_user.id and current_user.role not in ["Admin", "Project Owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to cancel this calculation job."
        )

    try:
        cancelled_job = job_service.cancel_job(db=db, job_id=job_id)
        return cancelled_job
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

