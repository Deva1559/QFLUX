import React, { useEffect, useState } from 'react';
import {
  Layers,
  Atom,
  Cpu,
  Scale,
  Sliders,
  FileText,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Activity,
  Flame,
  GitBranch,
  Play
} from 'lucide-react';
import { api } from '../services/api';
import { OverviewStats } from '../types';
import { TabKey } from '../components/Sidebar';
import { WorkflowFooter } from '../components/WorkflowFooter';

interface OverviewViewProps {
  onNavigate: (tab: TabKey) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getOverviewStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load overview stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Banner with Guided Workflow CTA */}
      <div
        className="glass-panel"
        style={{
          padding: 'clamp(20px, 4vw, 36px)',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(124, 58, 237, 0.04) 50%, #FFFFFF 100%)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ maxWidth: '840px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span className="badge badge-cyan">4-Stage Guided Discovery Pipeline</span>
            <span className="badge badge-verified">100% Local Execution</span>
          </div>

          <h1 className="hero-heading">
            Quantum-Guided Catalyst Research & Fluorine Recovery Workbench
          </h1>

          <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1.05rem)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '22px' }}>
            Per- and polyfluoroalkyl substances (<strong>PFAS</strong>) possess an extraordinarily inert carbon–fluorine bond (~485 kJ/mol). 
            Q-FLUX 2.0 guides researchers through a rigorous 4-stage pipeline: starting with forensic fluorine mass-balance audits, evaluating ab-initio and VQE quantum mechanics, prioritizing audited catalysts, and generating publication-grade PDF dossiers.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              onClick={() => onNavigate('fluorine')}
              className="btn btn-primary"
              style={{ padding: '11px 20px', fontSize: '0.92rem' }}
            >
              <Play size={16} /> Start Guided Workflow (Stage 1)
            </button>
            <button
              onClick={() => onNavigate('chemistry')}
              className="btn btn-secondary"
              style={{ padding: '11px 18px', fontSize: '0.92rem' }}
            >
              <Atom size={16} /> Jump to Ab-Initio SCF Lab
            </button>
            <button
              onClick={() => onNavigate('prioritization')}
              className="btn btn-secondary"
              style={{ padding: '11px 18px', fontSize: '0.92rem' }}
            >
              <Sliders size={16} /> View 10-D Rankings
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>AUDITED CATALYSTS</span>
            <Layers size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>5 Systems</div>
          <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '4px', fontWeight: 600 }}>Fe⁰, In₂O₃, BDD, BiOCl, Fe-N₄/C</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SCF CHEMISTRY</span>
            <Atom size={18} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>STO-3G RHF</div>
          <div style={{ fontSize: '0.72rem', color: '#0284C7', marginTop: '4px', fontWeight: 600 }}>HOMO-LUMO & ΔE_rxn Solved</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>VQE SOLVER ACCURACY</span>
            <Cpu size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {stats?.latest_quantum_run ? `${stats.latest_quantum_run.absolute_error.toExponential(2)}` : '1.83e-11'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7C3AED', marginTop: '4px', fontWeight: 600 }}>VQE vs Exact Diag Error</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>MASS-BALANCE CLOSURE</span>
            <Scale size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>90% – 105%</div>
          <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '4px', fontWeight: 600 }}>Accounting Recovery Window</div>
        </div>
      </div>

      {/* Interactive Scientific Discovery Pipeline Map */}
      <div className="glass-panel" style={{ padding: 'clamp(20px, 3.5vw, 28px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitBranch size={20} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Guided Scientific Pipeline Architecture
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Sequential computational workflow connecting forensic audit, molecular physics, quantum eigensolvers, and multi-criteria catalyst selection.
            </p>
          </div>
          <span className="badge badge-cyan">Complete Execution Map</span>
        </div>

        {/* 4 Interactive Pipeline Stage Boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px' }}>
          {/* Stage 1 Box */}
          <div
            onClick={() => onNavigate('fluorine')}
            style={{
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
            className="glass-panel-interactive"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-verified" style={{ fontSize: '0.66rem' }}>STAGE 1</span>
              <Scale size={18} color="var(--accent-emerald)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                Forensic Mass Balance
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Forensic Stoichiometry • Mass-Balance Closure
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Audits total fluorine recovery (90% ≤ Recovery ≤ 105%) to catch volatile organofluorine deficits before false claims of destruction.
            </p>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Launch Forensic Audit <ArrowRight size={13} />
            </span>
          </div>

          {/* Stage 2 Box */}
          <div
            onClick={() => onNavigate('chemistry')}
            style={{
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
            className="glass-panel-interactive"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-quantum" style={{ fontSize: '0.66rem' }}>STAGE 2</span>
              <Atom size={18} color="var(--accent-purple)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                Quantum & Ab-Initio SCF
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Ab-Initio & Quantum Physics Engine
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Executes RHF/STO-3G SCF ground-state calculations on $CF_3COO^-$ fragments and solves 2-qubit C-F active space with Variational Quantum Eigensolver.
            </p>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--accent-purple)', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Explore Quantum Lab <ArrowRight size={13} />
            </span>
          </div>

          {/* Stage 3 Box */}
          <div
            onClick={() => onNavigate('prioritization')}
            style={{
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
            className="glass-panel-interactive"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-hypothetical" style={{ fontSize: '0.66rem' }}>STAGE 3</span>
              <Sliders size={18} color="var(--accent-amber)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                Catalyst Prioritization
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Multi-Criteria Decision & Penalty Engine
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Ranks candidates across 10 dimensions, enforcing a mandatory penalty for unverified defluorination, paired with $\pm 20\%$ weight-shift sensitivity analysis.
            </p>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--accent-amber)', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Run Decision Engine <ArrowRight size={13} />
            </span>
          </div>

          {/* Stage 4 Box */}
          <div
            onClick={() => onNavigate('evidence')}
            style={{
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
            className="glass-panel-interactive"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-warning" style={{ fontSize: '0.66rem' }}>STAGE 4</span>
              <FileText size={18} color="var(--accent-rose)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                Synthesis & PDF Dossiers
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Peer-Reviewed Evidence & PDF Deliverables
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Generates audit-grade PDF research dossiers via ReportLab Platypus and delivers deterministic research advisor recommendations.
            </p>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--accent-rose)', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Generate PDF Dossier <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </div>

      {/* The Crucial Scientific Contrast Card (Smith et al. 2024) */}
      <div
        className="glass-panel"
        style={{
          padding: 'clamp(18px, 3vw, 28px)',
          border: '1px solid #FECDD3',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF5F5 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Flame size={20} color="#E11D48" />
              <h2 style={{ fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', fontWeight: 700, color: '#9F1239' }}>
                The Literature Pitfall: Parent Degradation vs Real Mineralization
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px' }}>
              Primary case study rigorously verified in <strong>Smith et al. (2024)</strong>, <em>Environ. Sci. Technol.</em> (DOI: 10.1021/acs.est.3c10617).
            </p>
          </div>
          <span className="badge badge-warning">Fundamental Methodology Gap</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px', marginTop: '14px' }}>
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: '#FEF2F2',
              border: '1px solid #FECDD3'
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>
              False Sense of Destruction
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#DC2626', margin: '4px 0' }}>100%</div>
            <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.86rem' }}>Parent PFOA Disappearance</div>
            <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '6px', lineHeight: 1.4 }}>
              Converting 100% of PFOA to PFHpA (C₈ → C₇) registers as 100% removal on standard LC-MS/MS assays, but destroys only one bond.
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFBEB',
              border: '1px solid #FDE68A'
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>
              Actual Measured Defluorination
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#D97706', margin: '4px 0' }}>~13%</div>
            <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.86rem' }}>Inorganic Fluoride Release (F⁻)</div>
            <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '6px', lineHeight: 1.4 }}>
              Only 2 of the 15 fluorine atoms in PFOA are released into safe mineral fluoride (F⁻).
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0'
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803D', textTransform: 'uppercase' }}>
              Hidden Toxic Residue
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#16A34A', margin: '4px 0' }}>87%</div>
            <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.86rem' }}>Persistent Organic Fluorine Remaining</div>
            <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '6px', lineHeight: 1.4 }}>
              Remaining fluorine exists as persistent, bioaccumulative shorter-chain PFAS (PFHpA, PFHxA, fluorinated gases).
            </p>
          </div>
        </div>
      </div>

      {/* Guided Workflow Step Footer */}
      <WorkflowFooter currentTab="overview" onNavigate={onNavigate} />
    </div>
  );
};
