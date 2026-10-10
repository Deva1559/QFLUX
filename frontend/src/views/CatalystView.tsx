import React, { useEffect, useState } from 'react';
import {
  Layers,
  Filter,
  CheckSquare,
  Square,
  Scale,
  ExternalLink,
  Zap,
  Flame,
  ShieldAlert,
  Info,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { Catalyst, CatalystComparisonResponse } from '../types';
import { TabKey } from '../components/Sidebar';
import { WorkflowFooter } from '../components/WorkflowFooter';

interface CatalystViewProps {
  onNavigate?: (tab: TabKey) => void;
}

export const CatalystView: React.FC<CatalystViewProps> = ({ onNavigate }) => {
  const [catalysts, setCatalysts] = useState<Catalyst[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([1, 2]); // default nZVI and In2O3
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState<CatalystComparisonResponse | null>(null);
  const [comparing, setComparing] = useState(false);

  const fetchCatalysts = async () => {
    setLoading(true);
    try {
      const data = await api.getCatalysts();
      setCatalysts(data);
    } catch (err) {
      console.error('Failed to fetch catalysts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalysts();
  }, []);

  const toggleSelectForCompare = (id: number) => {
    setSelectedForCompare((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenComparison = async () => {
    if (selectedForCompare.length < 2) return;
    setComparing(true);
    setComparisonModalOpen(true);
    try {
      const res = await api.compareCatalysts(selectedForCompare);
      setComparisonData(res);
    } catch (err) {
      console.error('Failed to compare catalysts', err);
    } finally {
      setComparing(false);
    }
  };

  const materialTypes = [
    'All',
    'Semiconductor Photocatalyst',
    'Transition Metal',
    'Electrochemical Electrode',
    'Layered Semiconductor',
    'Single-Atom Complex'
  ];

  const filteredCatalysts =
    selectedFilter === 'All'
      ? catalysts
      : catalysts.filter((c) =>
          c.material_type.toLowerCase().includes(selectedFilter.toLowerCase())
        );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className="view-heading">Catalyst Intelligence Catalogue</h1>
            <span className="badge badge-cyan">Audited Literature Systems</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
            Audited primary literature comparing parent-compound removal against verified fluoride release (defluorination).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleOpenComparison}
            disabled={selectedForCompare.length < 2}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            <Scale size={15} /> Compare Selected ({selectedForCompare.length})
          </button>
          <button
            onClick={fetchCatalysts}
            className="btn btn-secondary"
            style={{ padding: '8px 12px' }}
            title="Refresh catalogue"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '6px', width: '100%', WebkitOverflowScrolling: 'touch' }}>
        <Filter size={15} color="var(--text-muted)" style={{ marginRight: '4px', flexShrink: 0 }} />
        {materialTypes.map((type) => {
          const active = selectedFilter === type;
          return (
            <button
              key={type}
              onClick={() => setSelectedFilter(type)}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                background: active ? '#E0F2FE' : '#FFFFFF',
                border: active ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                color: active ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: 'var(--shadow-sm)',
                flexShrink: 0
              }}
            >
              {type}
            </button>
          );
        })}
      </div>

      {/* Catalyst Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="spin-slow" style={{ margin: '0 auto 12px auto' }} />
          <div>Loading verified catalyst literature...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))', gap: '18px' }}>
          {filteredCatalysts.map((cat) => {
            const isSelected = selectedForCompare.includes(cat.id);
            const defluorGap =
              cat.reported_defluorination_pct !== undefined && cat.reported_defluorination_pct !== null
                ? cat.reported_parent_removal_pct - cat.reported_defluorination_pct
                : null;
            const isHypothetical = cat.verification_status.includes('Hypothetical');

            return (
              <div
                key={cat.id}
                className="glass-panel"
                style={{
                  padding: 'clamp(16px, 3vw, 22px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  boxShadow: isSelected ? '0 0 16px rgba(8, 145, 178, 0.15)' : 'var(--shadow-sm)'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{cat.name}</h3>
                      <span className="badge badge-cyan" style={{ fontFamily: 'monospace' }}>
                        {cat.chemical_formula}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {cat.material_type} • Target: <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{cat.target_pfas}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSelectForCompare(cat.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      flexShrink: 0
                    }}
                  >
                    {isSelected ? <CheckSquare size={17} /> : <Square size={17} />}
                    <span>Compare</span>
                  </button>
                </div>

                {/* Metrics Highlight: Parent Removal vs Defluorination */}
                <div
                  className="responsive-triplet"
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Parent Loss</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                      {cat.reported_parent_removal_pct.toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Defluorination</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: cat.reported_defluorination_pct ? '#059669' : '#E11D48' }}>
                      {cat.reported_defluorination_pct !== null && cat.reported_defluorination_pct !== undefined
                        ? `${cat.reported_defluorination_pct.toFixed(1)}%`
                        : 'MISSING'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Unmineralized Gap</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: defluorGap && defluorGap > 30 ? '#D97706' : 'var(--text-primary)' }}>
                      {defluorGap !== null ? `${defluorGap.toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Mechanism & Conditions */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Mechanism: </strong>
                    {cat.treatment_mechanism}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Conditions: </strong>
                    {cat.reaction_conditions}
                  </div>
                  {cat.reported_byproducts && (
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Observed Intermediates: </strong>
                      <span className="mono" style={{ color: '#B45309', background: '#FEF3C7', padding: '1px 5px', borderRadius: '4px', fontSize: '0.72rem' }}>
                        {cat.reported_byproducts}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer status & citations */}
                <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span className={`badge ${isHypothetical ? 'badge-hypothetical' : 'badge-verified'}`}>
                    {cat.verification_status}
                  </span>

                  {cat.doi_or_url && !cat.doi_or_url.startsWith('hypothetical') ? (
                    <a
                      href={`https://doi.org/${cat.doi_or_url}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                    >
                      DOI: {cat.doi_or_url} <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      In-Silico Design Proposal
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison Modal */}
      {comparisonModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '960px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 'clamp(20px, 4vw, 32px)',
              background: '#FFFFFF',
              position: 'relative',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <button
              onClick={() => setComparisonModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', paddingRight: '28px' }}>
              <Scale size={22} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                Side-by-Side Catalyst Trade-Off Matrix
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '18px' }}>
              Comparing audited degradation parameters, operational energy requirements, and byproduct hazards.
            </p>

            {comparing ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="spin-slow" style={{ margin: '0 auto 8px auto' }} />
                <div>Computing comparison matrix...</div>
              </div>
            ) : comparisonData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Comparison Table */}
                <div className="table-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '480px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 700 }}>EVALUATION PROPERTY</th>
                        {comparisonData.catalysts.map((c) => (
                          <th key={c.id} style={{ padding: '10px 12px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                            {c.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.comparison_table.map((row, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid var(--border-subtle)',
                            background: idx % 2 === 0 ? '#FFFFFF' : 'var(--bg-surface)'
                          }}
                        >
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            <div>{row.property}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                              {row.description}
                            </div>
                          </td>
                          {comparisonData.catalysts.map((c) => {
                            const val = row.values[c.name] ?? row.values[String(c.id)] ?? 'N/A';
                            return (
                              <td key={c.id} style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                                {String(val)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Trade-off Summary */}
                {comparisonData.tradeoff_summary && (
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: '#F0F9FF',
                      border: '1px solid #BAE6FD',
                      fontSize: '0.82rem',
                      color: '#0369A1'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#0284C7', marginBottom: '4px' }}>
                      💡 Comparative Trade-off Analysis:
                    </div>
                    {comparisonData.tradeoff_summary}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {onNavigate && <WorkflowFooter currentTab="catalysts" onNavigate={onNavigate} />}
    </div>
  );
};
