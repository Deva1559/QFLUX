export interface HealthResponse {
  status: string;
  service?: string;
  database_connected: boolean;
  version?: string;
  environment?: string;
  timestamp?: string;
}

export interface Project {
  id: number;
  title: string;
  target_pfas: string;
  research_question: string;
  destruction_approach?: string;
  supporting_references?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OverviewStats {
  total_projects: number;
  total_evidence_records: number;
  total_quantum_runs: number;
  total_fluorine_scenarios: number;
  total_reports: number;
  latest_quantum_run?: {
    id: number;
    run_name: string;
    vqe_energy: number;
    exact_energy: number;
    absolute_error: number;
    is_toy_model: boolean;
    execution_time_ms: number;
  };
  scientific_warnings: string[];
}

export interface EvidenceRecord {
  id: number;
  project_id?: number;
  compound_name: string;
  study_title: string;
  authors?: string;
  publication_year?: number;
  doi_or_url?: string;
  method?: string;
  parent_removal_pct?: number;
  defluorination_pct?: number;
  mineralization_pct?: number;
  reported_byproducts?: string;
  reaction_conditions?: string;
  limitations?: string;
  evidence_category: string;
  verification_status: string;
  created_at: string;
}

export interface PathwayStep {
  id: number;
  pathway_id: number;
  step_number: number;
  reactant_name: string;
  product_name: string;
  transformation_description: string;
  bond_changes?: string;
  chemical_conditions?: string;
  reported_intermediates?: string;
  is_experimentally_observed: boolean;
  is_computationally_proposed: boolean;
  quantum_calc_status: string;
  created_at: string;
}

export interface Pathway {
  id: number;
  project_id?: number;
  title: string;
  target_compound: string;
  description?: string;
  reference_doi?: string;
  steps: PathwayStep[];
  created_at: string;
}

export interface QuantumBenchmarkRequest {
  project_id?: number;
  run_name: string;
  model_type?: 'Reduced C-F Active Space' | 'Pedagogical Toy Benchmark';
  optimizer: string;
  max_iter: number;
  tolerance: number;
  random_seed?: number;
  coeff_z0?: number;
  coeff_z1?: number;
  coeff_xx?: number;
  coeff_zz?: number;
}

export interface QuantumBenchmarkResponse {
  id?: number;
  run_name: string;
  model_type?: string;
  hamiltonian_type: string;
  hamiltonian_definition: string;
  num_qubits: number;
  exact_energy: number;
  vqe_energy: number;
  absolute_error: number;
  relative_error?: number;
  optimizer_name: string;
  iterations: number;
  function_evaluations: number;
  optimizer_converged: boolean;
  execution_time_ms: number;
  random_seed?: number;
  initial_parameters: number[];
  optimal_parameters: number[];
  software_versions: Record<string, string>;
  is_toy_model: boolean;
  disclaimer_text: string;
  extension_note: string;
}

export interface FluorineBalanceCalculateRequest {
  initial_fluorine_inventory: number;
  inventory_basis_units: string;
  measured_inorganic_fluoride?: number;
  remaining_organic_fluorine?: number;
  other_identified_fluorine?: number;
  unidentified_fraction?: number;
}

export interface FluorineBalanceCalculateResponse {
  initial_fluorine_inventory: number;
  inventory_basis_units: string;
  measured_inorganic_fluoride?: number;
  remaining_organic_fluorine?: number;
  other_identified_fluorine?: number;
  apparent_defluorination_pct?: number;
  remaining_organic_pct?: number;
  mass_balance_closure_pct?: number;
  closure_status: string;
  uncertainty_flags: string[];
  scientific_interpretation: string;
  chart_data: {
    categories: string[];
    values: number[];
    units: string;
    percentages: number[];
  };
}

export interface FluorineScenario {
  id: number;
  project_id?: number;
  scenario_name: string;
  initial_fluorine_inventory: number;
  inventory_basis_units: string;
  measured_inorganic_fluoride?: number;
  remaining_organic_fluorine?: number;
  other_identified_fluorine?: number;
  apparent_defluorination_pct?: number;
  remaining_organic_pct?: number;
  mass_balance_closure_pct?: number;
  closure_status: string;
  uncertainty_flags: string[];
  data_source_category: string;
  citation_or_reference?: string;
  notes?: string;
  created_at: string;
}

export interface ResearchInsight {
  id?: number;
  project_id?: number;
  title: string;
  rule_id: string;
  category: string;
  triggered_inputs: Record<string, any>;
  supporting_evidence_citation?: string;
  remaining_uncertainty: string;
  recommended_action: string;
  severity: "Warning" | "Info" | "Critical";
  created_at?: string;
}

export interface ReportItem {
  id: number;
  project_id: number;
  report_title: string;
  pdf_filename: string;
  file_size_bytes: number;
  download_url: string;
  generated_at: string;
}

export interface Catalyst {
  id: number;
  name: string;
  chemical_formula: string;
  material_type: string;
  target_pfas: string;
  treatment_mechanism: string;
  reaction_conditions: string;
  light_or_electrical_source?: string;
  operating_temperature_c?: number;
  operating_ph?: number;
  solvent_medium: string;
  catalyst_loading_g_l?: number;
  reported_parent_removal_pct: number;
  reported_defluorination_pct?: number;
  reported_byproducts?: string;
  catalyst_stability_cycles?: number;
  energy_intensity_kwh_m3?: number;
  evidence_category: string;
  doi_or_url?: string;
  publication_citation: string;
  known_limitations?: string;
  verification_status: string;
  created_at: string;
}

export interface CatalystComparisonResponse {
  catalysts: Catalyst[];
  comparison_table: Array<{
    property: string;
    description: string;
    values: Record<string, any>;
  }>;
  tradeoff_summary: string;
}

export interface MolecularModel {
  id: number;
  name: string;
  chemical_formula: string;
  charge: number;
  spin_multiplicity: number;
  cartesian_coordinates_xyz: string;
  num_atoms: number;
  num_electrons: number;
  basis_set: string;
  model_scope_description: string;
  created_at: string;
}

export interface ClassicalChemistryRunRequest {
  model_id: number;
  project_id?: number;
  run_name: string;
  basis_set?: string;
  compute_reaction_energy?: boolean;
}

export interface ClassicalChemistryRunResponse {
  id?: number;
  model_id: number;
  project_id?: number;
  run_name: string;
  method_name: string;
  nuclear_repulsion_energy_au: number;
  electronic_energy_au: number;
  total_scf_energy_au: number;
  homo_energy_ev: number;
  lumo_energy_ev: number;
  homo_lumo_gap_ev: number;
  dipole_moment_debye: number;
  reaction_name?: string;
  reaction_energy_kcal_mol?: number;
  energy_convention_note: string;
  converged: boolean;
  iterations: number;
  runtime_ms: number;
  software_version: string;
  limitations: string;
  created_at?: string;
}

export interface PrioritizationRankingItem {
  rank: number;
  catalyst_id: number;
  name: string;
  material_type: string;
  target_pfas: string;
  composite_score: number;
  category?: string;
  status: string;
  is_rankable?: boolean;
  missing_defluorination_penalty_applied: boolean;
  dimension_scores: Record<string, number>;
  primary_rationale: string;
  limitations: string;
}

export interface PrioritizationRunResponse {
  id: number;
  weights: Record<string, number>;
  rankings: PrioritizationRankingItem[];
  sensitivity_analysis: {
    tested_variations: string[];
    top_candidate_under_shifts: Record<string, string>;
    ranking_stability: string;
    critical_dimensions: string[];
    advice: string;
  };
  created_at: string;
}

// ================== Q-FLUX 2.0 PFAS Knowledge Base Types ==================
export interface PFASCompound {
  id: number;
  common_name: string;
  acronym: string;
  cas_number?: string;
  chemical_formula: string;
  smiles?: string;
  molecular_weight: number;
  num_carbons: number;
  num_fluorines: number;
  pka?: number;
  water_solubility_mg_l?: number;
  property_sources?: string;
  aliases_json?: string;
  notes?: string;
  created_at: string;
}

// ================== Q-FLUX 2.0 AI Literature Assistant Types ==================
export interface CandidateClaim {
  id: number;
  document_id: number;
  chunk_id?: number;
  claim_type: string;
  extracted_data_json: string;
  verification_status: 'unverified' | 'verified' | 'rejected';
  reviewer_notes?: string;
  verified_by_id?: number;
  verified_at?: string;
  created_at: string;
}

export interface DocumentChunk {
  id: number;
  document_id: number;
  chunk_index: number;
  section_title?: string;
  page_number?: number;
  content: string;
  created_at: string;
}

export interface UploadedDocument {
  id: number;
  project_id?: number;
  filename: string;
  file_size_bytes: number;
  mime_type: string;
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed';
  chunk_count: number;
  created_at: string;
  claims: CandidateClaim[];
}

export interface LiteratureSourceCitation {
  document_title: string;
  section_or_page: string;
  doi_or_url?: string;
  passage_excerpt: string;
  relevance_score: number;
}

export interface LiteratureQueryResponse {
  query: string;
  answer: string;
  citations: LiteratureSourceCitation[];
  missing_evidence_statement?: string;
  confidence_level: string;
}

export interface CSVImportPreviewRow {
  row_number: number;
  valid: boolean;
  data: Record<string, any>;
  errors: string[];
}

export interface CSVImportPreviewResponse {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  headers: string[];
  preview_rows: CSVImportPreviewRow[];
}

// ================== Q-FLUX 2.0 Experiment Planning Types ==================
export interface ExperimentPlan {
  id: number;
  project_id?: number;
  title: string;
  target_pfas_id: number;
  catalyst_id?: number;
  treatment_method: string;
  proposed_conditions: string;
  planned_controls?: string;
  expected_measurements?: string;
  analytical_methods?: string;
  detection_limits?: string;
  safety_hazards?: string;
  experiment_status: 'Draft' | 'Scheduled' | 'Completed' | 'Cancelled';
  researcher_notes?: string;
  created_at: string;
}

// ================== Q-FLUX 2.0 Recommendation Types ==================
export interface RecommendationEvidenceItem {
  catalyst_name: string;
  treatment_method: string;
  target_pfas: string;
  reported_parent_removal_pct: number;
  reported_defluorination_pct?: number;
  byproduct_risk: string;
  doi_or_url?: string;
  evidence_category: string;
}

export interface RecommendationItem {
  candidate_name: string;
  target_pfas: string;
  rank: number;
  composite_score: number;
  confidence_assessment: string;
  defluorination_penalty_applied: boolean;
  penalty_explanation: string;
  supporting_evidence: RecommendationEvidenceItem[];
  molecular_mechanistic_insights: string;
  missing_measurements: string[];
  potential_hazards: string[];
  proposed_next_experiment: string;
  conditions_under_which_recommendation_holds: string;
}

// ================== Q-FLUX 2.0 Calculation Jobs ==================
export interface CalculationJob {
  id: number;
  project_id?: number;
  job_type: 'scf_classical' | 'vqe_quantum';
  status: 'Queued' | 'Running' | 'Completed' | 'Failed' | 'Cancelled';
  progress_pct: number;
  input_params_json: string;
  output_results_json?: string;
  log_output?: string;
  error_message?: string;
  runtime_seconds?: number;
  created_at: string;
  updated_at: string;
}
