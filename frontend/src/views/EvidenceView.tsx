import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  RotateCw,
  Plus,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import { EvidenceRecord, ResearchInsight, ReportItem } from '../types';
import { TabKey } from '../components/Sidebar';
import { WorkflowFooter } from '../components/WorkflowFooter';

interface EvidenceViewProps {
  onNavigate?: (tab: TabKey) => void;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'evidence' | 'insights'>('reports');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [insights, setInsights] = useState<ResearchInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reps, evs, ins] = await Promise.all([
        api.getReports(1),
        api.getEvidence(1),
        api.getInsights(1)
      ]);
      setReports(reps);
      setEvidence(evs);
      setInsights(ins);
    } catch (err) {
      console.error('Failed to load evidence data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateReport = async () => {
    setGenerating(true);
    setFeedback(null);
    try {
      const newRep = await api.generateReport(1, 'Q-FLUX 2.0 Comprehensive PFAS Research Dossier');
      setReports((prev) => [newRep, ...prev]);
      setFeedback({ type: 'success', message: 'Publication-grade Platypus PDF Dossier compiled successfully! Download available below.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Report compilation error: ${err.message}` });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className="view-heading">Evidence & Publication PDF Dossiers</h1>
            <span className="badge badge-warning">Publication Governance</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
            Automated PDF dossier compilation using ReportLab Platypus, literature provenance repository, and deterministic research advisor rules.
          </p>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="btn btn-primary"
          style={{ padding: '9px 18px', flexShrink: 0 }}
        >
          {generating ? (
            <>
              <RotateCw size={15} className="spin-slow" /> Compiling PDF Dossier...
            </>
          ) : (
            <>
              <FileText size={15} /> Compile Platypus PDF Dossier
            </>
          )}
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: feedback.type === 'success' ? '#ECFDF5' : '#FFF1F2',
            border: `1.5px solid ${feedback.type === 'success' ? '#A7F3D0' : '#FECDD3'}`,
            color: feedback.type === 'success' ? '#065F46' : '#9F1239',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'slideUp 0.2s ease'
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Sub Tabs (Scrollable on small viewports) */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
        <button
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '7px 14px',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'reports' ? '#E0F2FE' : '#FFFFFF',
            border: activeTab === 'reports' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
            color: activeTab === 'reports' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          📑 Generated PDF Dossiers ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          style={{
            padding: '7px 14px',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'evidence' ? '#E0F2FE' : '#FFFFFF',
            border: activeTab === 'evidence' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
            color: activeTab === 'evidence' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          📚 Literature Repository ({evidence.length})
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          style={{
            padding: '7px 14px',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'insights' ? '#E0F2FE' : '#FFFFFF',
            border: activeTab === 'insights' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
            color: activeTab === 'insights' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          💡 Research Advisor Insights ({insights.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <RotateCw size={28} className="spin-slow" style={{ margin: '0 auto 12px auto' }} />
          <div>Loading research dossier assets...</div>
        </div>
      ) : activeTab === 'reports' ? (
        /* PDF Reports Tab */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '16px' }}>
          {reports.map((rep) => (
            <div key={rep.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} color="#E11D48" />
                </div>
                <span className="badge badge-verified">Platypus PDF</span>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{rep.report_title}</h3>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Generated: {new Date(rep.generated_at).toLocaleString()} • {(rep.file_size_bytes / 1024).toFixed(1)} KB
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                <a
                  href={api.getReportDownloadUrl(rep.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ width: '100%', textDecoration: 'none', padding: '8px 12px', fontSize: '0.8rem' }}
                >
                  <Download size={14} /> Download PDF Dossier
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'evidence' ? (
        /* Literature Repository Tab */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '16px' }}>
          {evidence.map((ev) => {
            const gap =
              ev.parent_removal_pct !== undefined && ev.defluorination_pct !== undefined
                ? ev.parent_removal_pct - ev.defluorination_pct
                : null;

            return (
              <div key={ev.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ev.study_title}</h3>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {ev.authors} ({ev.publication_year}) • Target: {ev.compound_name}
                    </div>
                  </div>
                  <span className={`badge ${ev.verification_status.includes('Verified') ? 'badge-verified' : 'badge-hypothetical'}`}>
                    {ev.verification_status}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 80px), 1fr))',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>PARENT LOSS</div>
                    <div style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '1.05rem' }}>
                      {ev.parent_removal_pct !== undefined ? `${ev.parent_removal_pct}%` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>DEFLUORINATION</div>
                    <div style={{ fontWeight: 800, color: ev.defluorination_pct ? '#059669' : '#E11D48', fontSize: '1.05rem' }}>
                      {ev.defluorination_pct !== undefined && ev.defluorination_pct !== null
                        ? `${ev.defluorination_pct}%`
                        : 'MISSING'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>DEFICIT GAP</div>
                    <div style={{ fontWeight: 800, color: gap && gap > 30 ? '#D97706' : 'var(--text-primary)', fontSize: '1.05rem' }}>
                      {gap !== null ? `${gap.toFixed(0)}%` : 'N/A'}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Conditions: </strong> {ev.reaction_conditions}
                </div>

                {ev.doi_or_url && (
                  <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                    <a
                      href={ev.doi_or_url.startsWith('http') ? ev.doi_or_url : `https://doi.org/${ev.doi_or_url}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                    >
                      Primary Publication Source <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Research Advisor Insights Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {insights.map((ins, idx) => (
            <div
              key={ins.id || idx}
              className="glass-panel"
              style={{
                padding: '18px 20px',
                borderLeft: ins.severity === 'Warning' || ins.severity === 'Critical'
                  ? '4px solid var(--accent-rose)'
                  : '4px solid var(--accent-cyan)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{ins.title}</div>
                <span className={`badge ${ins.severity === 'Critical' || ins.severity === 'Warning' ? 'badge-warning' : 'badge-cyan'}`}>
                  Rule {ins.rule_id} • {ins.severity}
                </span>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--accent-cyan)' }}>Recommended Action: </strong>
                {ins.recommended_action}
              </div>

              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <strong>Remaining Scientific Uncertainty: </strong>
                {ins.remaining_uncertainty}
              </div>
            </div>
          ))}
        </div>
      )}

      {onNavigate && <WorkflowFooter currentTab="evidence" onNavigate={onNavigate} />}
    </div>
  );
};
