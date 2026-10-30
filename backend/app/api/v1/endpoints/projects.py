from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import (
    Project, Catalyst, EvidenceRecord, QuantumRun,
    FluorineBalanceScenario, ClassicalChemistryRun, Report, User
)
from app.schemas import (
    ProjectResponse, ProjectCreate, ProjectUpdate, ProjectOverviewStats
)
from app.api.v1.endpoints.auth import get_current_user, get_optional_current_user

router = APIRouter()

@router.get("", response_model=List[ProjectResponse])
def list_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Project).offset(skip).limit(limit).all()

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    req: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    project_data = req.model_dump()
    if current_user:
        project_data["owner_id"] = current_user.id
    project = Project(**project_data)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/overview/stats", response_model=ProjectOverviewStats)
def get_overview_stats(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    total_projects = db.query(Project).count()
    total_catalysts = db.query(Catalyst).count()
    
    ev_q = db.query(EvidenceRecord)
    qr_q = db.query(QuantumRun)
    ch_q = db.query(ClassicalChemistryRun)
    fl_q = db.query(FluorineBalanceScenario)
    rp_q = db.query(Report)

    if project_id:
        ev_q = ev_q.filter(EvidenceRecord.project_id == project_id)
        qr_q = qr_q.filter(QuantumRun.project_id == project_id)
        ch_q = ch_q.filter(ClassicalChemistryRun.project_id == project_id)
        fl_q = fl_q.filter(FluorineBalanceScenario.project_id == project_id)
        rp_q = rp_q.filter(Report.project_id == project_id)

    latest_qr = qr_q.order_by(QuantumRun.id.desc()).first()
    latest_qr_dict = None
    if latest_qr:
        latest_qr_dict = {
            "id": latest_qr.id,
            "run_name": latest_qr.run_name,
            "model_type": latest_qr.model_type,
            "vqe_energy": latest_qr.vqe_energy,
            "exact_energy": latest_qr.exact_energy,
            "absolute_error": latest_qr.absolute_error,
            "is_toy_model": latest_qr.is_toy_model,
            "execution_time_ms": latest_qr.execution_time_ms
        }

    warnings = [
        "Parent-compound removal does NOT equate to defluorination or complete mineralization (Smith et al., 2024).",
        "Quantum VQE benchmarks evaluate a reduced C-F active space model or toy Hamiltonian; they do NOT model the extended periodic catalyst surface.",
        "Candidates with high parent loss but missing defluorination are heavily penalized in prioritization."
    ]

    return ProjectOverviewStats(
        total_projects=total_projects,
        total_catalysts=total_catalysts,
        total_evidence_records=ev_q.count(),
        total_quantum_runs=qr_q.count(),
        total_chemistry_runs=ch_q.count(),
        total_fluorine_scenarios=fl_q.count(),
        total_reports=rp_q.count(),
        latest_quantum_run=latest_qr_dict,
        scientific_warnings=warnings
    )

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    req: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Enforce ownership if project is owned
    if project.owner_id is not None:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to modify this project.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        if current_user.id != project.owner_id and current_user.role not in ["Admin", "Project Owner"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to modify this project."
            )
    
    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(project, field, val)
    
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.owner_id is not None:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to delete this project.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        if current_user.id != project.owner_id and current_user.role not in ["Admin", "Project Owner"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to delete this project."
            )

    db.delete(project)
    db.commit()
    return {"status": "success", "message": f"Project '{project.title}' deleted."}

