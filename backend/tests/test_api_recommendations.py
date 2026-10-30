import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_recommendations_endpoint_and_transparency(db_session):
    res = client.get("/api/v1/recommendations?target_pfas=PFOA")
    assert res.status_code == 200
    recs = res.json()
    assert len(recs) >= 3

    # Check top candidate
    top = recs[0]
    assert "candidate_name" in top
    assert "composite_score" in top
    assert "defluorination_penalty_applied" in top
    assert "penalty_explanation" in top
    assert "proposed_next_experiment" in top
    assert "conditions_under_which_recommendation_holds" in top

    # Find BiOCl or candidate with missing defluorination to verify penalty
    penalized = [r for r in recs if r["defluorination_penalty_applied"] is True]
    assert len(penalized) >= 1
    # Check that penalty explanation explicitly mentions defluorination
    for p in penalized:
        assert "defluorination" in p["penalty_explanation"].lower() or "fluoride" in p["penalty_explanation"].lower()

    # Check that next experiments are explicitly formulated
    for r in recs:
        assert len(r["proposed_next_experiment"]) > 10
        assert len(r["conditions_under_which_recommendation_holds"]) > 5
