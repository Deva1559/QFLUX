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

// Default development backend URL
// On Android emulator, localhost is 10.0.2.2
// On web / physical device, use host IP or localhost
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

  // Catalysts (Q-FLUX 2.0 Core Module A)
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

  // Molecular Chemistry (Q-FLUX 2.0 Core Module C)
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

  // Prioritization & Sensitivity (Q-FLUX 2.0 Core Module E)
  runPrioritization: (projectId?: number, customWeights?: Record<string, number>) =>
    request<PrioritizationRunResponse>('/prioritization/run', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, custom_weights: customWeights })
    }),
  getLatestPrioritization: (projectId?: number) =>
    request<PrioritizationRunResponse>(`/prioritization/latest${projectId ? `?project_id=${projectId}` : ''}`),

  // Evidence
  getEvidence: (projectId?: number, category?: string) => {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', String(projectId));
    if (category) params.append('category', category);
    const qs = params.toString();
    return request<EvidenceRecord[]>(`/evidence${qs ? `?${qs}` : ''}`);
  },
  createEvidence: (data: Partial<EvidenceRecord>) =>
    request<EvidenceRecord>('/evidence', { method: 'POST', body: JSON.stringify(data) }),

  // Pathways
  getPathways: (projectId?: number) =>
    request<Pathway[]>(`/pathways${projectId ? `?project_id=${projectId}` : ''}`),

  // Quantum Benchmarks (Q-FLUX 2.0 Core Module D)
  runQuantumBenchmark: (data: QuantumBenchmarkRequest) =>
    request<QuantumBenchmarkResponse>('/quantum/benchmarks', { method: 'POST', body: JSON.stringify(data) }),
  getQuantumBenchmarks: (projectId?: number) =>
    request<QuantumBenchmarkResponse[]>(`/quantum/benchmarks${projectId ? `?project_id=${projectId}` : ''}`),

  // Fluorine Balance
  calculateFluorineBalance: (data: FluorineBalanceCalculateRequest) =>
    request<FluorineBalanceCalculateResponse>('/fluorine-balance/calculate', { method: 'POST', body: JSON.stringify(data) }),
  createFluorineScenario: (data: any) =>
    request<FluorineScenario>('/fluorine-balance/scenarios', { method: 'POST', body: JSON.stringify(data) }),
  getFluorineScenarios: (projectId?: number) =>
    request<FluorineScenario[]>(`/fluorine-balance/scenarios${projectId ? `?project_id=${projectId}` : ''}`),

  // Research Insights
  getInsights: (projectId?: number) =>
    request<ResearchInsight[]>(`/insights${projectId ? `?project_id=${projectId}` : ''}`),

  // Reports
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

