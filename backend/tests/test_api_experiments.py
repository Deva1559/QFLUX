import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import PFASCompound

client = TestClient(app)

def test_experiment_plans_crud(db_session):
    from tests.conftest import get_auth_headers
    headers = get_auth_headers()

    pfas = db_session.query(PFASCompound).first()
    assert pfas is not None

    # Create plan
    plan_payload = {
        "title": "Benchmarking In2O3 with groundwater competing anions",
        "target_pfas_id": pfas.id,
        "treatment_method": "Photocatalytic (UV-C)",
        "proposed_conditions": "pH 7.0, 50 mg/L sulfate, 100 mg/L chloride, 25°C",
        "planned_controls": "Dark control, UV without catalyst",
        "expected_measurements": "PFOA removal, inorganic fluoride release (IC)",
        "analytical_methods": "LC-MS/MS, Ion Chromatography",
        "detection_limits": "0.01 mg/L for F-",
        "safety_hazards": "UV-C eye hazard; PPE required",
        "experiment_status": "Scheduled"
    }

    # Verify unauthenticated call is rejected
    unauth_res = client.post("/api/v1/experiments/plans", json=plan_payload)
    assert unauth_res.status_code == 401

    res = client.post("/api/v1/experiments/plans", json=plan_payload, headers=headers)
    assert res.status_code == 201
    plan = res.json()
    assert plan["title"] == plan_payload["title"]
    plan_id = plan["id"]

    # List plans
    list_res = client.get("/api/v1/experiments/plans")
    assert list_res.status_code == 200
    assert any(p["id"] == plan_id for p in list_res.json())

    # Update plan
    update_res = client.put(f"/api/v1/experiments/plans/{plan_id}", json={"experiment_status": "Completed"}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["experiment_status"] == "Completed"

    # Delete plan
    del_res = client.delete(f"/api/v1/experiments/plans/{plan_id}", headers=headers)
    assert del_res.status_code == 200

def test_csv_template_and_preview_validation(db_session):
    # 1. Download CSV template
    tmpl_res = client.get("/api/v1/literature/csv-template")
    assert tmpl_res.status_code == 200
    assert "target_pfas" in tmpl_res.text
    assert "parent_removal_pct" in tmpl_res.text

    # 2. Preview valid CSV
    valid_csv = (
        "target_pfas,catalyst,treatment_method,initial_conc_mg_l,duration_min,parent_removal_pct,defluorination_pct,doi,study_title,year,journal,notes\n"
        "PFOA,In2O3,Photocatalysis,50.0,180,99.2,78.4,10.1038/s41467-020-14610-6,Study 1,2020,Nat Comm,Valid run\n"
    )
    res_valid = client.post(
        "/api/v1/literature/import-csv/preview",
        files={"file": ("valid.csv", io.BytesIO(valid_csv.encode("utf-8")), "text/csv")}
    )
    assert res_valid.status_code == 200
    valid_data = res_valid.json()
    assert valid_data["total_rows"] == 1
    assert valid_data["valid_rows"] == 1
    assert valid_data["invalid_rows"] == 0

    # 3. Preview invalid CSV (negative conc, removal > 100%, missing fields)
    invalid_csv = (
        "target_pfas,catalyst,treatment_method,initial_conc_mg_l,duration_min,parent_removal_pct,defluorination_pct,doi,study_title,year,journal,notes\n"
        ",In2O3,Photocatalysis,-5.0,180,125.0,78.4,10.1038/xyz,Study Invalid,2020,Nat Comm,Broken row\n"
    )
    res_invalid = client.post(
        "/api/v1/literature/import-csv/preview",
        files={"file": ("invalid.csv", io.BytesIO(invalid_csv.encode("utf-8")), "text/csv")}
    )
    assert res_invalid.status_code == 200
    invalid_data = res_invalid.json()
    assert invalid_data["invalid_rows"] == 1
    assert len(invalid_data["preview_rows"][0]["errors"]) >= 2

    # 4. Execute import of valid CSV (authenticated)
    from tests.conftest import get_auth_headers
    headers = get_auth_headers()
    exec_res = client.post(
        "/api/v1/literature/import-csv/execute",
        files={"file": ("to_import.csv", io.BytesIO(valid_csv.encode("utf-8")), "text/csv")},
        headers=headers
    )
    assert exec_res.status_code == 200
    assert exec_res.json()["status"] == "success"
    assert exec_res.json()["imported_experiments_count"] == 1
