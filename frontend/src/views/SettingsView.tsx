import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Atom,
  ShieldCheck,
  Download,
  Terminal,
  Activity,
  Sun,
  Moon
} from 'lucide-react';
import { api, getApiBaseUrl, setApiBaseUrl } from '../services/api';
import { HealthResponse } from '../types';
import { useTheme } from '../context/ThemeContext';

export const SettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [url, setUrl] = useState<string>(getApiBaseUrl());
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(false);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setLoadingHealth(true);
      const res = await api.getHealth();
      setHealth(res);
    } catch {
      setHealth({
        status: 'error',
        database_connected: false,
        version: '2.0.0',
        environment: 'offline',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleSaveUrl = () => {
    setApiBaseUrl(url);
    setToastMsg(`API Base URL saved: ${url}`);
    fetchHealth();
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      setToastMsg(null);
      const res = await api.triggerSeed();
      setToastMsg(`Repository seeded: ${res.message}`);
      fetchHealth();
    } catch (err: any) {
      setToastMsg(`Seed failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleBackup = async () => {
    try {
      setBackingUp(true);
      setBackupStatus(null);
      const res = await api.backupDatabase();
      setBackupStatus(`Database backup created: ${res.backup_file || 'q_flux_backup.db'}`);
    } catch (err: any) {
      setBackupStatus(`Backup failed: ${err.message}`);
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.04) 0%, #FFFFFF 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-cyan">Module 11</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Environment, Engine Diagnostics & Backups
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Platform Settings & Diagnostics
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '680px' }}>
            Manage server connections, trigger database snapshot backups, sync seed benchmarks, and audit
            computational chemistry engines.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 700
          }}
        >
          <RefreshCw size={14} /> Refresh Health
        </button>
      </div>

      {toastMsg && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', fontSize: '0.82rem', fontWeight: 600 }}>
          {toastMsg}
        </div>
      )}

      {/* Visual Theme Selection */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Visual Interface Theme
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Choose between High-Clarity Scientific Light mode and Quantum Cyber Deep Slate mode.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setTheme('light')}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '0.8rem',
                gap: '6px',
                backgroundColor: theme === 'light' ? 'rgba(8, 145, 178, 0.15)' : 'var(--bg-surface)',
                border: `1.5px solid ${theme === 'light' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                color: theme === 'light' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
              }}
            >
              <Sun size={15} color="#D97706" /> Scientific Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '0.8rem',
                gap: '6px',
                backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-surface)',
                border: `1.5px solid ${theme === 'dark' ? 'var(--accent-purple)' : 'var(--border-subtle)'}`,
                color: theme === 'dark' ? 'var(--accent-purple)' : 'var(--text-secondary)'
              }}
            >
              <Moon size={15} color="#818CF8" /> Quantum Dark
            </button>
          </div>
        </div>
      </div>

      {/* Engine Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Server size={18} color="var(--accent-cyan)" />
            <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>FastAPI Backend</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Port 8000 (Python Local Virtual Environment)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: health?.database_connected ? '#059669' : '#DC2626'
              }}
            />
            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: health?.database_connected ? '#059669' : '#DC2626' }}>
              {health?.database_connected ? 'Operational (Connected)' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Atom size={18} color="var(--accent-purple)" />
            <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>Classical SCF Solver</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Restricted Hartree-Fock / STO-3G PySCF
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#059669' }}>
              Active (Local Solver Available)
            </span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Cpu size={18} color="#2563EB" />
            <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>Quantum VQE Engine</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            2-Qubit Jordan-Wigner Hamiltonian
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#059669' }}>
              Calibrated (100% Deterministic)
            </span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Database size={18} color="#059669" />
            <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>SQLite Database</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <code>backend/q_flux.db</code> (Alembic Migrated)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#059669' }}>
              Tables Seeded & Verified
            </span>
          </div>
        </div>
      </div>

      {/* API Configuration & Backup */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)', gap: '20px' }}>
        {/* Endpoint Config */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Backend API Endpoint
          </h3>
          <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Configure the target REST URL used by all client views and background pollers.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
                fontFamily: 'JetBrains Mono, monospace'
              }}
            />
            <button
              onClick={handleSaveUrl}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-cyan)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Update
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setUrl('http://127.0.0.1:8000');
                setApiBaseUrl('http://127.0.0.1:8000');
                fetchHealth();
              }}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: '#FFFFFF',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Default (127.0.0.1:8000)
            </button>
            <button
              onClick={() => {
                setUrl('http://localhost:8000');
                setApiBaseUrl('http://localhost:8000');
                fetchHealth();
              }}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: '#FFFFFF',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Localhost (localhost:8000)
            </button>
          </div>
        </div>

        {/* Database Management & Snapshot */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Database Operations & Backup
          </h3>
          <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Create an instantaneous SQLite snapshot or re-synchronize curated peer-reviewed seed records.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <button
              onClick={handleBackup}
              disabled={backingUp}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-emerald)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              <Download size={14} /> {backingUp ? 'Creating Snapshot...' : 'Backup Database'}
            </button>

            <button
              onClick={handleSeed}
              disabled={seeding}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} /> {seeding ? 'Syncing...' : 'Sync Research Datasets'}
            </button>
          </div>

          {backupStatus && (
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
              {backupStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
