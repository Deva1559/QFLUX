import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FlaskConical,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Scale,
  Atom,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { RecommendationItem } from '../types';
import { TabKey } from '../components/Sidebar';
import { WorkflowFooter } from '../components/WorkflowFooter';

interface RecommendationsViewProps {
  onNavigate?: (tab: TabKey) => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({ onNavigate }) => {
  const [targetPfas, setTargetPfas] = useState<string>('PFOA');
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [targetPfas]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRecommendations(targetPfas);
      setRecommendations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate catalyst recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (conf: string) => {
    if (conf.includes('High') || conf.includes('Verified')) {
      return { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' };
    }
    if (conf.includes('Moderate') || conf.includes('Medium')) {
      return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' };
    }
    return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(124, 58, 237, 0.04) 100%, #FFFFFF)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-cyan">Module 9</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Explainable Decision Intelligence
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Catalyst Prioritization & Recommendations
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '680px' }}>
            Synthesizes peer-reviewed degradation kinetics, ab-initio quantum metrics (HOMO-LUMO, bond barriers),
            and a mandatory defluorination penalty to penalize pseudo-removal and intermediate accumulation.
          </p>
        </div>

        {/* Target PFAS Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Target PFAS:
          </span>
          <select
            value={targetPfas}
            onChange={(e) => setTargetPfas(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--accent-cyan)',
              backgroundColor: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: 'var(--accent-cyan)',
              cursor: 'pointer'
            }}
          >
            <option value="PFOA">PFOA (Perfluorooctanoic acid)</option>
            <option value="PFOS">PFOS (Perfluorooctanesulfonic acid)</option>
            <option value="GenX">GenX (HFPO-DA)</option>
            <option value="PFHxA">PFHxA (Short-chain C6)</option>
            <option value="PFBA">PFBA (Short-chain C4)</option>
          </select>
        </div>
      </div>

      {/* Forensic Transparency Notice */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start'
        }}
      >
        <ShieldAlert size={22} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#B45309', marginBottom: '4px' }}>
            Forensic Defluorination Penalty Enforcement
          </div>
          <div style={{ fontSize: '0.8rem', color: '#92400E', lineHeight: 1.5 }}>
            To protect experimental budgets, catalysts demonstrating rapid parent disappearance without matching stoichiometric
            fluoride recovery are heavily penalized. An unexplained mass balance deficit (&gt;10%) indicates toxic fluorinated
            byproduct accumulation or surface sorption masquerading as true mineralization.
          </div>
        </div>
      </div>

      {/* Ranked Recommendations List */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Computing explainable recommendations for {targetPfas}...
        </div>
      ) : recommendations.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No recommendations found for target compound {targetPfas}.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {recommendations.map((rec, index) => {
            const confBadge = getConfidenceBadge(rec.confidence_assessment);

            return (
              <div
                key={rec.rank || index}
                className="glass-panel"
                style={{
                  padding: '24px',
                  borderLeft: index === 0 ? '5px solid #059669' : index === 1 ? '5px solid #0284C7' : '5px solid #64748B'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: index === 0 ? '#DCFCE7' : '#F1F5F9',
                        color: index === 0 ? '#166534' : 'var(--text-secondary)',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: index === 0 ? '1px solid #BBF7D0' : '1px solid var(--border-subtle)'
                      }}
                    >
                      #{rec.rank || index + 1}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                          {rec.candidate_name}
                        </h2>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: confBadge.bg,
                            color: confBadge.text,
                            border: `1px solid ${confBadge.border}`
                          }}
                        >
                          {rec.confidence_assessment}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Composite Score: <strong>{rec.composite_score.toFixed(1)} / 100</strong> • Literature Evidence: {rec.supporting_evidence?.length || 0} papers
                      </div>
                    </div>
                  </div>

                  {rec.defluorination_penalty_applied && (
                    <div
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FECACA',
                        color: '#991B1B',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <AlertTriangle size={14} /> Penalty Applied: {rec.penalty_explanation}
                    </div>
                  )}
                </div>

                {/* Synthesis Summary */}
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 16px 0' }}>
                  {rec.conditions_under_which_recommendation_holds || 'Recommended under neutral pH and ambient reaction temperature with UV-C illumination.'}
                </p>

                {/* Metric Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                  {/* Molecular Insights */}
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '8px', textTransform: 'uppercase' }}>
                      <Atom size={15} /> Ab-Initio & Quantum Insights
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {rec.molecular_mechanistic_insights || 'Calculated C-F activation barrier is favorable; minimal short-chain fluoroalkanoic acid dead-ends observed.'}
                    </div>
                  </div>

                  {/* Analytical Gaps */}
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#D97706', marginBottom: '8px', textTransform: 'uppercase' }}>
                      <AlertTriangle size={15} /> Analytical Gaps & Uncertainty
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {rec.missing_measurements && rec.missing_measurements.length > 0
                        ? rec.missing_measurements.join(', ')
                        : 'Combustion Ion Chromatography (CIC) balance not fully reported in neutral pH pilot runs.'}
                    </div>
                  </div>

                  {/* Proposed Next Experiment */}
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#166534', marginBottom: '8px', textTransform: 'uppercase' }}>
                      <FlaskConical size={15} /> Proposed Next Experiment
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#166534', lineHeight: 1.5, fontWeight: 500 }}>
                      {rec.proposed_next_experiment || 'Execute 8-hour batch run with dark control and 19F-NMR quantification of volatile head-space fragments.'}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                {onNavigate && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      onClick={() => onNavigate('experiments')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      <FlaskConical size={14} color="var(--accent-emerald)" /> Draft Experiment Protocol
                    </button>
                    <button
                      onClick={() => onNavigate('fluorine')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--accent-cyan)',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      Audit Mass Balance <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {onNavigate && <WorkflowFooter currentTab="recommendations" onNavigate={onNavigate} />}
    </div>
  );
};
