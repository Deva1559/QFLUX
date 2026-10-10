import pytest
from app.services.prioritization_service import prioritization_engine, DEFAULT_WEIGHTS
from app.models import Catalyst

def test_missing_defluorination_penalty(db):
    """Ensure candidate with missing defluorination is classified as unrankable/penalized."""
    biocl = db.query(Catalyst).filter(Catalyst.name.like("%BiOCl%")).first()
    assert biocl is not None
    assert biocl.reported_defluorination_pct is None

    eval_res = prioritization_engine.evaluate_candidate(biocl, DEFAULT_WEIGHTS)
    assert eval_res["is_rankable"] is False
    assert "Missing Defluorination" in eval_res["category"]
    assert any("MISSING" in note for note in eval_res["eval_notes"])

def test_in2o3_high_ranking(db):
    """In2O3 with 78.4% defluorination and byproduct safety should rank near the top."""
    in2o3 = db.query(Catalyst).filter(Catalyst.name.like("%In2O3%")).first()
    assert in2o3 is not None
    assert in2o3.reported_defluorination_pct == 78.4

    eval_res = prioritization_engine.evaluate_candidate(in2o3, DEFAULT_WEIGHTS)
    assert eval_res["is_rankable"] is True
    assert eval_res["composite_score"] >= 70.0
    assert eval_res["category"] == "Evidence-supported candidate"

def test_prioritization_run_and_sensitivity_analysis(db):
    """Verify multi-criteria prioritization run and sensitivity analysis."""
    run_res = prioritization_engine.run_prioritization(db=db)
    assert "rankings" in run_res
    assert len(run_res["rankings"]) >= 3
    assert "sensitivity_analysis" in run_res
    assert len(run_res["sensitivity_analysis"]) >= 2
    # Check top candidate has rank #1
    top_cand = run_res["rankings"][0]
    assert top_cand["rank"] == 1
