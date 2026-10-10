import React from 'react';
import { Atom, Database, Menu, X } from 'lucide-react';

interface NavbarProps {
  apiOnline: boolean;
  onRefreshHealth: () => void;
  onTriggerSeed: () => void;
  seeding: boolean;
  onToggleMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  apiOnline,
  onRefreshHealth,
  onTriggerSeed,
  seeding,
  onToggleMobileMenu,
  mobileMenuOpen
}) => {
  return (
    <header className="navbar-header">
      {/* Brand Identity & Mobile Hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="hamburger-btn"
            title="Toggle navigation"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--grad-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            flexShrink: 0
          }}
        >
          <Atom size={20} color="#FFFFFF" className="spin-slow" />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #0F172A 0%, #0284C7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Q-FLUX 2.0
            </span>
            <span className="badge badge-quantum" style={{ padding: '2px 8px', fontSize: '0.62rem' }}>
              RESEARCH
            </span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Quantum-Guided PFAS Workbench
          </div>
        </div>
      </div>

      {/* Center status pill (hidden on small viewports) */}
      <div className="navbar-contaminant-pill">
        <span style={{ color: 'var(--text-muted)' }}>Target:</span>
        <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>PFOA (C₈F₁₅O₂⁻)</span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span style={{ color: 'var(--text-muted)' }}>C-F Energy:</span>
        <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>~485 kJ/mol</span>
      </div>

      {/* Right Controls */}
      <div className="navbar-right-controls">
        {/* Backend Connectivity Status */}
        <div
          onClick={onRefreshHealth}
          title="Click to check backend connectivity"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '20px',
            background: apiOnline ? '#ECFDF5' : '#FFF1F2',
            border: `1px solid ${apiOnline ? '#A7F3D0' : '#FECDD3'}`,
            cursor: 'pointer'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: apiOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              boxShadow: apiOnline ? '0 0 6px rgba(5, 150, 105, 0.5)' : '0 0 6px rgba(225, 29, 72, 0.5)',
              flexShrink: 0
            }}
          />
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: apiOnline ? '#047857' : '#BE123C'
            }}
          >
            {apiOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Repository Sync Trigger */}
        <button
          onClick={onTriggerSeed}
          disabled={seeding || !apiOnline}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '6px' }}
          title="Synchronize peer-reviewed literature repository"
        >
          <Database size={13} className={seeding ? 'spin-slow' : ''} />
          <span className="btn-text-full">{seeding ? 'Synchronizing...' : 'Sync Repository'}</span>
        </button>
      </div>
    </header>
  );
};
