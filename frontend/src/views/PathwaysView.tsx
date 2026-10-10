import React, { useEffect, useState } from 'react';
import {
  GitBranch,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Atom,
  HelpCircle,
  Zap,
  RotateCw
} from 'lucide-react';
import { api } from '../services/api';
import { Pathway, PathwayStep } from '../types';
import { TabKey } from '../components/Sidebar';
import { WorkflowFooter } from '../components/WorkflowFooter';

interface PathwaysViewProps {
  onNavigate?: (tab: TabKey) => void;
}

export const PathwaysView: React.FC<PathwaysViewProps> = ({ onNavigate }) => {
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPathway, setSelectedPathway] = useState<Pathway | null>(null);

  useEffect(() => {
    const fetchPathways = async () => {
      try {
        const data = await api.getPathways();
        setPathways(data);
        if (data.length > 0) {
          setSelectedPathway(data[0]);
        }
      } catch (err) {
        console.error('Failed to load pathways', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPathways();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1 className="view-heading">Molecular Pathway Explorer</h1>
          <span className="badge badge-cyan">Elementary Mechanisms</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
          Graph of documented elementary reaction transformations, verified intermediate species, and proposed transition-state bond cleavage pathways.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <RotateCw size={28} className="spin-slow" style={{ margin: '0 auto 12px auto' }} />
          <div>Loading reaction pathways...</div>
        </div>
      ) : (
        <div className="responsive-pathways-layout">
          {/* Pathways List */}
          <div className="glass-panel" style={{ padding: 'clamp(16px, 3vw, 22px)', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Documented Reaction Sequences
            </h3>

            {pathways.map((pw) => {
              const isSelected = selectedPathway?.id === pw.id;
              return (
                <div
                  key={pw.id}
                  onClick={() => setSelectedPathway(pw)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? '#E0F2FE' : 'var(--bg-surface)',
                    border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: 700, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)', fontSize: '0.92rem' }}>
                    {pw.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', marginTop: '2px', fontWeight: 600 }}>
                    Target: {pw.target_compound} • {pw.steps?.length || 0} Steps
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pathway Steps View */}
          {selectedPathway ? (
            <div className="glass-panel" style={{ padding: 'clamp(18px, 3vw, 28px)', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedPathway.title}
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {selectedPathway.description}
                  </p>
                </div>

                {selectedPathway.reference_doi && (
                  <a
                    href={`https://doi.org/${selectedPathway.reference_doi}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                  >
                    DOI: {selectedPathway.reference_doi} <ExternalLink size={11} />
                  </a>
                )}
              </div>

              {/* Steps Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {selectedPathway.steps?.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    style={{
                      padding: '16px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      minWidth: 0
                    }}
                  >
                    {/* Step Title Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'var(--accent-cyan)',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {step.step_number}
                        </span>
                        <span className="mono" style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                          {step.reactant_name} <ArrowRight size={13} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--accent-cyan)' }} /> {step.product_name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {step.is_experimentally_observed ? (
                          <span className="badge badge-verified">Observed by MS</span>
                        ) : (
                          <span className="badge badge-hypothetical">Proposed Radical</span>
                        )}
                      </div>
                    </div>

                    {/* Step Description */}
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {step.transformation_description}
                    </p>

                    {/* Chemical Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '8px', fontSize: '0.76rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                      {step.bond_changes && (
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Bond: </strong>
                          {step.bond_changes}
                        </div>
                      )}
                      {step.chemical_conditions && (
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Conditions: </strong>
                          {step.chemical_conditions}
                        </div>
                      )}
                      {step.reported_intermediates && (
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Intermediate: </strong>
                          <span className="mono" style={{ color: 'var(--accent-cyan)', background: '#E0F2FE', padding: '1px 5px', borderRadius: '4px' }}>
                            {step.reported_intermediates}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {onNavigate && <WorkflowFooter currentTab="pathways" onNavigate={onNavigate} />}
    </div>
  );
};
