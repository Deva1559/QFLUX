import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import PFASCompound

client = TestClient(app)

def test_pfas_list_and_search(db_session):
    # Test listing compounds
    res = client.get("/api/v1/pfas")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 2
    acronyms = [item["acronym"] for item in data]
    assert "PFOA" in acronyms
    assert "PFOS" in acronyms

    # Test search by acronym
    res_search = client.get("/api/v1/pfas?search=pfoa")
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert len(search_data) >= 1
    assert search_data[0]["acronym"] == "PFOA"

    # Test filter by carbon number
    res_carbons = client.get("/api/v1/pfas?min_carbons=4&max_carbons=6")
    assert res_carbons.status_code == 200
    carbon_data = res_carbons.json()
    for item in carbon_data:
        assert 4 <= item["num_carbons"] <= 6

def test_pfas_crud_lifecycle(db_session):
    from tests.conftest import get_auth_headers
    headers = get_auth_headers()

    # Create new PFAS
    new_pfas = {
        "common_name": "Perfluorohexanoic acid",
        "acronym": "PFHXA_TEST",
        "cas_number": "307-24-4-TEST",
        "chemical_formula": "C6HF11O2",
        "smiles": "OC(=O)C(F)(F)C(F)(F)C(F)(F)C(F)(F)C(F)(F)F",
        "molecular_weight": 314.05,
        "num_carbons": 6,
        "num_fluorines": 11,
        "pka": 0.0,
        "water_solubility_mg_l": 20000.0,
        "property_sources": "CompTox Chemicals Dashboard",
        "aliases_json": '["PFHxA", "Undecafluorohexanoic acid"]',
        "notes": "Short-chain carboxylic acid test compound."
    }

    # Verify unauthenticated call is rejected
    unauth_res = client.post("/api/v1/pfas", json=new_pfas)
    assert unauth_res.status_code == 401

    create_res = client.post("/api/v1/pfas", json=new_pfas, headers=headers)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["acronym"] == "PFHXA_TEST"
    pfas_id = created["id"]

    # Duplicate creation check
    dup_res = client.post("/api/v1/pfas", json=new_pfas, headers=headers)
    assert dup_res.status_code == 400

    # Retrieve by ID
    get_res = client.get(f"/api/v1/pfas/{pfas_id}")
    assert get_res.status_code == 200
    assert get_res.json()["num_fluorines"] == 11

    # Update
    update_res = client.put(f"/api/v1/pfas/{pfas_id}", json={"water_solubility_mg_l": 21500.0}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["water_solubility_mg_l"] == 21500.0

    # Delete
    del_res = client.delete(f"/api/v1/pfas/{pfas_id}", headers=headers)
    assert del_res.status_code == 200

    # Verify deleted
    get_again = client.get(f"/api/v1/pfas/{pfas_id}")
    assert get_again.status_code == 404
