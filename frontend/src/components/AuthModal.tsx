import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Shield, X, AlertCircle, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    authModalReason,
    isLoading,
    authError,
    login,
    register,
    closeAuthModal,
    clearError,
    openAuthModal
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Researcher');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setValidationError(null);
      clearError();
    }
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (!email.trim() || !email.includes('@')) {
      setValidationError('Please enter a valid research institution email address.');
      return;
    }
    if (!password || password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    if (authModalMode === 'register' && !fullName.trim()) {
      setValidationError('Please enter your full name and scientific title.');
      return;
    }

    try {
      if (authModalMode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, fullName.trim(), role);
      }
    } catch {
      // Handled via authError in context
    }
  };

  const handleUseDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setValidationError(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
          position: 'relative'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #F1F5F9',
            background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'var(--grad-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}
              >
                <Lock size={15} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {authModalMode === 'login' ? 'Researcher Sign In' : 'Register Research Account'}
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {authModalMode === 'login'
                ? 'Authenticate to unlock compound registration, uploads & calculation jobs.'
                : 'Join the collaborative PFAS degradation and fluorine accounting network.'}
            </p>
          </div>

          <button
            onClick={closeAuthModal}
            aria-label="Close dialog"
            style={{
              border: 'none',
              background: '#F1F5F9',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Informative Protected Action Notice */}
        {authModalReason && (
          <div
            style={{
              padding: '10px 20px',
              backgroundColor: '#EFF6FF',
              borderBottom: '1px solid #DBEAFE',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#1E40AF',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            <Shield size={14} style={{ flexShrink: 0 }} />
            <span>{authModalReason}</span>
          </div>
        )}

        {/* Error Messages */}
        {(authError || validationError) && (
          <div
            style={{
              margin: '16px 24px 0',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{validationError || authError}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {authModalMode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Full Name & Title *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)'
                  }}
                />
                <User size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Academic / Lab Email Address *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                placeholder="researcher@qflux.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)'
                }}
              />
              <Mail size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)'
                }}
              />
              <KeyRound size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
            </div>
          </div>

          {authModalMode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Research Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <option value="Researcher">Senior Researcher / Chemist</option>
                <option value="Project Collaborator">Research Collaborator</option>
                <option value="Project Owner">Principal Investigator (PI)</option>
              </select>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              padding: '11px',
              fontSize: '0.88rem',
              fontWeight: 700,
              width: '100%',
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{authModalMode === 'login' ? 'Sign In to Workbench' : 'Create Research Account'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Toggle Login / Register */}
          <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {authModalMode === 'login' ? (
              <>
                Don't have a collaborator account?{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('register', authModalReason || undefined)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-highlight)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Register here
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('login', authModalReason || undefined)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-highlight)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Sign in here
                </button>
              </>
            )}
          </div>

          {/* Quick Demo Credentials Assistant */}
          {authModalMode === 'login' && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#F8FAFC',
                border: '1px dashed #CBD5E1'
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Pre-Configured Scientific Accounts
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleUseDemo('researcher@qflux.org', 'ResearchLab2026!')}
                  style={{
                    flex: '1 1 auto',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.74rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={13} color="#059669" />
                  <span>Researcher (Elena Vance)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUseDemo('admin@qflux.org', 'QFluxAdmin2026!')}
                  style={{
                    flex: '1 1 auto',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.74rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Shield size={13} color="#0284C7" />
                  <span>Project PI (Dr. Thorne)</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
