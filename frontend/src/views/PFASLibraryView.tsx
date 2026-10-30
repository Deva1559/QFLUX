import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Atom,
  AlertTriangle,
  FileText,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
  X,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { PFASCompound } from '../types';
import { TabKey } from '../components/Sidebar';
import { ChemicalStructure2D } from '../components/ChemicalStructure2D';
import { WorkflowFooter } from '../components/WorkflowFooter';
import { useAuth } from '../context/AuthContext';

interface PFASLibraryViewProps {
  onNavigate?: (tab: TabKey) => void;
}

export const PFASLibraryView: React.FC<PFASLibraryViewProps> = ({ onNavigate }) => {
  const { requireAuth } = useAuth();
  const [compounds, setCompounds] = useState<PFASCompound[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [carbonFilter, setCarbonFilter] = useState<'All' | 'Short' | 'Long'>('All');
  const [selectedCompound, setSelectedCompound] = useState<PFASCompound | null>(null);

  // New Compound Registration Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formAcronym, setFormAcronym] = useState<string>('');
  const [formCas, setFormCas] = useState<string>('');
  const [formFormula, setFormFormula] = useState<string>('');
  const [formSmiles, setFormSmiles] = useState<string>('');
  const [formMw, setFormMw] = useState<string>('414.07');
  const [formCarbons, setFormCarbons] = useState<string>('8');
  const [formFluorines, setFormFluorines] = useState<string>('15');
  const [formSources, setFormSources] = useState<string>('PubChem / EPA CompTox');
  const [formNotes, setFormNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCompounds = async () => {
    try {
      setLoading(true);
      setError(null);
      let minC: number | undefined;
      let maxC: number | undefined;

      if (carbonFilter === 'Short') {
        minC = 1;
        maxC = 6;
      } else if (carbonFilter === 'Long') {
        minC = 7;
        maxC = 20;
      }

      const data = await api.getPFASCompounds(searchQuery || undefined, minC, maxC);
      setCompounds(data);
      if (data.length > 0 && !selectedCompound) {
        setSelectedCompound(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load PFAS compound catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompounds();
  }, [searchQuery, carbonFilter]);

  const handleCreateCompound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAcronym.trim() || !formFormula.trim()) {
      setFormError('Common name, acronym, and chemical formula are mandatory.');
      return;
    }
    const mw = parseFloat(formMw);
    const c = parseInt(formCarbons, 10);
    const f = parseInt(formFluorines, 10);
    if (isNaN(mw) || isNaN(c) || isNaN(f) || c <= 0 || f <= 0) {
      setFormError('Molecular weight, carbons, and fluorines must be valid positive numbers.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      await api.createPFASCompound({
        common_name: formName.trim(),
        acronym: formAcronym.trim().toUpperCase(),
        cas_number: formCas.trim() || undefined,
        chemical_formula: formFormula.trim(),
        smiles: formSmiles.trim() || undefined,
        molecular_weight: mw,
        num_carbons: c,
        num_fluorines: f,
        property_sources: formSources.trim() || undefined,
        notes: formNotes.trim() || undefined
      });
      setModalOpen(false);
      resetForm();
      fetchCompounds();
    } catch (err: any) {
      setFormError(err.message || 'Failed to register compound in catalog.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormAcronym('');
    setFormCas('');
    setFormFormula('');
    setFormSmiles('');
    setFormMw('414.07');
    setFormCarbons('8');
    setFormFluorines('15');
    setFormSources('PubChem / EPA CompTox');
    setFormNotes('');
    setFormError(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.08) 0%, rgba(37, 99, 235, 0.04) 100%, #FFFFFF)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-cyan">Module 2</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              PFAS Knowledge Base & Registry
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            PFAS Molecular Library
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '680px' }}>
            Comprehensive database of per- and polyfluoroalkyl substances with curated CAS numbers, SMILES structures,
            chain-length categorization (short vs. long chain), and verified toxicological profiles.
          </p>
        </div>

        <button
          onClick={() => requireAuth(() => setModalOpen(true), "Sign in to register compounds in the PFAS catalog.")}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            backgroundColor: 'var(--accent-cyan)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(8, 145, 178, 0.3)'
          }}
        >
          <Plus size={16} /> Register New Compound
        </button>
      </div>

      {/* Controls Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 18px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search by name, acronym, CAS number, or SMILES..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
                backgroundColor: 'var(--bg-main)'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Chain Length:
          </span>
          {(['All', 'Short', 'Long'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setCarbonFilter(filter)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: carbonFilter === filter ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                backgroundColor: carbonFilter === filter ? '#E0F2FE' : '#FFFFFF',
                color: carbonFilter === filter ? 'var(--accent-cyan)' : 'var(--text-secondary)'
              }}
            >
              {filter === 'All' ? 'All Classes' : filter === 'Short' ? 'Short Chain (C1-C6)' : 'Long Chain (C7+)'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(360px, 1fr)', gap: '20px' }}>
        {/* Compounds Table / Grid */}
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#FAFCFE'
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              Catalog Registry ({compounds.length} items)
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click row to inspect molecular dossier
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading registered PFAS compounds...
            </div>
          ) : compounds.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No compounds found matching criteria.
            </div>
          ) : (
            <div style={{ maxHeight: '620px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: '#F8FAFC' }}>
                    <th style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Compound</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Formula</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Carbons</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Class</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>CAS Reg</th>
                  </tr>
                </thead>
                <tbody>
                  {compounds.map((c) => {
                    const isSelected = selectedCompound?.id === c.id;
                    const isLong = (c.num_carbons || 0) >= 7;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCompound(c)}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'var(--accent-cyan)' }}>{c.acronym}</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              {c.common_name}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace' }}>
                          {c.chemical_formula}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: isLong ? '#FEF2F2' : '#F0FDF4',
                              color: isLong ? '#991B1B' : '#166534',
                              border: isLong ? '1px solid #FECACA' : '1px solid #BBF7D0'
                            }}
                          >
                            C{c.num_carbons || '?'} ({isLong ? 'Long-chain' : 'Short-chain'})
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                          {c.acronym.endsWith('S') ? 'Sulfonate' : 'Carboxylate'}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>
                          {c.cas_number || 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Compound Molecular Dossier */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedCompound ? (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {selectedCompound.acronym}
                    </h2>
                    <span className="badge badge-cyan">{selectedCompound.chemical_formula}</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {selectedCompound.common_name}
                  </div>
                </div>

                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: (selectedCompound.num_carbons || 0) >= 7 ? '#FEE2E2' : '#DCFCE7',
                    color: (selectedCompound.num_carbons || 0) >= 7 ? '#991B1B' : '#166534'
                  }}
                >
                  {(selectedCompound.num_carbons || 0) >= 7 ? 'High Persistence (C7+)' : 'High Mobility (C1-C6)'}
                </span>
              </div>

              {/* Chemical Metrics Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Molecular Weight
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedCompound.molecular_weight ? `${selectedCompound.molecular_weight} g/mol` : '414.07 g/mol'}
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Stoichiometric Fluorines
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                    {selectedCompound.num_fluorines || 15} Fluorine Atoms
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    CAS Registry Number
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {selectedCompound.cas_number || '335-67-1'}
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Degradation Difficulty
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#DC2626' }}>
                    High Bond Energy (~485 kJ/mol)
                  </div>
                </div>
              </div>

              {/* 2D Skeletal Molecular Structure Renderer */}
              <div style={{ marginBottom: '20px' }}>
                <ChemicalStructure2D
                  smiles={selectedCompound.smiles || 'FC(F)(F)C(F)(F)C(F)(F)C(F)(F)C(F)(F)C(F)(F)C(F)(F)C(=O)O'}
                  compoundName={`${selectedCompound.acronym} — ${selectedCompound.chemical_formula}`}
                  width={380}
                  height={190}
                  theme="light"
                />
              </div>

              {/* SMILES Section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Canonical SMILES String
                </div>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#1E293B',
                    color: '#38BDF8',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.76rem',
                    wordBreak: 'break-all'
                  }}
                >
                  {selectedCompound.smiles || 'FC(F)(F)C(F)(F)C(F)(F)C(F)(F)C(F)(F)C(F)(F)C(F)(F)C(=O)O'}
                </div>
              </div>

              {/* Notes & Toxicological Warnings */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#B45309', fontWeight: 700, fontSize: '0.8rem', marginBottom: '4px' }}>
                  <AlertTriangle size={15} /> Environmental & Regulatory Classification
                </div>
                <div style={{ fontSize: '0.78rem', color: '#92400E', lineHeight: 1.45 }}>
                  {selectedCompound.notes ||
                    'Designated as persistent organic pollutant under Stockholm Convention. EPA Maximum Contaminant Level (MCL) enforceability limits established at 4.0 ng/L (parts-per-trillion).'}
                </div>
              </div>

              {/* Quick Action Navigation */}
              {onNavigate && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => onNavigate('chemistry')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    <Atom size={15} color="var(--accent-cyan)" /> Ab-Initio SCF Solver
                  </button>

                  <button
                    onClick={() => onNavigate('fluorine')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--accent-cyan)',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      cursor: 'pointer'
                    }}
                  >
                    Mass Balance Audit <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a compound from the catalog to view details.
            </div>
          )}
        </div>
      </div>

      {/* Compound Registration Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#F8FAFC'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Register PFAS Compound
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCompound} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {formError && (
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: '0.8rem' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Acronym *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PFOS"
                    value={formAcronym}
                    onChange={(e) => setFormAcronym(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Common Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Perfluorooctanesulfonic acid"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Chemical Formula *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. C8HF17O3S"
                    value={formFormula}
                    onChange={(e) => setFormFormula(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    CAS Registry Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1763-23-1"
                    value={formCas}
                    onChange={(e) => setFormCas(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  SMILES String
                </label>
                <input
                  type="text"
                  placeholder="e.g. C(C(C(C(F)(F)S(=O)(=O)O)(F)F)(F)F)..."
                  value={formSmiles}
                  onChange={(e) => setFormSmiles(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem', fontFamily: 'JetBrains Mono, monospace' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Mol. Weight (g/mol)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formMw}
                    onChange={(e) => setFormMw(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Carbon Count
                  </label>
                  <input
                    type="number"
                    value={formCarbons}
                    onChange={(e) => setFormCarbons(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Fluorine Count
                  </label>
                  <input
                    type="number"
                    value={formFluorines}
                    onChange={(e) => setFormFluorines(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Toxicological & Persistence Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes on regulatory thresholds, half-life, or known exposure risks..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: '#FFFFFF', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: 'var(--accent-cyan)', color: '#FFFFFF', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  {submitting ? 'Registering...' : 'Save Compound'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {onNavigate && <WorkflowFooter currentTab="pfas" onNavigate={onNavigate} />}
    </div>
  );
};
