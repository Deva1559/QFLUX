from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import EvidenceRecord
from app.schemas import EvidenceRecordResponse, EvidenceRecordCreate, EvidenceRecordUpdate

router = APIRouter()

@router.get("", response_model=List[EvidenceRecordResponse])
def list_evidence(
    project_id: Optional[int] = None,
    category: Optional[str] = None,
    verification_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(EvidenceRecord)
    if project_id:
        query = query.filter((EvidenceRecord.project_id == project_id) | (EvidenceRecord.project_id.is_(None)))
    if category:
        query = query.filter(EvidenceRecord.evidence_category == category)
    if verification_status:
        query = query.filter(EvidenceRecord.verification_status == verification_status)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=EvidenceRecordResponse, status_code=status.HTTP_201_CREATED)
def create_evidence(req: EvidenceRecordCreate, db: Session = Depends(get_db)):
    record = EvidenceRecord(**req.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.get("/{record_id}", response_model=EvidenceRecordResponse)
def get_evidence(record_id: int, db: Session = Depends(get_db)):
    record = db.query(EvidenceRecord).filter(EvidenceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Evidence record not found")
    return record

@router.patch("/{record_id}", response_model=EvidenceRecordResponse)
def update_evidence(record_id: int, req: EvidenceRecordUpdate, db: Session = Depends(get_db)):
    record = db.query(EvidenceRecord).filter(EvidenceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Evidence record not found")
    
    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(record, field, val)
    
    db.commit()
    db.refresh(record)
    return record
