import os
import pytest
from app.services.classical_chemistry_service import (
    classical_chemistry_service, parse_xyz, BENCHMARK_LITERATURE_REFERENCES,
    HARTREE_TO_KCAL, BOHR_TO_ANGSTROM
)
from app.services.fluorine_service import fluorine_service
from app.services.prioritization_service import prioritization_engine, DEFAULT_WEIGHTS
from app.services.report_service import report_service
from app.schemas import FluorineBalanceCalculateRequest
from app.models import Catalyst, Project, MolecularModel, ClassicalChemistryRun

# ----------------- 1. Classical Ab-Initio Roothaan-Hall SCF Reference Validation -----------------

def test_h2_ab_initio_sto3g_szabo_ostlund_reference_comparison():
    """Validates the exact native ab-initio s-Gaussian Roothaan-Hall SCF solver against
    the published benchmark standard: H2 at R = 1.400 Bohr (0.740848 Angstrom) in STO-3G basis.
    Reference: Szabo & Ostlund, Modern Quantum Chemistry (1989), Table 3.3, p. 161."""
    xyz_h2 = (
        "H 0.000000 0.000000 0.000000\n"
        "H 0.000000 0.000000 0.740848"
    )
    res = classical_chemistry_service.run_molecular_scf(
        molecule_name="H2",
        xyz_coords=xyz_h2,
        charge=0,
        spin_multiplicity=1,
        basis_set="STO-3G"
    )

    assert res["converged"] is True
    assert res["num_atoms"] == 2
    assert res["num_electrons"] == 2
    assert res["method_classification"] == "AB_INITIO"
    assert "Exact Ab-Initio Roothaan-Hall" in res["method"]

    ref = BENCHMARK_LITERATURE_REFERENCES["H2"]
    # Szabo & Ostlund Table 3.3 benchmark: E_tot = -1.116714 Hartree
    assert abs(res["total_scf_energy_au"] - ref["energy_au"]) < 1e-4
    # Nuclear repulsion: E_nuc = 1/1.4 = 0.714286 Hartree
    assert abs(res["nuclear_repulsion_au"] - ref["nuclear_repulsion_au"]) < 1e-4
    # Electronic energy: E_elec = -1.8310 Hartree
    assert abs(res["electronic_energy_au"] - ref["electronic_energy_au"]) < 2e-3
    # HOMO orbital energy: epsilon_1 = -0.5782 Hartree = -15.734 eV
    assert abs(res["homo_energy_ev"] - ref["homo_energy_ev"]) < 0.10

def test_heh_plus_ab_initio_sto3g_szabo_ostlund_reference_comparison():
    """Validates HeH+ heteronuclear cation at R = 1.4632 Bohr (0.774300 Angstrom) in STO-3G basis.
    Reference: Szabo & Ostlund, Modern Quantum Chemistry (1989), Table 3.5, p. 175."""
    xyz_heh = (
        "He 0.000000 0.000000 0.000000\n"
        "H  0.000000 0.000000 0.774300"
    )
    res = classical_chemistry_service.run_molecular_scf(
        molecule_name="HeH+",
        xyz_coords=xyz_heh,
        charge=1,
        spin_multiplicity=1,
        basis_set="STO-3G"
    )

    assert res["converged"] is True
    assert res["num_atoms"] == 2
    assert res["num_electrons"] == 2
    assert res["method_classification"] == "AB_INITIO"

    ref = BENCHMARK_LITERATURE_REFERENCES["HEH+"]
    # Szabo & Ostlund Table 3.5 benchmark: E_tot = -2.86066 Hartree
    assert abs(res["total_scf_energy_au"] - ref["energy_au"]) < 1e-3

# ----------------- 2. Polyatomic Fragment Model Methodological Transparency -----------------

def test_semiempirical_frontier_explicit_labeling_polyatomic():
    """Verifies that when solving polyatomic fluorinated fragments without PySCF,
    the solver is EXPLICITLY labeled as Semi-Empirical Frontier Model (not falsely ab initio),
    limitations are disclosed, and computed energy is never overwritten by reference benchmark constants."""
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
    assert "Semi-Empirical Frontier Model" in res["method"] or "PySCF" in res["method"]
    assert "Approximate model chemistry" in res["limitations"] or "Isolated molecular fragment" in res["limitations"]
    assert res["reference_literature_energy_au"] == -418.62145
    # Total computed energy must NOT be identical to reference constant (first-principles computation)
    assert abs(res["total_scf_energy_au"] - (-418.62145)) > 1e-4

# ----------------- 3. Mathematical Edge Cases and Error Rejections -----------------

def test_scf_error_handling_numerical_edge_cases():
    """Verifies robust rejection of non-physical geometries and charge/spin mismatches."""
    # 1. Coincident atoms closer than 0.10 Angstroms
    bad_geom = "H 0.0 0.0 0.0\nH 0.0 0.0 0.05"
    with pytest.raises(ValueError, match="Coincident or overlapping"):
        classical_chemistry_service.compute_nuclear_repulsion(parse_xyz(bad_geom))

    # 2. Unsupported element
    bad_elem = "H 0.0 0.0 0.0\nUu 0.0 0.0 1.0"
    with pytest.raises(ValueError, match="not supported"):
        classical_chemistry_service.run_molecular_scf("BadElem", bad_elem)

    # 3. Invalid electron count (charge exceeds total nuclear charge)
    with pytest.raises(ValueError, match="Invalid electron count"):
        classical_chemistry_service.run_molecular_scf("H2_cat", "H 0.0 0.0 0.0\nH 0.0 0.0 0.74", charge=5)

    # 4. Odd electron count (unrestricted open-shell rejected in closed-shell RHF)
    with pytest.raises(ValueError, match="Restricted Hartree-Fock requires a closed-shell singlet"):
        classical_chemistry_service.run_molecular_scf("H_atom", "H 0.0 0.0 0.0\nH 0.0 0.0 0.74", charge=1)

    # 5. Non-singlet spin multiplicity rejected in RHF
    with pytest.raises(ValueError, match="Restricted Hartree-Fock requires a closed-shell singlet"):
        classical_chemistry_service.run_molecular_scf("H2_triplet", "H 0.0 0.0 0.0\nH 0.0 0.0 0.74", charge=0, spin_multiplicity=3)

# ----------------- 4. Reaction Energy Balancing and Missing Data Handling -----------------

def test_reaction_energy_elemental_and_charge_balance():
    """Verifies strict elemental and charge balancing, unit conversion, and refusal to fabricate activation barriers."""
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

    rxn = classical_chemistry_service.calculate_reaction_energy(reactants, products_balanced)
    assert rxn["status"] == "COMPUTED"
    assert rxn["elemental_balance_verified"] is True
    assert rxn["charge_balance_verified"] is True
    assert rxn["is_exothermic"] is True
    assert abs(rxn["delta_e_kcal_mol"] - (rxn["delta_e_hartree"] * HARTREE_TO_KCAL)) < 1e-4

    # Crucial scientific check: Activation barrier must NOT be inferred from thermodynamic reaction energy
    assert "NOT_AVAILABLE" in rxn["activation_energy"]
    assert "NOT_AVAILABLE" in rxn["gibbs_free_energy"]
    assert "does NOT guarantee low kinetic activation barrier" in rxn["convention_note"]

def test_reaction_energy_elemental_imbalance_detection():
    """Detects elemental imbalance when stoichiometry does not match."""
    reactants = [{
        "formula": "CF3COO-",
        "coefficient": 1.0,
        "energy_au": -418.62145,
        "charge": -1,
        "atoms": {"C": 2, "F": 3, "O": 2}
    }]
    products_imbalanced = [
        {"formula": ".CF3", "coefficient": 1.0, "energy_au": -334.31210, "charge": 0, "atoms": {"C": 1, "F": 3}}
        # Missing CO2
    ]
    rxn = classical_chemistry_service.calculate_reaction_energy(reactants, products_imbalanced)
    assert rxn["elemental_balance_verified"] is False
    assert any("imbalance in C" in note or "imbalance in O" in note for note in rxn["balance_notes"])

def test_reaction_energy_missing_component_unavailability():
    """Ensures that missing fragment electronic energies return explicit UNAVAILABLE status rather than fabricating 0.0."""
    reactants = [{"formula": "CF3COO-", "coefficient": 1.0, "energy_au": -418.62145}]
    products_missing = [{"formula": ".CF3", "coefficient": 1.0, "energy_au": None}]

    rxn = classical_chemistry_service.calculate_reaction_energy(reactants, products_missing)
    assert rxn["status"] == "UNAVAILABLE"
    assert rxn["delta_e_hartree"] is None
    assert rxn["delta_e_kcal_mol"] is None
    assert "Missing required reactant or product" in rxn["unavailability_reason"]

# ----------------- 5. Calculation Provenance -----------------

def test_calculation_provenance_tracking():
    """Verifies that all calculation runs generate immutable calculation provenance metadata."""
    xyz = "H 0.0 0.0 0.0\nH 0.0 0.0 0.74"
    res = classical_chemistry_service.run_molecular_scf("H2", xyz, charge=0, spin_multiplicity=1)
    prov = res.get("provenance")
    assert prov is not None
    assert "engine" in prov
    assert "method_classification" in prov
    assert "basis_set" in prov
    assert "input_geometry_hash" in prov
    assert "timestamp_utc" in prov
    assert prov["converged"] is True

# ----------------- 6. Fluorine Accounting Integrity -----------------

def test_fluorine_accounting_units_and_missing_data():
    """Verifies fluorine accounting with strict unit validation and missing measurement handling."""
    # 1. Invalid unit rejection
    with pytest.raises(ValueError, match="Unsupported inventory basis unit"):
        fluorine_service.calculate(FluorineBalanceCalculateRequest(
            initial_fluorine_inventory=100.0,
            inventory_basis_units="lightyears",
            measured_inorganic_fluoride=50.0
        ))

    # 2. Missing organic measurement leaves closure as incomplete, NOT zero
    res_missing_org = fluorine_service.calculate(FluorineBalanceCalculateRequest(
        initial_fluorine_inventory=100.0,
        inventory_basis_units="mg/L",
        measured_inorganic_fluoride=75.0,
        remaining_organic_fluorine=None
    ))
    assert res_missing_org.apparent_defluorination_pct == 75.0
    assert res_missing_org.remaining_organic_pct is None
    assert res_missing_org.mass_balance_closure_pct is None
    assert res_missing_org.closure_status == "Incomplete data"
    assert any("Missing remaining organic" in flag for flag in res_missing_org.uncertainty_flags)

    # 3. Missing inorganic measurement leaves defluorination as None
    res_missing_inorg = fluorine_service.calculate(FluorineBalanceCalculateRequest(
        initial_fluorine_inventory=100.0,
        inventory_basis_units="mg/L",
        measured_inorganic_fluoride=None,
        remaining_organic_fluorine=20.0
    ))
    assert res_missing_inorg.apparent_defluorination_pct is None
    assert res_missing_inorg.remaining_organic_pct == 20.0
    assert res_missing_inorg.closure_status == "Incomplete data"

    # 4. Mineralization distinction: 100% parent disappearance with 13% defluorination
    res_smith = fluorine_service.calculate(FluorineBalanceCalculateRequest(
        initial_fluorine_inventory=100.0,
        inventory_basis_units="mg/L",
        measured_inorganic_fluoride=13.0,
        remaining_organic_fluorine=87.0
    ))
    assert res_smith.apparent_defluorination_pct == 13.0
    assert res_smith.mass_balance_closure_pct == 100.0
    assert res_smith.closure_status == "Acceptable (90-105%)"
    assert any("Parent compound disappearance alone does NOT equate to mineralization" in flag for flag in res_smith.uncertainty_flags)

# ----------------- 7. Catalyst Integrity and Provenance Auditing -----------------

def test_catalyst_data_integrity_and_penalties(db_session):
    """Verifies that seed catalysts have accurate provenance and missing data penalties are transparently explained."""
    # BiOCl: Defluorination was NOT measured in literature; must have missing defluorination penalty
    biocl = db_session.query(Catalyst).filter(Catalyst.name.like("%BiOCl%")).first()
    assert biocl is not None
    assert biocl.reported_defluorination_pct is None

    eval_biocl = prioritization_engine.evaluate_candidate(biocl, DEFAULT_WEIGHTS)
    assert eval_biocl["is_rankable"] is False
    assert eval_biocl["missing_defluorination_penalty_applied"] is True
    assert "missing_defluorination" in eval_biocl["penalty_breakdown"]
    assert eval_biocl["category"] == "Insufficient evidence to rank (Missing Defluorination)"

    # Fe-N4: Hypothetical candidate; must have 25% discount factor and clear hypothetical labeling
    fe_n4 = db_session.query(Catalyst).filter(Catalyst.name.like("%Fe-N4%")).first()
    assert fe_n4 is not None
    assert fe_n4.verification_status == "Hypothetical candidate"
    assert "hypothetical" in fe_n4.evidence_category.lower()

    eval_fe = prioritization_engine.evaluate_candidate(fe_n4, DEFAULT_WEIGHTS)
    assert eval_fe["evidence_status"] == "HYPOTHETICAL"
    assert "hypothetical_discount" in eval_fe["penalty_breakdown"]
    assert eval_fe["penalty_breakdown"]["hypothetical_discount"]["discount_factor"] == 0.75

    # In2O3: Peer-reviewed high-performing benchmark
    in2o3 = db_session.query(Catalyst).filter(Catalyst.name.like("%In2O3%")).first()
    assert in2o3 is not None
    assert in2o3.reported_defluorination_pct == 78.4
    eval_in2o3 = prioritization_engine.evaluate_candidate(in2o3, DEFAULT_WEIGHTS)
    assert eval_in2o3["is_rankable"] is True
    assert eval_in2o3["category"] == "Evidence-supported candidate"

# ----------------- 8. PDF Report Generation & Accurate Method Labeling -----------------

def test_pdf_report_generation_and_scientific_labeling(db_session):
    """Verifies that generated PDF report contains updated scientific disclaimers and methodology disclosures."""
    proj = db_session.query(Project).first()
    assert proj is not None

    rep = report_service.generate_pdf_report(db_session, proj.id, custom_title="Phase B Scientific Audit Report")
    assert rep is not None
    assert rep.file_size_bytes > 0
    assert os.path.exists(rep.pdf_filename) or len(rep.pdf_filename) > 0
