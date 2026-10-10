import React, { useState, useEffect } from 'react';
import {
  Scale,
  Play,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  TrendingDown,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { FluorineBalanceCalculateRequest, FluorineBalanceCalculateResponse } from '../types';
import { TabKey } from '../components/Sidebar';
import { WorkflowFooter } from '../components/WorkflowFooter';

interface FluorineBalanceViewProps {
  onNavigate?: (tab: TabKey) => void;
}

export const FluorineBalanceView: React.FC<FluorineBalanceViewProps> = ({ onNavigate }) => {
  const [initialInventory, setInitialInventory] = useState(100.0);
  const [inorganicFluoride, setInorganicFluoride] = useState(13.0);
  const [organicFluorine, setOrganicFluorine] = useState(87.0);
  const [otherFluorine, setOtherFluorine] = useState(0.0);
  const [units, setUnits] = useState('mg/L');

  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<FluorineBalanceCalculateResponse | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  const calculateBalance = async () => {
    setCalculating(true);
    setCalcError(null);
    try {
      const payload: FluorineBalanceCalculateRequest = {
        initial_fluorine_inventory: initialInventory,
        inventory_basis_units: units,
        measured_inorganic_fluoride: inorganicFluoride,
        remaining_organic_fluorine: organicFluorine,
        other_identified_fluorine: otherFluorine
      };
      const res = await api.calculateFluorineBalance(payload);
      setResult(res);
    } catch (err: any) {
      setCalcError(`Audit calculation error: ${err.message}`);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    calculateBalance();
  }, []);

  const loadSmithEtAlPreset = () => {
    setInitialInventory(100.0);
    setInorganicFluoride(13.0);
    setOrganicFluorine(87.0);
    setOtherFluorine(0.0);
  };

  const loadVolatileDeficitPreset = () => {
    setInitialInventory(100.0);
    setInorganicFluoride(25.0);
    setOrganicFluorine(40.0);
    setOtherFluorine(0.0);
  };

  const loadSurplusPreset = () => {
    setInitialInventory(100.0);
    setInorganicFluoride(65.0);
    setOrganicFluorine(50.0);
    setOtherFluorine(0.0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1 className="view-heading">Fluorine Mass Balance Accounting</h1>
          <span className="badge badge-verified">Forensic Stoichiometry</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
          Mathematical recovery verification (90% ≤ Closure ≤ 105%) detecting hidden toxic volatile organofluorine deficits and unmineralized intermediates.
        </p>
      </div>

      {calcError && (
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
          <span>{calcError}</span>
        </div>
      )}

      {/* Validation Benchmarks */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>VALIDATION CASE STUDIES:</span>
        <button
          onClick={loadSmithEtAlPreset}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.76rem' }}
        >
          Smith et al. 2024 Audit Case (13% F⁻)
        </button>
        <button
          onClick={loadVolatileDeficitPreset}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.76rem' }}
        >
          Volatile Gas Deficit (&lt; 90%)
        </button>
        <button
          onClick={loadSurplusPreset}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.76rem' }}
        >
          Analytical Imbalance (&gt; 105%)
        </button>
      </div>

      <div className="responsive-workbench-grid">
        {/* Left Column: Input Form */}
        <div className="glass-panel" style={{ padding: 'clamp(18px, 3vw, 24px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Fluorine Inventory Inputs
          </h3>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Concentration Units
            </label>
            <select
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="input-field"
            >
              <option value="mg/L">mg/L (Total Fluorine Basis)</option>
              <option value="µg/L">µg/L (Trace Groundwater)</option>
              <option value="mM">mM (Molar Basis)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Initial Total Fluorine Inventory ({units})
            </label>
            <input
              type="number"
              min="0.1"
              step="1"
              value={initialInventory}
              onChange={(e) => setInitialInventory(parseFloat(e.target.value) || 0)}
              className="input-field"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Measured Mineral Fluoride F⁻ Release ({units})
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={inorganicFluoride}
              onChange={(e) => setInorganicFluoride(parseFloat(e.target.value) || 0)}
              className="input-field"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Measured Residual Organic Fluorine ({units})
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={organicFluorine}
              onChange={(e) => setOrganicFluorine(parseFloat(e.target.value) || 0)}
              className="input-field"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Other Identified Fluorine ({units})
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={otherFluorine}
              onChange={(e) => setOtherFluorine(parseFloat(e.target.value) || 0)}
              className="input-field"
            />
          </div>

          <button
            onClick={calculateBalance}
            disabled={calculating}
            className="btn btn-primary"
            style={{ width: '100%', padding: '11px' }}
          >
            {calculating ? (
              <>
                <RotateCw size={15} className="spin-slow" /> Verifying Mass Balance...
              </>
            ) : (
              <>
                <Play size={15} /> Calculate Mass-Balance Closure
              </>
            )}
          </button>
        </div>

        {/* Right Column: Mass Balance Closure & Gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>
          {result ? (
            <div
              className="glass-panel"
              style={{
                padding: 'clamp(20px, 3vw, 28px)',
                border: result.closure_status?.includes('Acceptable')
                  ? '1px solid #A7F3D0'
                  : '1px solid #FECDD3',
                background: result.closure_status?.includes('Acceptable')
                  ? 'linear-gradient(180deg, #FFFFFF 0%, #F0FDF4 100%)'
                  : 'linear-gradient(180deg, #FFFFFF 0%, #FFF1F2 100%)',
                minWidth: 0
              }}
            >
              {/* Status Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Fluorine Accounting Breakdown
                  </h2>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Criteria: 90% ≤ Recovery Closure ≤ 105%
                  </div>
                </div>

                <span
                  className={`badge ${
                    result.closure_status?.includes('Acceptable') ? 'badge-verified' : 'badge-warning'
                  }`}
                >
                  {result.closure_status}
                </span>
              </div>

              {/* Three Metrics Grid */}
              <div className="responsive-triplet" style={{ marginBottom: '18px' }}>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#FFFFFF', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>APPARENT DEFLUORINATION</div>
                  <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                    {result.apparent_defluorination_pct?.toFixed(1) ?? 'N/A'}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>F⁻ Release</div>
                </div>

                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#FFFFFF', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>RESIDUAL ORGANIC F</div>
                  <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '4px' }}>
                    {result.remaining_organic_pct?.toFixed(1) ?? 'N/A'}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Unmineralized Residue</div>
                </div>

                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#FFFFFF', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>MASS-BALANCE CLOSURE</div>
                  <div
                    className="mono"
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: result.closure_status?.includes('Acceptable') ? '#059669' : '#E11D48',
                      marginTop: '4px'
                    }}
                  >
                    {result.mass_balance_closure_pct?.toFixed(1) ?? 'N/A'}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Total Fluorine Recovery</div>
                </div>
              </div>

              {/* Visual Horizontal Stack Bar */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ fontWeight: 600 }}>Fluorine Distribution Spectrum</span>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    Total Accounted: {((result.apparent_defluorination_pct || 0) + (result.remaining_organic_pct || 0)).toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: '16px', width: '100%', background: '#E2E8F0', borderRadius: '8px', display: 'flex', overflow: 'hidden' }}>
                  <div
                    title="Mineral Fluoride F⁻"
                    style={{
                      width: `${Math.min(100, Math.max(0, result.apparent_defluorination_pct || 0))}%`,
                      background: 'var(--accent-cyan)'
                    }}
                  />
                  <div
                    title="Residual Organic F"
                    style={{
                      width: `${Math.min(100, Math.max(0, result.remaining_organic_pct || 0))}%`,
                      background: 'var(--accent-amber)'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '14px', fontSize: '0.72rem', marginTop: '6px', fontWeight: 600, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-cyan)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--accent-cyan)' }} />
                    Mineral Fluoride F⁻ ({result.apparent_defluorination_pct?.toFixed(1)}%)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-amber)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--accent-amber)' }} />
                    Residual Organic F ({result.remaining_organic_pct?.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Scientific Interpretation */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '14px'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)', marginBottom: '5px' }}>
                  🔬 Analytical Mass-Balance Audit:
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {result.scientific_interpretation}
                </p>
              </div>

              {/* Uncertainty Flags */}
              {result.uncertainty_flags && result.uncertainty_flags.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {result.uncertainty_flags.map((flag, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: '#FFF1F2',
                        border: '1px solid #FECDD3',
                        fontSize: '0.76rem',
                        color: '#BE123C',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 500
                      }}
                    >
                      <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {onNavigate && <WorkflowFooter currentTab="fluorine" onNavigate={onNavigate} />}
    </div>
  );
};
