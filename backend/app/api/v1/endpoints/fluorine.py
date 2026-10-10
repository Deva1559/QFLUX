import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ....db.session import get_db
from ....models import FluorineBalanceScenario
from ....schemas import (
    FluorineBalanceCalculateRequest, FluorineBalanceCalculateResponse,
    FluorineBalanceScenarioCreate, FluorineBalanceScenarioResponse
)
from ....services.fluorine_service import fluorine_service

router = APIRouter()

@router.post("/calculate", response_model=FluorineBalanceCalculateResponse)
def calculate_balance(req: FluorineBalanceCalculateRequest):
    try:
        return fluorine_service.calculate(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/scenarios", response_model=FluorineBalanceScenarioResponse, status_code=status.HTTP_201_CREATED)
def create_scenario(req: FluorineBalanceScenarioCreate, db: Session = Depends(get_db)):
    try:
        calc_result = fluorine_service.calculate(FluorineBalanceCalculateRequest(
            initial_fluorine_inventory=req.initial_fluorine_inventory,
            inventory_basis_units=req.inventory_basis_units,
            measured_inorganic_fluoride=req.measured_inorganic_fluoride,
            remaining_organic_fluorine=req.remaining_organic_fluorine,
            other_identified_fluorine=req.other_identified_fluorine,
            unidentified_fraction=req.unidentified_fraction
        ))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    scenario = FluorineBalanceScenario(
        project_id=req.project_id,
        scenario_name=req.scenario_name,
        initial_fluorine_inventory=req.initial_fluorine_inventory,
        inventory_basis_units=req.inventory_basis_units,
        measured_inorganic_fluoride=req.measured_inorganic_fluoride,
        remaining_organic_fluorine=req.remaining_organic_fluorine,
        other_identified_fluorine=req.other_identified_fluorine,
        unidentified_fraction=req.unidentified_fraction,
        apparent_defluorination_pct=calc_result.apparent_defluorination_pct,
        remaining_organic_pct=calc_result.remaining_organic_pct,
        mass_balance_closure_pct=calc_result.mass_balance_closure_pct,
        closure_status=calc_result.closure_status,
        uncertainty_flags=json.dumps(calc_result.uncertainty_flags),
        data_source_category=req.data_source_category,
        citation_or_reference=req.citation_or_reference,
        notes=req.notes
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)

    return FluorineBalanceScenarioResponse(
        id=scenario.id,
        project_id=scenario.project_id,
        scenario_name=scenario.scenario_name,
        initial_fluorine_inventory=scenario.initial_fluorine_inventory,
        inventory_basis_units=scenario.inventory_basis_units,
        measured_inorganic_fluoride=scenario.measured_inorganic_fluoride,
        remaining_organic_fluorine=scenario.remaining_organic_fluorine,
        other_identified_fluorine=scenario.other_identified_fluorine,
        apparent_defluorination_pct=scenario.apparent_defluorination_pct,
        remaining_organic_pct=scenario.remaining_organic_pct,
        mass_balance_closure_pct=scenario.mass_balance_closure_pct,
        closure_status=scenario.closure_status,
        uncertainty_flags=calc_result.uncertainty_flags,
        data_source_category=scenario.data_source_category,
        citation_or_reference=scenario.citation_or_reference,
        notes=scenario.notes,
        created_at=scenario.created_at
    )

@router.get("/scenarios", response_model=List[FluorineBalanceScenarioResponse])
def list_scenarios(project_id: Optional[int] = None, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    query = db.query(FluorineBalanceScenario)
    if project_id:
        query = query.filter((FluorineBalanceScenario.project_id == project_id) | (FluorineBalanceScenario.project_id.is_(None)))
    rows = query.order_by(FluorineBalanceScenario.id.desc()).offset(skip).limit(limit).all()

    results = []
    for s in rows:
        flags = []
        if s.uncertainty_flags:
            try:
                flags = json.loads(s.uncertainty_flags)
            except Exception:
                flags = [s.uncertainty_flags]
        results.append(FluorineBalanceScenarioResponse(
            id=s.id,
            project_id=s.project_id,
            scenario_name=s.scenario_name,
            initial_fluorine_inventory=s.initial_fluorine_inventory,
            inventory_basis_units=s.inventory_basis_units,
            measured_inorganic_fluoride=s.measured_inorganic_fluoride,
            remaining_organic_fluorine=s.remaining_organic_fluorine,
            other_identified_fluorine=s.other_identified_fluorine,
            apparent_defluorination_pct=s.apparent_defluorination_pct,
            remaining_organic_pct=s.remaining_organic_pct,
            mass_balance_closure_pct=s.mass_balance_closure_pct,
            closure_status=s.closure_status,
            uncertainty_flags=flags,
            data_source_category=s.data_source_category,
            citation_or_reference=s.citation_or_reference,
            notes=s.notes,
            created_at=s.created_at
        ))
    return results
