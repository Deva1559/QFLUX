from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import PFASCompound, User
from app.api.v1.endpoints.auth import get_current_user
from app.schemas import PFASCompoundCreate, PFASCompoundUpdate, PFASCompoundResponse

router = APIRouter()

@router.get("", response_model=List[PFASCompoundResponse])
def list_pfas_compounds(
    search: Optional[str] = Query(None, description="Search by common name, acronym, or CAS"),
    min_carbons: Optional[int] = Query(None, ge=1),
    max_carbons: Optional[int] = Query(None, ge=1),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Lists normalized PFAS compounds with search and chain-length filters."""
    query = db.query(PFASCompound)
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (PFASCompound.common_name.ilike(search_fmt)) |
            (PFASCompound.acronym.ilike(search_fmt)) |
            (PFASCompound.cas_number.ilike(search_fmt))
        )
    if min_carbons is not None:
        query = query.filter(PFASCompound.num_carbons >= min_carbons)
    if max_carbons is not None:
        query = query.filter(PFASCompound.num_carbons <= max_carbons)

    return query.order_by(PFASCompound.num_carbons.desc()).offset(offset).limit(limit).all()

@router.get("/{pfas_id}", response_model=PFASCompoundResponse)
def get_pfas_compound(pfas_id: int, db: Session = Depends(get_db)):
    """Retrieves specific PFAS compound by ID."""
    pfas = db.query(PFASCompound).filter(PFASCompound.id == pfas_id).first()
    if not pfas:
        raise HTTPException(status_code=404, detail="PFAS compound not found.")
    return pfas

@router.post("", response_model=PFASCompoundResponse, status_code=201)
def create_pfas_compound(
    pfas_in: PFASCompoundCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new validated PFAS compound record (authenticated)."""
    existing = db.query(PFASCompound).filter(
        (PFASCompound.acronym == pfas_in.acronym) |
        (PFASCompound.cas_number == pfas_in.cas_number if pfas_in.cas_number else False)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="PFAS compound with this acronym or CAS number already exists.")

    pfas = PFASCompound(**pfas_in.model_dump())
    db.add(pfas)
    db.commit()
    db.refresh(pfas)
    return pfas

@router.put("/{pfas_id}", response_model=PFASCompoundResponse)
def update_pfas_compound(
    pfas_id: int,
    pfas_in: PFASCompoundUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates an existing PFAS compound record (authenticated)."""
    pfas = db.query(PFASCompound).filter(PFASCompound.id == pfas_id).first()
    if not pfas:
        raise HTTPException(status_code=404, detail="PFAS compound not found.")

    update_data = pfas_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(pfas, field, val)

    db.commit()
    db.refresh(pfas)
    return pfas

@router.delete("/{pfas_id}")
def delete_pfas_compound(
    pfas_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes a PFAS compound if no linked treatment experiments exist (authenticated)."""
    pfas = db.query(PFASCompound).filter(PFASCompound.id == pfas_id).first()
    if not pfas:
        raise HTTPException(status_code=404, detail="PFAS compound not found.")

    if pfas.experiments:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete {pfas.acronym}: {len(pfas.experiments)} treatment experiments are linked to it."
        )

    db.delete(pfas)
    db.commit()
    return {"status": "success", "message": f"PFAS compound {pfas.acronym} deleted."}
