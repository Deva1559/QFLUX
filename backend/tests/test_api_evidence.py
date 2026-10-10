from fastapi.testclient import TestClient

def test_evidence_list_and_create(client: TestClient):
    # List pre-seeded evidence
    list_res = client.get("/api/v1/evidence")
    assert list_res.status_code == 200
    evidence = list_res.json()
    assert len(evidence) >= 1

    # Verify Smith et al. 2024 is in the list
    smith_study = next((e for e in evidence if "Smith" in (e["authors"] or "")), None)
    assert smith_study is not None
    assert smith_study["parent_removal_pct"] == 100.0
    assert smith_study["defluorination_pct"] == 13.0
    assert smith_study["mineralization_pct"] == 0.0

    # Create new evidence
    new_ev = {
        "compound_name": "GenX (HFPO-DA)",
        "study_title": "Electrochemical Mineralization of GenX on Boron-Doped Diamond Anode",
        "authors": "Bao, Y. et al.",
        "publication_year": 2022,
        "doi_or_url": "10.1016/j.jhazmat.2021.127419",
        "method": "BDD Anode Electrolysis",
        "parent_removal_pct": 99.0,
        "defluorination_pct": 82.0,
        "mineralization_pct": 74.0,
        "evidence_category": "Published experimental result",
        "verification_status": "Verified against primary literature"
    }
    create_res = client.post("/api/v1/evidence", json=new_ev)
    assert create_res.status_code == 201
    assert create_res.json()["compound_name"] == "GenX (HFPO-DA)"

def test_insights_generation(client: TestClient):
    res = client.get("/api/v1/insights")
    assert res.status_code == 200
    insights = res.json()
    assert len(insights) >= 1
    # Check that rule for parent removal exceeding defluorination was triggered
    rule_gap = next((i for i in insights if i["rule_id"] == "RULE-GAP-DEFL-01"), None)
    assert rule_gap is not None
    assert rule_gap["severity"] == "Critical"
