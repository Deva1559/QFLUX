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
    nextTab: 'fluorine',
    nextLabel: 'Audit Fluorine Mass Balance (Stage 1)',
    milestoneTitle: 'Research Target Defined: PFOA C-F Cleavage (~485 kJ/mol)'
  },
  fluorine: {
    prevTab: 'overview',
    prevLabel: 'Overview & Governance',
    nextTab: 'pathways',
    nextLabel: 'Explore Elementary Pathways (Stage 2A)',
    milestoneTitle: 'Mass Balance & Volatile Deficit Closed (90% – 105%)'
  },
  pathways: {
    prevTab: 'fluorine',
    prevLabel: 'Mass Balance Audit',
    nextTab: 'chemistry',
    nextLabel: 'Execute Ab-Initio SCF Engine (Stage 2B)',
    milestoneTitle: 'Degradation Intermediates & Radical Cleavage Mapped'
  },
  chemistry: {
    prevTab: 'pathways',
    prevLabel: 'Reaction Pathways',
    nextTab: 'quantum',
    nextLabel: 'Launch Quantum VQE Workbench (Stage 2C)',
    milestoneTitle: 'RHF/STO-3G Ground State & ΔE_rxn Solved'
  },
  quantum: {
    prevTab: 'chemistry',
    prevLabel: 'Ab-Initio SCF Chemistry',
    nextTab: 'catalysts',
    nextLabel: 'Screen Audited Catalysts (Stage 3A)',
    milestoneTitle: '2-Qubit Active-Space Ground State Converged via VQE'
  },
  catalysts: {
    prevTab: 'quantum',
    prevLabel: 'Quantum VQE Workbench',
    nextTab: 'prioritization',
    nextLabel: 'Evaluate 10-D Decision Engine (Stage 3B)',
    milestoneTitle: '5 Primary Catalyst Literature Systems Audited'
  },
  prioritization: {
    prevTab: 'catalysts',
    prevLabel: 'Catalyst Catalogue & Matrix',
    nextTab: 'evidence',
    nextLabel: 'Compile Publication PDF Dossier (Stage 4)',
    milestoneTitle: 'Candidates Ranked with Defluorination Penalty Enforced'
  },
  evidence: {
    prevTab: 'prioritization',
    prevLabel: '10-D Prioritization Engine',
    nextTab: 'overview',
    nextLabel: 'Restart Research Workflow',
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
