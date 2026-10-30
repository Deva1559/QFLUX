import os
import re
import uuid
import shutil
from pathlib import Path
from typing import List, Optional, Tuple
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Response
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.config import settings
from app.models import UploadedDocument, CandidateClaim, User
from app.api.v1.endpoints.auth import get_current_user
from app.schemas import (
    UploadedDocumentResponse, CandidateClaimResponse, ClaimVerifyRequest,
    LiteratureQueryRequest, LiteratureQueryResponse, CSVImportPreviewResponse,
    CSVImportExecuteRequest
)
from app.services.literature_service import literature_service

router = APIRouter()

async def _save_validated_file(file: UploadFile, allowed_exts: Optional[set] = None) -> Tuple[Path, str, str, int]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing or invalid filename.")

    raw_name = Path(file.filename).name
    safe_base = re.sub(r'[^a-zA-Z0-9_.-]', '_', raw_name)
    if not safe_base:
        raise HTTPException(status_code=400, detail="Filename contains only illegal characters.")

    ext = Path(safe_base).suffix.lower()
    valid_exts = allowed_exts or settings.ALLOWED_EXTENSIONS
    if ext not in valid_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported: {', '.join(sorted(valid_exts))}"
        )

    mime_type = (file.content_type or "application/octet-stream").lower()
    if mime_type not in settings.ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported MIME content type '{mime_type}'."
        )

    safe_name = f"{uuid.uuid4().hex}_{safe_base}"
    target_path = settings.UPLOAD_DIR / safe_name

    total_bytes = 0
    chunk_size = 1024 * 1024  # 1MB
    try:
        with open(target_path, "wb") as buffer:
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > settings.MAX_UPLOAD_SIZE_BYTES:
                    buffer.close()
                    if target_path.exists():
                        target_path.unlink()
                    max_mb = settings.MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)
                    raise HTTPException(
                        status_code=413,
                        detail=f"Uploaded file exceeds maximum allowed limit of {max_mb:.0f} MB."
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if target_path.exists():
            target_path.unlink()
        raise HTTPException(status_code=500, detail=f"File transfer failed: {str(e)}")

    return target_path, safe_base, mime_type, total_bytes

CSV_TEMPLATE = """target_pfas,catalyst,treatment_method,initial_conc_mg_l,duration_min,parent_removal_pct,defluorination_pct,doi,study_title,year,journal,notes
PFOA,In2O3 nanocubes,Photocatalysis (UV-C),50.0,180,99.2,78.4,10.1038/s41467-020-14610-6,Photocatalytic destruction on In2O3,2020,Nature Comm.,Triplicate run at pH 4.0
PFOA,Fe0 nZVI,Reductive precipitation,20.0,120,82.5,38.0,10.1021/es051726o,Degradation with zerovalent iron,2006,Environ. Sci. Technol.,Volatile fluorocarbons detected
PFOS,BDD anode,Electrochemical oxidation,100.0,240,95.0,62.0,10.1016/j.cej.2017.10.024,Electrochemical mineralization of PFOS,2018,Chem. Eng. J.,Galvanostatic 15 mA/cm2
"""

@router.post("/upload", response_model=UploadedDocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Uploads a PDF or text research document, extracts chunks, and parses candidate claims (authenticated)."""
    target_path, clean_name, mime_type, file_size = await _save_validated_file(file)

    try:
        doc = literature_service.process_document(
            db=db,
            file_path=target_path,
            filename=clean_name,
            mime_type=mime_type,
            project_id=project_id,
            user_id=current_user.id
        )
        return doc
    except Exception as e:
        if target_path.exists():
            target_path.unlink()
        raise HTTPException(status_code=500, detail=f"Document extraction failed: {str(e)}")

@router.get("/documents", response_model=List[UploadedDocumentResponse])
def list_documents(
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Lists all uploaded research documents with their extraction status."""
    query = db.query(UploadedDocument)
    if project_id:
        query = query.filter(UploadedDocument.project_id == project_id)
    return query.order_by(UploadedDocument.created_at.desc()).all()

@router.get("/documents/{document_id}", response_model=UploadedDocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    """Retrieves document details, chunks, and candidate claims."""
    doc = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc

@router.get("/claims", response_model=List[CandidateClaimResponse])
def list_claims(
    document_id: Optional[int] = Query(None, description="Filter claims by document ID"),
    status: Optional[str] = Query(None, description="Filter by verification status: unverified, verified, or rejected"),
    claim_type: Optional[str] = Query(None, description="Filter by claim type"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Lists extracted candidate claims with status, claim type, and document filtering."""
    query = db.query(CandidateClaim)
    if document_id is not None:
        query = query.filter(CandidateClaim.document_id == document_id)
    if status:
        query = query.filter(CandidateClaim.verification_status == status)
    if claim_type:
        query = query.filter(CandidateClaim.claim_type == claim_type)
    return query.order_by(CandidateClaim.created_at.desc()).offset(offset).limit(limit).all()

@router.get("/claims/{claim_id}", response_model=CandidateClaimResponse)
def get_claim(claim_id: int, db: Session = Depends(get_db)):
    """Retrieves specific candidate claim by ID."""
    claim = db.query(CandidateClaim).filter(CandidateClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Candidate claim not found.")
    return claim

@router.post("/claims/{claim_id}/verify", response_model=CandidateClaimResponse)
def verify_candidate_claim(
    claim_id: int,
    request: ClaimVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verification interface: researcher verifies or rejects candidate claim with audit logging (authenticated)."""
    try:
        claim = literature_service.verify_claim(
            db=db,
            claim_id=claim_id,
            status=request.verification_status,
            reviewer_notes=request.reviewer_notes,
            edited_data=request.edited_data,
            user_id=current_user.id
        )
        return claim
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/query", response_model=LiteratureQueryResponse)
def query_literature(
    request: LiteratureQueryRequest,
    db: Session = Depends(get_db)
):
    """Answers research questions using strict source-passage citations from stored documents."""
    return literature_service.query_literature(
        db=db,
        query=request.query,
        target_pfas=request.target_pfas,
        top_k=request.top_k
    )

@router.get("/csv-template", response_class=PlainTextResponse)
def download_csv_template():
    """Returns sample experimental dataset CSV template with verified headers."""
    return Response(
        content=CSV_TEMPLATE,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=qflux_experiment_template.csv"}
    )

@router.post("/import-csv/preview", response_model=CSVImportPreviewResponse)
async def preview_csv_import(file: UploadFile = File(...)):
    """Validates uploaded experimental CSV row-by-row before committing."""
    temp_path, _, _, _ = await _save_validated_file(file, allowed_exts={".csv"})

    try:
        preview = literature_service.preview_csv_import(temp_path)
        return preview
    finally:
        if temp_path.exists():
            temp_path.unlink()

@router.post("/import-csv/execute")
async def execute_csv_import(
    file: UploadFile = File(...),
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Executes transactional import of validated CSV experimental dataset (authenticated)."""
    temp_path, _, _, _ = await _save_validated_file(file, allowed_exts={".csv"})

    try:
        result = literature_service.execute_csv_import(
            db=db,
            file_path=temp_path,
            project_id=project_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    finally:
        if temp_path.exists():
            temp_path.unlink()

@router.post("/import-json/preview", response_model=CSVImportPreviewResponse)
async def preview_json_import(file: UploadFile = File(...)):
    """Validates uploaded experimental JSON dataset record-by-record before committing."""
    temp_path, _, _, _ = await _save_validated_file(file, allowed_exts={".json"})
    try:
        preview = literature_service.preview_json_import(temp_path)
        return preview
    finally:
        if temp_path.exists():
            temp_path.unlink()

@router.post("/import-json/execute")
async def execute_json_import(
    file: UploadFile = File(...),
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Executes transactional import of validated JSON experimental dataset (authenticated)."""
    temp_path, _, _, _ = await _save_validated_file(file, allowed_exts={".json"})
    try:
        result = literature_service.execute_json_import(
            db=db,
            file_path=temp_path,
            project_id=project_id,
            user_id=current_user.id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    finally:
        if temp_path.exists():
            temp_path.unlink()

@router.get("/export-records")
def export_experimental_records(
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Exports validated experimental treatment records with complete provenance."""
    return literature_service.export_verified_records(db=db, project_id=project_id)
