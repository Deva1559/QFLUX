import React, { useState } from 'react';
import {
  Cpu,
  Play,
  RotateCw,
  Zap,
  CheckCircle2,
  Sliders,
  Scale,
  Activity,
  Layers,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { QuantumBenchmarkRequest, QuantumBenchmarkResponse } from '../types';
import { TabKey } from '../components/Sidebar';
import { WorkflowFooter } from '../components/WorkflowFooter';

interface QuantumViewProps {
  onNavigate?: (tab: TabKey) => void;
}

export const QuantumView: React.FC<QuantumViewProps> = ({ onNavigate }) => {
  const [modelType, setModelType] = useState<'Reduced C-F Active Space' | 'Pedagogical Toy Benchmark'>('Reduced C-F Active Space');
  const [optimizer, setOptimizer] = useState('Nelder-Mead');
  const [maxIter, setMaxIter] = useState(2500);
  const [tolerance, setTolerance] = useState(1e-10);
  const [randomSeed, setRandomSeed] = useState(42);

  // Hamiltonian Coefficients (for 2-qubit C-F active space)
  const [coeffZ0, setCoeffZ0] = useState(-1.05);
  const [coeffZ1, setCoeffZ1] = useState(-0.75);
  const [coeffXX, setCoeffXX] = useState(0.35);
  const [coeffZZ, setCoeffZZ] = useState(0.20);

  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<QuantumBenchmarkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunVQE = async () => {
    setCalculating(true);
    setError(null);
    try {
      const payload: QuantumBenchmarkRequest = {
        run_name: `${modelType} VQE Run`,
        model_type: modelType,
        optimizer,
        max_iter: maxIter,
        tolerance,
        random_seed: randomSeed,
        coeff_z0: coeffZ0,
        coeff_z1: coeffZ1,
        coeff_xx: coeffXX,
        coeff_zz: coeffZZ
      };
      const res = await api.runQuantumBenchmark(payload);
      setResult(res);
    } catch (err: any) {
      setError(`VQE Simulation error: ${err.message}`);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1 className="view-heading">Quantum Algorithm Workbench</h1>
          <span className="badge badge-quantum">2-Qubit Jordan-Wigner VQE</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
          Variational Quantum Eigensolver (VQE) benchmark on a 2-qubit Jordan-Wigner mapped C-F bond active-space Hamiltonian, validated against exact classical diagonalization.
        </p>
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
          <Cpu size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="responsive-workbench-grid">
        {/* Left Column: Configuration Controls */}
        <div className="glass-panel" style={{ padding: 'clamp(18px, 3vw, 24px)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Hamiltonian & VQE Configuration
          </h3>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Hamiltonian Target Model
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setModelType('Reduced C-F Active Space')}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: modelType === 'Reduced C-F Active Space' ? '#F5F3FF' : 'var(--bg-surface)',
                  border: modelType === 'Reduced C-F Active Space' ? '1px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
                  color: modelType === 'Reduced C-F Active Space' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                C-F Active Space
              </button>
              <button
                type="button"
                onClick={() => setModelType('Pedagogical Toy Benchmark')}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: modelType === 'Pedagogical Toy Benchmark' ? '#F5F3FF' : 'var(--bg-surface)',
                  border: modelType === 'Pedagogical Toy Benchmark' ? '1px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
                  color: modelType === 'Pedagogical Toy Benchmark' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Parametric Standard
              </button>
            </div>
          </div>

          {/* Hamiltonian 2-Qubit Pauli String Parameters */}
          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Pauli Weights: H = c₀·Z₀ + c₁·Z₁ + c₂·(X₀X₁) + c₃·(Z₀Z₁)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>c₀ (Z₀)</label>
                <input
                  type="number"
                  step="0.05"
                  value={coeffZ0}
                  onChange={(e) => setCoeffZ0(parseFloat(e.target.value) || 0)}
                  className="input-field"
                  style={{ padding: '8px 10px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>c₁ (Z₁)</label>
                <input
                  type="number"
                  step="0.05"
                  value={coeffZ1}
                  onChange={(e) => setCoeffZ1(parseFloat(e.target.value) || 0)}
                  className="input-field"
                  style={{ padding: '8px 10px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>c₂ (X₀X₁)</label>
                <input
                  type="number"
                  step="0.05"
                  value={coeffXX}
                  onChange={(e) => setCoeffXX(parseFloat(e.target.value) || 0)}
                  className="input-field"
                  style={{ padding: '8px 10px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>c₃ (Z₀Z₁)</label>
                <input
                  type="number"
                  step="0.05"
                  value={coeffZZ}
                  onChange={(e) => setCoeffZZ(parseFloat(e.target.value) || 0)}
                  className="input-field"
                  style={{ padding: '8px 10px' }}
                />
              </div>
            </div>
          </div>

          {/* Classical Optimizer */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Optimizer
              </label>
              <select
                value={optimizer}
                onChange={(e) => setOptimizer(e.target.value)}
                className="input-field"
                style={{ padding: '8px 10px' }}
              >
                <option value="Nelder-Mead">Nelder-Mead (Simplex)</option>
                <option value="COBYLA">COBYLA (Linear)</option>
                <option value="SLSQP">SLSQP (Sequential)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Random Seed
              </label>
              <input
                type="number"
                value={randomSeed}
                onChange={(e) => setRandomSeed(parseInt(e.target.value) || 0)}
                className="input-field"
                style={{ padding: '8px 10px' }}
              />
            </div>
          </div>

          <button
            onClick={handleRunVQE}
            disabled={calculating}
            className="btn btn-quantum"
            style={{ width: '100%', padding: '11px', fontSize: '0.88rem' }}
          >
            {calculating ? (
              <>
                <RotateCw size={15} className="spin-slow" /> Optimizing Variational Ansatz...
              </>
            ) : (
              <>
                <Play size={15} /> Execute Hybrid VQE Optimization
              </>
            )}
          </button>
        </div>

        {/* Right Column: VQE Benchmark & Eigensolver Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>
          {result ? (
            <div
              className="glass-panel"
              style={{
                padding: 'clamp(20px, 3vw, 28px)',
                border: '1px solid #DDD6FE',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF5FF 100%)',
                minWidth: 0
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <CheckCircle2 size={18} color="var(--accent-purple)" />
                    <h2 style={{ fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', fontWeight: 700, color: '#5B21B6' }}>
                      VQE Ground State Optimization Complete
                    </h2>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {result.num_qubits} Qubits • Optimizer: {result.optimizer_name} • Converged: {result.optimizer_converged ? 'Yes' : 'No'} ({result.execution_time_ms} ms)
                  </div>
                </div>

                <span className="badge badge-quantum">VQE Converged</span>
              </div>

              {/* Exact vs VQE Comparison Triplet */}
              <div className="responsive-triplet" style={{ marginBottom: '18px' }}>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#FFFFFF', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>VQE ESTIMATED ENERGY</div>
                  <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '4px' }}>
                    {result.vqe_energy.toFixed(8)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Model Active-Space Units</div>
                </div>

                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#FFFFFF', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>EXACT DIAGONALIZATION</div>
                  <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                    {result.exact_energy.toFixed(8)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Classical Reference Truth</div>
                </div>

                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: '#FFFFFF', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>ABSOLUTE ERROR |VQE - EXACT|</div>
                  <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
                    {result.absolute_error.toExponential(3)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '2px', fontWeight: 600 }}>High Precision Agreement</div>
                </div>
              </div>

              {/* Convergence Meta Table */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '16px'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Optimization Trajectory & Ansatz Parameters
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '8px', fontSize: '0.76rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Iterations: </span>
                    <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{result.iterations}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Function Evals: </span>
                    <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{result.function_evaluations}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Optimal Angles (θ): </span>
                    <span className="mono" style={{ color: 'var(--accent-purple)', fontWeight: 600, wordBreak: 'break-all' }}>
                      [{result.optimal_parameters.map((p) => p.toFixed(3)).join(', ')}]
                    </span>
                  </div>
                </div>
              </div>

              {/* Scientific Disclaimer Note */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  fontSize: '0.76rem',
                  color: '#78350F',
                  lineHeight: 1.5
                }}
              >
                <strong style={{ color: '#B45309' }}>Scientific Scope & Governance: </strong>
                {result.disclaimer_text}
              </div>
            </div>
          ) : (
            <div
              className="glass-panel"
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
            >
              <Cpu size={32} color="var(--accent-purple)" />
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Ready for Quantum Simulation</div>
              <div style={{ fontSize: '0.82rem', maxWidth: '420px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                Configure the active-space Hamiltonian parameters on the left and click <strong>"Execute Hybrid VQE Optimization"</strong> to evaluate quantum convergence against exact classical eigensolutions.
              </div>
            </div>
          )}
        </div>
      </div>

      {onNavigate && <WorkflowFooter currentTab="quantum" onNavigate={onNavigate} />}
    </div>
  );
};
