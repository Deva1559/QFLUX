import React, { useEffect, useState } from 'react';
import {
  Atom,
  Play,
  RotateCw,
  Zap,
  CheckCircle2,
  FileCode,
  Sliders,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { MolecularModel, ClassicalChemistryRunResponse } from '../types';
import { TabKey } from '../components/Sidebar';
import { WorkflowFooter } from '../components/WorkflowFooter';

interface ChemistryViewProps {
  onNavigate?: (tab: TabKey) => void;
}

export const ChemistryView: React.FC<ChemistryViewProps> = ({ onNavigate }) => {
  const [models, setModels] = useState<MolecularModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<MolecularModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [activeResult, setActiveResult] = useState<ClassicalChemistryRunResponse | null>(null);
  const [basisSet, setBasisSet] = useState('STO-3G');
  const [computeReactionEnergy, setComputeReactionEnergy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await api.getMolecularModels();
        setModels(data);
        if (data.length > 0) {
          setSelectedModel(data[0]);
        }
      } catch (err) {
        console.error('Failed to load molecular models', err);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  const handleRunSCF = async () => {
    if (!selectedModel) return;
    setCalculating(true);
    setError(null);
    try {
      const res = await api.runClassicalChemistry({
        model_id: selectedModel.id,
        run_name: `${selectedModel.name} RHF/STO-3G`,
        basis_set: basisSet,
        compute_reaction_energy: computeReactionEnergy
      });
      setActiveResult(res);
    } catch (err: any) {
      setError(`SCF computation error: ${err.message}`);
    } finally {
      setCalculating(false);
    }
  };

  // Parse XYZ coordinate string
  const parseCoordinates = (xyz: string) => {
    const lines = xyz.trim().split('\n');
    return lines.map((line, idx) => {
      const parts = line.trim().split(/\s+/);
      return {
        id: idx + 1,
        element: parts[0] || '?',
        x: parseFloat(parts[1] || '0').toFixed(4),
        y: parseFloat(parts[2] || '0').toFixed(4),
        z: parseFloat(parts[3] || '0').toFixed(4)
      };
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1 className="view-heading">Ab-Initio Classical Quantum Chemistry</h1>
          <span className="badge badge-cyan">RHF / STO-3G SCF Engine</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
          Real Restricted Hartree-Fock (RHF/STO-3G) electronic-structure solver calculating nuclear repulsion, ground-state SCF energies, HOMO-LUMO gaps, and reaction energetics (ΔE_rxn).
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
          <Atom size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="responsive-workbench-grid">
        {/* Left Column: Model Selection & Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="glass-panel" style={{ padding: 'clamp(18px, 3vw, 24px)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
              Select Chemical Model System
            </h3>

            {loading ? (
              <div style={{ color: 'var(--text-muted)' }}>Loading molecular models...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {models.map((m) => {
                  const isSelected = selectedModel?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedModel(m);
                        setActiveResult(null);
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? '#E0F2FE' : 'var(--bg-surface)',
                        border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={{ fontWeight: 700, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {m.name}
                        </span>
                        <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                          {m.chemical_formula}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {m.num_atoms} Atoms • {m.num_electrons} Electrons • Charge: {m.charge}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedModel && (
              <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700 }}>
                  CALCULATION SETTINGS
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                      Atomic Orbital Basis Set
                    </label>
                    <select
                      value={basisSet}
                      onChange={(e) => setBasisSet(e.target.value)}
                      className="input-field"
                    >
                      <option value="STO-3G">STO-3G (Minimal Slater Gaussian Basis)</option>
                    </select>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      checked={computeReactionEnergy}
                      onChange={(e) => setComputeReactionEnergy(e.target.checked)}
                    />
                    <span>Compute terminal C-F bond cleavage (ΔE_rxn)</span>
                  </label>

                  <button
                    onClick={handleRunSCF}
                    disabled={calculating}
                    className="btn btn-primary"
                    style={{ marginTop: '6px', width: '100%', padding: '11px' }}
                  >
                    {calculating ? (
                      <>
                        <RotateCw size={15} className="spin-slow" /> Running SCF Solver...
                      </>
                    ) : (
                      <>
                        <Play size={15} /> Execute Hartree-Fock SCF
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Model Scope Card */}
          {selectedModel && (
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Model Scope & Chemistry Rationale
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {selectedModel.model_scope_description}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Cartesian Coordinates & SCF Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>
          {/* Coordinates Table */}
          {selectedModel && (
            <div className="glass-panel" style={{ padding: 'clamp(18px, 3vw, 24px)', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Cartesian XYZ Atomic Coordinates (Å)
                </h3>
                <span className="badge badge-cyan">{selectedModel.num_atoms} Centers</span>
              </div>

              <div className="table-responsive" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left', minWidth: '380px' }}>
                  <thead style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '8px 12px' }}>#</th>
                      <th style={{ padding: '8px 12px' }}>Element</th>
                      <th style={{ padding: '8px 12px' }}>X (Å)</th>
                      <th style={{ padding: '8px 12px' }}>Y (Å)</th>
                      <th style={{ padding: '8px 12px' }}>Z (Å)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseCoordinates(selectedModel.cartesian_coordinates_xyz).map((row) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{row.id}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: row.element === 'F' ? '#E11D48' : row.element === 'C' ? '#0284C7' : '#7C3AED' }}>
                          {row.element}
                        </td>
                        <td className="mono" style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>{row.x}</td>
                        <td className="mono" style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>{row.y}</td>
                        <td className="mono" style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>{row.z}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SCF Calculation Results Display */}
          {activeResult ? (
            <div
              className="glass-panel"
              style={{
                padding: 'clamp(20px, 3vw, 28px)',
                border: '1px solid #A7F3D0',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F0FDF4 100%)',
                minWidth: 0
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <CheckCircle2 size={18} color="var(--accent-emerald)" />
                    <h2 style={{ fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', fontWeight: 700, color: '#065F46' }}>
                      RHF/STO-3G SCF Electronic-Structure Solved
                    </h2>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Method: {activeResult.method_name} • Converged in {activeResult.iterations} iters ({activeResult.runtime_ms} ms)
                  </div>
                </div>

                <span className="badge badge-verified">SCF Converged</span>
              </div>

              {/* Energy Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px', marginBottom: '18px' }}>
                <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: '#FFFFFF', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL GROUND SCF ENERGY</div>
                  <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                    {activeResult.total_scf_energy_au.toFixed(6)} a.u.
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: '#FFFFFF', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>NUCLEAR REPULSION ENERGY</div>
                  <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '4px' }}>
                    {activeResult.nuclear_repulsion_energy_au.toFixed(6)} a.u.
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: '#FFFFFF', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>HOMO-LUMO GAP</div>
                  <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
                    {activeResult.homo_lumo_gap_ev.toFixed(2)} eV
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: '#FFFFFF', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>MOLECULAR DIPOLE MOMENT</div>
                  <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '4px' }}>
                    {activeResult.dipole_moment_debye.toFixed(2)} Debye
                  </div>
                </div>
              </div>

              {/* Reaction Energy Card */}
              {activeResult.reaction_name && activeResult.reaction_energy_kcal_mol !== undefined && (
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    marginBottom: '14px'
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#1D4ED8', fontSize: '0.84rem', marginBottom: '4px' }}>
                    ⚗️ Reaction Cleavage Energetics: {activeResult.reaction_name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E3A8A' }}>
                      ΔE_rxn = {activeResult.reaction_energy_kcal_mol.toFixed(1)} kcal/mol
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      (~{(activeResult.reaction_energy_kcal_mol * 4.184).toFixed(1)} kJ/mol)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    {activeResult.energy_convention_note}
                  </div>
                </div>
              )}

              {/* Scientific limitation footnote */}
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                <strong>Methodological Context:</strong> {activeResult.limitations}
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
              <Atom size={32} color="var(--accent-cyan)" />
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Awaiting SCF Execution</div>
              <div style={{ fontSize: '0.82rem', maxWidth: '420px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                Select a PFAS active-space coordinate model on the left and click <strong>"Execute Hartree-Fock SCF"</strong> to calculate ground-state electronic energy.
              </div>
            </div>
          )}
        </div>
      </div>

      {onNavigate && <WorkflowFooter currentTab="chemistry" onNavigate={onNavigate} />}
    </div>
  );
};
