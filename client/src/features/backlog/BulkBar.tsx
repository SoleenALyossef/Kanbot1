import { Trash2, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import { PRIORITIES } from '../../lib/constants';
import { Button } from '../../components/ui/Button';
import type { Sprint, TodoPriority } from '../../types/api';

interface Props {
  count: number;
  sprints: Sprint[];
  busy: boolean;
  onMove: (sprintId: string | null) => void;
  onPriority: (priority: TodoPriority) => void;
  onDelete: () => void;
  onClear: () => void;
}

/** Appears while todos are selected in the backlog. */
export function BulkBar({ count, sprints, busy, onMove, onPriority, onDelete, onClear }: Props) {
  const { t } = useI18n();
  return (
    <div className="bulk-bar" role="region" aria-label={t('bulk.bar')}>
      <strong className="bulk-count">{t('bulk.selected', { n: count })}</strong>
      <select
        className="input select bulk-select"
        value=""
        disabled={busy}
        aria-label={t('bulk.moveTo')}
        onChange={(e) => {
          const v = e.target.value;
          if (v) onMove(v === 'backlog' ? null : v);
        }}
      >
        <option value="">{t('bulk.moveTo')}</option>
        <option value="backlog">{t('td.backlogOpt')}</option>
        {sprints.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <select
        className="input select bulk-select"
        value=""
        disabled={busy}
        aria-label={t('bulk.priority')}
        onChange={(e) => {
          if (e.target.value) onPriority(e.target.value as TodoPriority);
        }}
      >
        <option value="">{t('bulk.priority')}</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {t(`priority.${p}`)}
          </option>
        ))}
      </select>
      <Button variant="danger" size="sm" icon={Trash2} onClick={onDelete} disabled={busy}>
        {t('common.delete')}
      </Button>
      <button type="button" className="icon-btn" onClick={onClear} aria-label={t('bulk.clear')} title={t('bulk.clear')}>
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
