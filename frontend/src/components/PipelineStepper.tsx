import React from 'react';
import { TabKey } from './Sidebar';
import { BookOpen, Atom, Sliders, FolderKanban, CheckCircle2, ArrowRight } from 'lucide-react';

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
    label: 'Stage 1: Knowledge & Literature',
    subtitle: 'PFAS & Source Evidence',
    icon: <BookOpen size={15} />,
    primaryTab: 'pfas',
    tabs: ['overview', 'pfas', 'literature']
  },
  {
    id: 2,
    label: 'Stage 2: Quantum & SCF Lab',
    subtitle: 'Ab-Initio & VQE Benchmarks',
    icon: <Atom size={15} />,
    primaryTab: 'chemistry',
    tabs: ['pathways', 'chemistry', 'quantum']
  },
  {
    id: 3,
    label: 'Stage 3: Catalysts & Audit',
    subtitle: 'Forensic Balance & Deficit',
    icon: <Sliders size={15} />,
    primaryTab: 'catalysts',
    tabs: ['catalysts', 'fluorine', 'prioritization']
  },
  {
    id: 4,
    label: 'Stage 4: Execution & Reports',
    subtitle: 'Protocols & PDF Dossiers',
    icon: <FolderKanban size={15} />,
    primaryTab: 'reports',
    tabs: ['experiments', 'recommendations', 'reports', 'settings', 'evidence']
  }
];

export const PipelineStepper: React.FC<PipelineStepperProps> = ({ currentTab, onSelectTab }) => {
  const currentStageIndex = PIPELINE_STAGES.findIndex((s) => s.tabs.includes(currentTab));
  const activeStage = currentStageIndex >= 0 ? PIPELINE_STAGES[currentStageIndex] : PIPELINE_STAGES[0];
  const progressPct = Math.round(((currentStageIndex + 1) / PIPELINE_STAGES.length) * 100);

  return (
    <div
      style={{
        background: 'var(--stepper-bg)',
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
            background: 'rgba(8, 145, 178, 0.12)',
            border: '1px solid rgba(8, 145, 178, 0.25)',
            padding: '3px 8px',
            borderRadius: '12px'
          }}
        >
          Scientific Pipeline
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {activeStage.label}
        </span>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: 'var(--accent-emerald)',
            background: 'rgba(5, 150, 105, 0.1)',
            border: '1px solid rgba(5, 150, 105, 0.25)',
            padding: '2px 7px',
            borderRadius: '10px'
          }}
        >
          {progressPct}%
        </span>
      </div>

      {/* Stepper Bar */}
      <div
        className="smooth-scroll-x"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flex: '1 1 auto',
          justifyContent: 'flex-start',
          padding: '2px 0'
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
                    ? 'rgba(8, 145, 178, 0.16)'
                    : isCompleted
                    ? 'rgba(5, 150, 105, 0.12)'
                    : 'var(--bg-surface)',
                  border: isActive
                    ? '1.5px solid var(--accent-cyan)'
                    : isCompleted
                    ? '1px solid rgba(5, 150, 105, 0.35)'
                    : '1px solid var(--border-subtle)',
                  color: isActive
                    ? 'var(--accent-cyan)'
                    : isCompleted
                    ? 'var(--accent-emerald)'
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
