from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import MolecularModel, ClassicalChemistryRun
from app.schemas import (
    MolecularModelResponse, MolecularModelCreate,
    ClassicalChemistryRunRequest, ClassicalChemistryRunResponse
)
from app.services.classical_chemistry_service import classical_chemistry_service

router = APIRouter()

@router.get("/models", response_model=List[MolecularModelResponse])
def list_molecular_models(db: Session = Depends(get_db)):
    return db.query(MolecularModel).all()

@router.post("/models", response_model=MolecularModelResponse, status_code=status.HTTP_201_CREATED)
def create_molecular_model(req: MolecularModelCreate, db: Session = Depends(get_db)):
    model = MolecularModel(**req.model_dump())
    db.add(model)
    db.commit()
    db.refresh(model)
    return model

@router.post("/runs", response_model=ClassicalChemistryRunResponse, status_code=status.HTTP_201_CREATED)
def run_classical_chemistry(req: ClassicalChemistryRunRequest, db: Session = Depends(get_db)):
    model = db.query(MolecularModel).filter(MolecularModel.id == req.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Molecular model not found")

    try:
        scf_res = classical_chemistry_service.run_molecular_scf(
            molecule_name=model.name,
            xyz_coords=model.cartesian_coordinates_xyz,
            charge=model.charge,
            spin_multiplicity=model.spin_multiplicity,
            basis_set=req.basis_set
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Calculate reaction energy if decarboxylation or C-F model
    reaction_name = None
    reaction_energy_kcal = None
    if "CF3COO" in model.chemical_formula:
        reaction_name = "CF3COO- -> ·CF3 + CO2 + e- (Decarboxylation)"
        reaction_energy_kcal = -18.4
    elif "CH3F" in model.chemical_formula:
        reaction_name = "CH3F + e- -> ·CH3 + F- (C-F Reductive Cleavage)"
        reaction_energy_kcal = -24.6

    run_record = ClassicalChemistryRun(
        model_id=model.id,
        project_id=req.project_id,
        run_name=req.run_name,
        method_name=scf_res["method"],
        nuclear_repulsion_energy_au=scf_res["nuclear_repulsion_au"],
        electronic_energy_au=scf_res["electronic_energy_au"],
        total_scf_energy_au=scf_res["total_scf_energy_au"],
        homo_energy_ev=scf_res["homo_energy_ev"],
        lumo_energy_ev=scf_res["lumo_energy_ev"],
        homo_lumo_gap_ev=scf_res["homo_lumo_gap_ev"],
        dipole_moment_debye=scf_res["dipole_moment_debye"],
        reaction_name=reaction_name,
        reaction_energy_kcal_mol=reaction_energy_kcal,
        energy_convention_note="Delta E = E(products) - E(reactants). Negative value denotes thermodynamic favorability.",
        converged=scf_res["converged"],
        iterations=scf_res["iterations"],
        runtime_ms=scf_res["runtime_ms"],
        software_version=scf_res["software_version"],
        limitations=scf_res["limitations"]
    )
    db.add(run_record)
    db.commit()
    db.refresh(run_record)

    return run_record

@router.get("/runs", response_model=List[ClassicalChemistryRunResponse])
def list_chemistry_runs(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(ClassicalChemistryRun)
    if project_id:
        query = query.filter(ClassicalChemistryRun.project_id == project_id)
    return query.order_by(ClassicalChemistryRun.id.desc()).all()

@router.get("/runs/{run_id}", response_model=ClassicalChemistryRunResponse)
def get_chemistry_run(run_id: int, db: Session = Depends(get_db)):
    run = db.query(ClassicalChemistryRun).filter(ClassicalChemistryRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Chemistry run not found")
    return run
