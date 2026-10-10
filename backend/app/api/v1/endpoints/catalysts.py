from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Catalyst
from app.schemas import (
    CatalystResponse, CatalystCreate, CatalystComparisonRequest, CatalystComparisonResponse
)

router = APIRouter()

@router.get("", response_model=List[CatalystResponse])
def list_catalysts(
    material_type: Optional[str] = None,
    target_pfas: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Catalyst)
    if material_type:
        query = query.filter(Catalyst.material_type == material_type)
    if target_pfas:
        query = query.filter(Catalyst.target_pfas == target_pfas)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=CatalystResponse, status_code=status.HTTP_201_CREATED)
def create_catalyst(req: CatalystCreate, db: Session = Depends(get_db)):
    catalyst = Catalyst(**req.model_dump())
    db.add(catalyst)
    db.commit()
    db.refresh(catalyst)
    return catalyst

@router.get("/{catalyst_id}", response_model=CatalystResponse)
def get_catalyst(catalyst_id: int, db: Session = Depends(get_db)):
    cat = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Catalyst not found")
    return cat

@router.post("/compare", response_model=CatalystComparisonResponse)
def compare_catalysts(req: CatalystComparisonRequest, db: Session = Depends(get_db)):
    catalysts = db.query(Catalyst).filter(Catalyst.id.in_(req.catalyst_ids)).all()
    if not catalysts:
        raise HTTPException(status_code=400, detail="No matching catalysts found for provided IDs")

    properties = [
        ("Chemical Formula", "Stoichiometric chemical formula", lambda c: c.chemical_formula),
        ("Material Type", "Classification of catalyst material", lambda c: c.material_type),
        ("Treatment Mechanism", "Reaction pathway / active mechanism", lambda c: c.treatment_mechanism),
        ("Parent Removal", "Target PFAS concentration reduction", lambda c: f"{c.reported_parent_removal_pct:.1f}%"),
        ("Measured Defluorination", "Quantitative inorganic F- release", lambda c: f"{c.reported_defluorination_pct:.1f}%" if c.reported_defluorination_pct is not None else "MISSING"),
        ("Byproducts", "Reported intermediate compounds", lambda c: c.reported_byproducts or "Not reported"),
        ("Energy Intensity", "Operating energy requirement", lambda c: f"{c.energy_intensity_kwh_m3} kWh/m3" if c.energy_intensity_kwh_m3 else "N/A"),
        ("Cycling Stability", "Observed reuse cycles", lambda c: f"{c.catalyst_stability_cycles} cycles" if c.catalyst_stability_cycles else "N/A"),
        ("Operating pH", "Optimal solution pH", lambda c: str(c.operating_ph) if c.operating_ph is not None else "N/A"),
        ("Verification Status", "Literature provenance audit", lambda c: c.verification_status),
    ]

    comparison_table = []
    for prop_name, prop_desc, getter in properties:
        val_map = {}
        for c in catalysts:
            val_map[c.name] = getter(c)
        comparison_table.append({
            "property": prop_name,
            "description": prop_desc,
            "values": val_map
        })

    tradeoffs = []
    for c in catalysts:
        if c.reported_defluorination_pct is None:
            tradeoffs.append(f"• {c.name}: Critical gap — parent disappearance is reported ({c.reported_parent_removal_pct}%), but defluorination was never measured.")
        elif c.reported_parent_removal_pct - (c.reported_defluorination_pct or 0) > 30:
            tradeoffs.append(f"• {c.name}: Defluorination gap ({c.reported_parent_removal_pct - c.reported_defluorination_pct:.1f}%) indicates accumulation of shorter-chain persistent PFCAs.")
        else:
            tradeoffs.append(f"• {c.name}: Balanced performance with high defluorination ({c.reported_defluorination_pct}%).")

    summary = "\n".join(tradeoffs)

    return CatalystComparisonResponse(
        catalysts=[CatalystResponse.model_validate(c) for c in catalysts],
        comparison_table=comparison_table,
        tradeoff_summary=summary
    )

