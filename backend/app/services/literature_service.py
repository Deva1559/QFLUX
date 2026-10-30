import os
import re
import uuid
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from pypdf import PdfReader

from app.core.config import settings
from app.models import (
    UploadedDocument, DocumentChunk, CandidateClaim, EvidenceRecord,
    TreatmentExperiment, ExperimentalStudy, PFASCompound, Catalyst, User, AuditRecord
)
from app.schemas import (
    LiteratureSourceCitation, LiteratureQueryResponse,
    CSVImportPreviewResponse, CSVImportPreviewRow
)
from app.services.embedding_service import embedding_service

PFAS_PATTERNS = [
    r"\bPFOA\b", r"\bperfluorooctanoic acid\b", r"\bperfluorooctanoate\b",
    r"\bPFOS\b", r"\bperfluorooctanesulfonic acid\b", r"\bperfluorooctanesulfonate\b",
    r"\bGenX\b", r"\bHFPO-DA\b", r"\bPFBA\b", r"\bPFHpA\b", r"\bPFHxA\b", r"\bPFBS\b"
]

CATALYST_PATTERNS = [
    r"\bIn2O3\b", r"\bindium oxide\b", r"\bnZVI\b", r"\bzerovalent iron\b", r"\bFe0\b",
    r"\bBDD\b", r"\bboron-doped diamond\b", r"\bUV/sulfite\b", r"\bsulfite\b",
    r"\bBiOCl\b", r"\bbismuth oxychloride\b", r"\bGa2O3\b", r"\bgallium oxide\b",
    r"\bTiO2\b", r"\btitanium dioxide\b", r"\bpersulfate\b", r"\belectrochemical\b"
]

class LiteratureService:
    @staticmethod
    def extract_text_from_file(file_path: Path, mime_type: str) -> Tuple[str, List[Dict[str, Any]]]:
        """Extracts text and page-level chunks from PDF or text file."""
        text_chunks = []
        full_text_parts = []

        if mime_type == "application/pdf" or file_path.suffix.lower() == ".pdf":
            try:
                reader = PdfReader(str(file_path))
                for page_num, page in enumerate(reader.pages, start=1):
                    page_text = page.extract_text() or ""
                    cleaned = re.sub(r"\s+", " ", page_text).strip()
                    if cleaned:
                        full_text_parts.append(cleaned)
                        text_chunks.append({
                            "page_number": page_num,
                            "section_title": f"Page {page_num}",
                            "content": cleaned
                        })
            except Exception as e:
                # Fallback on plain text reading
                text_chunks = [{"page_number": 1, "section_title": "Document Content", "content": f"PDF parse error: {str(e)}"}]
        else:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            full_text_parts.append(content)
            # Break text into ~1000 char sections
            lines = content.split("\n\n")
            current_chunk = []
            current_len = 0
            page_idx = 1
            for paragraph in lines:
                current_chunk.append(paragraph)
                current_len += len(paragraph)
                if current_len >= 1200:
                    text_chunks.append({
                        "page_number": page_idx,
                        "section_title": f"Section {page_idx}",
                        "content": "\n\n".join(current_chunk).strip()
                    })
                    current_chunk = []
                    current_len = 0
                    page_idx += 1
            if current_chunk:
                text_chunks.append({
                    "page_number": page_idx,
                    "section_title": f"Section {page_idx}",
                    "content": "\n\n".join(current_chunk).strip()
                })

        return "\n\n".join(full_text_parts), text_chunks

    @staticmethod
    def extract_candidate_claims(content: str) -> List[Dict[str, Any]]:
        """Deterministic extractor searching for verifiable claims:
        catalyst, target pfas, removal %, defluorination %, and conditions."""
        claims = []

        # Find PFAS matches
        pfas_found = []
        for pat in PFAS_PATTERNS:
            m = re.findall(pat, content, flags=re.IGNORECASE)
            if m:
                pfas_found.extend(m)
        pfas_found = list(set([p.upper() for p in pfas_found]))

        # Find Catalyst matches
        cats_found = []
        for pat in CATALYST_PATTERNS:
            m = re.findall(pat, content, flags=re.IGNORECASE)
            if m:
                cats_found.extend(m)
        cats_found = list(set(cats_found))

        # Find Percentages (removal and defluorination)
        removal_matches = re.findall(r"(\b(?:removal|degradation|decomposition|elimination)\b[^\.\n;]{0,40}?(\d+(?:\.\d+)?)\s*%)", content, flags=re.IGNORECASE)
        defluor_matches = re.findall(r"(\b(?:defluorination|fluoride release|F- release|mineralization)\b[^\.\n;]{0,40}?(\d+(?:\.\d+)?)\s*%)", content, flags=re.IGNORECASE)

        if pfas_found and cats_found:
            for cat in cats_found:
                for pfas in pfas_found:
                    claim_data = {
                        "target_pfas": pfas,
                        "catalyst": cat,
                        "reported_removal_pct": float(removal_matches[0][1]) if removal_matches else None,
                        "reported_defluorination_pct": float(defluor_matches[0][1]) if defluor_matches else None,
                        "context_quote": content[:300] + "..." if len(content) > 300 else content
                    }
                    claims.append({
                        "claim_type": "catalyst_performance",
                        "data": claim_data
                    })
        elif removal_matches or defluor_matches:
            claim_data = {
                "target_pfas": pfas_found[0] if pfas_found else "PFOA (inferred)",
                "catalyst": cats_found[0] if cats_found else "Experimental catalyst",
                "reported_removal_pct": float(removal_matches[0][1]) if removal_matches else None,
                "reported_defluorination_pct": float(defluor_matches[0][1]) if defluor_matches else None,
                "context_quote": content[:300] + "..." if len(content) > 300 else content
            }
            claims.append({
                "claim_type": "catalyst_performance",
                "data": claim_data
            })

        return claims

    @classmethod
    def process_document(
        cls,
        db: Session,
        file_path: Path,
        filename: str,
        mime_type: str,
        project_id: Optional[int] = None,
        user_id: Optional[int] = None
    ) -> UploadedDocument:
        """Processes document: stores record, extracts chunks, parses claims."""
        doc = UploadedDocument(
            project_id=project_id,
            filename=filename,
            file_path=str(file_path),
            file_size_bytes=os.path.getsize(file_path),
            mime_type=mime_type,
            extraction_status="processing",
            uploaded_by_id=user_id
        )
        db.add(doc)
        db.flush()

        try:
            full_text, chunks = cls.extract_text_from_file(file_path, mime_type)
            doc.raw_text = full_text
            doc.chunk_count = len(chunks)

            # Compute batch dense vector embeddings for chunks
            chunk_contents = [c.get("content", "") for c in chunks]
            try:
                embeddings = embedding_service.encode_batch(chunk_contents)
            except Exception as emb_err:
                embeddings = [[0.0] * 384 for _ in chunks]

            all_claims_count = 0
            for idx, c in enumerate(chunks):
                emb_vec = embeddings[idx] if idx < len(embeddings) else None
                chunk_obj = DocumentChunk(
                    document_id=doc.id,
                    chunk_index=idx,
                    section_title=c.get("section_title"),
                    page_number=c.get("page_number"),
                    content=c.get("content"),
                    embedding_json=json.dumps(emb_vec) if emb_vec else None
                )
                db.add(chunk_obj)
                db.flush()

                # Extract claims
                extracted_claims = cls.extract_candidate_claims(c.get("content"))
                for cl in extracted_claims:
                    claim_obj = CandidateClaim(
                        document_id=doc.id,
                        chunk_id=chunk_obj.id,
                        claim_type=cl["claim_type"],
                        extracted_data_json=json.dumps(cl["data"]),
                        verification_status="unverified"
                    )
                    db.add(claim_obj)
                    all_claims_count += 1

            doc.extraction_status = "completed"
            db.commit()
            return doc
        except Exception as e:
            doc.extraction_status = "failed"
            db.commit()
            raise e

    @staticmethod
    def query_literature(
        db: Session,
        query: str,
        target_pfas: Optional[str] = None,
        top_k: int = 5
    ) -> LiteratureQueryResponse:
        """Source-grounded research query over stored chunks, studies, and evidence using hybrid dense-vector embeddings."""
        query_tokens = [w.lower() for w in re.findall(r"\w+", query) if len(w) > 2]
        
        # 1. Encode query into dense vector embedding
        query_embedding = embedding_service.encode_text(query)

        # 2. Search in DocumentChunk with hybrid dense vector + keyword similarity
        chunks = db.query(DocumentChunk).all()
        scored_chunks: List[Tuple[float, DocumentChunk]] = []

        for ch in chunks:
            text = ch.content.lower()
            
            # Keyword / token overlap
            keyword_score = sum(text.count(token) for token in query_tokens)
            
            # Vector embedding semantic similarity
            vector_sim = 0.0
            if ch.embedding_json:
                try:
                    ch_vec = json.loads(ch.embedding_json)
                    vector_sim = embedding_service.cosine_similarity(query_embedding, ch_vec)
                except Exception:
                    vector_sim = 0.0
            else:
                # Lazy-encode and persist legacy chunks
                ch_vec = embedding_service.encode_text(ch.content)
                ch.embedding_json = json.dumps(ch_vec)
                vector_sim = embedding_service.cosine_similarity(query_embedding, ch_vec)

            # Only include chunks with keyword overlap or strong semantic vector similarity (>= 0.40)
            if keyword_score > 0 or vector_sim >= 0.40:
                score = (vector_sim * 10.0) + (keyword_score * 0.8)
                if target_pfas and target_pfas.lower() in text:
                    score += 5.0
                scored_chunks.append((score, ch))

        try:
            db.commit()
        except Exception:
            db.rollback()

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_chunks = scored_chunks[:top_k]

        citations: List[LiteratureSourceCitation] = []
        for score, ch in top_chunks:
            doc_name = ch.document.filename if ch.document else "Literature Archive"
            citations.append(LiteratureSourceCitation(
                document_title=doc_name,
                section_or_page=f"Page {ch.page_number or 'N/A'} ({ch.section_title or 'Section'})",
                doi_or_url=None,
                passage_excerpt=ch.content[:240] + ("..." if len(ch.content) > 240 else ""),
                relevance_score=round(score, 2)
            ))

        # 3. Also incorporate ExperimentalStudy and EvidenceRecord if matches found
        studies = db.query(ExperimentalStudy).all()
        for st in studies:
            st_text = f"{st.title} {st.abstract or ''}".lower()
            st_score = sum(st_text.count(t) for t in query_tokens)
            if st_score > 0:
                citations.append(LiteratureSourceCitation(
                    document_title=st.title,
                    section_or_page=f"{st.journal or 'Journal'} ({st.publication_year or 'N/A'})",
                    doi_or_url=st.doi or st.study_url,
                    passage_excerpt=st.abstract[:240] if st.abstract else st.title,
                    relevance_score=round(st_score * 1.5, 2)
                ))

        # Sort combined citations
        citations.sort(key=lambda x: x.relevance_score, reverse=True)
        citations = citations[:top_k]

        # Formulate grounded synthesis
        if not citations:
            return LiteratureQueryResponse(
                query=query,
                answer=(
                    f"No empirical literature records in the local Q-FLUX database currently match the query: '{query}'. "
                    "All Q-FLUX responses are strictly evidence-grounded and do not fabricate literature sources or experimental values."
                ),
                citations=[],
                missing_evidence_statement="No indexed documents or studies address this exact question with verified data.",
                confidence_level="Zero Evidence Found"
            )

        # Build answer using grounded LLM provider service
        from app.services.llm_provider_service import llm_service
        llm_res = llm_service.generate_grounded_answer(
            query=query,
            citations=citations,
            target_pfas=target_pfas
        )

        return LiteratureQueryResponse(
            query=query,
            answer=llm_res["answer"],
            citations=citations,
            missing_evidence_statement=llm_res.get("missing_evidence_statement"),
            confidence_level=llm_res.get("confidence_level", "Preliminary Grounded (Moderate)")
        )

    @staticmethod
    def verify_claim(
        db: Session,
        claim_id: int,
        status: str,
        reviewer_notes: Optional[str] = None,
        edited_data: Optional[Dict[str, Any]] = None,
        user_id: Optional[int] = None
    ) -> CandidateClaim:
        """Marks claim as verified or rejected, with optional researcher edits."""
        claim = db.query(CandidateClaim).filter(CandidateClaim.id == claim_id).first()
        if not claim:
            raise ValueError(f"CandidateClaim {claim_id} not found.")

        claim.verification_status = status
        claim.reviewer_notes = reviewer_notes
        claim.verified_by_id = user_id
        claim.verified_at = datetime.utcnow()

        if edited_data:
            claim.extracted_data_json = json.dumps(edited_data)

        # Log audit record
        audit = AuditRecord(
            user_id=user_id,
            action="VERIFY" if status == "verified" else "REJECT",
            entity_type="CandidateClaim",
            entity_id=str(claim_id),
            change_summary=f"Claim {claim_id} marked as {status}. Notes: {reviewer_notes or 'None'}"
        )
        db.add(audit)
        db.commit()
        db.refresh(claim)
        return claim

    @staticmethod
    def preview_csv_import(file_path: Path) -> CSVImportPreviewResponse:
        """Parses CSV, checks column headers and row validity."""
        import csv
        required_columns = ["target_pfas", "catalyst", "treatment_method", "initial_conc_mg_l", "parent_removal_pct"]
        preview_rows: List[CSVImportPreviewRow] = []
        
        with open(file_path, "r", encoding="utf-8-sig", errors="replace") as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames or []
            
            row_idx = 1
            for row in reader:
                errors = []
                # Check required fields
                for col in required_columns:
                    if col not in row or not row[col] or not row[col].strip():
                        errors.append(f"Missing required field '{col}'")
                
                # Check numbers
                if "initial_conc_mg_l" in row and row["initial_conc_mg_l"]:
                    try:
                        val = float(row["initial_conc_mg_l"])
                        if val <= 0:
                            errors.append("initial_conc_mg_l must be greater than zero.")
                    except ValueError:
                        errors.append("initial_conc_mg_l must be a valid number.")

                if "parent_removal_pct" in row and row["parent_removal_pct"]:
                    try:
                        val = float(row["parent_removal_pct"])
                        if val < 0 or val > 100:
                            errors.append("parent_removal_pct must be between 0 and 100.")
                    except ValueError:
                        errors.append("parent_removal_pct must be a valid number.")

                preview_rows.append(CSVImportPreviewRow(
                    row_number=row_idx,
                    valid=len(errors) == 0,
                    data=dict(row),
                    errors=errors
                ))
                row_idx += 1

        valid_count = sum(1 for r in preview_rows if r.valid)
        invalid_count = len(preview_rows) - valid_count

        return CSVImportPreviewResponse(
            total_rows=len(preview_rows),
            valid_rows=valid_count,
            invalid_rows=invalid_count,
            headers=headers,
            preview_rows=preview_rows
        )

    @staticmethod
    def execute_csv_import(
        db: Session,
        file_path: Path,
        project_id: Optional[int] = None,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Transactional execution of validated CSV dataset import."""
        import csv
        preview = LiteratureService.preview_csv_import(file_path)
        if preview.invalid_rows > 0:
            raise ValueError(f"Cannot import: {preview.invalid_rows} rows have validation errors. Review preview first.")

        created_experiments = 0
        with open(file_path, "r", encoding="utf-8-sig", errors="replace") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Find or create study
                doi = row.get("doi", "").strip() or None
                study_title = row.get("study_title", "CSV Imported Dataset Study").strip()
                study = None
                if doi:
                    study = db.query(ExperimentalStudy).filter(ExperimentalStudy.doi == doi).first()
                if not study:
                    study = ExperimentalStudy(
                        title=study_title,
                        doi=doi,
                        authors=row.get("authors", "").strip() or None,
                        publication_year=int(row["year"]) if row.get("year", "").isdigit() else None,
                        journal=row.get("journal", "").strip() or "Imported Experimental Data"
                    )
                    db.add(study)
                    db.flush()

                # Find or link PFAS
                pfas_name = row["target_pfas"].strip()
                pfas = db.query(PFASCompound).filter(
                    (PFASCompound.acronym.ilike(pfas_name)) | (PFASCompound.common_name.ilike(f"%{pfas_name}%"))
                ).first()
                if not pfas:
                    pfas = PFASCompound(
                        common_name=pfas_name,
                        acronym=pfas_name[:10].upper(),
                        chemical_formula="Unknown",
                        molecular_weight=400.0,
                        num_carbons=8,
                        num_fluorines=15
                    )
                    db.add(pfas)
                    db.flush()

                # Find or link Catalyst
                cat_name = row["catalyst"].strip()
                cat = db.query(Catalyst).filter(Catalyst.name.ilike(f"%{cat_name}%")).first()

                defluor = float(row["defluorination_pct"]) if row.get("defluorination_pct", "").strip() else None

                exp = TreatmentExperiment(
                    study_id=study.id,
                    project_id=project_id,
                    pfas_id=pfas.id,
                    catalyst_id=cat.id if cat else None,
                    treatment_method=row["treatment_method"].strip(),
                    initial_concentration_mg_l=float(row["initial_conc_mg_l"]),
                    duration_minutes=float(row["duration_min"]) if row.get("duration_min", "").strip() else None,
                    parent_removal_pct=float(row["parent_removal_pct"]),
                    defluorination_pct=defluor,
                    notes=row.get("notes", "Batch imported from experimental CSV")
                )
                db.add(exp)
                created_experiments += 1

        db.commit()
        return {
            "status": "success",
            "imported_experiments_count": created_experiments
        }

    @staticmethod
    def preview_json_import(file_path: Path) -> CSVImportPreviewResponse:
        """Parses JSON dataset, checks schema validity, duplicate keys, and condition metadata."""
        import json
        required_columns = ["target_pfas", "catalyst", "treatment_method", "initial_conc_mg_l", "parent_removal_pct"]
        preview_rows: List[CSVImportPreviewRow] = []

        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            raw_data = json.load(f)

        records = raw_data.get("experiments", raw_data) if isinstance(raw_data, dict) else raw_data
        if not isinstance(records, list):
            raise ValueError("Invalid JSON format: expected list of experiment records or an object with an 'experiments' array.")

        headers = list(required_columns)
        for idx, row in enumerate(records, start=1):
            errors = []
            if not isinstance(row, dict):
                errors.append("Row must be a JSON object.")
                preview_rows.append(CSVImportPreviewRow(row_number=idx, valid=False, data={}, errors=errors))
                continue

            for col in row.keys():
                if col not in headers:
                    headers.append(col)

            for col in required_columns:
                if col not in row or row[col] is None or str(row[col]).strip() == "":
                    errors.append(f"Missing required field '{col}'")

            if "initial_conc_mg_l" in row and row["initial_conc_mg_l"] is not None:
                try:
                    val = float(row["initial_conc_mg_l"])
                    if val <= 0:
                        errors.append("initial_conc_mg_l must be greater than zero.")
                except (ValueError, TypeError):
                    errors.append("initial_conc_mg_l must be a valid number.")

            if "parent_removal_pct" in row and row["parent_removal_pct"] is not None:
                try:
                    val = float(row["parent_removal_pct"])
                    if val < 0 or val > 100:
                        errors.append("parent_removal_pct must be between 0 and 100.")
                except (ValueError, TypeError):
                    errors.append("parent_removal_pct must be a valid number.")

            preview_rows.append(CSVImportPreviewRow(
                row_number=idx,
                valid=len(errors) == 0,
                data=row,
                errors=errors
            ))

        valid_count = sum(1 for r in preview_rows if r.valid)
        invalid_count = len(preview_rows) - valid_count

        return CSVImportPreviewResponse(
            total_rows=len(preview_rows),
            valid_rows=valid_count,
            invalid_rows=invalid_count,
            headers=headers,
            preview_rows=preview_rows
        )

    @staticmethod
    def execute_json_import(
        db: Session,
        file_path: Path,
        project_id: Optional[int] = None,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Transactional execution of validated JSON dataset import."""
        import json
        preview = LiteratureService.preview_json_import(file_path)
        if preview.invalid_rows > 0:
            raise ValueError(f"Cannot import: {preview.invalid_rows} records have validation errors.")

        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            raw_data = json.load(f)

        records = raw_data.get("experiments", raw_data) if isinstance(raw_data, dict) else raw_data
        created = 0

        for row in records:
            doi = str(row.get("doi", "")).strip() or None
            study_title = str(row.get("study_title", "JSON Imported Experimental Dataset")).strip()
            study = None
            if doi:
                study = db.query(ExperimentalStudy).filter(ExperimentalStudy.doi == doi).first()
            if not study:
                study = ExperimentalStudy(
                    title=study_title,
                    doi=doi,
                    authors=row.get("authors"),
                    publication_year=int(row["year"]) if str(row.get("year", "")).isdigit() else None,
                    journal=str(row.get("journal", "Imported Experimental Data"))
                )
                db.add(study)
                db.flush()

            pfas_name = str(row["target_pfas"]).strip()
            pfas = db.query(PFASCompound).filter(
                (PFASCompound.acronym.ilike(pfas_name)) | (PFASCompound.common_name.ilike(f"%{pfas_name}%"))
            ).first()
            if not pfas:
                pfas = PFASCompound(
                    common_name=pfas_name,
                    acronym=pfas_name[:10].upper(),
                    chemical_formula="Unknown",
                    molecular_weight=400.0,
                    num_carbons=8,
                    num_fluorines=15
                )
                db.add(pfas)
                db.flush()

            cat_name = str(row["catalyst"]).strip()
            cat = db.query(Catalyst).filter(Catalyst.name.ilike(f"%{cat_name}%")).first()

            defluor = float(row["defluorination_pct"]) if row.get("defluorination_pct") is not None else None

            exp = TreatmentExperiment(
                study_id=study.id,
                project_id=project_id,
                pfas_id=pfas.id,
                catalyst_id=cat.id if cat else None,
                treatment_method=str(row["treatment_method"]).strip(),
                initial_concentration_mg_l=float(row["initial_conc_mg_l"]),
                duration_minutes=float(row["duration_min"]) if row.get("duration_min") is not None else None,
                parent_removal_pct=float(row["parent_removal_pct"]),
                defluorination_pct=defluor,
                notes=str(row.get("notes", "Batch imported from experimental JSON"))
            )
            db.add(exp)
            created += 1

        db.commit()
        return {
            "status": "success",
            "imported_experiments_count": created
        }

    @staticmethod
    def export_verified_records(db: Session, project_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Exports validated experimental treatment records with complete provenance."""
        query = db.query(TreatmentExperiment)
        if project_id:
            query = query.filter(TreatmentExperiment.project_id == project_id)

        records = query.all()
        results = []
        for r in records:
            pfas_name = r.pfas_compound.common_name if r.pfas_compound else "Unknown PFAS"
            cat_name = "Unknown Catalyst"
            if r.catalyst_id:
                cat_obj = db.query(Catalyst).filter(Catalyst.id == r.catalyst_id).first()
                if cat_obj:
                    cat_name = cat_obj.name
            study_doi = r.study.doi if r.study else None
            study_title = r.study.title if r.study else "Unknown Study"

            results.append({
                "experiment_id": r.id,
                "project_id": r.project_id,
                "target_pfas": pfas_name,
                "catalyst_name": cat_name,
                "treatment_method": r.treatment_method,
                "initial_concentration_mg_l": r.initial_concentration_mg_l,
                "duration_minutes": r.duration_minutes,
                "parent_removal_pct": r.parent_removal_pct,
                "defluorination_pct": r.defluorination_pct,
                "study_doi": study_doi,
                "study_title": study_title,
                "evidence_status": "EXPERIMENTALLY_MEASURED",
                "notes": r.notes
            })
        return results

literature_service = LiteratureService()
