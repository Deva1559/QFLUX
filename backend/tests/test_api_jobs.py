import time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from tests.conftest import get_auth_headers

client = TestClient(app)

def test_calculation_job_scf_submission_and_completion(db_session):
    headers = get_auth_headers()
    payload = {
        "job_type": "scf_classical",
        "input_params": {
            "molecule_name": "CF3COO-",
            "xyz_coords": "C 0.0 0.0 0.0\nC 1.5 0.0 0.0\nO 2.1 1.0 0.0\nO 2.1 -1.0 0.0\nF -0.5 1.1 0.0\nF -0.5 -0.5 1.0\nF -0.5 -0.5 -1.0",
            "charge": -1,
            "spin_multiplicity": 1
        }
    }

    res = client.post("/api/v1/jobs", json=payload, headers=headers)
    assert res.status_code == 201
    job = res.json()
    assert job["job_type"] == "scf_classical"
    assert job["status"] in ["Queued", "Running", "Completed"]
    job_id = job["id"]

    # Poll until done (should be fast for our STO-3G solver)
    for _ in range(20):
        get_res = client.get(f"/api/v1/jobs/{job_id}", headers=headers)
        assert get_res.status_code == 200
        j_data = get_res.json()
        if j_data["status"] in ["Completed", "Failed"]:
            break
        time.sleep(0.1)

    assert j_data["status"] == "Completed"
    assert j_data["output_results_json"] is not None
    assert "total_scf_energy_au" in j_data["output_results_json"]

def test_calculation_job_cancellation(db_session):
    headers = get_auth_headers()
    payload = {
        "job_type": "vqe_quantum",
        "input_params": {
            "run_name": "Long VQE Test",
            "model_type": "Reduced C-F Active Space",
            "optimizer": "Nelder-Mead",
            "max_iter": 500,
            "tolerance": 1e-8
        }
    }

    res = client.post("/api/v1/jobs", json=payload, headers=headers)
    assert res.status_code == 201
    job_id = res.json()["id"]

    # Cancel immediately
    cancel_res = client.post(f"/api/v1/jobs/{job_id}/cancel", headers=headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] in ["Cancelled", "Completed"]

def test_calculation_job_vqe_submission_and_completion(db_session):
    headers = get_auth_headers()
    payload = {
        "job_type": "vqe_quantum",
        "input_params": {
            "run_name": "VQE Completion Test",
            "model_type": "Reduced C-F Active Space",
            "optimizer": "Nelder-Mead",
            "max_iter": 100,
            "tolerance": 1e-6
        }
    }

    res = client.post("/api/v1/jobs", json=payload, headers=headers)
    assert res.status_code == 201
    job = res.json()
    assert job["job_type"] == "vqe_quantum"
    assert job["status"] in ["Queued", "Running", "Completed"]
    job_id = job["id"]

    # Poll until done
    final_data = None
    for _ in range(40):
        get_res = client.get(f"/api/v1/jobs/{job_id}", headers=headers)
        assert get_res.status_code == 200
        final_data = get_res.json()
        if final_data["status"] in ["Completed", "Failed"]:
            break
        time.sleep(0.1)

    assert final_data is not None
    assert final_data["status"] == "Completed"
    assert final_data["progress_pct"] == 100.0
    assert final_data["output_results_json"] is not None
    assert "vqe_energy" in final_data["output_results_json"]
    assert "exact_energy" in final_data["output_results_json"]

def test_calculation_job_worker_exception_handling(db_session):
    headers = get_auth_headers()
    payload = {
        "job_type": "vqe_quantum",
        "input_params": {
            "model_type": "Unknown Model",
            "optimizer": "NonExistentOptimizer"
        }
    }

    res = client.post("/api/v1/jobs", json=payload, headers=headers)
    assert res.status_code == 201
    job_id = res.json()["id"]

    final_data = None
    for _ in range(30):
        get_res = client.get(f"/api/v1/jobs/{job_id}", headers=headers)
        assert get_res.status_code == 200
        final_data = get_res.json()
        if final_data["status"] in ["Completed", "Failed"]:
            break
        time.sleep(0.1)

    assert final_data is not None
    assert final_data["status"] == "Failed"
    assert final_data["error_message"] is not None
    assert "ERROR" in final_data["log_output"]
