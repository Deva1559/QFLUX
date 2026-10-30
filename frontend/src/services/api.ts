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
  PrioritizationRunResponse,
  PFASCompound,
  UploadedDocument,
  CandidateClaim,
  LiteratureQueryResponse,
  CSVImportPreviewResponse,
  ExperimentPlan,
  RecommendationItem,
  CalculationJob
} from '../types';

let customBaseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000';

export const setApiBaseUrl = (url: string) => {
  customBaseUrl = url.replace(/\/+$/, '');
};

export const getApiBaseUrl = () => customBaseUrl;

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem('qflux_auth_token') || localStorage.getItem('qflux_token');
  } catch {
    return null;
  }
};

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const url = `${customBaseUrl}/api/v1${path}`;
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options?.headers as Record<string, string> || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch (_) { }
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('qflux:unauthorized', { detail: errorDetail }));
    }
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
    `${customBaseUrl}/api/v1/reports/${reportId}/download`,
  getReportCsvUrl: (projectId: number = 1) =>
    `${customBaseUrl}/api/v1/reports/export/csv?project_id=${projectId}`,

  // PFAS Knowledge Base (Enhancement 1)
  getPFASCompounds: (search?: string, minCarbons?: number, maxCarbons?: number) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (minCarbons) params.append('min_carbons', String(minCarbons));
    if (maxCarbons) params.append('max_carbons', String(maxCarbons));
    const qs = params.toString();
    return request<PFASCompound[]>(`/pfas${qs ? `?${qs}` : ''}`);
  },
  getPFASCompound: (id: number) => request<PFASCompound>(`/pfas/${id}`),
  createPFASCompound: (data: Partial<PFASCompound>) =>
    request<PFASCompound>('/pfas', { method: 'POST', body: JSON.stringify(data) }),
  deletePFASCompound: (id: number) =>
    request<{ status: string; message: string }>(`/pfas/${id}`, { method: 'DELETE' }),

  // AI Literature Assistant (Enhancement 2)
  getDocuments: (projectId?: number) =>
    request<UploadedDocument[]>(`/literature/documents${projectId ? `?project_id=${projectId}` : ''}`),
  getDocument: (id: number) =>
    request<UploadedDocument>(`/literature/documents/${id}`),
  uploadDocument: async (file: File, projectId?: number): Promise<UploadedDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) formData.append('project_id', String(projectId));
    const url = `${customBaseUrl}/api/v1/literature/upload`;
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', body: formData, headers });
    if (!res.ok) {
      let msg = `Upload failed: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) msg = errJson.detail;
      } catch (_) { }
      throw new Error(msg);
    }
    return res.json();
  },
  getLiteratureClaims: (params?: { document_id?: number; status?: string; claim_type?: string; limit?: number; offset?: number }) => {
    const sp = new URLSearchParams();
    if (params?.document_id) sp.append('document_id', String(params.document_id));
    if (params?.status) sp.append('status', params.status);
    if (params?.claim_type) sp.append('claim_type', params.claim_type);
    if (params?.limit) sp.append('limit', String(params.limit));
    if (params?.offset) sp.append('offset', String(params.offset));
    const qs = sp.toString();
    return request<CandidateClaim[]>(`/literature/claims${qs ? `?${qs}` : ''}`);
  },
  getLiteratureClaim: (claimId: number) =>
    request<CandidateClaim>(`/literature/claims/${claimId}`),
  verifyClaim: (claimId: number, status: 'verified' | 'rejected', notes?: string) =>
    request<CandidateClaim>(`/literature/claims/${claimId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ verification_status: status, reviewer_notes: notes })
    }),
  queryLiterature: (query: string, targetPfas?: string) =>
    request<LiteratureQueryResponse>('/literature/query', {
      method: 'POST',
      body: JSON.stringify({ query, target_pfas: targetPfas })
    }),
  getCsvTemplateUrl: () => `${customBaseUrl}/api/v1/literature/csv-template`,

  // Experiment Planning (Enhancement 8)
  getExperimentPlans: (projectId?: number, status?: string) => {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', String(projectId));
    if (status) params.append('status', status);
    const qs = params.toString();
    return request<ExperimentPlan[]>(`/experiments/plans${qs ? `?${qs}` : ''}`);
  },
  createExperimentPlan: (data: Partial<ExperimentPlan>) =>
    request<ExperimentPlan>('/experiments/plans', { method: 'POST', body: JSON.stringify(data) }),
  importExperimentsCSV: async (file: File): Promise<CSVImportPreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const url = `${customBaseUrl}/api/v1/experiments/import-csv`;
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', body: formData, headers });
    if (!res.ok) {
      let msg = `CSV import failed: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) msg = errJson.detail;
      } catch (_) { }
      if (res.status === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('qflux:unauthorized', { detail: msg }));
      }
      throw new Error(msg);
    }
    return res.json();
  },
  updateExperimentPlan: (id: number, data: Partial<ExperimentPlan>) =>
    request<ExperimentPlan>(`/experiments/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExperimentPlan: (id: number) =>
    request<{ status: string; message: string }>(`/experiments/plans/${id}`, { method: 'DELETE' }),

  // Transparent Recommendations (Enhancement 7)
  getRecommendations: (targetPfas: string = 'PFOA', projectId?: number) => {
    const params = new URLSearchParams();
    params.append('target_pfas', targetPfas);
    if (projectId) params.append('project_id', String(projectId));
    return request<RecommendationItem[]>(`/recommendations?${params.toString()}`);
  },

  // Calculation Jobs (Enhancement 4 & 5)
  getCalculationJobs: (projectId?: number, status?: string) => {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', String(projectId));
    if (status) params.append('status', status);
    const qs = params.toString();
    return request<CalculationJob[]>(`/jobs${qs ? `?${qs}` : ''}`);
  },
  submitCalculationJob: (data: { job_type: 'scf_classical' | 'vqe_quantum'; input_params: Record<string, any>; project_id?: number }) =>
    request<CalculationJob>('/jobs', { method: 'POST', body: JSON.stringify(data) }),
  cancelCalculationJob: (jobId: number) =>
    request<CalculationJob>(`/jobs/${jobId}/cancel`, { method: 'POST' }),

  // Backup (Enhancement 9)
  backupDatabase: () =>
    request<{ status: string; backup_file: string; file_size_bytes: number; restore_instruction: string }>('/settings/backup', { method: 'POST' }),

  // Authentication & Security (Enhancement 10)
  setAuthToken: (token: string | null) => {
    if (token) {
      localStorage.setItem('qflux_auth_token', token);
    } else {
      localStorage.removeItem('qflux_auth_token');
      localStorage.removeItem('qflux_token');
    }
  },
  getAuthToken: () => getStoredToken(),
  login: async (email: string, password: string) => {
    const res = await request<{ access_token: string; token_type: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.access_token) {
      api.setAuthToken(res.access_token);
    }
    return res;
  },
  register: (email: string, password: string, fullName: string, role?: string) =>
    request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName, role: role || 'Researcher' })
    }),
  getCurrentUser: () => request<any>('/auth/me')
};
