"""create_initial_schema

Revision ID: e79a8e46f017
Revises: 
Create Date: 2026-10-19 10:24:45.172200
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import Integer, String, Float, Boolean, Text, DateTime, ForeignKey

revision: str = 'e79a8e46f017'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        "application_settings",
        sa.Column("key", String(length=100), primary_key=True),
        sa.Column("value", Text(), nullable=False),
        sa.Column("description", String(length=255), nullable=True),
        sa.Column("updated_at", DateTime(), nullable=True),
    )
    op.create_table(
        "catalysts",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("name", String(length=255), nullable=False),
        sa.Column("chemical_formula", String(length=100), nullable=False),
        sa.Column("material_type", String(length=100), nullable=False),
        sa.Column("target_pfas", String(length=100), nullable=False),
        sa.Column("treatment_mechanism", String(length=255), nullable=False),
        sa.Column("reaction_conditions", Text(), nullable=False),
        sa.Column("light_or_electrical_source", String(length=255), nullable=True),
        sa.Column("operating_temperature_c", Float(), nullable=True),
        sa.Column("operating_ph", Float(), nullable=True),
        sa.Column("solvent_medium", String(length=100), nullable=False),
        sa.Column("catalyst_loading_g_l", Float(), nullable=True),
        sa.Column("reported_parent_removal_pct", Float(), nullable=False),
        sa.Column("reported_defluorination_pct", Float(), nullable=True),
        sa.Column("reported_byproducts", Text(), nullable=True),
        sa.Column("catalyst_stability_cycles", Integer(), nullable=True),
        sa.Column("energy_intensity_kwh_m3", Float(), nullable=True),
        sa.Column("evidence_category", String(length=100), nullable=False),
        sa.Column("doi_or_url", String(length=500), nullable=True),
        sa.Column("publication_citation", Text(), nullable=False),
        sa.Column("known_limitations", Text(), nullable=True),
        sa.Column("verification_status", String(length=100), nullable=False),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_catalysts_id", "catalysts", ['id'], unique=False)
    op.create_table(
        "experimental_studies",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("title", String(length=500), nullable=False),
        sa.Column("authors", String(length=500), nullable=True),
        sa.Column("publication_year", Integer(), nullable=True),
        sa.Column("journal", String(length=255), nullable=True),
        sa.Column("doi", String(length=255), nullable=True),
        sa.Column("study_url", String(length=500), nullable=True),
        sa.Column("abstract", Text(), nullable=True),
        sa.Column("is_peer_reviewed", Boolean(), nullable=True),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_experimental_studies_id", "experimental_studies", ['id'], unique=False)
    op.create_index("ix_experimental_studies_doi", "experimental_studies", ['doi'], unique=False)
    op.create_table(
        "pfas_compounds",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("common_name", String(length=255), nullable=False),
        sa.Column("acronym", String(length=50), nullable=False),
        sa.Column("cas_number", String(length=50), nullable=True),
        sa.Column("chemical_formula", String(length=100), nullable=False),
        sa.Column("smiles", String(length=500), nullable=True),
        sa.Column("molecular_weight", Float(), nullable=False),
        sa.Column("num_carbons", Integer(), nullable=False),
        sa.Column("num_fluorines", Integer(), nullable=False),
        sa.Column("pka", Float(), nullable=True),
        sa.Column("water_solubility_mg_l", Float(), nullable=True),
        sa.Column("property_sources", Text(), nullable=True),
        sa.Column("aliases_json", Text(), nullable=True),
        sa.Column("notes", Text(), nullable=True),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_pfas_compounds_id", "pfas_compounds", ['id'], unique=False)
    op.create_index("ix_pfas_compounds_common_name", "pfas_compounds", ['common_name'], unique=False)
    op.create_index("ix_pfas_compounds_cas_number", "pfas_compounds", ['cas_number'], unique=True)
    op.create_index("ix_pfas_compounds_acronym", "pfas_compounds", ['acronym'], unique=False)
    op.create_table(
        "users",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("email", String(length=255), nullable=False),
        sa.Column("hashed_password", String(length=255), nullable=False),
        sa.Column("full_name", String(length=255), nullable=False),
        sa.Column("role", String(length=50), nullable=False),
        sa.Column("is_active", Boolean(), nullable=True),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_users_email", "users", ['email'], unique=True)
    op.create_index("ix_users_id", "users", ['id'], unique=False)
    op.create_table(
        "audit_records",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("user_id", Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", String(length=100), nullable=False),
        sa.Column("entity_type", String(length=100), nullable=False),
        sa.Column("entity_id", String(length=100), nullable=True),
        sa.Column("change_summary", Text(), nullable=False),
        sa.Column("ip_address", String(length=50), nullable=True),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_audit_records_id", "audit_records", ['id'], unique=False)
    op.create_table(
        "molecular_models",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("name", String(length=255), nullable=False),
        sa.Column("chemical_formula", String(length=100), nullable=False),
        sa.Column("charge", Integer(), nullable=False),
        sa.Column("spin_multiplicity", Integer(), nullable=False),
        sa.Column("cartesian_coordinates_xyz", Text(), nullable=False),
        sa.Column("num_atoms", Integer(), nullable=False),
        sa.Column("num_electrons", Integer(), nullable=False),
        sa.Column("basis_set", String(length=50), nullable=False),
        sa.Column("model_scope_description", Text(), nullable=False),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_molecular_models_id", "molecular_models", ['id'], unique=False)
    op.create_table(
        "projects",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("title", String(length=255), nullable=False),
        sa.Column("target_pfas", String(length=255), nullable=False),
        sa.Column("research_question", Text(), nullable=False),
        sa.Column("destruction_approach", String(length=255), nullable=True),
        sa.Column("supporting_references", Text(), nullable=True),
        sa.Column("status", String(length=50), nullable=False),
        sa.Column("created_at", DateTime(), nullable=True),
        sa.Column("updated_at", DateTime(), nullable=True),
    )
    op.create_index("ix_projects_id", "projects", ['id'], unique=False)
    op.create_table(
        "calculation_jobs",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("project_id", Integer(), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("job_type", String(length=50), nullable=False),
        sa.Column("status", String(length=50), nullable=False),
        sa.Column("progress_pct", Float(), nullable=True),
        sa.Column("input_params_json", Text(), nullable=False),
        sa.Column("output_results_json", Text(), nullable=True),
        sa.Column("log_output", Text(), nullable=True),
        sa.Column("error_message", Text(), nullable=True),
        sa.Column("runtime_seconds", Float(), nullable=True),
        sa.Column("created_at", DateTime(), nullable=True),
        sa.Column("updated_at", DateTime(), nullable=True),
    )
    op.create_index("ix_calculation_jobs_id", "calculation_jobs", ['id'], unique=False)
    op.create_table(
        "classical_chemistry_runs",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("model_id", Integer(), sa.ForeignKey("molecular_models.id", ondelete="CASCADE"), nullable=False),
        sa.Column("project_id", Integer(), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("run_name", String(length=255), nullable=False),
        sa.Column("method_name", String(length=100), nullable=False),
        sa.Column("nuclear_repulsion_energy_au", Float(), nullable=False),
        sa.Column("electronic_energy_au", Float(), nullable=False),
        sa.Column("total_scf_energy_au", Float(), nullable=False),
        sa.Column("homo_energy_ev", Float(), nullable=False),
        sa.Column("lumo_energy_ev", Float(), nullable=False),
        sa.Column("homo_lumo_gap_ev", Float(), nullable=False),
        sa.Column("dipole_moment_debye", Float(), nullable=False),
        sa.Column("reaction_name", String(length=255), nullable=True),
        sa.Column("reaction_energy_kcal_mol", Float(), nullable=True),
        sa.Column("energy_convention_note", Text(), nullable=False),
        sa.Column("converged", Boolean(), nullable=True),
        sa.Column("iterations", Integer(), nullable=False),
        sa.Column("runtime_ms", Float(), nullable=False),
        sa.Column("software_version", String(length=100), nullable=False),
        sa.Column("limitations", Text(), nullable=False),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_classical_chemistry_runs_id", "classical_chemistry_runs", ['id'], unique=False)
    op.create_table(
        "evidence_records",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("project_id", Integer(), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("catalyst_id", Integer(), sa.ForeignKey("catalysts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("compound_name", String(length=255), nullable=False),
        sa.Column("study_title", String(length=500), nullable=False),
        sa.Column("authors", String(length=500), nullable=True),
        sa.Column("publication_year", Integer(), nullable=True),
        sa.Column("doi_or_url", String(length=500), nullable=True),
        sa.Column("method", String(length=255), nullable=True),
        sa.Column("parent_removal_pct", Float(), nullable=True),
        sa.Column("defluorination_pct", Float(), nullable=True),
        sa.Column("mineralization_pct", Float(), nullable=True),
        sa.Column("reported_byproducts", Text(), nullable=True),
        sa.Column("reaction_conditions", Text(), nullable=True),
        sa.Column("limitations", Text(), nullable=True),
        sa.Column("evidence_category", String(length=100), nullable=False),
        sa.Column("verification_status", String(length=100), nullable=False),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_evidence_records_id", "evidence_records", ['id'], unique=False)
    op.create_table(
        "experiment_plans",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("project_id", Integer(), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", String(length=255), nullable=False),
        sa.Column("target_pfas_id", Integer(), sa.ForeignKey("pfas_compounds.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("catalyst_id", Integer(), sa.ForeignKey("catalysts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("treatment_method", String(length=150), nullable=False),
        sa.Column("proposed_conditions", Text(), nullable=False),
        sa.Column("planned_controls", Text(), nullable=True),
        sa.Column("expected_measurements", Text(), nullable=True),
        sa.Column("analytical_methods", String(length=255), nullable=True),
        sa.Column("detection_limits", String(length=255), nullable=True),
        sa.Column("safety_hazards", Text(), nullable=True),
        sa.Column("experiment_status", String(length=50), nullable=False),
        sa.Column("researcher_notes", Text(), nullable=True),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_experiment_plans_id", "experiment_plans", ['id'], unique=False)
    op.create_table(
        "fluorine_balance_scenarios",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("project_id", Integer(), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("scenario_name", String(length=255), nullable=False),
        sa.Column("initial_fluorine_inventory", Float(), nullable=False),
        sa.Column("inventory_basis_units", String(length=50), nullable=False),
        sa.Column("measured_inorganic_fluoride", Float(), nullable=True),
        sa.Column("remaining_organic_fluorine", Float(), nullable=True),
        sa.Column("other_identified_fluorine", Float(), nullable=True),
        sa.Column("unidentified_fraction", Float(), nullable=True),
        sa.Column("apparent_defluorination_pct", Float(), nullable=True),
        sa.Column("remaining_organic_pct", Float(), nullable=True),
        sa.Column("mass_balance_closure_pct", Float(), nullable=True),
        sa.Column("closure_status", String(length=100), nullable=False),
        sa.Column("uncertainty_flags", Text(), nullable=True),
        sa.Column("data_source_category", String(length=100), nullable=False),
        sa.Column("citation_or_reference", String(length=500), nullable=True),
        sa.Column("notes", Text(), nullable=True),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_fluorine_balance_scenarios_id", "fluorine_balance_scenarios", ['id'], unique=False)
    op.create_table(
        "pathways",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("project_id", Integer(), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", String(length=255), nullable=False),
        sa.Column("target_compound", String(length=255), nullable=False),
        sa.Column("description", Text(), nullable=True),
        sa.Column("reference_doi", String(length=255), nullable=True),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_pathways_id", "pathways", ['id'], unique=False)
    op.create_table(
        "prioritization_runs",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("project_id", Integer(), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("run_title", String(length=255), nullable=False),
        sa.Column("target_pfas", String(length=100), nullable=False),
        sa.Column("weights_json", Text(), nullable=False),
        sa.Column("rankings_json", Text(), nullable=False),
        sa.Column("sensitivity_analysis_json", Text(), nullable=False),
        sa.Column("notes", Text(), nullable=True),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_prioritization_runs_id", "prioritization_runs", ['id'], unique=False)
    op.create_table(
        "quantum_runs",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("project_id", Integer(), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("run_name", String(length=255), nullable=False),
        sa.Column("model_type", String(length=100), nullable=False),
        sa.Column("hamiltonian_type", String(length=255), nullable=False),
        sa.Column("hamiltonian_definition", Text(), nullable=False),
        sa.Column("num_qubits", Integer(), nullable=False),
        sa.Column("exact_energy", Float(), nullable=False),
        sa.Column("vqe_energy", Float(), nullable=False),
        sa.Column("absolute_error", Float(), nullable=False),
        sa.Column("relative_error", Float(), nullable=True),
        sa.Column("optimizer_name", String(length=50), nullable=False),
        sa.Column("iterations", Integer(), nullable=False),
        sa.Column("function_evaluations", Integer(), nullable=False),
        sa.Column("optimizer_converged", Boolean(), nullable=True),
        sa.Column("execution_time_ms", Float(), nullable=False),
        sa.Column("random_seed", Integer(), nullable=True),
        sa.Column("initial_parameters", Text(), nullable=True),
        sa.Column("optimal_parameters", Text(), nullable=True),
        sa.Column("software_versions", Text(), nullable=True),
        sa.Column("is_toy_model", Boolean(), nullable=True),
        sa.Column("disclaimer_text", Text(), nullable=False),
        sa.Column("notes", Text(), nullable=True),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_quantum_runs_id", "quantum_runs", ['id'], unique=False)
    op.create_table(
        "reports",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("project_id", Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("report_title", String(length=255), nullable=False),
        sa.Column("pdf_filename", String(length=255), nullable=False),
        sa.Column("file_size_bytes", Integer(), nullable=False),
        sa.Column("metadata_json", Text(), nullable=True),
        sa.Column("generated_at", DateTime(), nullable=True),
    )
    op.create_index("ix_reports_id", "reports", ['id'], unique=False)
    op.create_table(
        "research_insights",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("project_id", Integer(), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", String(length=255), nullable=False),
        sa.Column("rule_id", String(length=100), nullable=False),
        sa.Column("category", String(length=100), nullable=False),
        sa.Column("triggered_inputs", Text(), nullable=True),
        sa.Column("supporting_evidence_citation", Text(), nullable=True),
        sa.Column("remaining_uncertainty", Text(), nullable=False),
        sa.Column("recommended_action", Text(), nullable=False),
        sa.Column("severity", String(length=50), nullable=False),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_research_insights_id", "research_insights", ['id'], unique=False)
    op.create_table(
        "treatment_experiments",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("study_id", Integer(), sa.ForeignKey("experimental_studies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("project_id", Integer(), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("pfas_id", Integer(), sa.ForeignKey("pfas_compounds.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("catalyst_id", Integer(), sa.ForeignKey("catalysts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("treatment_method", String(length=150), nullable=False),
        sa.Column("initial_concentration_mg_l", Float(), nullable=False),
        sa.Column("duration_minutes", Float(), nullable=True),
        sa.Column("temperature_c", Float(), nullable=True),
        sa.Column("ph", Float(), nullable=True),
        sa.Column("catalyst_loading_g_l", Float(), nullable=True),
        sa.Column("light_or_energy_source", String(length=255), nullable=True),
        sa.Column("other_conditions", Text(), nullable=True),
        sa.Column("parent_removal_pct", Float(), nullable=True),
        sa.Column("defluorination_pct", Float(), nullable=True),
        sa.Column("mineralization_pct", Float(), nullable=True),
        sa.Column("mass_balance_closure_pct", Float(), nullable=True),
        sa.Column("sample_size_replicates", Integer(), nullable=True),
        sa.Column("detection_limits", String(length=255), nullable=True),
        sa.Column("analytical_methods", String(length=255), nullable=True),
        sa.Column("experimental_uncertainty", String(length=255), nullable=True),
        sa.Column("notes", Text(), nullable=True),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_treatment_experiments_id", "treatment_experiments", ['id'], unique=False)
    op.create_table(
        "uploaded_documents",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("project_id", Integer(), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("filename", String(length=255), nullable=False),
        sa.Column("file_path", String(length=500), nullable=False),
        sa.Column("file_size_bytes", Integer(), nullable=False),
        sa.Column("mime_type", String(length=100), nullable=False),
        sa.Column("extraction_status", String(length=50), nullable=False),
        sa.Column("raw_text", Text(), nullable=True),
        sa.Column("chunk_count", Integer(), nullable=True),
        sa.Column("uploaded_by_id", Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_uploaded_documents_id", "uploaded_documents", ['id'], unique=False)
    op.create_table(
        "document_chunks",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("document_id", Integer(), sa.ForeignKey("uploaded_documents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("chunk_index", Integer(), nullable=False),
        sa.Column("section_title", String(length=255), nullable=True),
        sa.Column("page_number", Integer(), nullable=True),
        sa.Column("content", Text(), nullable=False),
        sa.Column("extracted_entities_json", Text(), nullable=True),
        sa.Column("embedding_json", Text(), nullable=True),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_document_chunks_id", "document_chunks", ['id'], unique=False)
    op.create_table(
        "pathway_steps",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("pathway_id", Integer(), sa.ForeignKey("pathways.id", ondelete="CASCADE"), nullable=False),
        sa.Column("step_number", Integer(), nullable=False),
        sa.Column("reactant_name", String(length=255), nullable=False),
        sa.Column("product_name", String(length=255), nullable=False),
        sa.Column("transformation_description", Text(), nullable=False),
        sa.Column("bond_changes", Text(), nullable=True),
        sa.Column("charge", Integer(), nullable=True),
        sa.Column("spin_multiplicity", Integer(), nullable=True),
        sa.Column("chemical_conditions", Text(), nullable=True),
        sa.Column("reported_intermediates", Text(), nullable=True),
        sa.Column("reaction_energy_kcal_mol", Float(), nullable=True),
        sa.Column("activation_barrier_kcal_mol", Float(), nullable=True),
        sa.Column("is_experimentally_observed", Boolean(), nullable=True),
        sa.Column("is_computationally_proposed", Boolean(), nullable=True),
        sa.Column("quantum_calc_status", String(length=100), nullable=True),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_pathway_steps_id", "pathway_steps", ['id'], unique=False)
    op.create_table(
        "reported_measurements",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("experiment_id", Integer(), sa.ForeignKey("treatment_experiments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("measurement_type", String(length=100), nullable=False),
        sa.Column("measured_value", Float(), nullable=False),
        sa.Column("unit", String(length=50), nullable=False),
        sa.Column("analytical_method", String(length=150), nullable=True),
        sa.Column("uncertainty_std", Float(), nullable=True),
        sa.Column("detection_limit", Float(), nullable=True),
        sa.Column("is_verified", Boolean(), nullable=True),
        sa.Column("raw_text_excerpt", Text(), nullable=True),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_reported_measurements_id", "reported_measurements", ['id'], unique=False)
    op.create_table(
        "transformation_intermediates",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("experiment_id", Integer(), sa.ForeignKey("treatment_experiments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", String(length=255), nullable=False),
        sa.Column("chemical_formula", String(length=100), nullable=True),
        sa.Column("num_fluorines", Integer(), nullable=True),
        sa.Column("concentration_mg_l", Float(), nullable=True),
        sa.Column("is_volatile", Boolean(), nullable=True),
        sa.Column("notes", Text(), nullable=True),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_transformation_intermediates_id", "transformation_intermediates", ['id'], unique=False)
    op.create_table(
        "candidate_claims",
        sa.Column("id", Integer(), primary_key=True),
        sa.Column("document_id", Integer(), sa.ForeignKey("uploaded_documents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("chunk_id", Integer(), sa.ForeignKey("document_chunks.id", ondelete="CASCADE"), nullable=True),
        sa.Column("claim_type", String(length=100), nullable=False),
        sa.Column("extracted_data_json", Text(), nullable=False),
        sa.Column("verification_status", String(length=50), nullable=False),
        sa.Column("reviewer_notes", Text(), nullable=True),
        sa.Column("verified_by_id", Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("verified_at", DateTime(), nullable=True),
        sa.Column("created_at", DateTime(), nullable=True),
    )
    op.create_index("ix_candidate_claims_id", "candidate_claims", ['id'], unique=False)


def downgrade() -> None:
    op.drop_index("ix_candidate_claims_id", table_name="candidate_claims")
    op.drop_table("candidate_claims")
    op.drop_index("ix_transformation_intermediates_id", table_name="transformation_intermediates")
    op.drop_table("transformation_intermediates")
    op.drop_index("ix_reported_measurements_id", table_name="reported_measurements")
    op.drop_table("reported_measurements")
    op.drop_index("ix_pathway_steps_id", table_name="pathway_steps")
    op.drop_table("pathway_steps")
    op.drop_index("ix_document_chunks_id", table_name="document_chunks")
    op.drop_table("document_chunks")
    op.drop_index("ix_uploaded_documents_id", table_name="uploaded_documents")
    op.drop_table("uploaded_documents")
    op.drop_index("ix_treatment_experiments_id", table_name="treatment_experiments")
    op.drop_table("treatment_experiments")
    op.drop_index("ix_research_insights_id", table_name="research_insights")
    op.drop_table("research_insights")
    op.drop_index("ix_reports_id", table_name="reports")
    op.drop_table("reports")
    op.drop_index("ix_quantum_runs_id", table_name="quantum_runs")
    op.drop_table("quantum_runs")
    op.drop_index("ix_prioritization_runs_id", table_name="prioritization_runs")
    op.drop_table("prioritization_runs")
    op.drop_index("ix_pathways_id", table_name="pathways")
    op.drop_table("pathways")
    op.drop_index("ix_fluorine_balance_scenarios_id", table_name="fluorine_balance_scenarios")
    op.drop_table("fluorine_balance_scenarios")
    op.drop_index("ix_experiment_plans_id", table_name="experiment_plans")
    op.drop_table("experiment_plans")
    op.drop_index("ix_evidence_records_id", table_name="evidence_records")
    op.drop_table("evidence_records")
    op.drop_index("ix_classical_chemistry_runs_id", table_name="classical_chemistry_runs")
    op.drop_table("classical_chemistry_runs")
    op.drop_index("ix_calculation_jobs_id", table_name="calculation_jobs")
    op.drop_table("calculation_jobs")
    op.drop_index("ix_projects_id", table_name="projects")
    op.drop_table("projects")
    op.drop_index("ix_molecular_models_id", table_name="molecular_models")
    op.drop_table("molecular_models")
    op.drop_index("ix_audit_records_id", table_name="audit_records")
    op.drop_table("audit_records")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")
    op.drop_index("ix_pfas_compounds_id", table_name="pfas_compounds")
    op.drop_index("ix_pfas_compounds_common_name", table_name="pfas_compounds")
    op.drop_index("ix_pfas_compounds_cas_number", table_name="pfas_compounds")
    op.drop_index("ix_pfas_compounds_acronym", table_name="pfas_compounds")
    op.drop_table("pfas_compounds")
    op.drop_index("ix_experimental_studies_id", table_name="experimental_studies")
    op.drop_index("ix_experimental_studies_doi", table_name="experimental_studies")
    op.drop_table("experimental_studies")
    op.drop_index("ix_catalysts_id", table_name="catalysts")
    op.drop_table("catalysts")
    op.drop_table("application_settings")
