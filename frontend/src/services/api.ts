import {
  Project,
  OverviewStats,
  EvidenceRecord,
  Pathway,
  QuantumBenchmarkRequest,
  QuantumBenchmarkResponse,
  FluorineBalanceCalculateRequest,
  FluorineBalanceCalculateResponse,
  FluorineScenario,
  ResearchInsight,
  ReportItem,
  Catalyst,
  CatalystComparisonResponse,
  MolecularModel,
  ClassicalChemistryRunRequest,
  ClassicalChemistryRunResponse,
  PrioritizationRunResponse
} from '../types';

let customBaseUrl = 'http://localhost:8000';

export const setApiBaseUrl = (url: string) => {
  customBaseUrl = url.replace(/\/+$/, '');
};

export const getApiBaseUrl = () => customBaseUrl;

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const url = `${customBaseUrl}/api/v1${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options?.headers || {})
    }
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch (_) {}
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
};

export const api = {
  // Health & System
  getHealth: () => request<{ status: string; service: string; database_connected: boolean }>('/health'),
  getSettings: () => request<any>('/settings'),
  triggerSeed: () => request<{ status: string; message: string }>('/settings/seed', { method: 'POST' }),

  // Projects
  getProjects: () => request<Project[]>('/projects'),
  createProject: (data: Partial<Project>) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  getOverviewStats: (projectId?: number) =>
    request<OverviewStats>(`/projects/overview/stats${projectId ? `?project_id=${projectId}` : ''}`),

  // Catalyst Intelligence & Comparative Screening
  getCatalysts: (targetPfas?: string, materialType?: string) => {
    const params = new URLSearchParams();
    if (targetPfas) params.append('target_pfas', targetPfas);
    if (materialType) params.append('material_type', materialType);
    const qs = params.toString();
    return request<Catalyst[]>(`/catalysts${qs ? `?${qs}` : ''}`);
  },
  getCatalyst: (id: number) => request<Catalyst>(`/catalysts/${id}`),
  compareCatalysts: (catalystIds: number[], normalizeBy: string = 'defluorination') =>
    request<CatalystComparisonResponse>('/catalysts/compare', {
      method: 'POST',
      body: JSON.stringify({ catalyst_ids: catalystIds, normalize_by: normalizeBy })
    }),

  // Ab-Initio RHF/STO-3G Molecular Chemistry
  getMolecularModels: () => request<MolecularModel[]>('/chemistry/models'),
  runClassicalChemistry: (data: ClassicalChemistryRunRequest) =>
    request<ClassicalChemistryRunResponse>('/chemistry/runs', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getClassicalChemistryRuns: (modelId?: number, projectId?: number) => {
    const params = new URLSearchParams();
    if (modelId) params.append('model_id', String(modelId));
    if (projectId) params.append('project_id', String(projectId));
    const qs = params.toString();
    return request<ClassicalChemistryRunResponse[]>(`/chemistry/runs${qs ? `?${qs}` : ''}`);
  },

  // 10-D Prioritization & Sensitivity Analysis
  runPrioritization: (projectId?: number, customWeights?: Record<string, number>) =>
    request<PrioritizationRunResponse>('/prioritization/run', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, custom_weights: customWeights })
    }),
  getLatestPrioritization: (projectId?: number) =>
    request<PrioritizationRunResponse>(`/prioritization/latest${projectId ? `?project_id=${projectId}` : ''}`),

  // Evidence Repository
  getEvidence: (projectId?: number, category?: string) => {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', String(projectId));
    if (category) params.append('category', category);
    const qs = params.toString();
    return request<EvidenceRecord[]>(`/evidence${qs ? `?${qs}` : ''}`);
  },
  createEvidence: (data: Partial<EvidenceRecord>) =>
    request<EvidenceRecord>('/evidence', { method: 'POST', body: JSON.stringify(data) }),

  // Elementary Reaction Pathways
  getPathways: (projectId?: number) =>
    request<Pathway[]>(`/pathways${projectId ? `?project_id=${projectId}` : ''}`),

  // Quantum Benchmarks (Jordan-Wigner VQE)
  runQuantumBenchmark: (data: QuantumBenchmarkRequest) =>
    request<QuantumBenchmarkResponse>('/quantum/benchmarks', { method: 'POST', body: JSON.stringify(data) }),
  getQuantumBenchmarks: (projectId?: number) =>
    request<QuantumBenchmarkResponse[]>(`/quantum/benchmarks${projectId ? `?project_id=${projectId}` : ''}`),

  // Fluorine Mass Balance & Stoichiometry
  calculateFluorineBalance: (data: FluorineBalanceCalculateRequest) =>
    request<FluorineBalanceCalculateResponse>('/fluorine-balance/calculate', { method: 'POST', body: JSON.stringify(data) }),
  createFluorineScenario: (data: any) =>
    request<FluorineScenario>('/fluorine-balance/scenarios', { method: 'POST', body: JSON.stringify(data) }),
  getFluorineScenarios: (projectId?: number) =>
    request<FluorineScenario[]>(`/fluorine-balance/scenarios${projectId ? `?project_id=${projectId}` : ''}`),

  // Research Insights Engine
  getInsights: (projectId?: number) =>
    request<ResearchInsight[]>(`/insights${projectId ? `?project_id=${projectId}` : ''}`),

  // PDF Dossier Reports (ReportLab Platypus)
  generateReport: (projectId: number, reportTitle?: string) =>
    request<ReportItem>('/reports', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, report_title: reportTitle })
    }),
  getReports: (projectId?: number) =>
    request<ReportItem[]>(`/reports${projectId ? `?project_id=${projectId}` : ''}`),
  getReportDownloadUrl: (reportId: number) =>
    `${customBaseUrl}/api/v1/reports/${reportId}/download`
};
