import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

import uuid

def test_user_registration_and_login(db_session):
    unique_email = f"chemist_{uuid.uuid4().hex[:8]}@qflux.org"
    user_payload = {
        "email": unique_email,
        "password": "SecurePassword2026!",
        "full_name": "Dr. Jordan Lee",
        "role": "Researcher"
    }
    reg_res = client.post("/api/v1/auth/register", json=user_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert reg_data["email"] == unique_email
    assert reg_data["full_name"] == "Dr. Jordan Lee"

    # Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": "SecurePassword2026!"}
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    token = login_data["access_token"]
    assert len(token) > 20
    assert login_data["user"]["email"] == unique_email

    # Access current user profile with valid token
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == unique_email

    # Verify that request without token is rejected with 401 Unauthorized (no anonymous fallback)
    unauth_res = client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401

    # Verify mutating endpoints enforce token authentication with 401 Unauthorized
    unauth_pfas = client.post("/api/v1/pfas", json={"common_name": "Test", "acronym": "TEST_UNAUTH", "chemical_formula": "C2F4"})
    assert unauth_pfas.status_code == 401

    unauth_pfas_put = client.put("/api/v1/pfas/1", json={"notes": "Should fail"})
    assert unauth_pfas_put.status_code == 401

    unauth_pfas_del = client.delete("/api/v1/pfas/999")
    assert unauth_pfas_del.status_code == 401

    unauth_plan = client.post("/api/v1/experiments/plans", json={"title": "Test Plan"})
    assert unauth_plan.status_code == 401

    unauth_claim = client.post("/api/v1/literature/claims/1/verify", json={"verification_status": "verified"})
    assert unauth_claim.status_code == 401

def test_database_backup_and_csv_export(db_session):
    # Test DB backup endpoint
    backup_res = client.post("/api/v1/settings/backup")
    assert backup_res.status_code == 200
    b_data = backup_res.json()
    assert b_data["status"] == "success"
    assert "q_flux_backup_" in b_data["backup_file"]

    # Test CSV report export
    csv_res = client.get("/api/v1/reports/export/csv?project_id=1")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "Q-FLUX 2.0 SCIENTIFIC RESEARCH DOSSIER" in csv_res.text
    assert "CATALYST CANDIDATES & MULTI-DIMENSIONAL BENCHMARKS" in csv_res.text
