import React, { useEffect, useState } from 'react';
import {
  Sliders,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  ShieldAlert,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { PrioritizationRunResponse, PrioritizationRankingItem } from '../types';
import { TabKey } from '../components/Sidebar';
import { WorkflowFooter } from '../components/WorkflowFooter';

interface PrioritizationViewProps {
  onNavigate?: (tab: TabKey) => void;
}

export const PrioritizationView: React.FC<PrioritizationViewProps> = ({ onNavigate }) => {
  const [data, setData] = useState<PrioritizationRunResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<PrioritizationRankingItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Weights state (normalized 0.0 - 1.0)
  const [weights, setWeights] = useState<Record<string, number>>({
    defluorination: 0.25,
    parent_removal: 0.15,
    byproduct_safety: 0.15,
    mechanism_evidence: 0.10,
    catalyst_stability: 0.10,
    energy_feasibility: 0.10,
    evidence_completeness: 0.15
  });

  const fetchLatest = async () => {
    setLoading(true);
    try {
      const res = await api.getLatestPrioritization();
      setData(res);
      if (res.rankings && res.rankings.length > 0) {
        setSelectedCandidate(res.rankings[0]);
      }
      if (res.weights) {
        setWeights(res.weights);
      }
    } catch (err) {
      console.error('Failed to load prioritization', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatest();
  }, []);

  const handleRunPrioritization = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await api.runPrioritization(undefined, weights);
      setData(res);
      if (res.rankings && res.rankings.length > 0) {
        setSelectedCandidate(res.rankings[0]);
      }
    } catch (err: any) {
      setError(`Prioritization calculation error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const adjustWeight = (dim: string, delta: number) => {
    setWeights((prev) => {
      const current = prev[dim] || 0.1;
      const updated = Math.max(0.0, Math.min(1.0, parseFloat((current + delta).toFixed(2))));
      return { ...prev, [dim]: updated };
    });
  };

  const getStatusBadge = (status?: string, category?: string) => {
    const text = status || category || 'Evaluated';
    if (text.includes('Evidence-supported')) {
      return <span className="badge badge-verified">{text}</span>;
    }
    if (text.includes('Promising')) {
      return <span className="badge badge-hypothetical">{text}</span>;
    }
    if (text.includes('Insufficient') || text.includes('Missing')) {
      return <span className="badge badge-warning">{text}</span>;
    }
    return <span className="badge badge-quantum">{text}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className="view-heading">10-Dimension Catalyst Prioritization</h1>
            <span className="badge badge-hypothetical">10-D MCDA Engine</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
            Multi-criteria decision analysis (MCDA) enforcing a mandatory penalty for missing defluorination, paired with ±20% weight-shift sensitivity analysis.
          </p>
        </div>

        <button
          onClick={handleRunPrioritization}
          disabled={running}
          className="btn btn-primary"
          style={{ padding: '9px 18px' }}
        >
          {running ? (
            <>
              <RotateCw size={15} className="spin-slow" /> Recalculating...
            </>
          ) : (
            <>
              <Sliders size={15} /> Recalculate Rankings & Sensitivity
            </>
          )}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: '#FFF1F2',
            border: '1px solid #FECDD3',
            color: '#9F1239',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <RotateCw size={28} className="spin-slow" style={{ margin: '0 auto 12px auto' }} />
          <div>Running prioritization algorithms...</div>
        </div>
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Robustness & Sensitivity Box */}
          {data.sensitivity_analysis && (
            <div
              className="glass-panel"
              style={{
                padding: 'clamp(16px, 3vw, 22px)',
                border: '1px solid #A7F3D0',
                background: 'linear-gradient(90deg, #ECFDF5 0%, #F0FDF4 100%)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#065F46', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <TrendingUp size={17} color="var(--accent-emerald)" />
                  <span>Robustness & Sensitivity Analysis (±20% Weight Shift)</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700 }}>
                  Ranking Stability: {data.sensitivity_analysis.ranking_stability}
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                {data.sensitivity_analysis.advice}
              </p>
            </div>
          )}

          {/* Main Responsive Layout: Rankings List + Selected Candidate Breakdown & Sliders */}
          <div className="responsive-prioritization-layout">
            {/* Left: Ranked Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Prioritized Candidate Standings
              </h3>

              {data.rankings.map((cand) => {
                const isSelected = selectedCandidate?.catalyst_id === cand.catalyst_id;
                const scoreDisplay = cand.composite_score > 1 ? cand.composite_score.toFixed(1) : (cand.composite_score * 100).toFixed(1);

                return (
                  <div
                    key={cand.catalyst_id}
                    onClick={() => setSelectedCandidate(cand)}
                    className="glass-panel"
                    style={{
                      padding: 'clamp(14px, 2.5vw, 18px)',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                      boxShadow: isSelected ? '0 0 16px rgba(8, 145, 178, 0.15)' : 'var(--shadow-sm)',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '10px',
                            background: cand.rank === 1 ? '#D1FAE5' : 'var(--bg-surface)',
                            color: cand.rank === 1 ? '#047857' : 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            flexShrink: 0
                          }}
                        >
                          #{cand.rank}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{cand.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {cand.material_type} • Target: {cand.target_pfas || 'PFOA'}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                          {scoreDisplay}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>Score / 100</div>
                      </div>
                    </div>

                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      {getStatusBadge(cand.status, cand.category)}

                      {cand.missing_defluorination_penalty_applied && (
                        <span className="badge badge-warning" style={{ fontSize: '0.62rem' }}>
                          ⚠️ Defluorination Penalty Applied
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
                      {cand.primary_rationale || 'Evaluated against multi-criteria decision matrix.'}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Right: Selected Candidate Detail & Interactive Weight Adjusters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>
              {selectedCandidate && (
                <div className="glass-panel" style={{ padding: 'clamp(18px, 3vw, 24px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Dimension Breakdown
                    </h3>
                    <span className="badge badge-cyan">#{selectedCandidate.rank} {selectedCandidate.name.split(' ')[0]}</span>
                  </div>

                  {/* Progress bars for dimensions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                    {Object.entries(selectedCandidate.dimension_scores || {}).map(([dim, score]) => {
                      const pct = score > 1 ? score : score * 100;
                      const norm = score > 1 ? score / 100 : score;
                      const fillColor = norm < 0.4 ? 'var(--accent-rose)' : norm > 0.75 ? 'var(--accent-emerald)' : 'var(--accent-blue)';

                      return (
                        <div key={dim}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '3px' }}>
                            <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize', fontWeight: 600 }}>
                              {dim.replace(/_/g, ' ')}
                            </span>
                            <span className="mono" style={{ fontWeight: 700, color: fillColor }}>
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                          <div style={{ height: '6px', width: '100%', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(100, Math.max(0, pct))}%`,
                                backgroundColor: fillColor,
                                borderRadius: '3px',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottlenecks Card */}
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: '#FFF1F2',
                      border: '1px solid #FECDD3',
                      fontSize: '0.78rem',
                      color: '#9F1239'
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px', color: '#BE123C' }}>
                      <AlertTriangle size={14} /> Key Literature Bottlenecks:
                    </div>
                    <div>{selectedCandidate.limitations || 'No major bottlenecks recorded.'}</div>
                  </div>
                </div>
              )}

              {/* Weight Controls */}
              <div className="glass-panel" style={{ padding: 'clamp(18px, 3vw, 24px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Criteria Weights
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Normalized sum</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(weights).map(([dim, val]) => (
                    <div
                      key={dim}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}
                    >
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', textTransform: 'capitalize', fontWeight: 600 }}>
                        {dim.replace(/_/g, ' ')}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => adjustWeight(dim, -0.05)}
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '4px',
                            background: '#FFFFFF',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          −
                        </button>
                        <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-cyan)', minWidth: '36px', textAlign: 'center' }}>
                          {(val * 100).toFixed(0)}%
                        </span>
                        <button
                          onClick={() => adjustWeight(dim, 0.05)}
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '4px',
                            background: '#FFFFFF',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {onNavigate && <WorkflowFooter currentTab="prioritization" onNavigate={onNavigate} />}
    </div>
  );
};
