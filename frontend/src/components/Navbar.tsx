import React from 'react';
import { Atom, Database, Menu, X, LogIn, LogOut, User, UserPlus, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

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
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

        {/* Theme Toggle (Light / Dark Mode) */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary"
          style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '5px' }}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle visual theme"
        >
          {theme === 'light' ? (
            <>
              <Moon size={14} color="#6366F1" />
              <span className="btn-text-full">Dark</span>
            </>
          ) : (
            <>
              <Sun size={14} color="#F59E0B" />
              <span className="btn-text-full">Light</span>
            </>
          )}
        </button>

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

        {/* Authentication Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 10px 4px 6px',
                  borderRadius: '20px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    {user.full_name}
                  </span>
                  <span style={{ fontSize: '0.64rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.74rem', gap: '5px', color: '#BE123C' }}
                title="Sign out of current research session"
              >
                <LogOut size={13} />
                <span className="btn-text-full">Sign Out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => openAuthModal('login')}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '5px' }}
                title="Sign in with research credentials"
              >
                <LogIn size={13} />
                <span>Sign In</span>
              </button>

              <button
                onClick={() => openAuthModal('register')}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '5px' }}
                title="Create a new research collaborator account"
              >
                <UserPlus size={13} />
                <span className="btn-text-full">Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
