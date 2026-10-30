import os
import json
import tempfile
import pytest
import numpy as np
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.models import Catalyst, PFASCompound, TreatmentExperiment, ExperimentalStudy, ClassicalChemistryRun
from app.schemas import EvidenceStatus
from app.services.classical_chemistry_service import (
    classical_chemistry_service, parse_xyz, BENCHMARK_LITERATURE_REFERENCES
)
from app.services.quantum_service import quantum_service, build_hamiltonian
from app.services.prioritization_service import prioritization_engine, DEFAULT_WEIGHTS
from app.services.bayesian_optimization_service import bayesian_planner
from app.services.llm_provider_service import llm_service
from app.services.literature_service import literature_service

client = TestClient(app)

# ----------------- 1. Scientific Provenance & Reconciled Records -----------------
def test_evidence_status_enum_values():
    """Verify standard evidence statuses exist and match scientific specifications."""
    expected = [
        "EXPERIMENTALLY_MEASURED", "LITERATURE_REPORTED", "COMPUTED",
        "ML_PREDICTED", "AI_EXTRACTED_UNVERIFIED", "HYPOTHETICAL",
        "ILLUSTRATIVE", "UNKNOWN", "FAILED", "NOT_AVAILABLE"
    ]
    for status in expected:
        assert hasattr(EvidenceStatus, status)
        assert EvidenceStatus[status].value == status

def test_reconciled_catalysts_provenance_and_penalties(db):
    """Verify Fe-N4/C is flagged as hypothetical coordination candidate,
    and BiOCl missing defluorination is transparently penalized."""
    fe_n4 = db.query(Catalyst).filter(Catalyst.name.like("%Fe-N4%")).first()
    assert fe_n4 is not None
    assert fe_n4.verification_status == "Hypothetical candidate"
    assert "Theoretical coordination design" in fe_n4.known_limitations

    eval_fe = prioritization_engine.evaluate_candidate(fe_n4, DEFAULT_WEIGHTS)
    assert eval_fe["evidence_status"] == "HYPOTHETICAL"
    assert any("Discounted by 25%" in n for n in eval_fe["eval_notes"])
    assert eval_fe["category"] == "Mechanistically interesting candidate (Hypothetical)"

    biocl = db.query(Catalyst).filter(Catalyst.name.like("%BiOCl%")).first()
    assert biocl is not None
    assert biocl.reported_defluorination_pct is None
    eval_biocl = prioritization_engine.evaluate_candidate(biocl, DEFAULT_WEIGHTS)
    assert eval_biocl["is_rankable"] is False
    assert eval_biocl["missing_defluorination_penalty_applied"] is True
    assert eval_biocl["category"] == "Insufficient evidence to rank (Missing Defluorination)"
    assert eval_biocl["data_coverage_pct"] < 100.0

# ----------------- 2. Classical Chemistry Engine -----------------
def test_classical_chemistry_no_hardcoded_overwriting():
    """Verify that calculated energy is purely computed and never overwritten with reference constants."""
    xyz_cf3coo = (
        "C  0.000000  0.000000  0.000000\n"
        "C  1.540000  0.000000  0.000000\n"
        "O  2.120000  1.100000  0.000000\n"
        "O  2.120000 -1.100000  0.000000\n"
        "F -0.520000  1.180000  0.000000\n"
        "F -0.520000 -0.590000  1.020000\n"
        "F -0.520000 -0.590000 -1.020000"
    )
    res = classical_chemistry_service.run_molecular_scf(
        molecule_name="CF3COO-",
        xyz_coords=xyz_cf3coo,
        charge=-1,
        spin_multiplicity=1,
        basis_set="STO-3G"
    )

    assert res["converged"] is True
    assert res["evidence_status"] == "COMPUTED"
    # Benchmark energy exists in reference suite for comparison
    assert res["reference_literature_energy_au"] == -418.62145
    # Total computed SCF energy must not be exactly identical to the benchmark constant
    # because it is an authentic numerical calculation from first principles
    assert res["total_scf_energy_au"] < -400.0
    assert abs(res["total_scf_energy_au"] - (-418.62145)) > 1e-4

def test_reaction_energy_balance_verification():
    """Verify that elemental and charge balancing are checked, and activation barrier is NOT_AVAILABLE."""
    # Balanced decarboxylation: CF3COO- -> .CF3 + CO2 + e-
    reactants = [{
        "formula": "CF3COO-",
        "coefficient": 1.0,
        "energy_au": -418.62145,
        "charge": -1,
        "atoms": {"C": 2, "F": 3, "O": 2}
    }]
    products_balanced = [
        {"formula": ".CF3", "coefficient": 1.0, "energy_au": -334.31210, "charge": 0, "atoms": {"C": 1, "F": 3}},
        {"formula": "CO2", "coefficient": 1.0, "energy_au": -84.34000, "charge": -1, "atoms": {"C": 1, "O": 2}}
    ]
    rxn_bal = classical_chemistry_service.calculate_reaction_energy(reactants, products_balanced)
    assert rxn_bal["elemental_balance_verified"] is True
    assert rxn_bal["charge_balance_verified"] is True
    assert "NOT_AVAILABLE" in rxn_bal["activation_energy"]
    assert "NOT_AVAILABLE" in rxn_bal["gibbs_free_energy"]

    # Imbalanced reaction: missing an atom
    products_imbalanced = [
        {"formula": "CO2", "coefficient": 1.0, "energy_au": -186.2154, "charge": 0, "atoms": {"C": 1, "O": 2}}
    ]
    rxn_imbal = classical_chemistry_service.calculate_reaction_energy(reactants, products_imbalanced)
    assert rxn_imbal["elemental_balance_verified"] is False
    assert len(rxn_imbal["balance_notes"]) > 0

# ----------------- 3. Genuine Molecule-Derived Quantum VQE -----------------
def test_molecule_derived_active_space_and_toy_labeling():
    """Verify toy VQE is explicitly labeled and molecule-derived active space is computed."""
    # Toy model
    H_toy, def_toy, desc_toy, is_toy = build_hamiltonian("Pedagogical Toy Benchmark")
    assert is_toy is True
    res_toy = quantum_service.run_benchmark(model_type="Pedagogical Toy Benchmark", random_seed=42)
    assert res_toy["is_toy_model"] is True
    assert res_toy["evidence_status"] == "ILLUSTRATIVE"
    assert "Toy VQE demonstration" in res_toy["disclaimer_text"]
    assert res_toy["physical_quantum_hardware"] is False

    # Molecule-derived C-F Active Space
    H_cf, def_cf, desc_cf, is_cf_toy = build_hamiltonian("Reduced C-F Active Space")
    assert is_cf_toy is False
    assert "Reduced C-F bond" in desc_cf
    res_cf = quantum_service.run_benchmark(
        model_type="Reduced C-F Active Space",
        optimizer="Nelder-Mead",
        random_seed=42
    )
    assert res_cf["is_toy_model"] is False
    assert res_cf["evidence_status"] == "COMPUTED"
    assert res_cf["absolute_error"] < 0.1
    assert "Statevector" in res_cf["software_versions"]["execution_environment"]
    assert "NO:" in res_cf["quantum_advantage_claim"]

def test_molecular_integrals_derivation():
    """Verify active space molecular integrals change with bond distance."""
    int_eq = quantum_service.derive_molecular_active_space_integrals(bond_length_angstrom=1.385)
    int_stretched = quantum_service.derive_molecular_active_space_integrals(bond_length_angstrom=2.200)
    assert int_eq["h11"] != int_stretched["h11"]
    assert int_eq["g0"] != int_stretched["g0"]

# ----------------- 4. Bayesian Experiment Optimization -----------------
def test_bayesian_optimization_insufficient_data_handling(db):
    """When fewer than 3 observations exist, Bayesian optimizer returns INSUFFICIENT_DATA with exploration grid."""
    # Query for a non-existent or clean compound ID to test < 3 data points
    res = bayesian_planner.optimize_next_experiment(db=db, target_pfas_id=999999)
    assert res["status"] == "INSUFFICIENT_DATA"
    assert res["observations_count"] < 3
    assert len(res["suggested_initial_grid"]) >= 3
    assert res["recommended_candidate"] is None

def test_bayesian_optimization_gp_acquisition(db):
    """When >= 3 verified observations exist, GP model fits and returns Expected Improvement recommendation."""
    # Ensure a test compound exists
    pfas = db.query(PFASCompound).first()
    if not pfas:
        pfas = PFASCompound(common_name="PFOA-Test", acronym="PFOA-T", chemical_formula="C8HF15O2", molecular_weight=414.0, num_carbons=8, num_fluorines=15)
        db.add(pfas)
        db.flush()

    study = db.query(ExperimentalStudy).first()
    if not study:
        study = ExperimentalStudy(title="Bayesian Test Study", journal="J. Test")
        db.add(study)
        db.flush()

    # Seed 3 distinct experiments with varied pH and temperature
    for i, (ph_val, temp_val, defluor) in enumerate([(3.0, 25.0, 42.0), (7.0, 30.0, 68.0), (9.0, 50.0, 75.0)]):
        exp = TreatmentExperiment(
            study_id=study.id,
            pfas_id=pfas.id,
            treatment_method="Photocatalysis Test",
            initial_concentration_mg_l=50.0,
            ph=ph_val,
            temperature_c=temp_val,
            catalyst_loading_g_l=1.0,
            duration_minutes=120.0,
            parent_removal_pct=95.0,
            defluorination_pct=defluor,
            notes=f"Bayesian GP unit test observation {i+1}"
        )
        db.add(exp)
    db.commit()

    res = bayesian_planner.optimize_next_experiment(db=db, target_pfas_id=pfas.id)
    assert res["status"] == "OPTIMIZED_RECOMMENDATION"
    assert res["observations_count"] >= 3
    assert res["recommended_conditions"]["operating_ph"] >= 3.0
    assert res["expected_improvement"] >= 0.0
    assert "Gaussian Process Regressor" in res["surrogate_model"]

def test_bayesian_recommendation_api_endpoint():
    """Verify GET /api/v1/experiments/bayesian-recommendation endpoint responds correctly."""
    response = client.get("/api/v1/experiments/bayesian-recommendation")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["INSUFFICIENT_DATA", "OPTIMIZED_RECOMMENDATION"]

# ----------------- 5. Grounded AI & Structured Data -----------------
def test_grounded_ai_unconfigured_provider_transparency():
    """Verify that unconfigured LLM provider returns explicit disclosure without masquerading as generative AI."""
    res = llm_service.generate_grounded_answer(query="What is defluorination of PFOA on In2O3?", citations=[])
    assert res["provider_status"] == "NO_EVIDENCE_FOUND"
    assert res["is_generative"] is False

    from app.schemas import LiteratureSourceCitation
    dummy_citations = [
        LiteratureSourceCitation(
            document_title="Li et al. Nature Comm",
            section_or_page="Page 1",
            passage_excerpt="In2O3 achieved 78.4% defluorination of PFOA under UV-C irradiation.",
            relevance_score=8.5
        )
    ]
    res_cited = llm_service.generate_grounded_answer(query="In2O3 PFOA defluorination", citations=dummy_citations)
    assert res_cited["provider_status"] == "AI_PROVIDER_UNCONFIGURED"
    assert res_cited["is_generative"] is False
    assert "[Deterministic Synthesis — Generative LLM Provider Unconfigured]" in res_cited["answer"]
    assert "Li et al. Nature Comm" in res_cited["answer"]

def test_json_import_preview_and_execution(db, tmp_path):
    """Verify JSON experimental dataset import validation and execution."""
    test_json = [
        {
            "target_pfas": "PFOA",
            "catalyst": "In2O3 nanocubes",
            "treatment_method": "Photocatalysis",
            "initial_conc_mg_l": 50.0,
            "parent_removal_pct": 99.2,
            "defluorination_pct": 78.4,
            "study_title": "JSON Import Test Study",
            "notes": "Verified JSON row"
        },
        {
            "target_pfas": "PFOA",
            "catalyst": "Missing removal field catalyst",
            "treatment_method": "Adsorption",
            "initial_conc_mg_l": 20.0,
            "parent_removal_pct": None  # invalid
        }
    ]
    file_path = tmp_path / "test_import.json"
    file_path.write_text(json.dumps(test_json), encoding="utf-8")

    preview = literature_service.preview_json_import(file_path)
    assert preview.total_rows == 2
    assert preview.valid_rows == 1
    assert preview.invalid_rows == 1
    assert any("Missing required field 'parent_removal_pct'" in e for e in preview.preview_rows[1].errors)

    # Clean file for valid execution
    clean_json = [test_json[0]]
    clean_path = tmp_path / "test_clean.json"
    clean_path.write_text(json.dumps(clean_json), encoding="utf-8")

    exec_res = literature_service.execute_json_import(db=db, file_path=clean_path)
    assert exec_res["status"] == "success"
    assert exec_res["imported_experiments_count"] == 1

def test_export_verified_records_endpoint():
    """Verify GET /api/v1/literature/export-records returns valid records with provenance."""
    response = client.get("/api/v1/literature/export-records")
    assert response.status_code == 200
    records = response.json()
    assert isinstance(records, list)
    if len(records) > 0:
        assert "evidence_status" in records[0]
        assert records[0]["evidence_status"] == "EXPERIMENTALLY_MEASURED"
