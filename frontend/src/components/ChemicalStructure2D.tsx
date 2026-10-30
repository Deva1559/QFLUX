import React, { useEffect, useRef, useState } from 'react';
import SmilesDrawer from 'smiles-drawer';
import { Eye, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

interface ChemicalStructure2DProps {
  smiles: string;
  compoundName?: string;
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
}

export const ChemicalStructure2D: React.FC<ChemicalStructure2DProps> = ({
  smiles,
  compoundName,
  width = 380,
  height = 240,
  theme = 'light'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState<boolean>(false);
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>(theme);

  useEffect(() => {
    if (!canvasRef.current || !smiles) return;

    setRenderError(null);
    setIsRendered(false);

    try {
      // Configuration for SmilesDrawer
      const options = {
        width: width,
        height: height,
        bondThickness: 1.5,
        bondLength: 20,
        shortBondLength: 0.85,
        bondSpacing: 0.18 * 20,
        atomVisualization: 'default',
        isomeric: true,
        debug: false,
        terminalCarbons: true,
        explicitHydrogens: false,
        overlapSensitivity: 0.42,
        compactDrawing: true,
        fontSizeLarge: 7,
        fontSizeSmall: 5,
        padding: 24,
        themes: {
          light: {
            C: '#0F172A',
            O: '#DC2626',
            N: '#2563EB',
            F: '#0284C7',
            CL: '#16A34A',
            BR: '#9333EA',
            I: '#4C1D95',
            P: '#EA580C',
            S: '#D97706',
            B: '#D97706',
            SI: '#D97706',
            H: '#64748B',
            BACKGROUND: '#FFFFFF'
          },
          dark: {
            C: '#F8FAFC',
            O: '#F87171',
            N: '#60A5FA',
            F: '#38BDF8',
            CL: '#4ADE80',
            BR: '#C084FC',
            I: '#A78BFA',
            P: '#FB923C',
            S: '#FBBF24',
            B: '#FBBF24',
            SI: '#FBBF24',
            H: '#94A3B8',
            BACKGROUND: '#0F172A'
          }
        }
      };

      const drawer = new (SmilesDrawer as any).Drawer(options);

      (SmilesDrawer as any).parse(
        smiles,
        (tree: any) => {
          if (canvasRef.current) {
            drawer.draw(tree, canvasRef.current, activeTheme, false);
            setIsRendered(true);
          }
        },
        (err: any) => {
          console.warn('SmilesDrawer parse warning:', err);
          setRenderError(`Could not render 2D SMILES graph: ${typeof err === 'string' ? err : 'Syntax not supported'}`);
        }
      );
    } catch (err: any) {
      console.error('ChemicalStructure2D error:', err);
      setRenderError(err.message || 'Error initializing 2D structure engine.');
    }
  }, [smiles, width, height, activeTheme]);

  // Extract fluorines and carbons for the summary banner
  const fCount = (smiles.match(/F/g) || []).length;
  const cCount = (smiles.match(/C/g) || []).length;
  const oCount = (smiles.match(/O/g) || []).length;
  const sCount = (smiles.match(/S/g) || []).length;

  return (
    <div
      style={{
        borderRadius: '12px',
        border: '1px solid var(--border-subtle, #E2E8F0)',
        backgroundColor: activeTheme === 'dark' ? '#0F172A' : '#FFFFFF',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: `1px solid ${activeTheme === 'dark' ? '#1E293B' : '#F1F5F9'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: activeTheme === 'dark' ? '#1E293B' : '#F8FAFC'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={15} color="#0284C7" />
          <span
            style={{
              fontWeight: 700,
              fontSize: '0.8rem',
              color: activeTheme === 'dark' ? '#F8FAFC' : '#1E293B'
            }}
          >
            2D Skeletal Molecular Geometry {compoundName ? `— ${compoundName}` : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setActiveTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
            style={{
              padding: '4px 8px',
              fontSize: '0.72rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: `1px solid ${activeTheme === 'dark' ? '#334155' : '#CBD5E1'}`,
              backgroundColor: activeTheme === 'dark' ? '#0F172A' : '#FFFFFF',
              color: activeTheme === 'dark' ? '#94A3B8' : '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Toggle Light / Dark contrast mode"
          >
            <RefreshCw size={11} /> {activeTheme === 'light' ? 'Dark View' : 'Light View'}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '12px',
          minHeight: `${height}px`,
          backgroundColor: activeTheme === 'dark' ? '#0F172A' : '#FFFFFF'
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            maxWidth: '100%',
            height: 'auto',
            display: renderError ? 'none' : 'block'
          }}
        />

        {renderError && (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: '#B91C1C',
              backgroundColor: '#FEF2F2',
              borderRadius: '8px',
              border: '1px solid #FECACA',
              margin: '12px',
              width: '100%'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <AlertCircle size={22} color="#DC2626" />
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>
              SMILES Notation Visualization
            </div>
            <div style={{ fontSize: '0.76rem', color: '#991B1B', marginBottom: '10px' }}>
              {renderError}
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                fontFamily: 'JetBrains Mono, monospace',
                backgroundColor: '#FFFFFF',
                padding: '6px 10px',
                borderRadius: '6px',
                wordBreak: 'break-all',
                color: '#475569'
              }}
            >
              {smiles}
            </div>
          </div>
        )}
      </div>

      {/* Atomic Distribution Footer */}
      <div
        style={{
          padding: '8px 14px',
          borderTop: `1px solid ${activeTheme === 'dark' ? '#1E293B' : '#F1F5F9'}`,
          backgroundColor: activeTheme === 'dark' ? '#1E293B' : '#F8FAFC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={13} color="#0284C7" />
          <span style={{ fontSize: '0.73rem', fontWeight: 600, color: activeTheme === 'dark' ? '#94A3B8' : '#64748B' }}>
            Atomic Composition:
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {cCount > 0 && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: activeTheme === 'dark' ? '#334155' : '#E2E8F0',
                color: activeTheme === 'dark' ? '#F8FAFC' : '#1E293B'
              }}
            >
              C: {cCount}
            </span>
          )}
          {fCount > 0 && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: '#E0F2FE',
                color: '#0369A1'
              }}
            >
              F: {fCount}
            </span>
          )}
          {oCount > 0 && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: '#FEE2E2',
                color: '#B91C1C'
              }}
            >
              O: {oCount}
            </span>
          )}
          {sCount > 0 && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: '#FEF3C7',
                color: '#B45309'
              }}
            >
              S: {sCount}
            </span>
          )}
          <span
            style={{
              fontSize: '0.7rem',
              color: activeTheme === 'dark' ? '#64748B' : '#94A3B8',
              marginLeft: '4px'
            }}
          >
            Interactive Canvas (SmilesDrawer)
          </span>
        </div>
      </div>
    </div>
  );
};
