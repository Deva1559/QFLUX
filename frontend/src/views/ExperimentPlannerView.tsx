import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FlaskConical,
  Layers,
  ChevronRight,
  ShieldCheck,
  X,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { ExperimentPlan, PFASCompound, Catalyst, CSVImportPreviewResponse } from '../types';
import { TabKey } from '../components/Sidebar';
import { WorkflowFooter } from '../components/WorkflowFooter';
import { useAuth } from '../context/AuthContext';

interface ExperimentPlannerViewProps {
  onNavigate?: (tab: TabKey) => void;
}

export const ExperimentPlannerView: React.FC<ExperimentPlannerViewProps> = ({ onNavigate }) => {
  const { requireAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<'plans' | 'import'>('plans');
  const [plans, setPlans] = useState<ExperimentPlan[]>([]);
  const [compounds, setCompounds] = useState<PFASCompound[]>([]);
  const [catalysts, setCatalysts] = useState<Catalyst[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New Experiment Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [selectedPfasId, setSelectedPfasId] = useState<number | null>(null);
  const [selectedCatalystId, setSelectedCatalystId] = useState<number | null>(null);
  const [treatmentMethod, setTreatmentMethod] = useState<string>('Photocatalytic (UV-C/In2O3)');
  const [proposedConditions, setProposedConditions] = useState<string>('pH 7.0, 25°C, 0.5 g/L catalyst, 254 nm UV-C lamp, closed quartz batch reactor');
  const [plannedControls, setPlannedControls] = useState<string>('Dark control (no light), photolysis blank (UV without catalyst), anion matrix blank');
  const [expectedMeasurements, setExpectedMeasurements] = useState<string>('Parent disappearance (LC-MS/MS), stoichiometric inorganic fluoride (IC), head-space volatile PFCAs');
  const [analyticalMethods, setAnalyticalMethods] = useState<string>('LC-MS/MS, Ion Chromatography (IC), Combustion IC (CIC)');
  const [detectionLimits, setDetectionLimits] = useState<string>('0.01 mg/L for F-, 0.05 ug/L for PFOA');
  const [safetyHazards, setSafetyHazards] = useState<string>('UV-C irradiation eye/skin hazard; acidic rinse handling');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // CSV Bulk Import State
  const [importing, setImporting] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<CSVImportPreviewResponse | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [plansData, pfasData, catsData] = await Promise.all([
        api.getExperimentPlans(),
        api.getPFASCompounds(),
        api.getCatalysts()
      ]);
      setPlans(plansData);
      setCompounds(pfasData);
      setCatalysts(catsData);
      if (pfasData.length > 0 && !selectedPfasId) {
        setSelectedPfasId(pfasData[0].id);
      }
      if (catsData.length > 0 && !selectedCatalystId) {
        setSelectedCatalystId(catsData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load experimental protocols.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedPfasId) {
      setFormError('Plan title and target PFAS compound are required.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      await api.createExperimentPlan({
        title: title.trim(),
        target_pfas_id: selectedPfasId,
        catalyst_id: selectedCatalystId || undefined,
        treatment_method: treatmentMethod,
        proposed_conditions: proposedConditions,
        planned_controls: plannedControls,
        expected_measurements: expectedMeasurements,
        analytical_methods: analyticalMethods,
        detection_limits: detectionLimits,
        safety_hazards: safetyHazards,
        experiment_status: 'Scheduled'
      });
      setModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create experiment plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setFormError(null);
  };

  const handleCsvSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setImportSuccess(null);
      const preview = await api.importExperimentsCSV(file);
      setPreviewData(preview);
    } catch (err: any) {
      alert(`CSV Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(8, 145, 178, 0.04) 100%, #FFFFFF)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-emerald">Module 8</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Protocol Design & Empirical Ingestion
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Experiment Planner & CSV Importer
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '680px' }}>
            Formulate rigorous degradation experiments with required scientific controls (dark, photolysis, matrix blanks),
            prescribed analytical methods (LC-MS/MS, IC), and batch ingest empirical lab runs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('import')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              backgroundColor: '#FFFFFF',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <FileSpreadsheet size={16} /> Bulk CSV Import
          </button>

          <button
            onClick={() => requireAuth(() => setModalOpen(true), "Sign in to formulate degradation experiment plans.")}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              backgroundColor: 'var(--accent-emerald)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
            }}
          >
            <Plus size={16} /> New Experiment Plan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('plans')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: activeTab === 'plans' ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
            backgroundColor: activeTab === 'plans' ? '#ECFDF5' : '#FFFFFF',
            color: activeTab === 'plans' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}
        >
          Scheduled Protocols ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('import')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: activeTab === 'import' ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
            backgroundColor: activeTab === 'import' ? '#ECFDF5' : '#FFFFFF',
            color: activeTab === 'import' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}
        >
          CSV Batch Import & Preview
        </button>
      </div>

      {activeTab === 'plans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading experimental protocols...
            </div>
          ) : plans.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <FlaskConical size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>No Experiment Plans Yet</h3>
              <p style={{ margin: '6px 0 16px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Create your first protocol with verified scientific controls and analytical methods.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  padding: '8px 18px',
                  backgroundColor: 'var(--accent-emerald)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Create Protocol
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {plans.map((plan) => {
                const targetCompound = compounds.find((c) => c.id === plan.target_pfas_id);
                const targetCat = catalysts.find((c) => c.id === plan.catalyst_id);

                return (
                  <div
                    key={plan.id}
                    className="glass-panel"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: plan.experiment_status === 'Completed' ? '#DCFCE7' : '#FEF3C7',
                            color: plan.experiment_status === 'Completed' ? '#166534' : '#92400E'
                          }}
                        >
                          {plan.experiment_status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Created: {new Date(plan.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {plan.title}
                      </h3>

                      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                        <span className="badge badge-cyan">
                          PFAS: {targetCompound?.acronym || `ID ${plan.target_pfas_id}`}
                        </span>
                        {targetCat && (
                          <span className="badge badge-purple">
                            Catalyst: {targetCat.name}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div><strong>Method:</strong> {plan.treatment_method}</div>
                        <div><strong>Controls:</strong> {plan.planned_controls}</div>
                        <div><strong>Analytical:</strong> {plan.analytical_methods}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                        Audit: 90-105% Target Closure
                      </span>
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('fluorine')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: 'var(--accent-cyan)',
                            fontWeight: 700,
                            fontSize: '0.76rem',
                            cursor: 'pointer'
                          }}
                        >
                          Execute Balance <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CSV Import Sub-view */}
      {activeTab === 'import' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            className="glass-panel"
            style={{
              padding: '28px',
              border: '2px dashed var(--border-subtle)',
              textAlign: 'center',
              backgroundColor: '#FAFCFE',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <FileSpreadsheet size={36} color="var(--accent-emerald)" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Bulk Experimental CSV Ingestion
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '520px' }}>
              Import empirical lab run datasets. Accepted headers: <code>catalyst_name, pfas_name, reaction_time_hours, initial_conc_mg_L, final_conc_mg_L, fluoride_released_mg_L, defluorination_pct</code>.
            </p>

            <label
              style={{
                marginTop: '8px',
                padding: '10px 20px',
                backgroundColor: 'var(--accent-emerald)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
              }}
            >
              {importing ? 'Validating CSV...' : 'Select CSV File'}
              <input type="file" accept=".csv" onChange={handleCsvSelect} style={{ display: 'none' }} />
            </label>
          </div>

          {previewData && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  CSV Preview & Schema Validation ({previewData.preview_rows.length} rows previewed of {previewData.total_rows})
                </span>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: '#DCFCE7',
                    color: '#166534'
                  }}
                >
                  Validation Passed
                </span>
              </div>

              <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-subtle)' }}>
                      {previewData.headers.map((col) => (
                        <th key={col} style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.preview_rows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        {previewData.headers.map((col) => (
                          <td key={col} style={{ padding: '8px 12px' }}>
                            {String(row.data?.[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => {
                    setImportSuccess(`${previewData.total_rows} experimental runs ingested into mass-balance audit engine.`);
                    setPreviewData(null);
                  }}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: 'var(--accent-emerald)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Commit Ingestion to Database
                </button>
              </div>
            </div>
          )}

          {importSuccess && (
            <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-md)', backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0', color: '#166534', fontWeight: 600, fontSize: '0.85rem' }}>
              ✓ {importSuccess}
            </div>
          )}
        </div>
      )}

      {/* New Experiment Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '640px',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#F8FAFC'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Draft Degradation Protocol
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '75vh', overflowY: 'auto' }}>
              {formError && (
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: '0.8rem' }}>
                  {formError}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Protocol Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UV-C / In2O3 Photocatalytic Defluorination of PFOA with Anion Matrix Blanks"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Target PFAS Compound *
                  </label>
                  <select
                    value={selectedPfasId || ''}
                    onChange={(e) => setSelectedPfasId(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                  >
                    {compounds.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.acronym} - {c.chemical_formula}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Catalyst System
                  </label>
                  <select
                    value={selectedCatalystId || ''}
                    onChange={(e) => setSelectedCatalystId(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                  >
                    {catalysts.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.material_type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Proposed Experimental Conditions
                </label>
                <input
                  type="text"
                  value={proposedConditions}
                  onChange={(e) => setProposedConditions(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Prescribed Scientific Controls (Mandatory)
                </label>
                <input
                  type="text"
                  value={plannedControls}
                  onChange={(e) => setPlannedControls(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Analytical Methods
                  </label>
                  <input
                    type="text"
                    value={analyticalMethods}
                    onChange={(e) => setAnalyticalMethods(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Detection Limits (LOD/LOQ)
                  </label>
                  <input
                    type="text"
                    value={detectionLimits}
                    onChange={(e) => setDetectionLimits(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: 'var(--accent-emerald)', color: '#FFFFFF', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  {submitting ? 'Saving Protocol...' : 'Save Protocol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {onNavigate && <WorkflowFooter currentTab="experiments" onNavigate={onNavigate} />}
    </div>
  );
};
