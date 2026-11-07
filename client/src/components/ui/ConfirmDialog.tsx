import type { ReactNode } from 'react';
import { useI18n } from '../../i18n';
import { Button } from './Button';
import { Dialog } from './Dialog';

interface ConfirmDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, children, confirmLabel, danger = false, loading = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useI18n();
  return (
    <Dialog
      title={title}
      size="sm"
      onClose={loading ? undefined : onCancel}
      footer={
        <>
          <Button onClick={onCancel} disabled={loading} data-autofocus>
            {t('common.cancel')}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="confirm-body">{children}</div>
    </Dialog>
  );
}
