import { Calendar } from 'lucide-react';
import { useFormat } from '../../i18n/useFormat';
import { useI18n } from '../../i18n';
import { dueState } from '../../lib/format';
import { cn } from '../../lib/cn';

/** Due date chip: overdue and due-today states carry text, not just colour. */
export function DueChip({ due, done = false }: { due: string | null; done?: boolean }) {
  const { t } = useI18n();
  const { formatDay } = useFormat();
  if (!due) return null;
  const state = done ? 'upcoming' : dueState(due);
  const suffix = state === 'overdue' ? t('due.overdue') : state === 'today' ? t('due.today') : '';
  return (
    <span className={cn('due-chip', state && `due-${state}`)} title={`${t('due.title', { date: formatDay(due) })}${suffix ? ` (${suffix})` : ''}`}>
      <Calendar size={12} aria-hidden="true" />
      {formatDay(due)}
      {suffix ? <span className="sr-only"> ({suffix})</span> : null}
    </span>
  );
}
