import type { ReactNode } from 'react';
import { AlertTriangle, Loader2, type LucideIcon } from 'lucide-react';
import { useI18n } from '../../i18n';
import { apiMessage } from '../../i18n/apiMessage';
import { Button } from './Button';
import { LogoMark } from './Logo';

export function Spinner({ size = 18, label }: { size?: number; label?: string }) {
  const { t } = useI18n();
  return (
    <span className="spinner" role="status">
      <Loader2 size={size} className="spin" aria-hidden="true" />
      <span className={label ? 'spinner-label' : 'sr-only'}>{label ?? t('common.loading')}</span>
    </span>
  );
}

export function FullPageLoader() {
  const { t } = useI18n();
  return (
    <div className="fullpage" role="status">
      <div className="fullpage-mark">
        <LogoMark size={52} />
      </div>
      <p>{t('common.loadingApp')}</p>
    </div>
  );
}

export function PageLoader() {
  const { t } = useI18n();
  return (
    <div className="page-loader">
      <Spinner size={22} label={t('common.loading')} />
    </div>
  );
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, actions, compact = false }: EmptyStateProps) {
  return (
    <div className={compact ? 'empty empty-compact' : 'empty'}>
      {Icon ? (
        <div className="empty-icon">
          <Icon size={compact ? 20 : 26} aria-hidden="true" />
        </div>
      ) : null}
      <h3 className="empty-title">{title}</h3>
      {description ? <p className="empty-desc">{description}</p> : null}
      {actions ? <div className="empty-actions">{actions}</div> : null}
    </div>
  );
}

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title: string;
  compact?: boolean;
}

export function ErrorState({ error, onRetry, title, compact = false }: ErrorStateProps) {
  const { t } = useI18n();
  return (
    <div className={compact ? 'empty empty-compact empty-error' : 'empty empty-error'} role="alert">
      <div className="empty-icon">
        <AlertTriangle size={compact ? 20 : 26} aria-hidden="true" />
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-desc">{apiMessage(error, t)}</p>
      {onRetry ? (
        <div className="empty-actions">
          <Button onClick={onRetry}>{t('common.tryAgain')}</Button>
        </div>
      ) : null}
    </div>
  );
}

export function Skeleton({ lines = 4, height = 44 }: { lines?: number; height?: number }) {
  return (
    <div className="skeleton-list" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton" style={{ height, opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}
