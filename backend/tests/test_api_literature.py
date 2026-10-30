import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_literature_upload_extraction_and_claims(db_session):
    from tests.conftest import get_auth_headers
    headers = get_auth_headers()

    # Upload text paper
    sample_text = (
        "Photocatalytic destruction of PFOA on In2O3 nanocubes under UV irradiation. "
        "The reaction achieved 99.2% parent removal and 78.4% defluorination within 180 min. "
        "Intermediate analysis identified minor PFHpA, with fluoride release confirmed via ion chromatography."
    )
    file_bytes = io.BytesIO(sample_text.encode("utf-8"))

    # Test unauthenticated upload rejection
    unauth_upload = client.post(
        "/api/v1/literature/upload",
        files={"file": ("sample_study.txt", io.BytesIO(sample_text.encode("utf-8")), "text/plain")}
    )
    assert unauth_upload.status_code == 401

    # Authenticated upload
    upload_res = client.post(
        "/api/v1/literature/upload",
        files={"file": ("sample_study.txt", file_bytes, "text/plain")},
        headers=headers
    )
    assert upload_res.status_code == 200
    doc = upload_res.json()
    assert doc["filename"] == "sample_study.txt"
    assert doc["extraction_status"] == "completed"
    assert len(doc["claims"]) >= 1

    claim = doc["claims"][0]
    claim_id = claim["id"]
    assert claim["verification_status"] == "unverified"

    # Test dedicated GET /api/v1/literature/claims endpoint
    all_claims_res = client.get("/api/v1/literature/claims")
    assert all_claims_res.status_code == 200
    all_claims = all_claims_res.json()
    assert isinstance(all_claims, list)
    assert any(c["id"] == claim_id for c in all_claims)

    # Test GET /api/v1/literature/claims/{claim_id}
    single_claim_res = client.get(f"/api/v1/literature/claims/{claim_id}")
    assert single_claim_res.status_code == 200
    assert single_claim_res.json()["id"] == claim_id

    # Test filter by document_id
    doc_claims_res = client.get(f"/api/v1/literature/claims?document_id={doc['id']}")
    assert doc_claims_res.status_code == 200
    assert len(doc_claims_res.json()) >= 1

    # Verify claim as researcher (unauthenticated -> 401)
    unauth_verify = client.post(
        f"/api/v1/literature/claims/{claim_id}/verify",
        json={"verification_status": "verified"}
    )
    assert unauth_verify.status_code == 401

    # Verify claim as researcher (authenticated)
    verify_res = client.post(
        f"/api/v1/literature/claims/{claim_id}/verify",
        json={
            "verification_status": "verified",
            "reviewer_notes": "Corroborated with Figure 3 of published article."
        },
        headers=headers
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["verification_status"] == "verified"
    assert verify_res.json()["reviewer_notes"] == "Corroborated with Figure 3 of published article."

    # Test filter by verification status
    verified_claims_res = client.get("/api/v1/literature/claims?status=verified")
    assert verified_claims_res.status_code == 200
    assert any(c["id"] == claim_id for c in verified_claims_res.json())

    # Test reject claim endpoint
    reject_res = client.post(
        f"/api/v1/literature/claims/{claim_id}/verify",
        json={
            "verification_status": "rejected",
            "reviewer_notes": "Matrix interference observed."
        },
        headers=headers
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["verification_status"] == "rejected"

def test_literature_query_grounding(db_session):
    # Query with matching terms
    res = client.post(
        "/api/v1/literature/query",
        json={"query": "In2O3 photocatalytic defluorination PFOA", "target_pfas": "PFOA"}
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["citations"]) >= 1
    assert "In2O3" in data["answer"] or "Li, Z." in data["answer"] or len(data["citations"]) > 0

    # Query with no match (must NOT hallucinate)
    res_empty = client.post(
        "/api/v1/literature/query",
        json={"query": "nonexistent_cryptic_chemical_xyz_9999"}
    )
    assert res_empty.status_code == 200
    empty_data = res_empty.json()
    assert len(empty_data["citations"]) == 0
    assert "No empirical literature records" in empty_data["answer"]
    assert empty_data["confidence_level"] == "Zero Evidence Found"
