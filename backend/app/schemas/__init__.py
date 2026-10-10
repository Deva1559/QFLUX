from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# ----------------- Project Schemas -----------------
class ProjectBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    target_pfas: str = Field(default="PFOA (perfluorooctanoic acid)")
    research_question: str
    destruction_approach: Optional[str] = None
    supporting_references: Optional[str] = None
    status: str = Field(default="Active")

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    target_pfas: Optional[str] = None
    research_question: Optional[str] = None
    destruction_approach: Optional[str] = None
    supporting_references: Optional[str] = None
    status: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ProjectOverviewStats(BaseModel):
    total_projects: int
    total_catalysts: int
    total_evidence_records: int
    total_quantum_runs: int
    total_chemistry_runs: int
    total_fluorine_scenarios: int
    total_reports: int
    latest_quantum_run: Optional[Dict[str, Any]] = None
    scientific_warnings: List[str] = []

# ----------------- Catalyst Schemas -----------------
class CatalystBase(BaseModel):
    name: str
    chemical_formula: str
    material_type: str
    target_pfas: str = "PFOA"
    treatment_mechanism: str
    reaction_conditions: str
    light_or_electrical_source: Optional[str] = None
    operating_temperature_c: Optional[float] = 25.0
    operating_ph: Optional[float] = 7.0
    solvent_medium: str = "Aqueous"
    catalyst_loading_g_l: Optional[float] = None
    reported_parent_removal_pct: float
    reported_defluorination_pct: Optional[float] = None
    reported_byproducts: Optional[str] = None
    catalyst_stability_cycles: Optional[int] = None
    energy_intensity_kwh_m3: Optional[float] = None
    evidence_category: str = "Published experimental result"
    doi_or_url: Optional[str] = None
    publication_citation: str
    known_limitations: Optional[str] = None
    verification_status: str = "Verified against primary literature"

class CatalystCreate(CatalystBase):
    pass

class CatalystResponse(CatalystBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CatalystComparisonRequest(BaseModel):
    catalyst_ids: List[int]
    normalize_by: Optional[str] = "defluorination"

class CatalystComparisonResponse(BaseModel):
    catalysts: List[CatalystResponse]
    comparison_table: List[Dict[str, Any]]
    tradeoff_summary: str

# ----------------- Molecular Models & Chemistry Schemas -----------------
class MolecularModelBase(BaseModel):
    name: str
    chemical_formula: str
    charge: int = 0
    spin_multiplicity: int = 1
    cartesian_coordinates_xyz: str
    num_atoms: int
    num_electrons: int
    basis_set: str = "STO-3G"
    model_scope_description: str

class MolecularModelCreate(MolecularModelBase):
    pass

class MolecularModelResponse(MolecularModelBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ClassicalChemistryRunRequest(BaseModel):
    model_id: int
    project_id: Optional[int] = None
    run_name: str
    basis_set: str = "STO-3G"
    compute_reaction_energy: bool = True

class ClassicalChemistryRunResponse(BaseModel):
    id: Optional[int] = None
    model_id: int
    project_id: Optional[int] = None
    run_name: str
    method_name: str
    nuclear_repulsion_energy_au: float
    electronic_energy_au: float
    total_scf_energy_au: float
    homo_energy_ev: float
    lumo_energy_ev: float
    homo_lumo_gap_ev: float
    dipole_moment_debye: float
    reaction_name: Optional[str] = None
    reaction_energy_kcal_mol: Optional[float] = None
    energy_convention_note: str
    converged: bool
    iterations: int
    runtime_ms: float
    software_version: str
    limitations: str
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# ----------------- Evidence Schemas -----------------
class EvidenceRecordBase(BaseModel):
    project_id: Optional[int] = None
    catalyst_id: Optional[int] = None
    compound_name: str
    study_title: str
    authors: Optional[str] = None
    publication_year: Optional[int] = None
    doi_or_url: Optional[str] = None
    method: Optional[str] = None
    parent_removal_pct: Optional[float] = None
    defluorination_pct: Optional[float] = None
    mineralization_pct: Optional[float] = None
    reported_byproducts: Optional[str] = None
    reaction_conditions: Optional[str] = None
    limitations: Optional[str] = None
    evidence_category: str = Field(default="Published experimental result")
    verification_status: str = Field(default="Needs verification")

class EvidenceRecordCreate(EvidenceRecordBase):
    pass

class EvidenceRecordUpdate(BaseModel):
    compound_name: Optional[str] = None
    study_title: Optional[str] = None
    authors: Optional[str] = None
    publication_year: Optional[int] = None
    doi_or_url: Optional[str] = None
    method: Optional[str] = None
    parent_removal_pct: Optional[float] = None
    defluorination_pct: Optional[float] = None
    mineralization_pct: Optional[float] = None
    reported_byproducts: Optional[str] = None
    reaction_conditions: Optional[str] = None
    limitations: Optional[str] = None
    evidence_category: Optional[str] = None
    verification_status: Optional[str] = None

class EvidenceRecordResponse(EvidenceRecordBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- Pathway Schemas -----------------
class PathwayStepBase(BaseModel):
    step_number: int
    reactant_name: str
    product_name: str
    transformation_description: str
    bond_changes: Optional[str] = None
    charge: Optional[int] = 0
    spin_multiplicity: Optional[int] = 1
    chemical_conditions: Optional[str] = None
    reported_intermediates: Optional[str] = None
    reaction_energy_kcal_mol: Optional[float] = None
    activation_barrier_kcal_mol: Optional[float] = None
    is_experimentally_observed: bool = False
    is_computationally_proposed: bool = True
    quantum_calc_status: str = "Not yet calculated"

class PathwayStepCreate(PathwayStepBase):
    pass

class PathwayStepResponse(PathwayStepBase):
    id: int
    pathway_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PathwayBase(BaseModel):
    project_id: Optional[int] = None
    title: str
    target_compound: str
    description: Optional[str] = None
    reference_doi: Optional[str] = None

class PathwayCreate(PathwayBase):
    steps: Optional[List[PathwayStepCreate]] = []

class PathwayResponse(PathwayBase):
    id: int
    created_at: datetime
    steps: List[PathwayStepResponse] = []
    model_config = ConfigDict(from_attributes=True)

# ----------------- Quantum Schemas -----------------
class QuantumBenchmarkRequest(BaseModel):
    project_id: Optional[int] = None
    run_name: str = "Reduced C-F Active Space VQE Benchmark"
    model_type: str = Field(default="Reduced C-F Active Space", pattern="^(Reduced C-F Active Space|Pedagogical Toy Benchmark)$")
    optimizer: str = Field(default="Nelder-Mead", pattern="^(Nelder-Mead|COBYLA|BFGS)$")
    max_iter: int = Field(default=2500, ge=10, le=10000)
    tolerance: float = Field(default=1e-8, gt=0)
    random_seed: Optional[int] = 42
    coeff_z0: float = -1.05
    coeff_z1: float = -0.75
    coeff_xx: float = 0.35
    coeff_zz: float = 0.20

class QuantumBenchmarkResponse(BaseModel):
    id: Optional[int] = None
    run_name: str
    model_type: str
    hamiltonian_type: str
    hamiltonian_definition: str
    num_qubits: int
    exact_energy: float
    vqe_energy: float
    absolute_error: float
    relative_error: Optional[float]
    optimizer_name: str
    iterations: int
    function_evaluations: int
    optimizer_converged: bool
    execution_time_ms: float
    random_seed: Optional[int]
    initial_parameters: List[float]
    optimal_parameters: List[float]
    software_versions: Dict[str, str]
    is_toy_model: bool
    disclaimer_text: str
    classical_comparison_note: str

class QuantumRunResponse(BaseModel):
    id: int
    project_id: Optional[int]
    run_name: str
    model_type: str
    hamiltonian_type: str
    hamiltonian_definition: str
    num_qubits: int
    exact_energy: float
    vqe_energy: float
    absolute_error: float
    relative_error: Optional[float]
    optimizer_name: str
    iterations: int
    function_evaluations: int
    optimizer_converged: bool
    execution_time_ms: float
    random_seed: Optional[int]
    is_toy_model: bool
    disclaimer_text: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- Prioritization Schemas -----------------
class PrioritizationRunRequest(BaseModel):
    project_id: Optional[int] = None
    custom_weights: Optional[Dict[str, float]] = None

class PrioritizationRunResponse(BaseModel):
    id: int
    weights: Dict[str, float]
    rankings: List[Dict[str, Any]]
    sensitivity_analysis: Dict[str, Any]
    created_at: str

# ----------------- Fluorine Mass Balance Schemas -----------------
class FluorineBalanceCalculateRequest(BaseModel):
    initial_fluorine_inventory: float = Field(..., gt=0)
    inventory_basis_units: str = Field(default="mg/L")
    measured_inorganic_fluoride: Optional[float] = Field(None, ge=0)
    remaining_organic_fluorine: Optional[float] = Field(None, ge=0)
    other_identified_fluorine: Optional[float] = Field(default=0.0, ge=0)
    unidentified_fraction: Optional[float] = Field(default=None, ge=0)

class FluorineBalanceCalculateResponse(BaseModel):
    initial_fluorine_inventory: float
    inventory_basis_units: str
    measured_inorganic_fluoride: Optional[float]
    remaining_organic_fluorine: Optional[float]
    other_identified_fluorine: Optional[float]
    apparent_defluorination_pct: Optional[float]
    remaining_organic_pct: Optional[float]
    mass_balance_closure_pct: Optional[float]
    closure_status: str
    uncertainty_flags: List[str]
    scientific_interpretation: str
    chart_data: Dict[str, Any]

class FluorineBalanceScenarioCreate(FluorineBalanceCalculateRequest):
    project_id: Optional[int] = None
    scenario_name: str
    data_source_category: str = Field(default="Published experimental")
    citation_or_reference: Optional[str] = None
    notes: Optional[str] = None

class FluorineBalanceScenarioResponse(BaseModel):
    id: int
    project_id: Optional[int]
    scenario_name: str
    initial_fluorine_inventory: float
    inventory_basis_units: str
    measured_inorganic_fluoride: Optional[float]
    remaining_organic_fluorine: Optional[float]
    other_identified_fluorine: Optional[float]
    apparent_defluorination_pct: Optional[float]
    remaining_organic_pct: Optional[float]
    mass_balance_closure_pct: Optional[float]
    closure_status: str
    uncertainty_flags: List[str]
    data_source_category: str
    citation_or_reference: Optional[str]
    notes: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------- Insight Schemas -----------------
class InsightResponse(BaseModel):
    id: Optional[int] = None
    project_id: Optional[int] = None
    title: str
    rule_id: str
    category: str
    triggered_inputs: Dict[str, Any]
    supporting_evidence_citation: Optional[str] = None
    remaining_uncertainty: str
    recommended_action: str
    severity: str
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# ----------------- Report Schemas -----------------
class ReportGenerateRequest(BaseModel):
    project_id: int
    report_title: Optional[str] = None
    include_quantum: bool = True
    include_evidence: bool = True
    include_catalysts: bool = True
    include_fluorine: bool = True
    include_chemistry: bool = True

class ReportResponse(BaseModel):
    id: int
    project_id: int
    report_title: str
    pdf_filename: str
    file_size_bytes: int
    download_url: str
    generated_at: datetime
    model_config = ConfigDict(from_attributes=True)
