import { useEffect } from 'react';

/**
 * Toast notification component.
 * @param {{ toasts: Array<{id, message, type}>, onRemove: (id) => void }} props
 */
export default function Toast({ toasts, onRemove }) {
  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const icons = { error: '✕', success: '✓', info: 'ℹ' };

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div className={`toast ${toast.type}`} role="alert">
      <span className="toast-icon">{icons[toast.type]}</span>
      <span className="toast-msg">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', padding: '0 0 0 8px', opacity: 0.6 }}
        aria-label="Dismiss"
      >✕</button>
    </div>
  );
}
