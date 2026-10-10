from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    target_pfas = Column(String(255), nullable=False, default="PFOA (perfluorooctanoic acid)")
    research_question = Column(Text, nullable=False)
    destruction_approach = Column(String(255), nullable=True)
    supporting_references = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    evidence_records = relationship("EvidenceRecord", back_populates="project", cascade="all, delete-orphan")
    quantum_runs = relationship("QuantumRun", back_populates="project", cascade="all, delete-orphan")
    fluorine_scenarios = relationship("FluorineBalanceScenario", back_populates="project", cascade="all, delete-orphan")
    insights = relationship("ResearchInsight", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")
    pathways = relationship("Pathway", back_populates="project", cascade="all, delete-orphan")
    chemistry_runs = relationship("ClassicalChemistryRun", back_populates="project", cascade="all, delete-orphan")
    prioritization_runs = relationship("PrioritizationRun", back_populates="project", cascade="all, delete-orphan")


class Catalyst(Base):
    __tablename__ = "catalysts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    chemical_formula = Column(String(100), nullable=False)
    material_type = Column(String(100), nullable=False)
    target_pfas = Column(String(100), nullable=False, default="PFOA")
    treatment_mechanism = Column(String(255), nullable=False)
    reaction_conditions = Column(Text, nullable=False)
    light_or_electrical_source = Column(String(255), nullable=True)
    operating_temperature_c = Column(Float, nullable=True, default=25.0)
    operating_ph = Column(Float, nullable=True, default=7.0)
    solvent_medium = Column(String(100), nullable=False, default="Aqueous")
    catalyst_loading_g_l = Column(Float, nullable=True)
    reported_parent_removal_pct = Column(Float, nullable=False)
    reported_defluorination_pct = Column(Float, nullable=True)  # Strictly nullable if missing in publication
    reported_byproducts = Column(Text, nullable=True)
    catalyst_stability_cycles = Column(Integer, nullable=True)
    energy_intensity_kwh_m3 = Column(Float, nullable=True)
    evidence_category = Column(String(100), nullable=False, default="Published experimental result")
    doi_or_url = Column(String(500), nullable=True)
    publication_citation = Column(Text, nullable=False)
    known_limitations = Column(Text, nullable=True)
    verification_status = Column(String(100), nullable=False, default="Verified against primary literature")
    created_at = Column(DateTime, default=datetime.utcnow)

    evidence_records = relationship("EvidenceRecord", back_populates="catalyst")


class EvidenceRecord(Base):
    __tablename__ = "evidence_records"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    catalyst_id = Column(Integer, ForeignKey("catalysts.id", ondelete="SET NULL"), nullable=True)
    compound_name = Column(String(255), nullable=False)
    study_title = Column(String(500), nullable=False)
    authors = Column(String(500), nullable=True)
    publication_year = Column(Integer, nullable=True)
    doi_or_url = Column(String(500), nullable=True)
    method = Column(String(255), nullable=True)
    parent_removal_pct = Column(Float, nullable=True)
    defluorination_pct = Column(Float, nullable=True)
    mineralization_pct = Column(Float, nullable=True)
    reported_byproducts = Column(Text, nullable=True)
    reaction_conditions = Column(Text, nullable=True)
    limitations = Column(Text, nullable=True)
    evidence_category = Column(String(100), nullable=False, default="Published experimental result")
    verification_status = Column(String(100), nullable=False, default="Needs verification")
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="evidence_records")
    catalyst = relationship("Catalyst", back_populates="evidence_records")


class MolecularModel(Base):
    __tablename__ = "molecular_models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    chemical_formula = Column(String(100), nullable=False)
    charge = Column(Integer, nullable=False, default=0)
    spin_multiplicity = Column(Integer, nullable=False, default=1)
    cartesian_coordinates_xyz = Column(Text, nullable=False)
    num_atoms = Column(Integer, nullable=False)
    num_electrons = Column(Integer, nullable=False)
    basis_set = Column(String(50), nullable=False, default="STO-3G")
    model_scope_description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    chemistry_runs = relationship("ClassicalChemistryRun", back_populates="model", cascade="all, delete-orphan")


class ClassicalChemistryRun(Base):
    __tablename__ = "classical_chemistry_runs"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("molecular_models.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    run_name = Column(String(255), nullable=False)
    method_name = Column(String(100), nullable=False, default="Hartree-Fock (SCF)")
    nuclear_repulsion_energy_au = Column(Float, nullable=False)
    electronic_energy_au = Column(Float, nullable=False)
    total_scf_energy_au = Column(Float, nullable=False)
    homo_energy_ev = Column(Float, nullable=False)
    lumo_energy_ev = Column(Float, nullable=False)
    homo_lumo_gap_ev = Column(Float, nullable=False)
    dipole_moment_debye = Column(Float, nullable=False)
    reaction_name = Column(String(255), nullable=True)
    reaction_energy_kcal_mol = Column(Float, nullable=True)
    energy_convention_note = Column(Text, nullable=False)
    converged = Column(Boolean, default=True)
    iterations = Column(Integer, nullable=False)
    runtime_ms = Column(Float, nullable=False)
    software_version = Column(String(100), nullable=False)
    limitations = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    model = relationship("MolecularModel", back_populates="chemistry_runs")
    project = relationship("Project", back_populates="chemistry_runs")


class Pathway(Base):
    __tablename__ = "pathways"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    target_compound = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    reference_doi = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="pathways")
    steps = relationship("PathwayStep", back_populates="pathway", cascade="all, delete-orphan", order_by="PathwayStep.step_number")


class PathwayStep(Base):
    __tablename__ = "pathway_steps"

    id = Column(Integer, primary_key=True, index=True)
    pathway_id = Column(Integer, ForeignKey("pathways.id", ondelete="CASCADE"), nullable=False)
    step_number = Column(Integer, nullable=False)
    reactant_name = Column(String(255), nullable=False)
    product_name = Column(String(255), nullable=False)
    transformation_description = Column(Text, nullable=False)
    bond_changes = Column(Text, nullable=True)
    charge = Column(Integer, nullable=True, default=0)
    spin_multiplicity = Column(Integer, nullable=True, default=1)
    chemical_conditions = Column(Text, nullable=True)
    reported_intermediates = Column(Text, nullable=True)
    reaction_energy_kcal_mol = Column(Float, nullable=True)
    activation_barrier_kcal_mol = Column(Float, nullable=True)
    is_experimentally_observed = Column(Boolean, default=False)
    is_computationally_proposed = Column(Boolean, default=True)
    quantum_calc_status = Column(String(100), default="Not yet calculated")
    created_at = Column(DateTime, default=datetime.utcnow)

    pathway = relationship("Pathway", back_populates="steps")


class QuantumRun(Base):
    __tablename__ = "quantum_runs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    run_name = Column(String(255), nullable=False)
    model_type = Column(String(100), nullable=False, default="Reduced C-F Active Space") # "Reduced C-F Active Space" or "Pedagogical Toy Benchmark"
    hamiltonian_type = Column(String(255), nullable=False)
    hamiltonian_definition = Column(Text, nullable=False)
    num_qubits = Column(Integer, nullable=False, default=2)
    exact_energy = Column(Float, nullable=False)
    vqe_energy = Column(Float, nullable=False)
    absolute_error = Column(Float, nullable=False)
    relative_error = Column(Float, nullable=True)
    optimizer_name = Column(String(50), nullable=False, default="Nelder-Mead")
    iterations = Column(Integer, nullable=False)
    function_evaluations = Column(Integer, nullable=False)
    optimizer_converged = Column(Boolean, default=True)
    execution_time_ms = Column(Float, nullable=False)
    random_seed = Column(Integer, nullable=True)
    initial_parameters = Column(Text, nullable=True)
    optimal_parameters = Column(Text, nullable=True)
    software_versions = Column(Text, nullable=True)
    is_toy_model = Column(Boolean, default=False)
    disclaimer_text = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="quantum_runs")


class FluorineBalanceScenario(Base):
    __tablename__ = "fluorine_balance_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    scenario_name = Column(String(255), nullable=False)
    initial_fluorine_inventory = Column(Float, nullable=False)
    inventory_basis_units = Column(String(50), nullable=False, default="mg/L")
    measured_inorganic_fluoride = Column(Float, nullable=True)
    remaining_organic_fluorine = Column(Float, nullable=True)
    other_identified_fluorine = Column(Float, nullable=True)
    unidentified_fraction = Column(Float, nullable=True)
    apparent_defluorination_pct = Column(Float, nullable=True)
    remaining_organic_pct = Column(Float, nullable=True)
    mass_balance_closure_pct = Column(Float, nullable=True)
    closure_status = Column(String(100), nullable=False)
    uncertainty_flags = Column(Text, nullable=True)
    data_source_category = Column(String(100), nullable=False, default="Published experimental")
    citation_or_reference = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="fluorine_scenarios")


class PrioritizationRun(Base):
    __tablename__ = "prioritization_runs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    run_title = Column(String(255), nullable=False)
    target_pfas = Column(String(100), nullable=False, default="PFOA")
    weights_json = Column(Text, nullable=False)
    rankings_json = Column(Text, nullable=False)
    sensitivity_analysis_json = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="prioritization_runs")


class ResearchInsight(Base):
    __tablename__ = "research_insights"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    rule_id = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    triggered_inputs = Column(Text, nullable=True)
    supporting_evidence_citation = Column(Text, nullable=True)
    remaining_uncertainty = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    severity = Column(String(50), nullable=False, default="Warning")
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="insights")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    report_title = Column(String(255), nullable=False)
    pdf_filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    metadata_json = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="reports")


class ApplicationSetting(Base):
    __tablename__ = "application_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
