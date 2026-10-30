import React from 'react';
import { TabKey } from './Sidebar';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

interface StepInfo {
  prevTab?: TabKey;
  prevLabel?: string;
  nextTab?: TabKey;
  nextLabel?: string;
  milestoneTitle: string;
}

const STEP_FLOW: Record<TabKey, StepInfo> = {
  overview: {
    nextTab: 'pfas',
    nextLabel: 'Explore PFAS Compound Library',
    milestoneTitle: 'Research Target Defined: PFOA C-F Cleavage (~485 kJ/mol)'
  },
  pfas: {
    prevTab: 'overview',
    prevLabel: 'Executive Overview',
    nextTab: 'literature',
    nextLabel: 'Query Literature Evidence',
    milestoneTitle: 'PFAS Compound Catalog & Structural SMILES Audited'
  },
  literature: {
    prevTab: 'pfas',
    prevLabel: 'PFAS Library',
    nextTab: 'chemistry',
    nextLabel: 'Execute Ab-Initio Chemistry Solver',
    milestoneTitle: 'Peer-Reviewed Claims & Passages Vectorized'
  },
  chemistry: {
    prevTab: 'literature',
    prevLabel: 'Literature Workspace',
    nextTab: 'quantum',
    nextLabel: 'Launch Quantum VQE Workbench',
    milestoneTitle: 'RHF/STO-3G Ground State & ΔE_rxn Solved'
  },
  quantum: {
    prevTab: 'chemistry',
    prevLabel: 'Ab-Initio SCF Chemistry',
    nextTab: 'pathways',
    nextLabel: 'Inspect Elementary Pathways',
    milestoneTitle: '2-Qubit Active-Space Ground State Converged via VQE'
  },
  pathways: {
    prevTab: 'quantum',
    prevLabel: 'Quantum VQE Workbench',
    nextTab: 'catalysts',
    nextLabel: 'Screen Catalyst Intelligence',
    milestoneTitle: 'Degradation Intermediates & Radical Cleavage Mapped'
  },
  catalysts: {
    prevTab: 'pathways',
    prevLabel: 'Reaction Pathways',
    nextTab: 'fluorine',
    nextLabel: 'Audit Fluorine Mass Balance',
    milestoneTitle: '5 Primary Catalyst Literature Systems Audited'
  },
  fluorine: {
    prevTab: 'catalysts',
    prevLabel: 'Catalyst Explorer',
    nextTab: 'prioritization',
    nextLabel: 'Evaluate 10-D Decision Engine',
    milestoneTitle: 'Mass Balance & Volatile Deficit Closed (90% – 105%)'
  },
  prioritization: {
    prevTab: 'fluorine',
    prevLabel: 'Fluorine Balance Audit',
    nextTab: 'experiments',
    nextLabel: 'Plan Laboratory Protocols',
    milestoneTitle: 'Candidates Ranked with Defluorination Penalty Enforced'
  },
  experiments: {
    prevTab: 'prioritization',
    prevLabel: '10-D Prioritization',
    nextTab: 'recommendations',
    nextLabel: 'Review Explainable Recommendations',
    milestoneTitle: 'Batch Protocols Formulated with Matrix & Dark Controls'
  },
  recommendations: {
    prevTab: 'experiments',
    prevLabel: 'Experiment Planner',
    nextTab: 'reports',
    nextLabel: 'Compile PDF Dossiers & Reports',
    milestoneTitle: 'Catalyst Hierarchy Synthesized with Defluorination Penalty'
  },
  reports: {
    prevTab: 'recommendations',
    prevLabel: 'Recommendations Engine',
    nextTab: 'settings',
    nextLabel: 'Audit Environment & Backups',
    milestoneTitle: 'ReportLab PDF & CSV Scientific Dossiers Exported'
  },
  settings: {
    prevTab: 'reports',
    prevLabel: 'Projects & Reports',
    nextTab: 'overview',
    nextLabel: 'Return to Executive Dashboard',
    milestoneTitle: 'Local Python Virtual Environment & SQLite Snapshot Verified'
  },
  evidence: {
    prevTab: 'prioritization',
    prevLabel: '10-D Prioritization',
    nextTab: 'reports',
    nextLabel: 'View Projects & Reports',
    milestoneTitle: 'Synthesis Dossiers Compiled & Research Advisor Active'
  }
};

interface WorkflowFooterProps {
  currentTab: TabKey;
  onNavigate: (tab: TabKey) => void;
}

export const WorkflowFooter: React.FC<WorkflowFooterProps> = ({ currentTab, onNavigate }) => {
  const step = STEP_FLOW[currentTab];
  if (!step) return null;

  return (
    <div
      style={{
        marginTop: '32px',
        padding: '16px 20px',
        borderRadius: 'var(--radius-lg)',
        background: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}
    >
      {/* Previous Step Button */}
      {step.prevTab && step.prevLabel ? (
        <button
          onClick={() => onNavigate(step.prevTab!)}
          className="btn btn-secondary"
          style={{ padding: '8px 14px', fontSize: '0.8rem' }}
        >
          <ArrowLeft size={14} /> {step.prevLabel}
        </button>
      ) : (
        <div style={{ width: '100px' }} />
      )}

      {/* Milestone Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
        <CheckCircle2 size={16} color="var(--accent-emerald)" />
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {step.milestoneTitle}
        </span>
      </div>

      {/* Next Step Button */}
      {step.nextTab && step.nextLabel && (
        <button
          onClick={() => onNavigate(step.nextTab!)}
          className="btn btn-primary"
          style={{ padding: '9px 18px', fontSize: '0.82rem' }}
        >
          {step.nextLabel} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
};
