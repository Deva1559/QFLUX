import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 9999,
        maxWidth: '420px',
        width: 'calc(100vw - 48px)',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getTheme = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: '#ECFDF5',
          border: '#A7F3D0',
          text: '#065F46',
          icon: <CheckCircle2 size={18} color="#059669" />
        };
      case 'error':
        return {
          bg: '#FFF1F2',
          border: '#FECDD3',
          text: '#9F1239',
          icon: <AlertTriangle size={18} color="#E11D48" />
        };
      default:
        return {
          bg: '#F0F9FF',
          border: '#BAE6FD',
          text: '#075985',
          icon: <Info size={18} color="#0284C7" />
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      style={{
        pointerEvents: 'auto',
        background: '#FFFFFF',
        border: `1.5px solid ${theme.border}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ flexShrink: 0, marginTop: '2px' }}>{theme.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: theme.text, marginBottom: '2px' }}>
            {toast.title}
          </div>
        )}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          {toast.message}
        </div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          flexShrink: 0
        }}
        title="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
};
