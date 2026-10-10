from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.models import Report, Project
from app.schemas import ReportResponse, ReportGenerateRequest
from app.services.report_service import report_service

router = APIRouter()

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_report(req: ReportGenerateRequest, db: Session = Depends(get_db)):
    try:
        report_record = report_service.generate_pdf_report(
            db=db,
            project_id=req.project_id,
            custom_title=req.report_title
        )
        return ReportResponse(
            id=report_record.id,
            project_id=report_record.project_id,
            report_title=report_record.report_title,
            pdf_filename=report_record.pdf_filename,
            file_size_bytes=report_record.file_size_bytes,
            download_url=f"/api/v1/reports/{report_record.id}/download",
            generated_at=report_record.generated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@router.get("", response_model=List[ReportResponse])
def list_reports(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Report)
    if project_id:
        query = query.filter(Report.project_id == project_id)
    records = query.order_by(Report.id.desc()).all()
    return [
        ReportResponse(
            id=r.id,
            project_id=r.project_id,
            report_title=r.report_title,
            pdf_filename=r.pdf_filename,
            file_size_bytes=r.file_size_bytes,
            download_url=f"/api/v1/reports/{r.id}/download",
            generated_at=r.generated_at
        )
        for r in records
    ]

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")
    return ReportResponse(
        id=r.id,
        project_id=r.project_id,
        report_title=r.report_title,
        pdf_filename=r.pdf_filename,
        file_size_bytes=r.file_size_bytes,
        download_url=f"/api/v1/reports/{r.id}/download",
        generated_at=r.generated_at
    )

@router.get("/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")
    
    file_path = settings.REPORTS_DIR / r.pdf_filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Report file not found on disk")
    
    return FileResponse(
        path=str(file_path),
        filename=r.pdf_filename,
        media_type="application/pdf"
    )
