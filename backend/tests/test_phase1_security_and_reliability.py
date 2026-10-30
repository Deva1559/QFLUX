import os
import time
import json
import uuid
import pytest
from datetime import datetime, timedelta
from jose import jwt
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import Settings, DEFAULT_DEV_SECRET
from app.core.security import create_access_token, decode_access_token
from app.models import User, CalculationJob
from app.services.job_service import job_service
from app.services.quantum_service import quantum_service

client = TestClient(app)

# -------------------------------------------------------------
# 1. Security Configuration Tests: Production Secret & CORS
# -------------------------------------------------------------

def test_production_secret_rejection_of_default_key(monkeypatch):
    """Verifies production mode rejects default development secret."""
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", DEFAULT_DEV_SECRET)
    with pytest.raises(ValueError, match="Default development secret is prohibited"):
        Settings()

def test_production_secret_rejection_of_missing_key(monkeypatch):
    """Verifies production mode rejects missing SECRET_KEY."""
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("SECRET_KEY", raising=False)
    with pytest.raises(ValueError, match="Production mode requires a dedicated SECRET_KEY"):
        Settings()

def test_production_secret_rejection_of_short_key(monkeypatch):
    """Verifies production mode rejects short SECRET_KEY (<32 chars)."""
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", "too_short_key_under_32")
    with pytest.raises(ValueError, match="at least 32 characters long"):
        Settings()

def test_production_valid_configuration(monkeypatch):
    """Verifies production mode accepts strong >=32 char secret and explicit CORS origins."""
    strong_secret = "a_super_strong_production_secret_key_exceeding_32_characters_2026!"
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", strong_secret)
    monkeypatch.setenv("CORS_ORIGINS", "https://qflux.org, https://app.qflux.org")

    cfg = Settings()
    assert cfg.IS_PRODUCTION is True
    assert cfg.SECRET_KEY == strong_secret
    assert "https://qflux.org" in cfg.CORS_ORIGINS
    assert "https://app.qflux.org" in cfg.CORS_ORIGINS
    assert "*" not in cfg.CORS_ORIGINS

def test_production_cors_wildcard_rejection(monkeypatch):
    """Verifies production mode rejects wildcard '*' origin."""
    strong_secret = "a_super_strong_production_secret_key_exceeding_32_characters_2026!"
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", strong_secret)
    monkeypatch.setenv("CORS_ORIGINS", "https://qflux.org, *")

    with pytest.raises(ValueError, match="Wildcard '\\*' origin is prohibited in production mode"):
        Settings()

def test_development_convenient_configuration(monkeypatch):
    """Verifies development mode falls back conveniently to development secret."""
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.delenv("SECRET_KEY", raising=False)
    monkeypatch.delenv("CORS_ORIGINS", raising=False)

    cfg = Settings()
    assert cfg.IS_PRODUCTION is False
    assert cfg.SECRET_KEY == DEFAULT_DEV_SECRET
    assert cfg.CORS_ORIGINS == ["*"]


# -------------------------------------------------------------
# 2. Token Security & Expired Token Handling Tests
# -------------------------------------------------------------

def test_expired_token_rejection(db_session):
    """Verifies that an expired access token is rejected with HTTP 401."""
    # Create token expired 1 hour ago
    expired_token = create_access_token(
        data={"sub": "researcher@qflux.org"},
        expires_delta=timedelta(hours=-1)
    )

    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert "Could not validate credentials or token expired" in res.json()["detail"]

def test_tampered_token_rejection(db_session):
    """Verifies that a tampered/malformed JWT is rejected with HTTP 401."""
    valid_token = create_access_token(data={"sub": "researcher@qflux.org"})
    tampered_token = valid_token[:-4] + "fake"

    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tampered_token}"})
    assert res.status_code == 401

def test_token_without_sub_claim_rejection(db_session):
    """Verifies that a token missing 'sub' claim is rejected with HTTP 401."""
    token_no_sub = create_access_token(data={"role": "Researcher"})
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token_no_sub}"})
    assert res.status_code == 401

def test_nonexistent_user_token_rejection(db_session):
    """Verifies that a token referencing a deleted/nonexistent user is rejected with HTTP 401."""
    ghost_token = create_access_token(data={"sub": "ghost_nonexistent_user@qflux.org"})
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {ghost_token}"})
    assert res.status_code == 401
    assert "Authenticated user account not found" in res.json()["detail"]


# -------------------------------------------------------------
# 3. Quantum Job Worker Execution, Reliability, & Lifecycle
# -------------------------------------------------------------

def test_quantum_job_full_execution_lifecycle(db_session):
    """Verifies complete VQE quantum job submission, background execution, result storage, and status polling."""
    from tests.conftest import get_auth_headers
    headers = get_auth_headers()

    payload = {
        "job_type": "vqe_quantum",
        "input_params": {
            "run_name": "Full Reliability VQE Test",
            "model_type": "Pedagogical Toy Benchmark",
            "optimizer": "Nelder-Mead",
            "max_iter": 50,
            "tolerance": 1e-4,
            "coeff_z0": -1.0,
            "coeff_z1": -0.8,
            "coeff_xx": 0.3,
            "coeff_zz": 0.2
        }
    }

    # Submit job
    submit_res = client.post("/api/v1/jobs", json=payload, headers=headers)
    assert submit_res.status_code == 201
    job_data = submit_res.json()
    job_id = job_data["id"]
    assert job_data["status"] in ["Queued", "Running", "Completed"]

    # Poll until terminal state
    terminal_data = None
    for _ in range(40):
        get_res = client.get(f"/api/v1/jobs/{job_id}", headers=headers)
        assert get_res.status_code == 200
        terminal_data = get_res.json()
        if terminal_data["status"] in ["Completed", "Failed", "Cancelled"]:
            break
        time.sleep(0.1)

    assert terminal_data is not None
    assert terminal_data["status"] == "Completed"
    assert terminal_data["progress_pct"] == 100.0
    assert terminal_data["runtime_seconds"] is not None
    assert terminal_data["runtime_seconds"] > 0

    # Verify structured results in JSON
    results = json.loads(terminal_data["output_results_json"])
    assert "vqe_energy" in results
    assert "exact_energy" in results
    assert "absolute_error" in results
    assert results["is_toy_model"] is True
    assert "disclaimer_text" in results
    assert "Parametric Hamiltonian benchmark" in results["disclaimer_text"]

def test_quantum_job_worker_handles_extra_and_invalid_args(db_session):
    """Verifies that job worker handles invalid input parameters gracefully by recording failure."""
    payload = {
        "job_type": "vqe_quantum",
        "input_params": {
            "model_type": "Pedagogical Toy Benchmark",
            "optimizer": "Nelder-Mead",
            "max_iter": "invalid_number_string",
            "tolerance": "invalid_float",
            "extra_unrecognized_argument": "should_be_ignored_safely"
        }
    }

    from tests.conftest import get_auth_headers
    headers = get_auth_headers()

    submit_res = client.post("/api/v1/jobs", json=payload, headers=headers)
    assert submit_res.status_code == 201
    job_id = submit_res.json()["id"]

    final_data = None
    for _ in range(30):
        res = client.get(f"/api/v1/jobs/{job_id}", headers=headers)
        final_data = res.json()
        if final_data["status"] in ["Completed", "Failed"]:
            break
        time.sleep(0.1)

    assert final_data is not None
    # Invalid types cause schema validation error which is captured safely in status=Failed
    assert final_data["status"] == "Failed"
    assert final_data["error_message"] is not None

def test_quantum_job_worker_ignores_extra_valid_args(db_session):
    """Verifies that extra unrecognized parameters do not crash valid benchmark executions."""
    from tests.conftest import get_auth_headers
    headers = get_auth_headers()
    payload = {
        "job_type": "vqe_quantum",
        "input_params": {
            "run_name": "Extra Args Benchmark",
            "model_type": "Pedagogical Toy Benchmark",
            "optimizer": "Nelder-Mead",
            "max_iter": 30,
            "tolerance": 1e-4,
            "extra_custom_metadata": "ignored_cleanly"
        }
    }

    submit_res = client.post("/api/v1/jobs", json=payload, headers=headers)
    assert submit_res.status_code == 201
    job_id = submit_res.json()["id"]

    final_data = None
    for _ in range(30):
        res = client.get(f"/api/v1/jobs/{job_id}", headers=headers)
        final_data = res.json()
        if final_data["status"] in ["Completed", "Failed"]:
            break
        time.sleep(0.1)

    assert final_data is not None
    assert final_data["status"] == "Completed"
    assert final_data["output_results_json"] is not None

def test_quantum_job_cancellation_consistency(db_session):
    """Verifies cancellation leaves consistent database state and clears worker flags."""
    from tests.conftest import get_auth_headers
    headers = get_auth_headers()
    payload = {
        "job_type": "vqe_quantum",
        "input_params": {
            "run_name": "Job Cancel Test",
            "model_type": "Reduced C-F Active Space",
            "optimizer": "Nelder-Mead",
            "max_iter": 3000,
            "tolerance": 1e-10
        }
    }

    submit_res = client.post("/api/v1/jobs", json=payload, headers=headers)
    assert submit_res.status_code == 201
    job_id = submit_res.json()["id"]

    # Cancel job
    cancel_res = client.post(f"/api/v1/jobs/{job_id}/cancel", headers=headers)
    assert cancel_res.status_code == 200
    cancel_data = cancel_res.json()
    assert cancel_data["status"] in ["Cancelled", "Completed"]

    # Wait briefly and verify terminal state remains consistent
    time.sleep(0.3)
    final_res = client.get(f"/api/v1/jobs/{job_id}", headers=headers)
    final_status = final_res.json()["status"]
    assert final_status in ["Cancelled", "Completed"]
    assert job_id not in job_service._cancel_flags


# -------------------------------------------------------------
# 4. File Upload Security & Validation
# -------------------------------------------------------------

def test_file_upload_rejects_disallowed_extension(db_session):
    """Verifies that malicious or unsupported file extensions (.exe, .sh) are rejected."""
    from tests.conftest import get_auth_headers
    headers = get_auth_headers()

    malicious_file = ("script.exe", b"binary_executable_data", "application/octet-stream")
    res = client.post(
        "/api/v1/literature/upload",
        files={"file": malicious_file},
        headers=headers
    )
    assert res.status_code == 400
    assert "Unsupported file format" in res.json()["detail"]

def test_file_upload_rejects_empty_filename(db_session):
    """Verifies that upload without filename is rejected with validation error."""
    from tests.conftest import get_auth_headers
    headers = get_auth_headers()

    empty_file = ("", b"some text content", "text/plain")
    res = client.post(
        "/api/v1/literature/upload",
        files={"file": empty_file},
        headers=headers
    )
    assert res.status_code in [400, 422]

