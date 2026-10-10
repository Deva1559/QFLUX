import React from 'react';
import { TabKey } from './Sidebar';
import { Scale, Atom, Sliders, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

interface PipelineStepperProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export interface PipelineStage {
  id: number;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  primaryTab: TabKey;
  tabs: TabKey[];
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 1,
    label: 'Stage 1: Forensic Audit',
    subtitle: 'Mass Balance & Deficit',
    icon: <Scale size={15} />,
    primaryTab: 'fluorine',
    tabs: ['overview', 'fluorine']
  },
  {
    id: 2,
    label: 'Stage 2: Quantum & SCF',
    subtitle: 'Ab-Initio & VQE Lab',
    icon: <Atom size={15} />,
    primaryTab: 'chemistry',
    tabs: ['pathways', 'chemistry', 'quantum']
  },
  {
    id: 3,
    label: 'Stage 3: Catalyst Decision',
    subtitle: '10-D MCDA Screening',
    icon: <Sliders size={15} />,
    primaryTab: 'catalysts',
    tabs: ['catalysts', 'prioritization']
  },
  {
    id: 4,
    label: 'Stage 4: Synthesis Dossier',
    subtitle: 'PDF Reports & Advisor',
    icon: <FileText size={15} />,
    primaryTab: 'evidence',
    tabs: ['evidence']
  }
];

export const PipelineStepper: React.FC<PipelineStepperProps> = ({ currentTab, onSelectTab }) => {
  const currentStageIndex = PIPELINE_STAGES.findIndex((s) => s.tabs.includes(currentTab));
  const activeStage = currentStageIndex >= 0 ? PIPELINE_STAGES[currentStageIndex] : PIPELINE_STAGES[0];

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 16px',
        marginBottom: '20px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        width: '100%'
      }}
    >
      {/* Left Pipeline Header Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'fit-content' }}>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--accent-cyan)',
            background: '#F0F9FF',
            border: '1px solid #BAE6FD',
            padding: '3px 8px',
            borderRadius: '12px'
          }}
        >
          Scientific Pipeline
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {activeStage.label}
        </span>
      </div>

      {/* Stepper Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flex: '1 1 auto',
          justifyContent: 'center',
          overflowX: 'auto',
          padding: '2px 0',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {PIPELINE_STAGES.map((stage, idx) => {
          const isActive = stage.tabs.includes(currentTab);
          const isCompleted = idx < currentStageIndex;

          return (
            <React.Fragment key={stage.id}>
              <button
                onClick={() => onSelectTab(stage.primaryTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: isActive
                    ? '#E0F2FE'
                    : isCompleted
                    ? '#ECFDF5'
                    : 'var(--bg-surface)',
                  border: isActive
                    ? '1.5px solid var(--accent-cyan)'
                    : isCompleted
                    ? '1px solid #A7F3D0'
                    : '1px solid var(--border-subtle)',
                  color: isActive
                    ? 'var(--accent-cyan)'
                    : isCompleted
                    ? '#059669'
                    : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.76rem',
                  fontWeight: isActive ? 700 : 600,
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
                title={`Jump to ${stage.label}`}
              >
                <span style={{ display: 'flex' }}>
                  {isCompleted ? <CheckCircle2 size={13} color="#059669" /> : stage.icon}
                </span>
                <span>{stage.label.replace('Stage ', '')}</span>
              </button>

              {idx < PIPELINE_STAGES.length - 1 && (
                <span
                  style={{
                    color: idx < currentStageIndex ? '#059669' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0
                  }}
                >
                  <ArrowRight size={12} />
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
