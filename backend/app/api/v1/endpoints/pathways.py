from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Pathway, PathwayStep
from app.schemas import PathwayResponse, PathwayCreate, PathwayStepResponse, PathwayStepCreate

router = APIRouter()

@router.get("", response_model=List[PathwayResponse])
def list_pathways(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Pathway)
    if project_id:
        query = query.filter((Pathway.project_id == project_id) | (Pathway.project_id.is_(None)))
    return query.all()

@router.post("", response_model=PathwayResponse, status_code=status.HTTP_201_CREATED)
def create_pathway(req: PathwayCreate, db: Session = Depends(get_db)):
    pathway = Pathway(
        project_id=req.project_id,
        title=req.title,
        target_compound=req.target_compound,
        description=req.description,
        reference_doi=req.reference_doi
    )
    db.add(pathway)
    db.flush()

    for step_in in (req.steps or []):
        step = PathwayStep(
            pathway_id=pathway.id,
            step_number=step_in.step_number,
            reactant_name=step_in.reactant_name,
            product_name=step_in.product_name,
            transformation_description=step_in.transformation_description,
            bond_changes=step_in.bond_changes,
            chemical_conditions=step_in.chemical_conditions,
            reported_intermediates=step_in.reported_intermediates,
            is_experimentally_observed=step_in.is_experimentally_observed,
            is_computationally_proposed=step_in.is_computationally_proposed,
            quantum_calc_status=step_in.quantum_calc_status
        )
        db.add(step)
    
    db.commit()
    db.refresh(pathway)
    return pathway

@router.get("/{pathway_id}", response_model=PathwayResponse)
def get_pathway(pathway_id: int, db: Session = Depends(get_db)):
    pathway = db.query(Pathway).filter(Pathway.id == pathway_id).first()
    if not pathway:
        raise HTTPException(status_code=404, detail="Pathway not found")
    return pathway
