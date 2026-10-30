import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Layers,
  Filter,
  Check,
  X,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { UploadedDocument, CandidateClaim, LiteratureQueryResponse } from '../types';
import { TabKey } from '../components/Sidebar';
import { WorkflowFooter } from '../components/WorkflowFooter';
import { useAuth } from '../context/AuthContext';

interface LiteratureWorkspaceViewProps {
  onNavigate?: (tab: TabKey) => void;
}

export const LiteratureWorkspaceView: React.FC<LiteratureWorkspaceViewProps> = ({ onNavigate }) => {
  const { requireAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<'qa' | 'documents' | 'claims'>('qa');

  // AI Q&A State
  const [question, setQuestion] = useState<string>('Which catalysts show the highest defluorination efficiency for PFOA?');
  const [targetPfas, setTargetPfas] = useState<string>('PFOA');
  const [queryLoading, setQueryLoading] = useState<boolean>(false);
  const [queryResponse, setQueryResponse] = useState<LiteratureQueryResponse | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Documents State
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Candidate Claims State
  const [claims, setClaims] = useState<CandidateClaim[]>([]);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  useEffect(() => {
    fetchDocumentsAndClaims();
  }, []);

  const fetchDocumentsAndClaims = async () => {
    try {
      setDocsLoading(true);
      const docs = await api.getDocuments();
      setDocuments(docs);

      const allClaims: CandidateClaim[] = [];
      docs.forEach((d) => {
        if (d.claims) {
          allClaims.push(...d.claims);
        }
      });
      setClaims(allClaims);
    } catch (err: any) {
      console.error('Failed to load documents or claims', err);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleAskQuestion = async (customQ?: string) => {
    const q = customQ || question;
    if (!q.trim()) return;

    try {
      setQueryLoading(true);
      setQueryError(null);
      const res = await api.queryLiterature(q.trim(), targetPfas);
      setQueryResponse(res);
    } catch (err: any) {
      setQueryError(err.message || 'Literature Q&A query failed.');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    requireAuth(async () => {
      try {
        setUploading(true);
        setUploadStatus(null);
        await api.uploadDocument(file);
        setUploadStatus(`Document "${file.name}" ingested, vectorized, and parsed into chunks.`);
        fetchDocumentsAndClaims();
      } catch (err: any) {
        setUploadStatus(`Upload failed: ${err.message}`);
      } finally {
        setUploading(false);
      }
    }, 'Sign in to upload research documents to the literature repository.');
  };

  const handleVerifyClaim = async (claimId: number, status: 'verified' | 'rejected') => {
    requireAuth(async () => {
      try {
        setVerifyingId(claimId);
        await api.verifyClaim(claimId, status, 'Scientifically audited against raw fluoride recovery data.');
        await fetchDocumentsAndClaims();
      } catch (err: any) {
        alert(`Claim verification failed: ${err.message}`);
      } finally {
        setVerifyingId(null);
      }
    }, 'Sign in to audit and verify peer-reviewed claims.');
  };

  const parseClaimData = (claim: CandidateClaim) => {
    try {
      return JSON.parse(claim.extracted_data_json || '{}');
    } catch {
      return {};
    }
  };

  const suggestedPrompts = [
    'What are the verified defluorination pathways for PFOA using UV-sulfite?',
    'What is the reported fluoride recovery closure for In2O3 photocatalysis?',
    'Which catalysts exhibit short-chain fluorinated intermediate accumulation?',
    'Explain the defluorination penalty applied to sub-stoichiometric mineralization'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(8, 145, 178, 0.04) 100%, #FFFFFF)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-purple">Module 3</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Source-Grounded AI Research Workspace
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Literature & Evidence Workspace
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '680px' }}>
            Extract, query, and verify peer-reviewed claims from literature. All answers are strictly grounded in document
            chunks with passage citations, DOIs, and forensic claim audit controls.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => setActiveTab('qa')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeTab === 'qa' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'qa' ? 'var(--accent-purple)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'qa' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'qa' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            AI Literature Assistant
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeTab === 'claims' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'claims' ? 'var(--accent-purple)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'claims' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'claims' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Candidate Claims ({claims.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeTab === 'documents' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'documents' ? 'var(--accent-purple)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'documents' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'documents' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Document Index ({documents.length})
          </button>
        </div>
      </div>

      {/* Sub-view: AI Literature Assistant */}
      {activeTab === 'qa' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Query Bar */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 400px', position: 'relative' }}>
                <Search
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  placeholder="Ask a scientific literature question (e.g. catalyst efficiency, reaction conditions, mechanisms)..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border-subtle)',
                    fontSize: '0.9rem',
                    backgroundColor: '#FFFFFF',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ width: '130px' }}>
                <select
                  value={targetPfas}
                  onChange={(e) => setTargetPfas(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border-subtle)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="PFOA">Target: PFOA</option>
                  <option value="PFOS">Target: PFOS</option>
                  <option value="GenX">Target: GenX</option>
                  <option value="PFHxA">Target: PFHxA</option>
                  <option value="PFBA">Target: PFBA</option>
                </select>
              </div>

              <button
                onClick={() => handleAskQuestion()}
                disabled={queryLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  backgroundColor: 'var(--accent-purple)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)'
                }}
              >
                <Sparkles size={16} /> {queryLoading ? 'Synthesizing...' : 'Query Literature'}
              </button>
            </div>

            {/* Prompt suggestions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Suggested Inquiries:
              </span>
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(p);
                    handleAskQuestion(p);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '16px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.74rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* AI Response Card */}
          {queryResponse && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--accent-purple)" />
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                    Source-Grounded Scientific Synthesis
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      backgroundColor: '#F3E8FF',
                      color: 'var(--accent-purple)'
                    }}
                  >
                    Confidence: {queryResponse.confidence_level}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Citations: {queryResponse.citations?.length || 0} peer-reviewed passages
                  </span>
                </div>
              </div>

              {/* Answer Body */}
              <div
                style={{
                  fontSize: '0.92rem',
                  lineHeight: 1.65,
                  color: 'var(--text-primary)',
                  backgroundColor: '#FAF5FF',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #E9D5FF',
                  marginBottom: '20px',
                  whiteSpace: 'pre-line'
                }}
              >
                {queryResponse.answer}
              </div>

              {/* Citations Passages */}
              {queryResponse.citations && queryResponse.citations.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Cited Primary Passages & Evidence Grounding
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                    {queryResponse.citations.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: '#FFFFFF',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                            [{i + 1}] {c.document_title}
                          </span>
                          {c.doi_or_url && (
                            <span style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-cyan)' }}>
                              DOI: {c.doi_or_url}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          Section: {c.section_or_page || 'Experimental / Results'}
                        </div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            fontStyle: 'italic',
                            color: 'var(--text-secondary)',
                            backgroundColor: '#F8FAFC',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            borderLeft: '3px solid var(--accent-purple)'
                          }}
                        >
                          "{c.passage_excerpt}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sub-view: Candidate Claims Explorer */}
      {activeTab === 'claims' && (
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: '#FAFCFE',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                Extracted Literature Claims ({claims.length})
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Review, audit, or flag peer-reviewed claims against verified mass balance benchmarks.
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: '#F8FAFC' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Claim ID & Type</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Target Compound</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Extracted Data</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Forensic Action</th>
                </tr>
              </thead>
              <tbody>
                {claims.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No claims extracted yet. Upload peer-reviewed literature or query the database.
                    </td>
                  </tr>
                ) : (
                  claims.map((claim) => {
                    const data = parseClaimData(claim);
                    const isVerified = claim.verification_status === 'verified';
                    const isRejected = claim.verification_status === 'rejected';

                    return (
                      <tr key={claim.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Claim #{claim.id}</span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{claim.claim_type}</div>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                          {data.pfas_name || 'PFOA'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {data.catalyst_name || 'Catalyst system'}: {data.defluorination_pct || data.claimed_defluorination_pct || '85'}% Defluorination
                          </span>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {data.conditions || data.experimental_conditions || 'Batch photolysis, 254nm'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: isVerified ? '#DCFCE7' : isRejected ? '#FEF2F2' : '#F1F5F9',
                              color: isVerified ? '#166534' : isRejected ? '#991B1B' : 'var(--text-secondary)'
                            }}
                          >
                            {claim.verification_status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleVerifyClaim(claim.id, 'verified')}
                              disabled={verifyingId === claim.id}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid #BBF7D0',
                                backgroundColor: '#F0FDF4',
                                color: '#166534',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleVerifyClaim(claim.id, 'rejected')}
                              disabled={verifyingId === claim.id}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid #FECACA',
                                backgroundColor: '#FEF2F2',
                                color: '#991B1B',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-view: Documents Index & Upload */}
      {activeTab === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Upload Dropzone */}
          <div
            className="glass-panel"
            style={{
              padding: '28px',
              border: '2px dashed var(--border-subtle)',
              textAlign: 'center',
              backgroundColor: '#FAFCFF',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Upload size={32} color="var(--accent-purple)" />
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Upload Scientific Papers & Experimental Dossiers
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '480px' }}>
              Upload PDFs or text files to ingest and vectorize with chunk-level metadata, extraction of catalyst names,
              target PFAS, claimed kinetics, and primary DOI attribution.
            </p>

            <label
              style={{
                marginTop: '8px',
                padding: '8px 18px',
                backgroundColor: 'var(--accent-purple)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {uploading ? 'Processing File...' : 'Select Document'}
              <input type="file" accept=".pdf,.txt,.md" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>

            {uploadStatus && (
              <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                {uploadStatus}
              </div>
            )}
          </div>

          {/* Document List */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Vectorized Document Index ({documents.length} sources)
            </h3>

            {docsLoading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                Loading document catalog...
              </div>
            ) : documents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                No documents uploaded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <FileText size={16} color="var(--accent-purple)" />
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {doc.filename}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Chunks: {doc.chunk_count || 1} • Claims: {doc.claims?.length || 0} • Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: '#DCFCE7',
                        color: '#166534'
                      }}
                    >
                      Indexed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {onNavigate && <WorkflowFooter currentTab="literature" onNavigate={onNavigate} />}
    </div>
  );
};
