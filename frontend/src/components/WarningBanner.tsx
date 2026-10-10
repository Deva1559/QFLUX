import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export const WarningBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #FFFBEB 0%, #FEF2F2 100%)',
        border: '1px solid #FDE68A',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 18px',
        marginBottom: '20px',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: '1 1 280px', minWidth: 0 }}>
          <div
            style={{
              background: '#FEF3C7',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              color: '#D97706',
              flexShrink: 0
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#B45309', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>SCIENTIFIC GOVERNANCE: PFAS DEGRADATION ≠ DEFLUORINATION</span>
              <span className="badge badge-warning" style={{ fontSize: '0.62rem' }}>Smith et al. 2024 Audit</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '3px', lineHeight: 1.4 }}>
              Converting 100% of PFOA to PFHpA yields 100% parent loss, but only ~13% defluorination and 0% carbon mineralization. Q-FLUX enforces mathematical fluorine mass-balance closure.
            </div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="btn btn-secondary"
          style={{ padding: '6px 10px', fontSize: '0.75rem', height: 'fit-content', flexShrink: 0, marginTop: '2px' }}
        >
          {expanded ? (
            <>Less <ChevronUp size={13} /></>
          ) : (
            <>Methodology Disclosure <ChevronDown size={13} /></>
          )}
        </button>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #FDE68A',
            fontSize: '0.78rem',
            color: '#475569',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px'
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: '3px' }}>
              🔬 Computational Model Scope
            </div>
            <p>
              Classical RHF/STO-3G and 2-qubit Jordan-Wigner VQE algorithms validate algorithmic workflows and relative energy orderings for active-space models. They do not constitute wet-lab experimental proof of complete mineralization.
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: '3px' }}>
              ⚖️ Mandatory Defluorination Penalty
            </div>
            <p>
              Candidates lacking empirical fluoride release data are marked unrankable in the 10-D Prioritization Engine to eliminate false claims of destructive efficacy.
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: '3px' }}>
              📖 Primary Evidence Citation
            </div>
            <p>
              Smith et al. (2024), <em>Environ. Sci. Technol.</em>, DOI:{' '}
              <a
                href="https://doi.org/10.1021/acs.est.3c10617"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
              >
                10.1021/acs.est.3c10617 <ExternalLink size={11} />
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
