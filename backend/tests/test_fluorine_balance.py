import pytest
from app.services.fluorine_service import fluorine_service
from app.schemas import FluorineBalanceCalculateRequest

def test_smith_et_al_case_study_calculation():
    """Validates Smith et al. (2024) literature case:
    100 mg/L initial F, 13 mg/L inorganic F-, 87 mg/L remaining organic F.
    Defluorination = 13.0%, Closure = 100.0%.
    """
    req = FluorineBalanceCalculateRequest(
        initial_fluorine_inventory=100.0,
        inventory_basis_units="mg/L",
        measured_inorganic_fluoride=13.0,
        remaining_organic_fluorine=87.0
    )
    res = fluorine_service.calculate(req)
    assert res.apparent_defluorination_pct == pytest.approx(13.0, abs=1e-3)
    assert res.remaining_organic_pct == pytest.approx(87.0, abs=1e-3)
    assert res.mass_balance_closure_pct == pytest.approx(100.0, abs=1e-3)
    assert res.closure_status == "Acceptable (90-105%)"
    # Should flag warning that parent compound disappearance != defluorination
    assert any("Low defluorination observed" in flag for flag in res.uncertainty_flags)

def test_mass_balance_deficit():
    """Validates mass-balance closure deficit detection (<90%)."""
    req = FluorineBalanceCalculateRequest(
        initial_fluorine_inventory=100.0,
        inventory_basis_units="mg/L",
        measured_inorganic_fluoride=40.0,
        remaining_organic_fluorine=30.0,
        other_identified_fluorine=0.0
    )
    res = fluorine_service.calculate(req)
    assert res.mass_balance_closure_pct == pytest.approx(70.0, abs=1e-3)
    assert res.closure_status == "Deficit (<90%)"
    assert any("deficit" in flag.lower() for flag in res.uncertainty_flags)

def test_mass_balance_surplus():
    """Validates mass-balance closure surplus detection (>105%)."""
    req = FluorineBalanceCalculateRequest(
        initial_fluorine_inventory=100.0,
        inventory_basis_units="mg/L",
        measured_inorganic_fluoride=70.0,
        remaining_organic_fluorine=45.0
    )
    res = fluorine_service.calculate(req)
    assert res.mass_balance_closure_pct == pytest.approx(115.0, abs=1e-3)
    assert res.closure_status == "Surplus (>105%)"
    assert any("surplus" in flag.lower() for flag in res.uncertainty_flags)

def test_missing_measurements_handling():
    """Validates that None values are NOT silently treated as zero."""
    # Missing inorganic fluoride
    req_no_inorg = FluorineBalanceCalculateRequest(
        initial_fluorine_inventory=100.0,
        measured_inorganic_fluoride=None,
        remaining_organic_fluorine=80.0
    )
    res = fluorine_service.calculate(req_no_inorg)
    assert res.apparent_defluorination_pct is None
    assert res.closure_status == "Incomplete data"
    assert any("Missing inorganic fluoride" in flag for flag in res.uncertainty_flags)

    # Missing remaining organic fluorine
    req_no_org = FluorineBalanceCalculateRequest(
        initial_fluorine_inventory=100.0,
        measured_inorganic_fluoride=50.0,
        remaining_organic_fluorine=None
    )
    res2 = fluorine_service.calculate(req_no_org)
    assert res2.apparent_defluorination_pct == pytest.approx(50.0, abs=1e-3)
    assert res2.mass_balance_closure_pct is None
    assert res2.closure_status == "Incomplete data"

def test_division_by_zero_and_negative_inputs():
    """Ensures division by zero and negative inputs raise validation or value errors."""
    with pytest.raises((ValueError, Exception)):
        FluorineBalanceCalculateRequest(
            initial_fluorine_inventory=0.0
        )

    with pytest.raises((ValueError, Exception)):
        FluorineBalanceCalculateRequest(
            initial_fluorine_inventory=100.0,
            measured_inorganic_fluoride=-5.0
        )

    with pytest.raises((ValueError, Exception)):
        FluorineBalanceCalculateRequest(
            initial_fluorine_inventory=100.0,
            remaining_organic_fluorine=-1.0
        )

def test_apparent_defluorination_over_100_percent():
    """Apparent values >100% are not silently clamped; an analytical flag is raised."""
    req = FluorineBalanceCalculateRequest(
        initial_fluorine_inventory=100.0,
        measured_inorganic_fluoride=112.0,
        remaining_organic_fluorine=0.0
    )
    res = fluorine_service.calculate(req)
    assert res.apparent_defluorination_pct == pytest.approx(112.0, abs=1e-3)
    assert any("exceeds 100%" in flag for flag in res.uncertainty_flags)
