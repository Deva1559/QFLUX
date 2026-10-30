import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  FolderKanban,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Plus
} from 'lucide-react';
import { api, getApiBaseUrl } from '../services/api';
import { ReportItem } from '../types';
import { TabKey } from '../components/Sidebar';
import { WorkflowFooter } from '../components/WorkflowFooter';

interface ProjectsReportsViewProps {
  onNavigate?: (tab: TabKey) => void;
}

export const ProjectsReportsView: React.FC<ProjectsReportsViewProps> = ({ onNavigate }) => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [reportTitle, setReportTitle] = useState<string>('Q-FLUX 2.0 Scientific Dossier: PFOA Defluorination Benchmark');
  const [activeProjectId, setActiveProjectId] = useState<number>(1);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [activeProjectId]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await api.getReports(activeProjectId);
      setReports(data);
    } catch (err: any) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    try {
      setGenerating(true);
      setFeedback(null);
      const rep = await api.generateReport(activeProjectId, reportTitle.trim() || undefined);
      setFeedback(`PDF Dossier successfully compiled (${(rep.file_size_bytes / 1024).toFixed(1)} KB).`);
      loadReports();
    } catch (err: any) {
      setFeedback(`Generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadCsv = () => {
    const csvUrl = `${getApiBaseUrl()}/api/v1/reports/export/csv`;
    window.open(csvUrl, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Banner */}
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
            <span className="badge badge-cyan">Module 10</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Scientific Dossiers & Archival Reports
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Projects & Research Reports
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '680px' }}>
            Compile comprehensive peer-review ready PDF dossiers with ReportLab and export complete raw datasets
            in CSV format for external statistical validation and regulatory reporting.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDownloadCsv}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              backgroundColor: '#FFFFFF',
              color: 'var(--accent-cyan)',
              border: '1.5px solid var(--accent-cyan)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <FileSpreadsheet size={16} /> Export Raw CSV Dossier
          </button>
        </div>
      </div>

      {/* Report Generator Controls */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Compile Formal PDF Scientific Dossier
        </h3>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 360px' }}>
            <input
              type="text"
              placeholder="Dossier Title..."
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.88rem'
              }}
            />
          </div>

          <button
            onClick={handleGeneratePdf}
            disabled={generating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
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
            <FileText size={16} /> {generating ? 'Compiling PDF Dossier...' : 'Generate ReportLab PDF'}
          </button>
        </div>

        {feedback && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: feedback.includes('failed') ? '#FEF2F2' : '#F0FDF4',
              color: feedback.includes('failed') ? '#991B1B' : '#166534',
              border: feedback.includes('failed') ? '1px solid #FECACA' : '1px solid #BBF7D0',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
          >
            {feedback}
          </div>
        )}
      </div>

      {/* Generated Reports Table */}
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
          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            Compiled Project Reports & Dossiers ({reports.length})
          </span>
          <button
            onClick={loadReports}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading report archives...
          </div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No compiled reports yet. Click "Generate ReportLab PDF" above to build a verified dossier.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Dossier Title</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Format</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Size</th>
                  <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Date Compiled</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((rep) => (
                  <tr key={rep.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="var(--accent-cyan)" />
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rep.report_title}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge badge-cyan">PDF / ReportLab</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace' }}>
                      {(rep.file_size_bytes / 1024).toFixed(1)} KB
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                      {new Date(rep.generated_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <a
                        href={rep.download_url.startsWith('http') ? rep.download_url : `${getApiBaseUrl()}${rep.download_url}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#E0F2FE',
                          color: 'var(--accent-cyan)',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          textDecoration: 'none'
                        }}
                      >
                        <Download size={13} /> Download PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {onNavigate && <WorkflowFooter currentTab="reports" onNavigate={onNavigate} />}
    </div>
  );
};
