import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Atom,
  Cpu,
  Sliders,
  Scale,
  GitBranch,
  FileText,
  X
} from 'lucide-react';

export type TabKey =
  | 'overview'
  | 'catalysts'
  | 'chemistry'
  | 'quantum'
  | 'prioritization'
  | 'fluorine'
  | 'pathways'
  | 'evidence';

interface SidebarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  stepNum: string;
}

interface StageGroup {
  stageNumber: number;
  stageName: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, isOpen, onClose }) => {
  const stageGroups: StageGroup[] = [
    {
      stageNumber: 1,
      stageName: 'Stage 1: Forensic Audit',
      items: [
        {
          key: 'overview',
          label: 'Executive Overview',
          stepNum: '1.1',
          icon: <LayoutDashboard size={16} />
        },
        {
          key: 'fluorine',
          label: 'Fluorine Mass Balance',
          stepNum: '1.2',
          icon: <Scale size={16} />
        }
      ]
    },
    {
      stageNumber: 2,
      stageName: 'Stage 2: Quantum & Chemistry',
      items: [
        {
          key: 'pathways',
          label: 'Pathway Explorer',
          stepNum: '2.1',
          icon: <GitBranch size={16} />
        },
        {
          key: 'chemistry',
          label: 'Ab-Initio Chemistry',
          stepNum: '2.2',
          icon: <Atom size={16} />
        },
        {
          key: 'quantum',
          label: 'Quantum Algorithm Lab',
          stepNum: '2.3',
          icon: <Cpu size={16} />
        }
      ]
    },
    {
      stageNumber: 3,
      stageName: 'Stage 3: Catalyst Decision',
      items: [
        {
          key: 'catalysts',
          label: 'Catalyst Intelligence',
          stepNum: '3.1',
          icon: <Layers size={16} />
        },
        {
          key: 'prioritization',
          label: '10-D Prioritization',
          stepNum: '3.2',
          icon: <Sliders size={16} />
        }
      ]
    },
    {
      stageNumber: 4,
      stageName: 'Stage 4: Synthesis & Dossiers',
      items: [
        {
          key: 'evidence',
          label: 'Evidence & PDF Dossiers',
          stepNum: '4.1',
          icon: <FileText size={16} />
        }
      ]
    }
  ];

  return (
    <aside
      className={`sidebar-wrapper ${isOpen ? 'mobile-open' : ''}`}
      style={{
        borderRight: '1px solid var(--border-subtle)',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 12px',
        userSelect: 'none',
        height: '100%',
        minHeight: '100vh',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Header with Title & Mobile Close Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 14px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-cyan)', letterSpacing: '0.08em' }}>
            Discovery Workflow
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Research Pipeline
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="hamburger-btn"
            style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
            title="Close navigation"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Structured Pipeline Stage Groups */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto', paddingTop: '14px' }}>
        {stageGroups.map((group) => {
          const isGroupActive = group.items.some((i) => i.key === currentTab);

          return (
            <div key={group.stageNumber} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isGroupActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  padding: '2px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isGroupActive ? 'var(--accent-cyan)' : '#CBD5E1'
                  }}
                />
                {group.stageName}
              </div>

              {group.items.map((item) => {
                const isActive = currentTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onSelectTab(item.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      background: isActive
                        ? 'linear-gradient(90deg, rgba(8, 145, 178, 0.12) 0%, rgba(37, 99, 235, 0.05) 100%)'
                        : 'transparent',
                      border: isActive ? '1px solid rgba(8, 145, 178, 0.3)' : '1px solid transparent',
                      color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span
                        className="mono"
                        style={{
                          fontSize: '0.68rem',
                          color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                          fontWeight: 700,
                          minWidth: '20px'
                        }}
                      >
                        {item.stepNum}
                      </span>
                      <span style={{ color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)', display: 'flex' }}>
                        {item.icon}
                      </span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                    </div>

                    {isActive && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'var(--accent-cyan)',
                          boxShadow: '0 0 6px rgba(8, 145, 178, 0.6)',
                          flexShrink: 0
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div
        style={{
          marginTop: 'auto',
          padding: '10px 12px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.7rem',
          color: 'var(--text-muted)'
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
          Strict Local Execution
        </div>
        <div>100% local Python SCF, VQE & Platypus. Zero external Docker required.</div>
      </div>
    </aside>
  );
};
