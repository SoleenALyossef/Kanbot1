import { createContext, useCallback, useContext, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useI18n } from '../i18n';

type Kind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: Kind;
  message: string;
  ms: number;
  action?: { label: string; run: () => void };
}
interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  /** A toast with a button (e.g. "Undo"). */
  action: (message: string, label: string, run: () => void) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info } as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (kind: Kind, message: string, action?: ToastItem['action']) => {
      const id = nextId.current++;
      const ms = kind === 'error' ? 6500 : action ? 6000 : 3800;
      setToasts((list) => [...list.slice(-3), { id, kind, message, ms, action }]);
      window.setTimeout(() => dismiss(id), ms);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
      action: (m, label, run) => push('info', m, { label, run }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="region" aria-label={t('common.notifications')}>
        {toasts.map((item) => {
          const Icon = ICONS[item.kind];
          return (
            <div key={item.id} className={`toast toast-${item.kind}`} role={item.kind === 'error' ? 'alert' : 'status'}>
              <Icon size={18} aria-hidden="true" />
              <span className="toast-msg">{item.message}</span>
              {item.action ? (
                <button
                  type="button"
                  className="toast-action"
                  onClick={() => {
                    item.action?.run();
                    dismiss(item.id);
                  }}
                >
                  {item.action.label}
                </button>
              ) : null}
              <button type="button" className="icon-btn icon-btn-sm" onClick={() => dismiss(item.id)} aria-label={t('common.dismiss')}>
                <X size={14} aria-hidden="true" />
              </button>
              <span className="toast-bar" style={{ '--dur': `${item.ms}ms` } as CSSProperties} aria-hidden="true" />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
